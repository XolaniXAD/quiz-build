/**
 * src/pages/QuizEditPage.jsx — quiz creation / editing page
 * ─────────────────────────────────────────────────────────
 * Props: { onNavigate(target: string) }
 *
 * Lifecycle:
 *   mount  → createQuiz()     → stores quizId in state
 *   title  → updateQuiz()     (debounced TITLE_SAVE_DELAY_MS ms)
 *   + btn  → createQuestion() → appends to questions state
 *   delete → deleteQuestion() → optimistic remove from state
 *   save   → updateQuestion() (called by RichTextEditor auto-save)
 *
 * Child components:
 *   <TopBar>             — fixed navigation bar at top
 *   <QuestionTypePicker> — overlay to pick question type when adding
 *   <QuestionCard>       — one per question, contains its <RichTextEditor>
 *
 * NOTE: quizId starts null — "Add Question" button is disabled until
 *       createQuiz() resolves and quizId is set.
 */
import { useState, useEffect, useRef } from 'react'
import TopBar from '../components/TopBar'
import QuestionTypePicker from '../components/QuestionTypePicker'
import QuestionCard from '../components/QuestionCard'
import { createQuiz, updateQuiz, createQuestion, deleteQuestion, updateQuestion } from '../api/index'
import { TITLE_SAVE_DELAY_MS } from '../constants'

export default function QuizEditPage({ onNavigate }) {
  const [questions,  setQuestions]  = useState([])
  const [title,      setTitle]      = useState('Untitled Quiz')
  const [showPicker, setShowPicker] = useState(false)
  const [quizId,     setQuizId]     = useState(null)
  const titleTimerRef = useRef(null)

  // Create the quiz row in DB immediately on mount
  useEffect(() => {
    createQuiz('Untitled Quiz')
      .then((q) => setQuizId(q.id))
      .catch(console.error)
  }, [])

  // Debounce-save title whenever it changes (skips if quizId not yet set)
  useEffect(() => {
    if (!quizId) return
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current)
    titleTimerRef.current = setTimeout(() => {
      updateQuiz(quizId, { title }).catch(console.error)
    }, TITLE_SAVE_DELAY_MS)
    return () => clearTimeout(titleTimerRef.current)
  }, [title, quizId])

  async function handleSelectType(type) {
    if (!quizId) return
    try {
      const q = await createQuestion(quizId, { type })
      setQuestions((prev) => [...prev, { id: q.id, type, content: {} }])
      setShowPicker(false)
    } catch (err) {
      console.error('Failed to create question', err)
    }
  }

  async function handleDeleteQuestion(id) {
    setQuestions((prev) => prev.filter((q) => q.id !== id)) // optimistic
    try {
      await deleteQuestion(id)
    } catch (err) {
      console.error('Failed to delete question', err)
    }
  }

  // Called by RichTextEditor auto-save (via QuestionCard prop chain)
  async function handleSaveContent(questionId, content) {
    await updateQuestion(questionId, { content })
  }

  const isEmpty = questions.length === 0

  return (
    <div className="font-body-md text-on-background bg-slate-50 min-h-screen">
      <TopBar onMenuToggle={null} onNavigate={onNavigate} />

      <main className="mt-16 min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-8 md:py-10 max-w-4xl mx-auto">
        {/* Quiz title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl md:text-3xl font-bold text-slate-900 text-center border-b-2 border-transparent hover:border-slate-200 focus:border-primary-container focus:outline-none bg-transparent mb-10 w-full transition-colors"
        />

        {/* Question cards */}
        {!isEmpty && (
          <div className="flex flex-col gap-5 mb-6">
            {questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={i}
                onDelete={handleDeleteQuestion}
                onSaveContent={handleSaveContent}
              />
            ))}
          </div>
        )}

        {/* Inline type picker */}
        {showPicker && (
          <QuestionTypePicker
            onSelect={handleSelectType}
            onCancel={() => setShowPicker(false)}
            isEmpty={isEmpty}
          />
        )}

        {/* Add Question button */}
        {!showPicker && (
          <div className={`flex justify-center ${isEmpty ? 'pt-20' : 'pt-4'}`}>
            <button
              onClick={() => setShowPicker(true)}
              disabled={!quizId}
              className="flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary rounded-xl font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-wait"
            >
              <span className="material-symbols-outlined">add</span>
              Add Question
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

