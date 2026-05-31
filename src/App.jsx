/**
 * src/App.jsx — root component / client-side router
 * ───────────────────────────────────────────────────
 * Owns the single `page` state that switches between views.
 * There is NO router library — navigation is just a setState call.
 *
 * Pages:
 *   'editor'    (default on load) → <QuizEditPage>
 *   'dashboard'                   → <DashboardPage>
 *
 * Quiz persistence across reloads:
 *   currentQuizId is read from / written to localStorage('quizId').
 *   On reload the same quiz is reopened instead of creating a new blank one.
 *   Set localStorage.removeItem('quizId') to force-create a fresh quiz.
 *
 * To add a new page:
 *   1. Import the page component
 *   2. Add its case to navigate()
 *   3. Add a return branch below
 */
import { useState } from 'react'
import DashboardPage from './pages/DashboardPage'
import QuizEditPage from './pages/QuizEditPage'

export default function App() {
  const [page, setPage] = useState('editor')

  // Restore last-opened quiz from localStorage so reloads don't lose the quiz
  const [currentQuizId, setCurrentQuizId] = useState(
    () => localStorage.getItem('quizId') ? Number(localStorage.getItem('quizId')) : null
  )

  // Called by QuizEditPage when it creates a brand-new quiz
  function handleQuizCreated(id) {
    setCurrentQuizId(id)
    localStorage.setItem('quizId', String(id))
  }

  function navigate(target, quizId = null) {
    if (target === 'quizzes' || target === 'dashboard') setPage('dashboard')
    if (target === 'editor') {
      setCurrentQuizId(quizId)
      if (quizId) localStorage.setItem('quizId', String(quizId))
      else localStorage.removeItem('quizId')
      setPage('editor')
    }
  }

  if (page === 'editor') {
    return (
      <QuizEditPage
        quizId={currentQuizId}
        onQuizCreated={handleQuizCreated}
        onNavigate={navigate}
      />
    )
  }

  return (
    <DashboardPage
      onEditQuiz={(id) => navigate('editor', id)}
      onNavigate={navigate}
    />
  )
}
