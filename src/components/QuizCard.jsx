export default function QuizCard({ quiz, onEdit, onDelete, onDuplicate }) {
  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">
      {/* Color accent bar */}
      <div className={`h-1.5 w-full ${quiz.color ?? 'bg-primary-container'}`} />

      {/* Body */}
      <div className="flex-1 p-5 flex flex-col gap-3">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
            quiz.published
              ? 'bg-tertiary-container/30 text-tertiary'
              : 'bg-slate-100 text-slate-400'
          }`}>
            {quiz.published ? 'Published' : 'Draft'}
          </span>
          {/* 3-dot menu */}
          <div className="relative">
            <button className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100">
              <span className="material-symbols-outlined text-xl">more_vert</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-900 text-base leading-snug line-clamp-2">{quiz.title}</h3>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mt-auto pt-2">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">quiz</span>
            {quiz.questionCount} questions
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-base">schedule</span>
            {quiz.updatedAt}
          </span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between bg-slate-50/50">
        <button
          onClick={() => onEdit(quiz)}
          className="flex items-center gap-1.5 text-sm font-medium text-primary-container hover:underline"
        >
          <span className="material-symbols-outlined text-base">edit</span>
          Edit
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDuplicate(quiz)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            title="Duplicate"
          >
            <span className="material-symbols-outlined text-base">content_copy</span>
          </button>
          <button
            onClick={() => onDelete(quiz)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      </div>
    </div>
  )
}
