import type { ExecutionResult } from '../services/api';
import './ExecutionResult.css';

interface ExecutionResultProps {
  result: ExecutionResult;
}

export function ExecutionResult({ result }: ExecutionResultProps) {
  const formatDuration = (ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatJson = (text: string): string => {
    try {
      const parsed = JSON.parse(text);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return text;
    }
  };

  const isSuccess = result.success;
  const statusClass = isSuccess ? 'success' : 'error';

  return (
    <div className="execution-result">
      <div className={`execution-header ${statusClass}`}>
        <h3>
          {isSuccess ? '✅ Execution Successful' : '❌ Execution Failed'}
        </h3>
        <div className="execution-meta">
          <span className="status-badge">
            Status: {result.responseStatus || 'N/A'}
          </span>
          <span className="duration-badge">
            Duration: {formatDuration(result.executionDuration)}
          </span>
        </div>
      </div>

      {result.error && (
        <div className="execution-error">
          <strong>Error:</strong> {result.error}
        </div>
      )}

      <div className="execution-details">
        <div className="detail-section">
          <h4>Resolved Request</h4>
          <div className="request-info">
            <div className="info-row">
              <strong>Method:</strong> <code>{result.resolvedRequest.method}</code>
            </div>
            <div className="info-row">
              <strong>URL:</strong> <code className="url-value">{result.resolvedRequest.url}</code>
            </div>
            {result.resolvedRequest.headers.length > 0 && (
              <div className="info-row">
                <strong>Headers:</strong>
                <table className="headers-table">
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.resolvedRequest.headers.map((header, index) => (
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
            {result.resolvedRequest.body && (
              <div className="info-row">
                <strong>Body:</strong>
                <pre className="body-preview">{formatJson(result.resolvedRequest.body)}</pre>
              </div>
            )}
          </div>
        </div>

        {result.responseStatus > 0 && (
          <div className="detail-section">
            <h4>Response</h4>
            <div className="response-info">
              <div className="info-row">
                <strong>Status:</strong> <code>{result.responseStatus}</code>
              </div>
              {Object.keys(result.responseHeaders).length > 0 && (
                <div className="info-row">
                  <strong>Response Headers:</strong>
                  <table className="headers-table">
                    <thead>
                      <tr>
                        <th>Key</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(result.responseHeaders).map(([key, value], index) => (
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
              {result.responseBody && (
                <div className="info-row">
                  <strong>Response Body:</strong>
                  <pre className="response-body">{formatJson(result.responseBody)}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
