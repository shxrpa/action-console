import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getActionDetails } from '../services/api';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useEnvironment } from '../contexts/EnvironmentContext';
import { SetupWizard } from '../components/SetupWizard';
import { ActionForm } from '../components/ActionForm';
import type { Action } from '../services/api';

function ActionDetailPage() {
  const { actionId, collectionId } = useParams<{ actionId: string; collectionId: string }>();
  const navigate = useNavigate();
  const { selectedWorkspaceId } = useWorkspace();
  const { selectedEnvironmentId } = useEnvironment();
  const [action, setAction] = useState<Action | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (actionId) {
      loadAction();
    }
  }, [actionId, selectedWorkspaceId, selectedEnvironmentId]);

  const loadAction = async () => {
    if (!actionId) return;

    try {
      setIsLoading(true);
      setError(null);
      const actionData = await getActionDetails(
        actionId,
        selectedWorkspaceId || undefined,
        selectedEnvironmentId ?? undefined
      );
      setAction(actionData);
      
      // Show wizard if there are missing variables
      if (actionData.missingVariables && actionData.missingVariables.length > 0) {
        setShowWizard(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load action');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAction = () => {
    if (action?.missingVariables && action.missingVariables.length > 0) {
      setShowWizard(true);
    } else {
      // Show form for variable configuration
      setShowForm(true);
    }
  };

  const handleFormSubmit = (values: Record<string, string>) => {
    console.log('Form submitted with values:', values);
    // TODO: Pass to execution engine (next story)
    alert('Action execution will be available in the next story. Form values: ' + JSON.stringify(values));
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    // Reload action to get updated missing variables
    loadAction();
  };

  const formatBody = (body: string | null | undefined) => {
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

  if (error || !action) {
    return (
      <div className="action-detail-page">
        <div className="error-message">{error || 'Action not found'}</div>
        <button onClick={() => navigate(collectionId ? `/collections/${collectionId}/actions` : '/collections')}>
          Back to Catalog
        </button>
      </div>
    );
  }

  const variables = action.variables || [];
  const warnings = action.warnings || [];
  const headers = action.headers || [];
  const formattedBody = formatBody(action.body);

  return (
    <div className="action-detail-page">
      {showWizard && action.missingVariables && (
        <SetupWizard
          action={action}
          missingVariables={action.missingVariables}
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
        />
      )}

      <div className="detail-header">
        <button
          className="back-button"
          onClick={() => navigate(collectionId ? `/collections/${collectionId}/actions` : '/collections')}
        >
          ← Back to Catalog
        </button>
        <h2>{action.name}</h2>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <h3>Request Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Method:</span>
              <span className={`method-badge method-${action.method.toLowerCase()}`}>
                {action.method}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">URL:</span>
              <code className="info-value">{action.url}</code>
            </div>
            <div className="info-item">
              <span className="info-label">Risk Level:</span>
              <span className={`risk-badge risk-${(action.risk || 'Write').toLowerCase()}`}>
                {action.risk || 'Write'}
              </span>
            </div>
            {action.hasScripts && (
              <div className="info-item">
                <span className="info-label">Scripts:</span>
                <span className="script-badge">⚠️ Contains scripts</span>
              </div>
            )}
            {action.missingVariables && action.missingVariables.length > 0 && (
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className="missing-vars-badge">
                  ⚠️ {action.missingVariables.length} required variable(s) missing
                </span>
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

        {showForm && (
          <div className="detail-section">
            <ActionForm
              actionId={action.id}
              onSubmit={handleFormSubmit}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {!showForm && (
          <div className="detail-section">
            <button
              className="btn-run-action"
              onClick={handleRunAction}
              disabled={!selectedWorkspaceId}
              title={!selectedWorkspaceId ? 'Please select a workspace first' : undefined}
            >
              Run Action
            </button>
            {action.missingVariables && action.missingVariables.length > 0 && (
              <p className="missing-vars-hint">
                ⚠️ {action.missingVariables.length} required variable(s) need to be configured before running
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActionDetailPage;
