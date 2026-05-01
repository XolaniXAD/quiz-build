export default function DeleteConfirmModal({ quiz, onConfirm, onCancel }) {
  if (!quiz) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col gap-5">
        <div className="flex items-center justify-center w-14 h-14 bg-error-container rounded-full mx-auto">
          <span className="material-symbols-outlined text-error text-3xl">delete_forever</span>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-900">Delete Quiz?</h2>
          <p className="text-sm text-slate-500 mt-1">
            <span className="font-semibold text-slate-700">"{quiz.title}"</span> and all its questions will be permanently deleted.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(quiz)}
            className="flex-1 py-2.5 rounded-xl bg-error text-on-error text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
