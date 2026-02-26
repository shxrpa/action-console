import './ConfirmModals.css';

interface DeleteFirstConfirmModalProps {
  actionName: string;
  url: string;
  onContinue: () => void;
  onCancel: () => void;
}

export function DeleteFirstConfirmModal({ actionName, url, onContinue, onCancel }: DeleteFirstConfirmModalProps) {
  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-modal__title">This is a DELETE request</h3>
        <p className="confirm-modal__hint">Are you sure you want to proceed? This request will delete a resource.</p>
        <div className="resolved-preview__row">
          <strong>Action:</strong>
          <span>{actionName}</span>
        </div>
        <div className="resolved-preview__row">
          <strong>URL:</strong>
          <code className="delete-first__url">{url}</code>
        </div>
        <div className="confirm-modal__actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={onContinue}>Continue</button>
        </div>
      </div>
    </div>
  );
}
