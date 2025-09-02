'use client';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog__header">
          <h3 className="confirm-dialog__title">{title}</h3>
        </div>
        <div className="confirm-dialog__body">
          <p className="confirm-dialog__message">{message}</p>
        </div>
        <div className="confirm-dialog__footer">
          <button 
            className="confirm-dialog__button confirm-dialog__button--cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className="confirm-dialog__button confirm-dialog__button--confirm"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
