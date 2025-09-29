// ActionModal.tsx
import React, { useState } from 'react';
import './ActionModal.css';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
  title: string;
  label: string;
  placeholder: string;
  confirmText: string;
  confirmButtonClass: string;
}

const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  label,
  placeholder,
  confirmText,
  confirmButtonClass
}) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlayy" onClick={handleClose}>
      <div className="modal-contentt" onClick={(e) => e.stopPropagation()}>
        <div className="modal-headerr">
          <h3>{title}</h3>
          <button 
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isLoading}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-bodyy">
            <label htmlFor="action-reason">
              {label}
            </label>
            <textarea
              id="action-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={placeholder}
              rows={4}
              disabled={isLoading}
            />
          </div>
          
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${confirmButtonClass}`}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActionModal;