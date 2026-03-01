import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRun, type Run } from '../services/api';
import './RunDetailPage.css';

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatBody(body: string | null): string {
  if (!body) return '';
  try {
    const parsed = JSON.parse(body);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return body;
  }
}

export default function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawRequestOpen, setRawRequestOpen] = useState(false);
  const [rawResponseOpen, setRawResponseOpen] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;
    getRun(runId)
      .then(setRun)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load run'))
      .finally(() => setLoading(false));
  }, [runId]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast(`${label} copied to clipboard`);
      setTimeout(() => setCopyToast(null), 2000);
    } catch {
      setCopyToast(`Failed to copy ${label}`);
      setTimeout(() => setCopyToast(null), 2000);
    }
  };

  if (loading || !runId) {
    return (
      <div className="run-detail-page">
        {loading && <p>Loading run...</p>}
        {!runId && <p>Missing run ID.</p>}
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="run-detail-page">
        <div className="error-message">{error ?? 'Run not found'}</div>
        <button type="button" onClick={() => navigate('/runs')}>Back to Run History</button>
      </div>
    );
  }

  const resolvedRequest = (() => {
    try {
      return JSON.parse(run.resolvedRequest) as { method: string; url: string; headers: Record<string, string>; body: string | null };
    } catch {
      return { method: '', url: '', headers: {}, body: null };
    }
  })();
  const responseHeaders = (() => {
    try {
      return JSON.parse(run.responseHeaders) as Record<string, string>;
    } catch {
      return {};
    }
  })();

  return (
    <div className="run-detail-page">
      <div className="run-detail-header">
        <button type="button" className="btn-back" onClick={() => navigate('/runs')}>
          Back to Run History
        </button>
        <h2>Run details</h2>
      </div>

      <section className="run-section">
        <h3>Run metadata</h3>
        <dl className="run-meta">
          <dt>Timestamp</dt>
          <dd>{formatTimestamp(run.timestamp)}</dd>
          <dt>Action</dt>
          <dd>
            {run.collectionId ? (
              <Link to={`/collections/${run.collectionId}/actions/${run.actionId}`}>{run.actionName}</Link>
            ) : (
              run.actionName
            )}
          </dd>
          <dt>Environment</dt>
          <dd><span className="env-badge">{run.environmentName}</span></dd>
          <dt>Execution duration</dt>
          <dd>{formatDuration(run.executionDuration)}</dd>
          <dt>Outcome</dt>
          <dd>
            <span className={`status-badge ${run.success ? 'success' : 'error'}`}>
              {run.success ? 'Success' : 'Failure'}
            </span>
          </dd>
        </dl>
      </section>

      <section className="run-section">
        <h3>Resolved request</h3>
        <div className="section-actions">
          <button type="button" onClick={() => setRawRequestOpen((v) => !v)}>
            {rawRequestOpen ? 'Hide raw request' : 'View raw request'}
          </button>
          <button type="button" onClick={() => copyToClipboard(JSON.stringify(resolvedRequest, null, 2), 'Request')}>
            Copy request
          </button>
        </div>
        {rawRequestOpen ? (
          <pre className="raw-block">{JSON.stringify(resolvedRequest, null, 2)}</pre>
        ) : (
          <>
            <div className="request-method-url">
              <span className="method">{resolvedRequest.method}</span>
              <span className="url">{resolvedRequest.url}</span>
            </div>
            {Object.keys(resolvedRequest.headers).length > 0 && (
              <table className="headers-table">
                <thead>
                  <tr><th>Header</th><th>Value</th></tr>
                </thead>
                <tbody>
                  {Object.entries(resolvedRequest.headers).map(([k, v]) => (
                    <tr key={k}><td>{k}</td><td>{v}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {resolvedRequest.body && (
              <div className="body-block">
                <strong>Body</strong>
                <pre>{formatBody(resolvedRequest.body)}</pre>
              </div>
            )}
          </>
        )}
      </section>

      <section className="run-section">
        <h3>Response</h3>
        <div className="section-actions">
          <button type="button" onClick={() => setRawResponseOpen((v) => !v)}>
            {rawResponseOpen ? 'Hide raw response' : 'View raw response'}
          </button>
          <button type="button" onClick={() => copyToClipboard(run.responseBody, 'Response')}>
            Copy response
          </button>
        </div>
        <p className="response-status">
          Status: <span className={run.responseStatus >= 200 && run.responseStatus < 300 ? 'success' : 'error'}>{run.responseStatus}</span>
        </p>
        {Object.keys(responseHeaders).length > 0 && (
          <table className="headers-table">
            <thead>
              <tr><th>Header</th><th>Value</th></tr>
            </thead>
            <tbody>
              {Object.entries(responseHeaders).map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        {run.responseBodyTruncated ? (
          <p className="truncated-notice">Response too large, truncated. Only the first 1MB is stored.</p>
        ) : null}
        {rawResponseOpen ? (
          <pre className="raw-block">{run.responseBody || '(empty)'}</pre>
        ) : (
          <pre className="body-block">{formatBody(run.responseBody) || run.responseBody || '(empty)'}</pre>
        )}
      </section>

      {!run.success && run.error && (
        <section className="run-section">
          <h3>Error details</h3>
          <p className="error-message">{run.error}</p>
        </section>
      )}

      {copyToast && <div className="copy-toast" role="status">{copyToast}</div>}
    </div>
  );
}
