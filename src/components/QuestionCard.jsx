const TYPE_META = {
  multiple_choice: { label: 'Multiple Choice',     icon: 'radio_button_checked',  iconColor: 'text-blue-500',   accentBar: 'bg-blue-500'   },
  checkbox:        { label: 'Checkbox',             icon: 'check_box',             iconColor: 'text-violet-500', accentBar: 'bg-violet-500' },
  drag_drop_order: { label: 'Drag & Drop — Order', icon: 'swap_vert',             iconColor: 'text-amber-500',  accentBar: 'bg-amber-500'  },
  drag_drop_fill:  { label: 'Drag & Drop — Fill',  icon: 'drag_indicator',        iconColor: 'text-teal-500',   accentBar: 'bg-teal-500'   },
  dropdown:        { label: 'Dropdown',             icon: 'arrow_drop_down_circle',iconColor: 'text-rose-500',   accentBar: 'bg-rose-500'   },
}

export default function QuestionCard({ question, index, onDelete }) {
  const meta = TYPE_META[question.type] ?? { label: 'Question', icon: 'quiz', iconColor: 'text-slate-400', accentBar: 'bg-slate-300' }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex">
      {/* Left accent bar */}
      <div className={`w-1.5 flex-shrink-0 ${meta.accentBar}`} />

      <div className="flex-1 min-w-0">
        {/* Card header */}
        <div className="flex items-center justify-between px-5 md:px-6 pt-4 pb-3">
          <div className="flex items-center gap-2">
            {/* Question number badge */}
            <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
              {index + 1}
            </span>
            <span className={`material-symbols-outlined text-lg ${meta.iconColor}`}>{meta.icon}</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{meta.label}</span>
          </div>

          <button
            onClick={() => onDelete(question.id)}
            className="p-2 rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-400 transition-colors"
            title="Delete question"
          >
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-5 md:mx-6 h-px bg-slate-100" />

        {/* Question textarea */}
        <div className="px-5 md:px-6 py-4">
          <textarea
            placeholder="Type your question here…"
            rows={4}
            className="w-full resize-none text-base text-slate-800 placeholder-slate-300 border-0 outline-none bg-transparent leading-relaxed"
          />
        </div>
      </div>
    </div>
  )
}
