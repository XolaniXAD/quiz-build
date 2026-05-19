# QuizMaster — Project Source of Truth

> **Purpose:** Complete working reference so any part of the code can be edited with full context, even after losing conversational history.
> Update this document whenever a feature is added, changed, or removed.

---

## Tech Stack

| Layer      | Technology                         | Notes                                       |
|------------|------------------------------------|---------------------------------------------|
| Frontend   | React 18 + Vite 6                  | Port 5000, `strictPort: false`, auto-opens  |
| Styling    | Tailwind CSS v3 (PostCSS plugin)   | Full custom Material Design token theme     |
| Icons      | Material Symbols Outlined (Google) | Loaded via `<link>` in `index.html`         |
| Font       | Inter (400–900, Google Fonts)      | Loaded via `<link>` in `index.html`         |
| Rich text  | TipTap v3                          | ProseMirror-based, outputs JSON to DB       |
| Backend    | Express 5 + Node v24               | Port 3001                                   |
| Database   | PostgreSQL (localhost:5432)        | DB: `world`, user: `postgres`               |
| Uploads    | multer                             | Stored in `server/uploads/`                 |

### Dev scripts
```
npm run dev      → Vite frontend  (port 5000)
npm run server   → Express API    (port 3001)
npm run build    → Production build
```

### .env (not committed)
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<password>
DB_NAME=world
PORT=3001
```

---

## Project Structure

```
/
├── index.html            ← Google Fonts + Material Symbols <link> tags, mounts #root
├── vite.config.js        ← port 5000, proxy /api + /uploads → localhost:3001
├── tailwind.config.js    ← Full custom color/spacing/font token definitions
├── postcss.config.js     ← Standard PostCSS (tailwindcss + autoprefixer)
├── package.json
├── .env                  ← DB credentials (gitignored)
├── Quiz.jsx              ← Original static mock (DO NOT EDIT — reference only)
│
├── src/
│   ├── main.jsx          ← Creates React root, renders <App> in StrictMode
│   ├── index.css         ← @tailwind directives + global editor CSS classes
│   ├── App.jsx           ← State-based router: 'dashboard' | 'editor'
│   │
│   ├── pages/
│   │   ├── DashboardPage.jsx     ← Quiz list, mock data, no API yet
│   │   └── QuizEditPage.jsx      ← Quiz editor, fully wired to API
│   │
│   └── components/
│       ├── TopBar.jsx            ← Fixed top nav, hamburger, Save button (decorative)
│       ├── SideNav.jsx           ← Desktop sidebar + mobile slide-in drawer
│       ├── Footer.jsx            ← Fixed bottom status bar
│       ├── QuizCard.jsx          ← Card-view quiz tile
│       ├── QuizListItem.jsx      ← List-view quiz row
│       ├── DeleteConfirmModal.jsx ← Backdrop confirm dialog
│       ├── EmptyState.jsx        ← Decorative empty state (not currently used)
│       ├── QuestionTypePicker.jsx ← Inline type selector
│       ├── QuestionCard.jsx      ← Question wrapper: header + RichTextEditor + options stub
│       │
│       └── editor/
│           ├── RichTextEditor.jsx        ← TipTap editor, auto-save, image upload/crop
│           ├── EditorToolbar.jsx         ← Full toolbar (font size, color, bold, align, lists, image)
│           ├── EditorContext.jsx         ← React context: { questionId, onCropRequest }
│           ├── ImageCropModal.jsx        ← Custom canvas crop UI (fullscreen dark overlay)
│           ├── cropImage.js              ← Canvas crop utility (currently unused — kept for reference)
│           └── extensions/
│               ├── ResizableImage.jsx    ← TipTap node: resizable/draggable images, context menu
│               ├── CustomLists.js        ← Extends BulletList + OrderedList with listType attribute
│               └── FontSize.js           ← Custom TipTap extension for inline font-size
│
└── server/
    ├── index.js          ← Full Express REST API (see API section)
    ├── db.js             ← pg Pool, reads from .env
    ├── schema.sql        ← DB schema (run once to set up; already applied)
    └── uploads/          ← Uploaded images (gitignored)
```

---

## Routing

`App.jsx` — no router library. Single `page` state.

| `page` value  | Component rendered | How to get there                         |
|---------------|--------------------|------------------------------------------|
| `'editor'`    | `QuizEditPage`     | **Default on load.** "New Quiz" buttons  |
| `'dashboard'` | `DashboardPage`    | Logo click, "Dashboard" nav in TopBar/SideNav |

`navigate(target)` in `App.jsx`:
- `target === 'quizzes'` or `'dashboard'` → sets page to `'dashboard'`
- `target` anything else → currently ignored

`QuizEditPage` receives: `onNavigate`  
`DashboardPage` receives: `onEditQuiz`, `onNavigate`

---

## Pages

### DashboardPage — `src/pages/DashboardPage.jsx`

**Data source:** `MOCK_QUIZZES` array (6 hardcoded items). **Not wired to API.**

**State:**
| Variable        | Type    | Purpose                              |
|-----------------|---------|--------------------------------------|
| `quizzes`       | array   | The displayed quiz list              |
| `viewMode`      | string  | `'card'` or `'list'`                 |
| `search`        | string  | Live search filter                   |
| `filter`        | string  | `'all'` / `'published'` / `'draft'`  |
| `deleteTarget`  | object  | Quiz to delete (opens modal if set)  |
| `mobileNavOpen` | boolean | Controls SideNav mobile drawer       |

**What each button does:**
- "New Quiz" → calls `onEditQuiz(null)` → `App.jsx` sets page to `'editor'`
- Delete → sets `deleteTarget` → `DeleteConfirmModal` opens → `confirmDelete` removes from local state
- Duplicate → adds copy to local `quizzes` state with `id: Date.now()` and `title: "... (Copy)"`
- Edit (on QuizCard/QuizListItem) → calls `onEditQuiz(quiz)` → navigates to editor

---

### QuizEditPage — `src/pages/QuizEditPage.jsx`

**Fully wired to API.**

**State:**
| Variable      | Type    | Purpose                                        |
|---------------|---------|------------------------------------------------|
| `questions`   | array   | `[{ id, type, content }]` — from DB after creation |
| `title`       | string  | Quiz title, debounce-saved after 1200ms        |
| `showPicker`  | boolean | Shows `QuestionTypePicker` inline              |
| `quizId`      | number  | Set on mount after POST /api/quizzes           |

**Lifecycle:**
1. On mount → `POST /api/quizzes` with `{ title: 'Untitled Quiz' }` → stores `quizId`
2. Title changes → 1200ms debounce → `PUT /api/quizzes/:id { title }`
3. "Add Question" clicked → shows `QuestionTypePicker`
4. Type selected → `POST /api/quizzes/:quizId/questions { type }` → appends `{ id, type, content: {} }` to `questions`
5. Trash icon → removes from local state + `DELETE /api/questions/:id`
6. Editor content changes → `RichTextEditor` calls `onSaveContent(questionId, content)` → `PUT /api/questions/:id { content }`

**No sidebar, no footer on this page (intentional).**

---

## Components

### TopBar — `src/components/TopBar.jsx`

Props: `{ onMenuToggle, onNavigate }`

- Fixed `header` at top, `z-50`, 64px tall
- Hamburger (mobile only, shown when `onMenuToggle` is not null)
- "QuizMaster" logo → calls `onNavigate('dashboard')`
- Desktop nav links: Dashboard (functional), My Quizzes / Templates / Analytics (`href="#"`, decorative)
- "Save" button — **decorative, does nothing**
- Cloud icon, profile icon — **decorative**

---

### SideNav — `src/components/SideNav.jsx`

Props: `{ activePage, onNavigate, isOpen, onClose }`

- Fixed left sidebar, `top: 64px` (below TopBar)
- Desktop: always visible (`md:translate-x-0`)
- Mobile: slide-in drawer, controlled by `isOpen`; dark backdrop closes it on click
- 4 nav items: Dashboard, My Quizzes, Templates, Analytics
  - Only "Dashboard" and "My Quizzes" call `onNavigate` — others are not yet functional
- "New Quiz" button at bottom → calls `onNavigate('quizzes')`
- Settings + Help at very bottom — **decorative**

---

### Footer — `src/components/Footer.jsx`

No props.

- Fixed bottom bar, `md:left-64` offset (clears sidebar)
- Shows "Last saved: 2 minutes ago" — **hardcoded, not wired**
- Shows "Unpublished Changes" — **hardcoded, not wired**

---

### QuizCard — `src/components/QuizCard.jsx`

Props: `{ quiz, onEdit, onDelete, onDuplicate }`

`quiz` shape: `{ id, title, questionCount, updatedAt, published, color }`

- Color accent bar at top (`quiz.color` Tailwind class e.g. `bg-blue-500`)
- Published/Draft badge
- Title, question count, last updated
- "Edit" button → `onEdit(quiz)`
- Duplicate icon → `onDuplicate(quiz)`
- Delete icon → `onDelete(quiz)` (opens `DeleteConfirmModal`)
- 3-dot menu button exists but **has no dropdown — decorative**

---

### QuizListItem — `src/components/QuizListItem.jsx`

Props: `{ quiz, onEdit, onDelete, onDuplicate }`

Same `quiz` shape as `QuizCard`. Compact row view.

- Color dot on left
- Actions always visible on mobile, `group-hover` on desktop

---

### DeleteConfirmModal — `src/components/DeleteConfirmModal.jsx`

Props: `{ quiz, onConfirm, onCancel }`

- Renders `null` when `quiz` is null
- Backdrop blur overlay; clicking backdrop calls `onCancel`
- "Cancel" → `onCancel` | "Delete" → `onConfirm(quiz)`

---

### QuestionTypePicker — `src/components/QuestionTypePicker.jsx`

Props: `{ onSelect, onCancel, isEmpty }`

5 question types (hardcoded constant `QUESTION_TYPES`):

| `id`              | Label                | Icon                     | Accent color |
|-------------------|----------------------|--------------------------|--------------|
| `multiple_choice` | Multiple Choice      | `radio_button_checked`   | Blue         |
| `checkbox`        | Checkbox             | `check_box`              | Violet       |
| `drag_drop_order` | Drag & Drop — Order  | `swap_vert`              | Amber        |
| `drag_drop_fill`  | Drag & Drop — Fill   | `drag_indicator`         | Teal         |
| `dropdown`        | Dropdown             | `arrow_drop_down_circle` | Rose         |

**Layout:**
- `isEmpty=true` → centered icon/text + 2-column card grid
- `isEmpty=false` → divider line + 3-column grid (lg+), 1-column (mobile)

Clicking a type card calls `onSelect(type.id)`.

---

### QuestionCard — `src/components/QuestionCard.jsx`

Props: `{ question, index, onDelete, onSaveContent }`

`question` shape: `{ id, type, content }`

`TYPE_META` lookup table maps `question.type` to `{ label, icon, iconColor, accentBar }`.

- Left colored accent bar
- Numbered badge + type icon + type label in header
- Trash → `onDelete(question.id)`
- `RichTextEditor` with `questionId={question.id}` and `onSave={(content) => onSaveContent(question.id, content)}`
- "Answer options — coming soon" dashed placeholder below editor

---

### EmptyState — `src/components/EmptyState.jsx`

Props: `{ onAddQuestion }`

**Not currently used in any page.** Decorative component with animated icon, hints for CSV import / AI generate / question bank.

---

## Rich Text Editor System

### RichTextEditor — `src/components/editor/RichTextEditor.jsx`

Props: `{ questionId, initialContent, onSave }`

- Wraps TipTap in `EditorContext.Provider` with `{ questionId, onCropRequest }`
- Auto-save: `onUpdate` fires `scheduleAutoSave(editor.getJSON())` → 1500ms debounce → calls `onSave(content)`
- Save status: `'saving'` | `'saved'` | `'error'` — displayed in `EditorToolbar`
- Paste image: intercepts clipboard items with `image/*` type → calls `uploadImageFile(blob)`
- `uploadImageFile(file)`: POSTs to `/api/questions/:questionId/images` → inserts `resizableImage` node into editor
- `insertImageUrl(url)`: inserts `resizableImage` node directly with src=url (no upload)
- `handleCropRequest({ src, onComplete })`: opens `ImageCropModal` via state
- `handleCropDone(newSrc)`: calls `cropState.onComplete(newSrc)` then clears modal

**TipTap extensions used:**
```
StarterKit (bulletList: false, orderedList: false)
TextAlign   → types: ['heading', 'paragraph']
Highlight
TextStyle
Color       (from @tiptap/extension-text-style)
FontSize    (custom — FontSize.js)
Placeholder → 'Type your question here, or paste / insert an image…'
ResizableImage (custom node — ResizableImage.jsx)
CustomBulletList  (custom — CustomLists.js)
CustomOrderedList (custom — CustomLists.js)
```

---

### EditorToolbar — `src/components/editor/EditorToolbar.jsx`

Props: `{ editor, onImageFile, onImageUrl, saveStatus }`

Returns `null` if `editor` is null (TipTap not ready yet).

**Controls left-to-right:**
1. `FontSizeDropdown` — preset sizes 8–72px + free-type input; reads `editor.getAttributes('textStyle').fontSize`
2. `FontColorPicker` — 18 swatches + native `<input type="color">`
3. Bold / Italic / Highlight toggle buttons
4. Align left / center / right
5. `BulletDropdown` — 8 list types (disc, circle, square, arrow, star, triangle, check, dash)
6. `OrderedDropdown` — 5 list types (decimal, lower-alpha, upper-alpha, lower-roman, upper-roman)
7. `ImageDropdown` — "Upload from device" / "From URL" / paste hint
8. `SaveBadge` — shows saving/saved/error, pushed to far right with `marginLeft: 'auto'`

All dropdown close overlays use `position: fixed; inset: 0; z-index: 40` to capture outside clicks.

---

### EditorContext — `src/components/editor/EditorContext.jsx`

```js
// Shape
{ questionId: number|null, onCropRequest: function|null }
```

Used by `ResizableImage` (via `useEditorContext()`) to get `questionId` and trigger crop modal in `RichTextEditor`.

---

### ImageCropModal — `src/components/editor/ImageCropModal.jsx`

Props: `{ imageSrc, questionId, onComplete, onCancel }`

**Custom crop UI — does NOT use `react-easy-crop` (that package is installed but unused).**

- Fullscreen dark overlay (`background: '#111'`)
- Image rendered with fixed 40px `PADDING` so crop coords are stable
- `crop` state: `{ x, y, w, h }` in pixels relative to container
- 8 drag handles at corners/edges using `setPointerCapture` — aspect ratio locked on corner drags
- Moveable crop rect via `startMove`
- Dark overlay panels outside crop rect (4 divs: top/bottom bands, left/right strips)
- Rule-of-thirds grid lines inside crop rect
- **Apply:** draws onto canvas, exports `image/jpeg 0.92` quality → if `questionId` present, POSTs to `/api/questions/:questionId/images` and calls `onComplete('/uploads/filename')`, else calls `onComplete(URL.createObjectURL(blob))`

---

### ResizableImage — `src/components/editor/extensions/ResizableImage.jsx`

**TipTap custom node `'resizableImage'`.**

Node attrs: `{ src, alt, title, width, height, wrapMode, posX, posY }`

`wrapMode` values: `'inline'` | `'left'` | `'right'` | `'center'` | `'inFront'` | `'behind'`

**Key design decisions:**
- `ResizeOverlay` renders into `document.body` via `createPortal` — keeps resize handles completely outside ProseMirror's DOM tree so PM never intercepts mouse events
- `ResizeOverlay` uses `requestAnimationFrame` loop to track image position, clips overlay to visible editor area (never bleeds over fixed navbar)
- During drag: direct DOM mutation for zero-overhead feedback; commits to TipTap attrs only on `mouseup`
- Corners lock aspect ratio; edge handles resize one axis only
- `inFront`/`behind` modes: zero-size inline anchor, image is `position: absolute` and freely draggable
- Left/right 24px click zones (inline mode only) place PM text cursor before/after the image node
- Right-click → context menu with wrap mode picker, crop, insert paragraph before/after, delete

---

### CustomLists — `src/components/editor/extensions/CustomLists.js`

Extends `BulletList` and `OrderedList` with a `listType` attribute.

- Stored as `data-list-type` HTML attribute
- CSS in `src/index.css` maps `[data-list-type="*"]` to visual list style
- BulletList types: `disc` | `circle` | `square` | `arrow` | `star` | `triangle` | `check` | `dash`
- OrderedList types: `decimal` | `lower-alpha` | `upper-alpha` | `lower-roman` | `upper-roman`

---

### FontSize — `src/components/editor/extensions/FontSize.js`

Custom TipTap `Extension` built on top of `TextStyle`.

- Adds `fontSize` attribute to `textStyle` mark, renders as `style="font-size: Npx"`
- Commands: `setFontSize(size)` / `unsetFontSize()`

---

### cropImage.js — `src/components/editor/cropImage.js`

Standalone canvas crop utility. **Currently unused** — `ImageCropModal` performs its own canvas crop inline. Kept for reference.

---

## Global CSS — `src/index.css`

| Class / Selector                     | Purpose                                              |
|--------------------------------------|------------------------------------------------------|
| `.quiz-editor-wrap`                  | Editor outer border, border-radius, focus ring       |
| `.quiz-editor-content`               | ProseMirror content area (min-height, padding, font) |
| `.quiz-editor-content p`             | Zero margin paragraphs                               |
| `.quiz-editor-content ul/ol`         | List indent and spacing                              |
| `ul[data-list-type="*"]`             | Custom bullet/ordered list visual styles             |
| `[style*="text-align: *"]`           | Passes text-align through                            |
| `.reactEasyCrop_CropArea + div`      | Hides react-easy-crop watermark (kept defensively)   |

---

## Tailwind Config — `tailwind.config.js`

Content paths: `['./index.html', './src/**/*.{js,jsx}']`

### ⚠️ Known quirk — borderRadius override
The config places `DEFAULT`, `lg`, `xl`, `full` inside `extend.borderRadius`. In Tailwind v3, `extend` is supposed to be additive, but these keys **shadow the Tailwind defaults**:
- `rounded-full` → `0.75rem` instead of `9999px` — breaks circular elements (color dots, avatars, badges)
- If you need true circles, use `style={{ borderRadius: '9999px' }}` inline or add a `rounded-circle` token

### Color tokens (key subset)
| Token                 | Hex        | Usage                              |
|-----------------------|------------|------------------------------------|
| `primary-container`   | `#2463eb`  | Primary buttons, active states     |
| `on-primary`          | `#ffffff`  | Text on primary buttons            |
| `tertiary-container`  | `#007d55`  | Published badge background         |
| `tertiary`            | `#006242`  | Published badge text               |
| `error`               | `#ba1a1a`  | Delete button background           |
| `on-error`            | `#ffffff`  | Delete button text                 |
| `on-background`       | `#131b2e`  | Body text                          |
| `on-surface-variant`  | `#434655`  | Secondary text                     |
| `surface-container`   | `#eaedff`  | Card icon backgrounds              |

### Font family tokens
All map to `Inter, sans-serif`. Used as `font-body-md`, `font-headline-md`, etc.

### Font size tokens
`body-md` (14px) / `headline-sm` (18px) / `headline-md` (24px) / `body-lg` (16px) / `label-md` (12px) / `display-lg` (48px)

---

## Backend API — `server/index.js`

Base URL: `http://localhost:3001`  
Vite dev server proxies `/api/*` and `/uploads/*` to `localhost:3001`.

### Quizzes

| Method | Route               | Body                  | Response         |
|--------|---------------------|-----------------------|------------------|
| GET    | `/api/quizzes`      | —                     | `Quiz[]` ordered by `created_at DESC` |
| GET    | `/api/quizzes/:id`  | —                     | `Quiz + questions[] + options[] + images[]` |
| POST   | `/api/quizzes`      | `{ title? }`          | `Quiz` (201)     |
| PUT    | `/api/quizzes/:id`  | `{ title }`           | `Quiz`           |
| DELETE | `/api/quizzes/:id`  | —                     | 204              |

### Questions

| Method | Route                                    | Body                            | Response           |
|--------|------------------------------------------|---------------------------------|--------------------|
| GET    | `/api/quizzes/:quizId/questions`         | —                               | `Question[]`       |
| POST   | `/api/quizzes/:quizId/questions`         | `{ content?, position?, type? }`| `Question + options[] + images[]` (201) |
| PUT    | `/api/questions/:id`                     | `{ content?, position?, type? }`| `Question`         |
| DELETE | `/api/questions/:id`                     | —                               | 204 + deletes image files from disk |
| PUT    | `/api/quizzes/:quizId/questions/reorder` | `{ order: [{id, position}] }`   | `{ ok: true }`     |

Auto-migration on startup: `ALTER TABLE questions ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'multiple_choice'`

### Options

| Method | Route                              | Body                                    | Response     |
|--------|------------------------------------|-----------------------------------------|--------------|
| GET    | `/api/questions/:questionId/options` | —                                     | `Option[]`   |
| POST   | `/api/questions/:questionId/options` | `{ text?, is_correct?, position? }`   | `Option` (201) |
| PUT    | `/api/options/:id`                 | `{ text?, is_correct?, position? }`     | `Option`     |
| DELETE | `/api/options/:id`                 | —                                       | 204          |

### Images

| Method | Route                                  | Body / Form                  | Response        |
|--------|----------------------------------------|------------------------------|-----------------|
| POST   | `/api/questions/:questionId/images`    | `multipart: images[]` (max 20) | `Image[]` (201) |
| DELETE | `/api/images/:id`                      | —                            | 204 + deletes file from disk |
| GET    | `/uploads/:filename`                   | —                            | Static file     |

Multer: max 20 MB per file, allowed MIME: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`

---

## Database Schema — `server/schema.sql`

Already applied. Run `psql -U postgres -d world -f server/schema.sql` to re-apply (safe — uses `IF NOT EXISTS`).

```sql
quizzes (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT 'Untitled Quiz',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
)

questions (
  id          SERIAL PRIMARY KEY,
  quiz_id     INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,
  content     JSONB NOT NULL DEFAULT '{}',   -- TipTap JSON doc
  type        VARCHAR(50) DEFAULT 'multiple_choice',  -- added via migration
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
)

options (
  id          SERIAL PRIMARY KEY,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,
  text        TEXT NOT NULL DEFAULT '',
  is_correct  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
)

question_images (
  id            SERIAL PRIMARY KEY,
  question_id   INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  filename      TEXT NOT NULL,        -- stored name in server/uploads/
  original_name TEXT,
  mime_type     TEXT,
  size_bytes    INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
)
```

`questions.content` stores TipTap's `editor.getJSON()` output — a ProseMirror JSON document.

---

## What Is and Isn't Wired

| Feature                               | Status                                      |
|---------------------------------------|---------------------------------------------|
| Create quiz on editor load            | ✅ Wired — POST /api/quizzes on mount        |
| Save quiz title                       | ✅ Wired — 1200ms debounce PUT              |
| Create question                       | ✅ Wired — POST on type select              |
| Delete question                       | ✅ Wired — DELETE + local state remove      |
| Save question content (rich text)     | ✅ Wired — 1500ms debounce PUT in editor    |
| Upload images in editor               | ✅ Wired — POST to /api/questions/:id/images |
| Crop image + save                     | ✅ Wired — POST cropped jpeg to API         |
| Dashboard quiz list                   | ❌ Mock data only                            |
| Dashboard delete/duplicate            | ❌ Local state only                          |
| Options (answer choices)              | ❌ API exists, UI not built                  |
| TopBar "Save" button                  | ❌ Decorative                                |
| Footer "Last saved" text              | ❌ Hardcoded string                          |
| Published / Draft toggle              | ❌ Not started                               |
| Quiz preview / play mode              | ❌ Not started                               |

---

## Git

- **Repo:** `https://github.com/XolaniXAD/quiz-build` (public)
- **Remote:** `git@github.com:XolaniXAD/quiz-build.git`
- **Branch:** `master`
