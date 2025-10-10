// ConfirmationModal.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import './SuccessModal.css'; // reuse same styles for consistency

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Yes',
  cancelText = 'No',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div className="success-modal-overlay" onClick={handleOverlayClick}>
      <div className="success-modal-content">
        <div className="success-modal-header error">
          <div className="success-modal-icon">
            <AlertTriangle className="error-icon" />
          </div>
          <h3 className="success-modal-title">{title}</h3>
        </div>

        <div className="success-modal-body">
          <p className="success-modal-message">{message}</p>
        </div>

        <div className="success-modal-footer">
          <button className="success-modal-btn btn-danger" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="success-modal-btn btn-success" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
