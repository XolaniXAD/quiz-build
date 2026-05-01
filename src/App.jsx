import { useState } from 'react'
import DashboardPage from './pages/DashboardPage'
import QuizEditPage from './pages/QuizEditPage'

export default function App() {
  const [page, setPage] = useState('dashboard') // 'dashboard' | 'editor'

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
