const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'quizzes',   label: 'My Quizzes', icon: 'description' },
  { id: 'templates', label: 'Templates',  icon: 'layers' },
  { id: 'analytics', label: 'Analytics',  icon: 'analytics' },
]

export default function SideNav({ activePage = 'dashboard', onNavigate, isOpen = false, onClose }) {
  function handleNav(id) {
    if (onNavigate) onNavigate(id)
    if (onClose) onClose()   // close drawer on mobile after tapping
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-16 h-[calc(100vh-64px)] w-72 md:w-64 flex flex-col p-4
          bg-slate-50 border-r border-slate-200 font-inter text-sm font-medium
          z-40 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="mb-8 px-4">
          <h2 className="text-slate-900 font-bold text-lg">QuizMaster Pro</h2>
          <p className="text-slate-500 text-xs">Editor Workspace</p>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex items-center gap-3 px-4 py-3 md:py-2 rounded-lg w-full text-left transition-all duration-200 ease-in-out ${
                  active
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <button
          onClick={() => handleNav('quizzes')}
          className="mb-6 mx-4 py-3 bg-primary-container text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">add</span>
          New Quiz
        </button>

        <div className="mt-auto border-t border-slate-200 pt-4 flex flex-col gap-1">
          <button className="flex items-center gap-3 px-4 py-3 md:py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-all w-full text-left">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </button>
          <button className="flex items-center gap-3 px-4 py-3 md:py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-all w-full text-left">
            <span className="material-symbols-outlined">help_outline</span>
            <span>Help</span>
          </button>
        </div>
      </aside>
    </>
  )
}
