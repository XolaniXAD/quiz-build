const QUESTION_TYPES = [
  {
    id: 'multiple_choice',
    label: 'Multiple Choice',
    description: 'One correct answer',
    icon: 'radio_button_checked',
    accent: 'border-blue-300 hover:border-blue-400 hover:bg-blue-50',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-100',
  },
  {
    id: 'checkbox',
    label: 'Checkbox',
    description: 'Multiple correct answers',
    icon: 'check_box',
    accent: 'border-violet-300 hover:border-violet-400 hover:bg-violet-50',
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-100',
  },
  {
    id: 'drag_drop_order',
    label: 'Drag & Drop — Order',
    description: 'Arrange into sequence',
    icon: 'swap_vert',
    accent: 'border-amber-300 hover:border-amber-400 hover:bg-amber-50',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-100',
  },
  {
    id: 'drag_drop_fill',
    label: 'Drag & Drop — Fill',
    description: 'Fill in the blanks',
    icon: 'drag_indicator',
    accent: 'border-teal-300 hover:border-teal-400 hover:bg-teal-50',
    iconColor: 'text-teal-500',
    iconBg: 'bg-teal-100',
  },
  {
    id: 'dropdown',
    label: 'Dropdown',
    description: 'Choose from a list',
    icon: 'arrow_drop_down_circle',
    accent: 'border-rose-300 hover:border-rose-400 hover:bg-rose-50',
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-100',
  },
]

export default function QuestionTypePicker({ onSelect, onCancel, isEmpty }) {
  return (
    <div className="w-full">
      {isEmpty ? (
        /* Empty state */
        <div className="flex flex-col items-center pt-10 pb-6">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">quiz</span>
          <p className="text-slate-400 text-sm mb-6">Choose a question type to get started.</p>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUESTION_TYPES.map((type) => (
              <TypeCard key={type.id} type={type} onSelect={onSelect} />
            ))}
          </div>
          <button
            onClick={onCancel}
            className="mt-5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        /* Inline below last question */
        <div className="mt-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Choose question type
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUESTION_TYPES.map((type) => (
              <TypeCard key={type.id} type={type} onSelect={onSelect} />
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <button
              onClick={onCancel}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TypeCard({ type, onSelect }) {
  return (
    <button
      onClick={() => onSelect(type.id)}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-white text-left transition-all active:scale-[0.98] ${type.accent}`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${type.iconBg}`}>
        <span className={`material-symbols-outlined text-xl ${type.iconColor}`}>{type.icon}</span>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-slate-800 leading-tight">{type.label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{type.description}</p>
      </div>
    </button>
  )
}
