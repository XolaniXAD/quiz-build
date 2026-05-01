export default function TopBar({ onMenuToggle, onNavigate }) {
  return (
    <header className="fixed top-0 w-full z-50 flex items-center justify-between px-4 md:px-6 h-16 bg-white border-b border-slate-200 shadow-sm font-inter antialiased">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 -ml-1 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}
        <button
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="text-xl font-black tracking-tight text-slate-900 hover:text-primary-container transition-colors"
        >
          QuizMaster
        </button>
        <nav className="hidden md:flex gap-6 ml-8">
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="text-slate-600 hover:bg-slate-50 transition-colors px-3 py-1 rounded-lg text-sm font-medium"
          >
            Dashboard
          </button>
          <a className="text-blue-600 font-semibold px-3 py-1 rounded-lg text-sm" href="#">My Quizzes</a>
          <a className="text-slate-600 hover:bg-slate-50 transition-colors px-3 py-1 rounded-lg text-sm font-medium" href="#">Templates</a>
          <a className="text-slate-600 hover:bg-slate-50 transition-colors px-3 py-1 rounded-lg text-sm font-medium" href="#">Analytics</a>
        </nav>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <button className="flex items-center gap-2 px-3 md:px-4 py-2 bg-primary-container text-on-primary rounded-xl font-semibold text-sm active:scale-95 transition-transform">
          <span>Save</span>
        </button>
        <div className="flex items-center gap-1 border-l pl-2 md:pl-4 border-slate-200">
          <button className="p-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors" title="Sync Status">
            <span className="material-symbols-outlined">cloud_done</span>
          </button>
          <button className="p-2 text-slate-600 hover:bg-slate-50 rounded-full transition-colors" title="Profile">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </header>
  )
}
