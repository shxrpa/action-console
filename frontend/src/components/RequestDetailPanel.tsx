import type { Request } from './CollectionTree';

interface VariableRef {
  name: string;
  required: boolean;
  locations: Array<'url' | 'header' | 'body'>;
  description?: string;
}

interface RequestDetailPanelProps {
  request: Request;
  onClose: () => void;
}

function RequestDetailPanel({ request, onClose }: RequestDetailPanelProps) {
  const variables: VariableRef[] = request.variables ? JSON.parse(request.variables) : [];
  const warnings: string[] = request.warnings ? JSON.parse(request.warnings) : [];

  return (
    <div className="request-detail-overlay" onClick={onClose}>
      <div className="request-detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="request-detail-header">
          <h3>{request.name}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="request-detail-content">
          <div className="detail-section">
            <h4>Request Info</h4>
            <div className="detail-row">
              <span className="detail-label">Method:</span>
              <span className={`method-badge method-${request.method.toLowerCase()}`}>{request.method}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">URL:</span>
              <span className="detail-value">{request.url}</span>
            </div>
          </div>

          {request.risk && (
            <div className="detail-section">
              <h4>Risk Level</h4>
              <span className={`risk-badge risk-${request.risk.toLowerCase()}`}>{request.risk}</span>
              {request.risk === 'Dangerous' && (
                <p className="risk-warning">⚠️ This is a destructive operation - use with caution</p>
              )}
            </div>
          )}

          {request.hasScripts && (
            <div className="detail-section">
              <h4>Scripts</h4>
              <p className="script-warning">⚠️ This request contains scripts that may affect execution behavior</p>
            </div>
          )}

          {variables.length > 0 && (
            <div className="detail-section">
              <h4>Variables ({variables.length})</h4>
              <div className="variables-list">
                {variables.map((variable, index) => (
                  <div key={index} className="variable-item">
                    <div className="variable-header">
                      <code className="variable-name">{variable.name}</code>
                      <span className={`variable-required ${variable.required ? 'required' : 'optional'}`}>
                        {variable.required ? 'Required' : 'Optional'}
                      </span>
                    </div>
                    <div className="variable-locations">
                      Locations: {variable.locations.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="detail-section">
              <h4>Warnings</h4>
              <ul className="warnings-list">
                {warnings.map((warning, index) => (
                  <li key={index} className="warning-item">⚠️ {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RequestDetailPanel;
