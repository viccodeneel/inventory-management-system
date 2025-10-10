import ReactDOM from 'react-dom/client';
import ConfirmationModal from './ConfirmationModal';
import SuccessModal from './SuccessModal';

export function showConfirmationModal(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const root = ReactDOM.createRoot(div);

    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      root.unmount();
      document.body.removeChild(div);
    };

    root.render(
      <ConfirmationModal
        isOpen={true}
        title={title}
        message={message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  });
}

export function showSuccessModal(title: string, message: string): Promise<void> {
  return new Promise((resolve) => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = ReactDOM.createRoot(div);

    const handleClose = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      root.unmount();
      document.body.removeChild(div);
    };

    root.render(
      <SuccessModal
        isOpen={true}
        onClose={handleClose}
        title={title}
        message={message}
        type="success"
      />
    );
  });
}
