import { useState, useCallback } from 'react';
import { JsonTreeView, type JsonSelection } from './JsonTreeView';
import { FriendlyResponseView } from './FriendlyResponseView';
import './ResponseViewer.css';

export const VARIABLE_WALLET_REFRESH_EVENT = 'variable-wallet-refresh';

export function dispatchVariableWalletRefresh(): void {
  window.dispatchEvent(new CustomEvent(VARIABLE_WALLET_REFRESH_EVENT));
}

interface ResponseViewerProps {
  responseBody: string;
  responseHeaders: Record<string, string>;
  onSelectionChange?: (selection: JsonSelection | null) => void;
}

function isJsonContentType(headers: Record<string, string>): boolean {
  const ct = headers['content-type'] || headers['Content-Type'] || '';
  return ct.toLowerCase().includes('application/json');
}

type ViewMode = 'friendly' | 'json';

export function ResponseViewer({ responseBody, responseHeaders, onSelectionChange }: ResponseViewerProps) {
  const [selected, setSelected] = useState<JsonSelection | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('friendly');

  const setViewModeAndClearSelection = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'friendly') {
      setSelected(null);
      onSelectionChange?.(null);
    }
  }, [onSelectionChange]);

  const handleSelect = useCallback(
    (selection: JsonSelection | null) => {
      setSelected(selection);
      onSelectionChange?.(selection);
    },
    [onSelectionChange]
  );

  let parsed: unknown = null;
  let isJson = false;
  if (responseBody && responseBody.trim()) {
    const tryJson = isJsonContentType(responseHeaders) || responseBody.trimStart().startsWith('{') || responseBody.trimStart().startsWith('[');
    if (tryJson) {
      try {
        parsed = JSON.parse(responseBody);
        isJson = true;
      } catch {
        isJson = false;
      }
    }
  }

  const handleCopy = useCallback(() => {
    if (!responseBody) return;
    navigator.clipboard.writeText(responseBody).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [responseBody]);

  if (!responseBody || !responseBody.trim()) {
    return (
      <div className="response-viewer response-viewer--empty">
        <span className="response-viewer-empty-text">Empty response body</span>
      </div>
    );
  }

  if (isJson && parsed !== null) {
    return (
      <div className="response-viewer response-viewer--json">
        <div className="response-viewer-toolbar">
          <div className="response-viewer-view-toggle">
            <button
              type="button"
              className={`response-viewer-toggle-btn ${viewMode === 'friendly' ? 'active' : ''}`}
              onClick={() => setViewModeAndClearSelection('friendly')}
            >
              Friendly view
            </button>
            <button
              type="button"
              className={`response-viewer-toggle-btn ${viewMode === 'json' ? 'active' : ''}`}
              onClick={() => setViewModeAndClearSelection('json')}
            >
              JSON
            </button>
          </div>
          {viewMode === 'json' && selected && (
            <span className="response-viewer-selection" title={selected.path}>
              Selected: {selected.path}
            </span>
          )}
          <button type="button" className="btn btn-secondary btn-sm response-viewer-copy" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="response-viewer-content response-viewer-content--friendly">
          {viewMode === 'friendly' ? (
            <FriendlyResponseView data={parsed} />
          ) : (
            <div className="response-viewer-content--tree">
              <JsonTreeView
                data={parsed}
                selectedPath={selected?.path ?? null}
                onSelect={handleSelect}
                defaultExpanded={false}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="response-viewer response-viewer--text">
      <div className="response-viewer-toolbar">
        <span className="response-viewer-type">Plain text</span>
        <button type="button" className="btn btn-secondary btn-sm response-viewer-copy" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="response-viewer-content response-viewer-content--pre">
        <pre>{responseBody}</pre>
      </div>
    </div>
  );
}
