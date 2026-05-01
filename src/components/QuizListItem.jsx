export default function QuizListItem({ quiz, onEdit, onDelete, onDuplicate }) {
  return (
    <div className="group bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center gap-4 hover:shadow-sm hover:border-slate-300 transition-all duration-150">
      {/* Color dot */}
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${quiz.color ?? 'bg-primary-container'}`} />

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{quiz.title}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {quiz.questionCount} questions &middot; Updated {quiz.updatedAt}
        </p>
      </div>

      {/* Status badge */}
      <span className={`hidden sm:inline text-[11px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full flex-shrink-0 ${
        quiz.published
          ? 'bg-tertiary-container/30 text-tertiary'
          : 'bg-slate-100 text-slate-400'
      }`}>
        {quiz.published ? 'Published' : 'Draft'}
      </span>

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(quiz)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-container bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          Edit
        </button>
        <button
          onClick={() => onDuplicate(quiz)}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Duplicate"
        >
          <span className="material-symbols-outlined text-sm">content_copy</span>
        </button>
        <button
          onClick={() => onDelete(quiz)}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
    </div>
  )
}
