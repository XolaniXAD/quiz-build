export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 md:left-64 right-0 h-auto md:h-12 bg-white/80 backdrop-blur-sm border-t border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-8 py-2 md:py-0 text-[11px] font-medium text-slate-400 uppercase tracking-widest z-40 gap-1 md:gap-0">
      <div className="flex gap-4 md:gap-6">
        <span>Last saved: 2 minutes ago</span>
        <span className="hidden sm:inline">Unpublished Changes</span>
      </div>
      <div className="flex gap-4 md:gap-6">
        <span className="hidden md:inline">QuizMaster Engine v2.4.0</span>
        <a className="hover:text-blue-600 transition-colors" href="#">Privacy Policy</a>
      </div>
    </footer>
  )
}
