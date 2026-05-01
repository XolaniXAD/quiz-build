import { useState } from 'react'
import TopBar from '../components/TopBar'

export default function QuizEditPage({ onNavigate }) {
  const [questions, setQuestions] = useState([])
  const [title, setTitle] = useState('Untitled Quiz')

  function handleAddQuestion() {
    setQuestions((prev) => [...prev, { id: Date.now() }])
  }

  const isEmpty = questions.length === 0

  return (
    <div className="font-body-md text-on-background">
      <TopBar onMenuToggle={null} onNavigate={onNavigate} />

      <main className="mt-16 min-h-[calc(100vh-64px)] flex flex-col items-center px-4 md:px-8 py-8 md:py-10">
        {/* Quiz title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-bold text-slate-900 text-center border-b-2 border-transparent hover:border-slate-200 focus:border-primary-container focus:outline-none bg-transparent mb-10 w-full max-w-2xl transition-colors"
        />

        {/* Question cards */}
        {!isEmpty && (
          <div className="w-full max-w-2xl flex flex-col gap-6 mb-8">
            {questions.map((q, i) => (
              <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <p className="text-slate-400 text-sm">Question {i + 1} — editor coming soon</p>
              </div>
            ))}
          </div>
        )}

        {/* Add Question button — centred when empty, at bottom when questions exist */}
        <button
          onClick={handleAddQuestion}
          className={`flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary rounded-xl font-semibold active:scale-95 transition-transform shadow-md hover:shadow-lg ${
            isEmpty ? 'mt-20' : ''
          }`}
        >
          <span className="material-symbols-outlined">add</span>
          {isEmpty ? 'Add Question' : 'Add New Question'}
        </button>
      </main>
    </div>
  )
}
