# QuizMaster — Project Source of Truth

> This document records every approved and implemented feature.
> Update it whenever a feature is finished and committed.

---

## Tech Stack

| Layer      | Technology                          | Notes                                      |
|------------|-------------------------------------|--------------------------------------------|
| Frontend   | React 18 + Vite 6                   | Port 5000, `strictPort: false`, auto-opens |
| Styling    | Tailwind CSS v3 (PostCSS)           | Full custom theme (see below)              |
| Icons      | Material Symbols Outlined (Google)  | Loaded via `<link>` in `index.html`        |
| Font       | Inter (400–900, Google Fonts)       | Loaded via `<link>` in `index.html`        |
| Backend    | Express 5 + Node v24                | Port 3001                                  |
| Database   | PostgreSQL (localhost:5432)         | DB: `world`, user: `postgres`              |
| Uploads    | multer                              | Stored in `server/uploads/`                |

### Scripts (`package.json`)
```
npm run dev      → Vite frontend (port 5000)
npm run server   → Express backend (port 3001)
npm run build    → Production build
```

---

## Project Structure

```
/
├── index.html                  ← Google Fonts + Material Symbols link tags
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── .env                        ← DB credentials (not committed)
├── .gitignore
├── Quiz.jsx                    ← Original static reference file (keep, do not edit)
│
├── src/
│   ├── main.jsx
│   ├── index.css
│   ├── App.jsx                 ← Root router (state-based: 'dashboard' | 'editor')
│   │
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   └── QuizEditPage.jsx
│   │
│   └── components/
│       ├── TopBar.jsx
│       ├── SideNav.jsx
│       ├── Footer.jsx
│       ├── QuizCard.jsx
│       ├── QuizListItem.jsx
│       ├── DeleteConfirmModal.jsx
│       ├── QuestionTypePicker.jsx
│       └── QuestionCard.jsx
│
└── server/
    ├── index.js                ← Full Express REST API
    ├── db.js                   ← pg Pool connection
    ├── schema.sql              ← Applied to DB (run once)
    └── uploads/                ← Image uploads (not committed)
```

---

## Tailwind Theme

Custom tokens defined in `tailwind.config.js`:

| Token                  | Value      | Usage                        |
|------------------------|------------|------------------------------|
| `primary-container`    | `#2463eb`  | Buttons, focus rings         |
| `on-primary`           | `#ffffff`  | Text on primary buttons      |
| `tertiary-container`   | `#007d55`  | Success / published states   |
| `error`                | `#ba1a1a`  | Delete actions               |
| `surface-container`    | (light bg) | Card backgrounds             |
| `on-background`        | (dark)     | Default body text            |

Custom spacing: `xs / sm / md / lg / xl / gutter`
Custom font sizes: `body-md / headline-sm / display-lg` etc.
Custom border radius tokens.

---

## Routing

`App.jsx` manages page state — no router library.

| State value  | Page rendered     | How to reach it                              |
|--------------|-------------------|----------------------------------------------|
| `'dashboard'`| `DashboardPage`   | Logo click, "Dashboard" nav link, Back button |
| `'editor'`   | `QuizEditPage`    | "New Quiz" button on Dashboard               |

---

## Feature: Dashboard Page

**File:** `src/pages/DashboardPage.jsx`  
**Data:** Mock (`MOCK_QUIZZES` array — 6 items). Not yet wired to API.

### Approved features
- **Stats row** — 4 tiles: Total Quizzes, Published, Total Questions, Drafts
- **New Quiz button** — navigates to editor page
- **Search bar** — filters quiz list by title (client-side)
- **Filter tabs** — All / Published / Drafts
- **Card view** — `QuizCard` component, color accent bar, status badge, question count, last updated
- **List view** — `QuizListItem` component, same data in compact row form
- **View toggle** — switches between card and list view
- **Duplicate** — adds a copy of a quiz to the list (local state only)
- **Delete** — opens `DeleteConfirmModal`, removes on confirm (local state only)
- **Sidebar navigation** — `SideNav` with active page highlight
- **Mobile hamburger** — TopBar hamburger opens SideNav as a slide-in drawer
- **Mobile responsiveness** — 1-column on mobile, sidebar hidden, footer/main offsets use `md:` prefix

### Components used
- `TopBar` — fixed top bar, hamburger (mobile), logo + Dashboard link
- `SideNav` — desktop always-visible, mobile slide-in drawer with backdrop
- `Footer` — fixed bottom status bar, `md:left-64` offset
- `QuizCard` — card view tile with hover 3-dot menu
- `QuizListItem` — list row, actions always visible on mobile, hover-only on desktop
- `DeleteConfirmModal` — backdrop blur confirm dialog

---

## Feature: Quiz Editor Page

**File:** `src/pages/QuizEditPage.jsx`  
**Data:** Local state only. Not yet saved to DB.

### Approved features
- **Quiz title input** — editable, centered, underline appears on hover/focus
- **Add Question button** — centered when no questions exist, below cards otherwise
- **Question type picker** — appears inline when "Add Question" is clicked, hides the button
  - Selecting a type adds a question card and hides the picker
  - Cancel link dismisses the picker without adding a question
- **Question cards** — one card per added question, in order added
- **Delete question** — trash icon on each card removes it from the list

### No sidebar, no footer on this page (intentional)

---

## Feature: Question Type Picker

**File:** `src/components/QuestionTypePicker.jsx`

5 question types, each with its own color, icon and description:

| Type ID           | Label                 | Icon                      | Color  |
|-------------------|-----------------------|---------------------------|--------|
| `multiple_choice` | Multiple Choice       | `radio_button_checked`    | Blue   |
| `checkbox`        | Checkbox              | `check_box`               | Violet |
| `drag_drop_order` | Drag & Drop — Order   | `swap_vert`               | Amber  |
| `drag_drop_fill`  | Drag & Drop — Fill    | `drag_indicator`          | Teal   |
| `dropdown`        | Dropdown              | `arrow_drop_down_circle`  | Rose   |

**Layout:**
- Empty state (no questions yet): centered icon + text, 2-column grid on sm+
- Non-empty state: divider line `——— Choose question type ———`, 3-col grid on lg+
- Mobile: always 1 column

**Not yet functional** — all types show the same plain textarea for now.

---

## Feature: Question Card

**File:** `src/components/QuestionCard.jsx`

- Left colored accent bar matching the question type
- Numbered circle badge (1, 2, 3…)
- Type icon + type label in header
- Delete button (trash icon), hover turns red
- Plain textarea (4 rows) — placeholder: "Type your question here…"
- Full width up to `max-w-4xl` container

---

## Backend API

**File:** `server/index.js`  
**Base URL:** `http://localhost:3001`  
**Not yet connected to frontend** — all frontend data is local state.

| Method | Route                                    | Description              |
|--------|------------------------------------------|--------------------------|
| GET    | `/api/quizzes`                           | List all quizzes         |
| POST   | `/api/quizzes`                           | Create quiz              |
| PUT    | `/api/quizzes/:id`                       | Update quiz              |
| DELETE | `/api/quizzes/:id`                       | Delete quiz              |
| GET    | `/api/questions`                         | List questions           |
| POST   | `/api/questions`                         | Create question          |
| PUT    | `/api/questions/:id`                     | Update question          |
| DELETE | `/api/questions/:id`                     | Delete question          |
| PUT    | `/api/quizzes/:quizId/questions/reorder` | Reorder questions        |
| GET    | `/api/options`                           | List options             |
| POST   | `/api/options`                           | Create option            |
| PUT    | `/api/options/:id`                       | Update option            |
| DELETE | `/api/options/:id`                       | Delete option            |
| POST   | `/api/questions/:questionId/images`      | Upload image (multer)    |
| DELETE | `/api/images/:id`                        | Delete image             |
| GET    | `/uploads/:filename`                     | Serve uploaded image     |

---

## Database Schema

**File:** `server/schema.sql` — already applied.

```sql
quizzes         (id, title, created_at, updated_at)
questions       (id, quiz_id→quizzes, position, content JSONB, created_at, updated_at)
options         (id, question_id→questions, position, text, is_correct, created_at, updated_at)
question_images (id, question_id→questions, filename, original_name, mime_type, size_bytes, created_at)
```

> `questions.content` is JSONB — designed to store TipTap/ProseMirror document JSON.
> When the rich text editor is added, the textarea output must be serialised to this format before saving.

---

## Git

- **Repo:** `https://github.com/XolaniXAD/quiz-build` (public)
- **Remote:** `git@github.com:XolaniXAD/quiz-build.git`
- **Branch:** `master`

### Commit history (significant)
| Commit    | Message                                                        |
|-----------|----------------------------------------------------------------|
| `e5d8b44` | Mobile responsive layout + navbar navigation links            |
| `8c58af8` | Add question type picker and question cards (inline, on-demand)|

---

## Not Yet Built (planned, not started)

- [ ] Question type editors (multiple choice options, checkbox, drag-drop, dropdown UIs)
- [ ] Rich text editor for question text (TipTap/ProseMirror — outputs to `content` JSONB)
- [ ] Image upload within question editor
- [ ] Save quiz + questions to database (wire frontend → API)
- [ ] Load quizzes from database on Dashboard
- [ ] Published / Draft toggle on quiz
- [ ] Quiz preview / play mode
