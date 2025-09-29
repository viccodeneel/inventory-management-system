// SuccessModal.tsx
import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import './SuccessModal.css';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'error';
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div className="success-modal-overlay" onClick={handleOverlayClick}>
      <div className="success-modal-content">
        <div className={`success-modal-header ${type}`}>
          <div className="success-modal-icon">
            {type === 'success' ? (
              <CheckCircle className="success-icon" />
            ) : (
              <XCircle className="error-icon" />
            )}
          </div>
          <h3 className="success-modal-title">{title}</h3>
        </div>
        
        <div className="success-modal-body">
          <p className="success-modal-message">{message}</p>
        </div>
        
        <div className="success-modal-footer">
          <button
            className={`success-modal-btn ${type === 'success' ? 'btn-success' : 'btn-danger'}`}
            onClick={handleClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;