export default function EmptyState({ onAddQuestion }) {
  return (
    <div className="max-w-xl w-full flex flex-col items-center text-center">
      {/* Icon */}
      <div className="relative mb-8 w-48 h-48 flex items-center justify-center">
        <div className="absolute inset-0 bg-blue-100/50 rounded-full scale-150 blur-3xl" />
        <div className="relative z-10 w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100">
          <span className="material-symbols-outlined text-primary-container text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            quiz
          </span>
        </div>
        <div className="absolute -top-4 -right-4 w-12 h-12 bg-tertiary-container rounded-full shadow-lg flex items-center justify-center text-on-tertiary-container border-2 border-white">
          <span className="material-symbols-outlined text-2xl">auto_awesome</span>
        </div>
      </div>

      {/* Text */}
      <div className="space-y-4 mb-10">
        <h1 className="font-headline-md text-on-background text-3xl tracking-tight">Your Quiz Canvas is Empty</h1>
        <p className="font-body-lg text-on-surface-variant max-w-sm mx-auto">
          Start building your exam by adding your first question. Choose from multiple choice, true/false, or essay formats.
        </p>
      </div>

      {/* Add Question CTA */}
      <button
        onClick={onAddQuestion}
        className="group relative flex flex-col items-center gap-4 active:scale-95 transition-all duration-200"
      >
        <div className="flex items-center justify-center w-20 h-20 bg-primary-container text-on-primary rounded-full shadow-[0_8px_30px_rgb(36,99,235,0.4)] group-hover:shadow-[0_12px_40px_rgb(36,99,235,0.6)] group-hover:-translate-y-1 transition-all duration-300">
          <span className="material-symbols-outlined text-4xl">add</span>
        </div>
        <span className="font-headline-sm text-primary-container tracking-wide uppercase text-xs">Add Question</span>
      </button>

      {/* Hints */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-4">
        <div className="p-4 bg-white/50 border border-slate-200 rounded-xl flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-slate-400 mb-2">import_contacts</span>
          <span className="font-label-md text-slate-500">Import from CSV</span>
        </div>
        <div className="p-4 bg-white/50 border border-slate-200 rounded-xl flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-slate-400 mb-2">smart_toy</span>
          <span className="font-label-md text-slate-500">Generate with AI</span>
        </div>
        <div className="p-4 bg-white/50 border border-slate-200 rounded-xl flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-slate-400 mb-2">library_add</span>
          <span className="font-label-md text-slate-500">From Bank</span>
        </div>
      </div>
    </div>
  )
}
