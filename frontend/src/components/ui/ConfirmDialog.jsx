import { useState } from 'react';
import Modal from './Modal';

const typeConfig = {
  danger: {
    icon: '\u26A0\uFE0F',
    confirmClass:
      'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: '\u26A0\uFE0F',
    confirmClass:
      'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500 text-white',
    iconColor: 'text-yellow-500 dark:text-yellow-400',
  },
};

export default function ConfirmDialog({
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger',
}) {
  const [loading, setLoading] = useState(false);
  const config = typeConfig[type] || typeConfig.danger;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onCancel} title={title} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <span className={`text-4xl mb-3 ${config.iconColor}`}>{config.icon}</span>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {message}
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 ${config.confirmClass}`}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
