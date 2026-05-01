import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import pool from './db.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// ── Uploads directory ─────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

// ── Multer config ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${path.extname(file.originalname)}`)
  },
})

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true)
    else cb(new Error(`Unsupported file type: ${file.mimetype}`))
  },
})

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(UPLOADS_DIR))

// ── Helper ────────────────────────────────────────────────────────────────────
const query = (text, params) => pool.query(text, params)

// ═════════════════════════════════════════════════════════════════════════════
// QUIZZES
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/quizzes — list all
app.get('/api/quizzes', async (_req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM quizzes ORDER BY created_at DESC'
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/quizzes/:id — single quiz with questions + options + images
app.get('/api/quizzes/:id', async (req, res) => {
  try {
    const { id } = req.params
    const quizResult = await query('SELECT * FROM quizzes WHERE id = $1', [id])
    if (!quizResult.rows.length) return res.status(404).json({ error: 'Quiz not found' })

    const quiz = quizResult.rows[0]

    const questionsResult = await query(
      'SELECT * FROM questions WHERE quiz_id = $1 ORDER BY position ASC',
      [id]
    )

    // Attach options and images to each question
    const questions = await Promise.all(
      questionsResult.rows.map(async (q) => {
        const [optionsResult, imagesResult] = await Promise.all([
          query(
            'SELECT * FROM options WHERE question_id = $1 ORDER BY position ASC',
            [q.id]
          ),
          query(
            'SELECT * FROM question_images WHERE question_id = $1 ORDER BY created_at ASC',
            [q.id]
          ),
        ])
        return { ...q, options: optionsResult.rows, images: imagesResult.rows }
      })
    )

    res.json({ ...quiz, questions })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/quizzes — create
app.post('/api/quizzes', async (req, res) => {
  try {
    const { title = 'Untitled Quiz' } = req.body
    const { rows } = await query(
      'INSERT INTO quizzes (title) VALUES ($1) RETURNING *',
      [title]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/quizzes/:id — update title
app.put('/api/quizzes/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title } = req.body
    const { rows } = await query(
      'UPDATE quizzes SET title = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [title, id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Quiz not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/quizzes/:id
app.delete('/api/quizzes/:id', async (req, res) => {
  try {
    const { id } = req.params
    await query('DELETE FROM quizzes WHERE id = $1', [id])
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// QUESTIONS
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/quizzes/:quizId/questions
app.get('/api/quizzes/:quizId/questions', async (req, res) => {
  try {
    const { quizId } = req.params
    const { rows } = await query(
      'SELECT * FROM questions WHERE quiz_id = $1 ORDER BY position ASC',
      [quizId]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/quizzes/:quizId/questions — create question
app.post('/api/quizzes/:quizId/questions', async (req, res) => {
  try {
    const { quizId } = req.params
    const { content = {}, position } = req.body

    // Auto-assign next position if not provided
    let pos = position
    if (pos === undefined || pos === null) {
      const { rows } = await query(
        'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM questions WHERE quiz_id = $1',
        [quizId]
      )
      pos = rows[0].next_pos
    }

    const { rows } = await query(
      'INSERT INTO questions (quiz_id, position, content) VALUES ($1, $2, $3) RETURNING *',
      [quizId, pos, JSON.stringify(content)]
    )

    // Also update quiz updated_at
    await query('UPDATE quizzes SET updated_at = NOW() WHERE id = $1', [quizId])

    res.status(201).json({ ...rows[0], options: [], images: [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/questions/:id — update content and/or position
app.put('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { content, position } = req.body

    const fields = []
    const values = []
    let i = 1

    if (content !== undefined) { fields.push(`content = $${i++}`); values.push(JSON.stringify(content)) }
    if (position !== undefined) { fields.push(`position = $${i++}`); values.push(position) }
    fields.push(`updated_at = NOW()`)
    values.push(id)

    const { rows } = await query(
      `UPDATE questions SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    )
    if (!rows.length) return res.status(404).json({ error: 'Question not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/questions/:id
app.delete('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Delete associated image files from disk
    const { rows: images } = await query(
      'SELECT filename FROM question_images WHERE question_id = $1',
      [id]
    )
    images.forEach(({ filename }) => {
      const filePath = path.join(UPLOADS_DIR, filename)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    })

    await query('DELETE FROM questions WHERE id = $1', [id])
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/questions/reorder — bulk reorder positions
app.put('/api/quizzes/:quizId/questions/reorder', async (req, res) => {
  try {
    // Body: { order: [{ id, position }] }
    const { order } = req.body
    await Promise.all(
      order.map(({ id, position }) =>
        query('UPDATE questions SET position = $1, updated_at = NOW() WHERE id = $2', [
          position,
          id,
        ])
      )
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// OPTIONS (answer choices)
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/questions/:questionId/options
app.get('/api/questions/:questionId/options', async (req, res) => {
  try {
    const { questionId } = req.params
    const { rows } = await query(
      'SELECT * FROM options WHERE question_id = $1 ORDER BY position ASC',
      [questionId]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/questions/:questionId/options — create option
app.post('/api/questions/:questionId/options', async (req, res) => {
  try {
    const { questionId } = req.params
    const { text = '', is_correct = false, position } = req.body

    let pos = position
    if (pos === undefined || pos === null) {
      const { rows } = await query(
        'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM options WHERE question_id = $1',
        [questionId]
      )
      pos = rows[0].next_pos
    }

    const { rows } = await query(
      'INSERT INTO options (question_id, position, text, is_correct) VALUES ($1, $2, $3, $4) RETURNING *',
      [questionId, pos, text, is_correct]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/options/:id — update text or is_correct
app.put('/api/options/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { text, is_correct, position } = req.body

    const fields = []
    const values = []
    let i = 1

    if (text !== undefined) { fields.push(`text = $${i++}`); values.push(text) }
    if (is_correct !== undefined) { fields.push(`is_correct = $${i++}`); values.push(is_correct) }
    if (position !== undefined) { fields.push(`position = $${i++}`); values.push(position) }
    fields.push(`updated_at = NOW()`)
    values.push(id)

    const { rows } = await query(
      `UPDATE options SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    )
    if (!rows.length) return res.status(404).json({ error: 'Option not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/options/:id
app.delete('/api/options/:id', async (req, res) => {
  try {
    await query('DELETE FROM options WHERE id = $1', [req.params.id])
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// IMAGES
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/questions/:questionId/images — upload one or more images
app.post(
  '/api/questions/:questionId/images',
  upload.array('images', 20),
  async (req, res) => {
    try {
      const { questionId } = req.params
      if (!req.files || !req.files.length) {
        return res.status(400).json({ error: 'No files uploaded' })
      }

      const inserted = await Promise.all(
        req.files.map((file) =>
          query(
            `INSERT INTO question_images (question_id, filename, original_name, mime_type, size_bytes)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [questionId, file.filename, file.originalname, file.mimetype, file.size]
          ).then((r) => r.rows[0])
        )
      )

      res.status(201).json(inserted)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
)

// DELETE /api/images/:id
app.delete('/api/images/:id', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT filename FROM question_images WHERE id = $1',
      [req.params.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Image not found' })

    const filePath = path.join(UPLOADS_DIR, rows[0].filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    await query('DELETE FROM question_images WHERE id = $1', [req.params.id])
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
