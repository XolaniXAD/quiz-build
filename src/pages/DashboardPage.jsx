import { useState } from 'react'
import TopBar from '../components/TopBar'
import SideNav from '../components/SideNav'
import Footer from '../components/Footer'
import QuizCard from '../components/QuizCard'
import QuizListItem from '../components/QuizListItem'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

// ── Mock data for visuals ─────────────────────────────────────────────────────
const MOCK_QUIZZES = [
  { id: 1, title: 'Introduction to Biology', questionCount: 24, updatedAt: '2 hours ago', published: true,  color: 'bg-blue-500' },
  { id: 2, title: 'World History: Cold War Era', questionCount: 18, updatedAt: 'Yesterday', published: true,  color: 'bg-violet-500' },
  { id: 3, title: 'Algebra Fundamentals', questionCount: 30, updatedAt: '3 days ago', published: false, color: 'bg-amber-500' },
  { id: 4, title: 'English Literature — Shakespearean Plays', questionCount: 12, updatedAt: '1 week ago', published: false, color: 'bg-rose-500' },
  { id: 5, title: 'Computer Science: Data Structures', questionCount: 40, updatedAt: '2 weeks ago', published: true,  color: 'bg-teal-500' },
  { id: 6, title: 'Chemistry: Periodic Table Basics', questionCount: 20, updatedAt: '1 month ago', published: false, color: 'bg-orange-500' },
]

const STATS = [
  { label: 'Total Quizzes', value: '6', icon: 'description' },
  { label: 'Published', value: '3', icon: 'public' },
  { label: 'Total Questions', value: '144', icon: 'quiz' },
  { label: 'Drafts', value: '3', icon: 'edit_note' },
]

export default function DashboardPage({ onEditQuiz, onNavigate }) {
  const [quizzes, setQuizzes]         = useState(MOCK_QUIZZES)
  const [viewMode, setViewMode]       = useState('card')
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState('all')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const filtered = quizzes.filter((q) => {
    const matchSearch = q.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'published' && q.published) ||
      (filter === 'draft' && !q.published)
    return matchSearch && matchFilter
  })

  function handleDelete(quiz) { setDeleteTarget(quiz) }
  function confirmDelete(quiz) {
    setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id))
    setDeleteTarget(null)
  }
  function handleDuplicate(quiz) {
    setQuizzes((prev) => [
      ...prev,
      { ...quiz, id: Date.now(), title: `${quiz.title} (Copy)`, published: false, updatedAt: 'Just now' },
    ])
  }

  return (
    <div className="font-body-md text-on-background">
      <TopBar onMenuToggle={() => setMobileNavOpen((v) => !v)} onNavigate={onNavigate} />
      <SideNav activePage="dashboard" onNavigate={onNavigate} isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <main className="md:ml-64 mt-16 min-h-[calc(100vh-64px)] pb-20 px-4 md:px-8 py-6 md:py-8">

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Quizzes</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage, edit and publish your quiz library</p>
          </div>
          <button
            onClick={() => onEditQuiz && onEditQuiz(null)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-container text-on-primary rounded-xl font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Quiz
          </button>
        </div>

        {/* ── Stats row ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary-container">{s.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar: search + filter + view toggle ──────────── */}
        <div className="flex flex-col gap-3 mb-5">
          {/* Search — full width on mobile */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search quizzes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-container/40"
            />
          </div>

          {/* Filter + view toggle row */}
          <div className="flex items-center justify-between gap-2">
            {/* Filter tabs */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 text-sm font-medium flex-1 sm:flex-none">
              {[['all', 'All'], ['published', 'Published'], ['draft', 'Drafts']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilter(val)}
                  className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg transition-all text-xs sm:text-sm ${
                    filter === val
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                title="Card view"
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                title="List view"
              >
                <span className="material-symbols-outlined text-lg">view_list</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Quiz grid / list ────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="material-symbols-outlined text-slate-300 text-6xl mb-4">search_off</span>
            <p className="text-slate-500 font-medium">No quizzes match your search.</p>
            <button onClick={() => { setSearch(''); setFilter('all') }} className="mt-3 text-sm text-primary-container underline">
              Clear filters
            </button>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((q) => (
              <QuizCard
                key={q.id}
                quiz={q}
                onEdit={onEditQuiz ?? (() => {})}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
            {/* Add new card */}
            <button
              onClick={() => onEditQuiz && onEditQuiz(null)}
              className="group border-2 border-dashed border-slate-200 hover:border-primary-container rounded-2xl flex flex-col items-center justify-center gap-3 py-12 text-slate-400 hover:text-primary-container transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">add</span>
              </div>
              <span className="text-sm font-semibold">New Quiz</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((q) => (
              <QuizListItem
                key={q.id}
                quiz={q}
                onEdit={onEditQuiz ?? (() => {})}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        quiz={deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
