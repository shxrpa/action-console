import type { ExecutionResult as ExecutionResultType } from '../services/api';
import './ExecutionResult.css';

interface ExecutionResultProps {
  result: ExecutionResultType;
  onClose: () => void;
  onRunAgain: () => void;
}

export function ExecutionResult({ result, onClose, onRunAgain }: ExecutionResultProps) {
  const formatHeaders = (headers: Record<string, string>) => {
    return Object.entries(headers).map(([key, value]) => ({ key, value }));
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

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="execution-result">
      <div className="result-header">
        <h3>Execution Result</h3>
        <div className={`status-badge ${result.success ? 'success' : 'error'}`}>
          {result.success ? '✓ Success' : '✗ Failed'}
        </div>
      </div>

      <div className="result-summary">
        <div className="summary-item">
          <span className="summary-label">Status:</span>
          <span className={`status-code ${result.responseStatus >= 200 && result.responseStatus < 300 ? 'success' : 'error'}`}>
            {result.responseStatus > 0 ? result.responseStatus : 'N/A'}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Duration:</span>
          <span>{formatDuration(result.executionDuration)}</span>
        </div>
        {result.error && (
          <div className="summary-item error">
            <span className="summary-label">Error:</span>
            <span>{result.error}</span>
          </div>
        )}
      </div>

      <div className="result-section">
        <h4>Resolved Request</h4>
        <div className="resolved-request">
          <div className="request-method">{result.resolvedRequest.method}</div>
          <div className="request-url">{result.resolvedRequest.url}</div>
        </div>

        {Object.keys(result.resolvedRequest.headers).length > 0 && (
          <div className="request-headers">
            <h5>Headers</h5>
            <table className="headers-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.resolvedRequest.headers).map(([key, value], index) => (
                  <tr key={index}>
                    <td>{key}</td>
                    <td>
                      <code>{value}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result.resolvedRequest.body && (
          <div className="request-body">
            <h5>Body</h5>
            <pre>{formatBody(result.resolvedRequest.body) || result.resolvedRequest.body}</pre>
          </div>
        )}
      </div>

      <div className="result-section">
        <h4>Response</h4>
        {Object.keys(result.responseHeaders).length > 0 && (
          <div className="response-headers">
            <h5>Headers</h5>
            <table className="headers-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {formatHeaders(result.responseHeaders).map((header, index) => (
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

        {result.responseBody && (
          <div className="response-body">
            <h5>Body</h5>
            <pre>{formatBody(result.responseBody) || result.responseBody}</pre>
          </div>
        )}
      </div>

      <div className="result-actions">
        <button className="btn btn-primary" onClick={onRunAgain}>
          Run Again
        </button>
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
