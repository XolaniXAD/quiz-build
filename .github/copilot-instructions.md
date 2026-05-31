# QuizMaster — Copilot Instructions

> This file is automatically loaded into every Copilot conversation for this workspace.
> It is the authoritative quick-reference for this project. For full detail, read `PROJECT.md`.

---

## Run

```
npm run dev          → Vite frontend → port 5001  (NOT 5000 — 5000 was occupied)
node server/index.js → Express API  → port 3001
```

DB: PostgreSQL `localhost:5432`, database `world`.  
`.env` uses `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — NOT the standard `PG*` names.

---

## Stack

- **React 18 + Vite 6** — `StrictMode` is ON in `main.jsx` (double-invokes effects in dev)
- **TipTap v3** — ProseMirror-based rich text
- **Express 5 + Node v24** — REST API on port 3001
- **Tailwind CSS v3** — PostCSS plugin, custom design tokens
- **No router library** — `useState('editor')` in `App.jsx`; nav via `onNavigate(target)` prop

---

## ⚠️ CRITICAL: React StrictMode — mountedRef pattern

**Every component** that uses `mountedRef` MUST reset it in the effect setup. This pattern is **permanently broken** in StrictMode:

```js
// ❌ BROKEN — cleanup fires, second mount never resets it → always false
useEffect(() => () => { mountedRef.current = false }, [])
```

**The correct pattern:**

```js
// ✅ CORRECT
const mountedRef = useRef(true)
useEffect(() => {
  mountedRef.current = true
  return () => { mountedRef.current = false }
}, [])
```

Applied in: `RichTextEditor.jsx` and `ResizableImageView` (inside `ResizableImage.jsx`).  
Breaking this silently disables: auto-save, image resize persistence, image position persistence.

---

## ⚠️ TipTap extensions — source matters

`FontSize` and `Color` come from **`@tiptap/extension-text-style`**, NOT from the custom `FontSize.js` file.  
`extensions/FontSize.js` exists in the repo but is superseded — do not use it.

```js
import { FontSize, Color } from '@tiptap/extension-text-style'
```

---

## ⚠️ Tailwind `rounded-full` quirk

`tailwind.config.js` overrides `rounded-full` → `0.75rem` (not `9999px`).  
For true circles, use `style={{ borderRadius: '9999px' }}`.

---

## ⚠️ Toolbar dropdowns must use createPortal

The toolbar has `overflowX: auto` which clips `overflow-y` too — absolutely-positioned children are clipped.  
All toolbar dropdown panels **must** render via `createPortal(panel, document.body)` with `position: fixed` + `getBoundingClientRect()` for coords.  
Already done: `FontSizeDropdown`. Apply same pattern to any new dropdowns.

---

## ⚠️ Express 5 — EADDRINUSE is silent

Express 5 fires the `listen` callback before the port actually binds. On conflict it logs "running" then exits silently. Fix already applied in `server/index.js`:

```js
const server = app.listen(PORT, () => console.log(`Server on ${PORT}`))
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') console.error(`Port ${PORT} already in use`)
  process.exit(1)
})
```

---

## Key architectural patterns

### Auto-save flow
`onUpdate` → `scheduleAutoSave(editor.getJSON())` → 1500ms debounce → `onSave(content)` → `PUT /api/questions/:id`  
Content stored as JSONB in `questions.content`. On load: check `q.content?.type === 'doc'`.

### Image insert flow
Paste/upload → `POST /api/questions/:id/images` → multer → `server/uploads/`  
→ insert `resizableImage` node → `onUpdate` → auto-save  
After insert: check `$to.pos === $to.end()` and call `editor.commands.splitBlock()` to add newline below.

### Keyboard shortcuts (editorProps.handleKeyDown)
- `Ctrl+A` → `editor.commands.selectAll()`, return `true`
- `Ctrl+C` / `Ctrl+X` → return `false` (let ProseMirror's native copy/cut handle it — preserves rich-text formatting)
- `Enter` (plain) → return `false` (let TipTap split normally), then `setTimeout(0)` → `editor.commands.unsetTextAlign()` (prevents alignment inheritance on new paragraphs; skip if `$from.parent.type.spec.code`)

### TextAlign commands
```js
editor.commands.setTextAlign('left' | 'center' | 'right' | 'justify')
editor.commands.unsetTextAlign()   // reverts to CSS default (left)
```

---

## What is wired to the API vs. mock

| Feature | Status |
|---|---|
| `QuizEditPage` (create, title, questions, images, content) | ✅ Fully wired |
| `DashboardPage` | ❌ Mock only — `MOCK_QUIZZES` array, no API calls |
| TopBar "Save" button | ❌ Decorative |
| Footer "Last saved" text | ❌ Hardcoded |
| QuizCard 3-dot menu | ❌ Decorative |
| SideNav Templates / Analytics | ❌ No-op links |

---

## ResizableImage node attributes

`src`, `alt`, `title`, `width`, `height`, `wrapMode`, `posX`, `posY`  
All in `addAttributes()` → serialised into `editor.getJSON()` → persisted to DB.  
`wrapMode`: `'inline'` | `'left'` | `'right'` | `'center'` | `'inFront'` | `'behind'`

---

## API quick-ref (base: localhost:3001, proxied via /api in dev)

```
POST   /api/quizzes                              → create quiz
PUT    /api/quizzes/:id                          → update title
GET    /api/quizzes/:id                          → quiz + questions + options + images
DELETE /api/quizzes/:id                          → delete quiz

POST   /api/quizzes/:quizId/questions            → create question
PUT    /api/questions/:id                        → update content/type/position
DELETE /api/questions/:id                        → delete question + image files

POST   /api/questions/:questionId/images         → upload images (multer, max 20MB each)
DELETE /api/images/:id                           → delete image + file from disk

GET    /uploads/:filename                        → static file
```

---

## Do not break these working behaviors

1. Auto-save (mountedRef must reset on remount — see CRITICAL section above)
2. Image resize, position drag, and crop persisting across reloads
3. Ctrl+C/X rich-text clipboard (do not intercept in handleKeyDown)
4. Dropdown portal rendering in the toolbar
5. `rounded-full` — already works around with inline styles where circles are needed

---

## Checklist before making any editor change

- [ ] Does this component use `mountedRef`? Verify setup resets it to `true`.
- [ ] Does this add a new toolbar dropdown? Use `createPortal` + `position: fixed`.
- [ ] Does this involve TipTap extensions? Import from `@tiptap/extension-text-style`, not custom files.
- [ ] Does this need a true circle? Use `style={{ borderRadius: '9999px' }}`.
