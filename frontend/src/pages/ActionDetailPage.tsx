import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface VariableRef {
  name: string;
  required: boolean;
  locations: Array<'url' | 'header' | 'body'>;
}

interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: string;
  body: string | null;
  variables?: string;
  risk?: 'Safe' | 'Write' | 'Dangerous';
  hasScripts?: boolean;
  warnings?: string;
}

function ActionDetailPage() {
  const { collectionId, actionId } = useParams<{ collectionId: string; actionId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (actionId && collectionId) {
      loadAction();
    }
  }, [actionId, collectionId]);

  const loadAction = async () => {
    if (!actionId || !collectionId) return;

    try {
      setIsLoading(true);
      setError(null);
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/collections/${collectionId}`);
      if (!response.ok) {
        throw new Error('Failed to load collection');
      }
      const collection = await response.json();
      const foundRequest = collection.requests.find((r: Request) => r.id === actionId);
      if (!foundRequest) {
        throw new Error('Action not found');
      }
      setRequest(foundRequest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load action');
    } finally {
      setIsLoading(false);
    }
  };

  const formatHeaders = (headersJson: string) => {
    try {
      const headers = JSON.parse(headersJson);
      if (Array.isArray(headers)) {
        return headers;
      }
      return [];
    } catch {
      return [];
    }
  };

  const formatBody = (body: string | null) => {
    if (!body) return null;
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  };

  if (isLoading) {
    return (
      <div className="action-detail-page">
        <p>Loading action...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="action-detail-page">
        <div className="error-message">{error || 'Action not found'}</div>
        <button onClick={() => navigate(`/collections/${collectionId}/actions`)}>
          Back to Catalog
        </button>
      </div>
    );
  }

  const variables: VariableRef[] = request.variables ? JSON.parse(request.variables) : [];
  const warnings: string[] = request.warnings ? JSON.parse(request.warnings) : [];
  const headers = formatHeaders(request.headers);
  const formattedBody = formatBody(request.body);

  return (
    <div className="action-detail-page">
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate(`/collections/${collectionId}/actions`)}>
          ← Back to Catalog
        </button>
        <h2>{request.name}</h2>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <h3>Request Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Method:</span>
              <span className={`method-badge method-${request.method.toLowerCase()}`}>
                {request.method}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">URL:</span>
              <code className="info-value">{request.url}</code>
            </div>
            {request.risk && (
              <div className="info-item">
                <span className="info-label">Risk Level:</span>
                <span className={`risk-badge risk-${request.risk.toLowerCase()}`}>
                  {request.risk}
                </span>
              </div>
            )}
            {request.hasScripts && (
              <div className="info-item">
                <span className="info-label">Scripts:</span>
                <span className="script-badge">⚠️ Contains scripts</span>
              </div>
            )}
          </div>
        </div>

        {variables.length > 0 && (
          <div className="detail-section">
            <h3>Variables ({variables.length})</h3>
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
                    <strong>Locations:</strong> {variable.locations.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {headers.length > 0 && (
          <div className="detail-section">
            <h3>Headers</h3>
            <table className="headers-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {headers.map((header: { key: string; value: string }, index: number) => (
                  <tr key={index}>
                    <td>{header.key}</td>
                    <td>
                      <code>{header.value}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {formattedBody && (
          <div className="detail-section">
            <h3>Body</h3>
            <pre className="body-preview">{formattedBody}</pre>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="detail-section">
            <h3>Warnings</h3>
            <ul className="warnings-list">
              {warnings.map((warning, index) => (
                <li key={index} className="warning-item">
                  ⚠️ {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="detail-section">
          <button className="btn-run-action" disabled title="Coming in next story">
            Run Action
          </button>
          <p className="coming-soon">Action execution will be available in the next story</p>
        </div>
      </div>
    </div>
  );
}

export default ActionDetailPage;
