export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-64 right-0 h-12 bg-white/80 backdrop-blur-sm border-t border-slate-200 flex items-center justify-between px-8 text-[11px] font-medium text-slate-400 uppercase tracking-widest z-40">
      <div className="flex gap-6">
        <span>Last saved: 2 minutes ago</span>
        <span>Unpublished Changes</span>
      </div>
      <div className="flex gap-6">
        <span>QuizMaster Engine v2.4.0</span>
        <a className="hover:text-blue-600 transition-colors" href="#">Privacy Policy</a>
      </div>
    </footer>
  )
}
