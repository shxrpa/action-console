import './ConfirmModals.css';

interface WriteConfirmModalProps {
  method: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function WriteConfirmModal({ method, onConfirm, onCancel }: WriteConfirmModalProps) {
  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-modal__title">Confirm {method} request</h3>
        <div className="write-confirm__warning">
          Undo is not possible. This request will modify data on the server.
        </div>
        <div className="confirm-modal__actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>Run</button>
        </div>
      </div>
    </div>
  );
}
