/**
 * src/api/index.js — centralised API layer
 * ─────────────────────────────────────────
 * ALL network requests to the Express backend live here.
 * Components never call fetch() directly — they import named functions.
 *
 * Base URL: relative /api paths — Vite proxies /api → localhost:3001 in dev
 * (see vite.config.js). In production the same Express server serves both
 * the static frontend and the API.
 *
 * Every exported function throws an Error on non-2xx so callers can
 * catch uniformly with try/catch or .catch().
 *
 * To add a new endpoint:
 *   1. Write a function below following the same pattern
 *   2. Export it
 *   3. Import it in the component that needs it
 *   Never inline fetch() inside a component.
 */

const BASE = '/api'

/**
 * Generic fetch wrapper.
 * Automatically adds Content-Type: application/json unless the body is FormData.
 * Returns parsed JSON, or null for 204 No Content.
 */
async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: isFormData
      ? options.headers
      : { 'Content-Type': 'application/json', ...options.headers },
  })
  if (!res.ok) {
    throw new Error(`API ${options.method ?? 'GET'} ${path} failed (${res.status})`)
  }
  if (res.status === 204) return null
  return res.json()
}

// ── Quizzes ───────────────────────────────────────────────────────────────────
// GET  /api/quizzes          → array of all quizzes ordered by created_at DESC
// GET  /api/quizzes/:id      → single quiz with nested questions/options/images
// POST /api/quizzes          → body: { title } → returns created quiz row
// PUT  /api/quizzes/:id      → body: { title } → returns updated quiz row
// DELETE /api/quizzes/:id    → 204 No Content

export const getQuizzes = ()         => request('/quizzes')
export const getQuiz    = (id)       => request(`/quizzes/${id}`)
export const createQuiz = (title)    => request('/quizzes', { method: 'POST', body: JSON.stringify({ title }) })
export const updateQuiz = (id, data) => request(`/quizzes/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteQuiz = (id)       => request(`/quizzes/${id}`, { method: 'DELETE' })

// ── Questions ─────────────────────────────────────────────────────────────────
// POST /api/quizzes/:quizId/questions  → body: { type, content? } → returns question row
// PUT  /api/questions/:id              → body: { content?, position?, type? } → returns updated row
// DELETE /api/questions/:id            → 204, also deletes image files from disk
// PUT  /api/quizzes/:quizId/questions/reorder → body: { order: [{id, position}] }

export const createQuestion   = (quizId, data)  => request(`/quizzes/${quizId}/questions`, { method: 'POST', body: JSON.stringify(data) })
export const updateQuestion   = (id, data)       => request(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteQuestion   = (id)             => request(`/questions/${id}`, { method: 'DELETE' })
export const reorderQuestions = (quizId, order)  => request(`/quizzes/${quizId}/questions/reorder`, { method: 'PUT', body: JSON.stringify({ order }) })

// ── Options (answer choices) ──────────────────────────────────────────────────
// GET    /api/questions/:questionId/options  → array of options
// POST   /api/questions/:questionId/options  → body: { text, is_correct, position? }
// PUT    /api/options/:id                    → body: { text?, is_correct?, position? }
// DELETE /api/options/:id                    → 204

export const getOptions   = (questionId)        => request(`/questions/${questionId}/options`)
export const createOption = (questionId, data)  => request(`/questions/${questionId}/options`, { method: 'POST', body: JSON.stringify(data) })
export const updateOption = (id, data)          => request(`/options/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteOption = (id)                => request(`/options/${id}`, { method: 'DELETE' })

// ── Images ────────────────────────────────────────────────────────────────────
// POST   /api/questions/:questionId/images  → multipart/form-data, field: 'images'
//   Returns: array of { id, filename } — serve files at /uploads/<filename>
// DELETE /api/images/:id                    → 204, also deletes file from disk

export async function uploadImages(questionId, files) {
  const formData = new FormData()
  files.forEach((f) => formData.append('images', f))
  return request(`/questions/${questionId}/images`, { method: 'POST', body: formData })
}

export const deleteImage = (id) => request(`/images/${id}`, { method: 'DELETE' })
