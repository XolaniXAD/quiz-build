import { useState } from 'react'
import TopBar from '../components/TopBar'
import SideNav from '../components/SideNav'
import Footer from '../components/Footer'
import EmptyState from '../components/EmptyState'

export default function QuizEditPage({ onNavigate }) {
  const [questions, setQuestions] = useState([])

  function handleAddQuestion() {
    // Placeholder — feature will be implemented later
    setQuestions((prev) => [...prev, { id: Date.now() }])
  }

  const isEmpty = questions.length === 0

  return (
    <div className="font-body-md text-on-background">
      <TopBar />
      <SideNav activePage="quizzes" onNavigate={onNavigate} />

      <main className="ml-64 mt-16 min-h-[calc(100vh-64px)] flex items-center justify-center p-lg overflow-hidden">
        {isEmpty ? (
          <EmptyState onAddQuestion={handleAddQuestion} />
        ) : (
          <div className="w-full max-w-3xl py-10 flex flex-col gap-6">
            {/* Question cards will be rendered here */}
            {questions.map((q, i) => (
              <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="text-slate-400 text-sm">Question {i + 1} — editor coming soon</p>
              </div>
            ))}

            {/* Add Question button at bottom when questions exist */}
            <button
              onClick={handleAddQuestion}
              className="self-center flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary rounded-xl font-semibold active:scale-95 transition-transform shadow-md hover:shadow-lg"
            >
              <span className="material-symbols-outlined">add</span>
              Add New Question
            </button>
          </div>
        )}

        {/* Decorative background element */}
        <div className="fixed bottom-12 right-12 opacity-5 pointer-events-none">
          <span className="material-symbols-outlined text-[300px]">edit_note</span>
        </div>
      </main>

      <Footer />
    </div>
  )
}
