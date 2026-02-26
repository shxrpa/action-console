import { useState } from 'react';
import './ConfirmModals.css';

interface DangerousConfirmModalProps {
  actionName: string;
  environmentName: string | null;
  requireEnvConfirmation: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DangerousConfirmModal({
  actionName,
  environmentName,
  requireEnvConfirmation,
  onConfirm,
  onCancel,
}: DangerousConfirmModalProps) {
  const [typedName, setTypedName] = useState('');
  const [envConfirmed, setEnvConfirmed] = useState(false);
  const match = typedName.trim() === actionName;
  const canConfirm = match && (!requireEnvConfirmation || envConfirmed);

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-modal__title">Confirm dangerous action</h3>
        <p className="confirm-modal__hint">This action is marked as dangerous. Type the action name exactly to continue.</p>
        <div className="dangerous-confirm__name">{actionName}</div>
        <label>
          Type <strong>{actionName}</strong> to confirm:
        </label>
        <input
          type="text"
          className="dangerous-confirm__input"
          value={typedName}
          onChange={(e) => setTypedName(e.target.value)}
          placeholder="Action name"
          autoFocus
        />
        {typedName.trim() && !match && (
          <p className="dangerous-confirm__error">Name does not match. Type exactly: {actionName}</p>
        )}
        {requireEnvConfirmation && environmentName && (
          <div className="env-confirm-checkbox">
            <input
              type="checkbox"
              id="env-confirm"
              checked={envConfirmed}
              onChange={(e) => setEnvConfirmed(e.target.checked)}
            />
            <label htmlFor="env-confirm">
              I confirm I am running this in environment: <strong>{environmentName}</strong>
            </label>
          </div>
        )}
        <div className="confirm-modal__actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={!canConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
