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
 * To add a new page:
 *   1. Import the page component
 *   2. Add its case to navigate()
 *   3. Add a return branch below
 */
import { useState } from 'react'
import DashboardPage from './pages/DashboardPage'
import QuizEditPage from './pages/QuizEditPage'

export default function App() {
  const [page, setPage] = useState('editor') // 'dashboard' | 'editor'

  function navigate(target) {
    if (target === 'quizzes' || target === 'dashboard') setPage('dashboard')
  }

  if (page === 'editor') {
    return <QuizEditPage onNavigate={navigate} />
  }

  return (
    <DashboardPage
      onEditQuiz={() => setPage('editor')}
      onNavigate={navigate}
    />
  )
}
