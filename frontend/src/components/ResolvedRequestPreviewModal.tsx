import type { ResolvedPreview } from '../services/api';
import './ConfirmModals.css';

interface ResolvedRequestPreviewModalProps {
  preview: ResolvedPreview;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResolvedRequestPreviewModal({ preview, onConfirm, onCancel }: ResolvedRequestPreviewModalProps) {
  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-modal__title">Resolved request preview</h3>
        <p className="confirm-modal__hint">Review the request that will be sent. Secrets are masked.</p>
        <div className="resolved-preview">
          <div className="resolved-preview__row">
            <strong>Method:</strong>
            <span className={`method-badge method-${preview.method.toLowerCase()}`}>{preview.method}</span>
          </div>
          <div className="resolved-preview__row">
            <strong>URL:</strong>
            <code className="resolved-preview__url">{preview.url}</code>
          </div>
          <div className="resolved-preview__row">
            <strong>Headers:</strong>
            <span>{preview.headersCount} header(s)</span>
          </div>
          {Object.keys(preview.headers).length > 0 && (
            <div className="resolved-preview__headers">
              <strong>Header list:</strong>
              <table className="headers-table">
                <tbody>
                  {Object.entries(preview.headers).map(([key, value]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td><code>{value}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {preview.bodyPreview && (
            <div className="resolved-preview__row">
              <strong>Body preview:</strong>
              <pre className="resolved-preview__body">{preview.bodyPreview}</pre>
            </div>
          )}
        </div>
        <div className="confirm-modal__actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>Continue</button>
        </div>
      </div>
    </div>
  );
}
