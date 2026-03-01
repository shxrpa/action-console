import { useState, useEffect } from 'react';
import { useEnvironment } from '../contexts/EnvironmentContext';
import { createVariable } from '../services/api';
import type { JsonSelection } from './JsonTreeView';
import { dispatchVariableWalletRefresh } from './ResponseViewer';
import './SaveAsVariableModal.css';

const VARIABLE_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function pathToVariableName(path: string): string {
  const s = path
    .replace(/^\[(\d+)\]$/, '$1')
    .replace(/\[(\d+)\]/g, '_$1')
    .replace(/\./g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '_');
  if (/^[0-9]/.test(s)) return 'v_' + s;
  return s || 'value';
}

interface SaveAsVariableModalProps {
  selection: JsonSelection;
  workspaceId: string;
  onSaved: (variableName: string, value: string) => void;
  onCancel: () => void;
}

export function SaveAsVariableModal({ selection, workspaceId, onSaved, onCancel }: SaveAsVariableModalProps) {
  const { selectedEnvironmentId } = useEnvironment();
  const [name, setName] = useState(pathToVariableName(selection.path));
  const [scope, setScope] = useState<'workspace' | 'environment'>('workspace');
  const [isSecret, setIsSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(pathToVariableName(selection.path));
  }, [selection.path]);

  const valueStr = typeof selection.value === 'string' ? selection.value : String(selection.value);
  const nameValid = name.trim().length > 0 && !name.includes(' ') && VARIABLE_NAME_REGEX.test(name.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameValid || !workspaceId) return;
    setSaving(true);
    setError(null);
    try {
      await createVariable(workspaceId, {
        name: name.trim(),
        value: valueStr,
        isSecret,
        scope,
        environmentId: scope === 'environment' ? selectedEnvironmentId ?? null : null,
      });
      dispatchVariableWalletRefresh();
      onSaved(name.trim(), valueStr);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save variable');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="save-as-variable-overlay" onClick={onCancel}>
      <div className="save-as-variable-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="save-as-variable-title">Save as Variable</h3>
        <p className="save-as-variable-hint">Save the selected value to the Variable Wallet for use in other actions.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="var-name">Variable name</label>
            <input
              id="var-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. user_id"
              className={!nameValid && name.length > 0 ? 'input-invalid' : ''}
              autoFocus
            />
            {name.length > 0 && !name.includes(' ') && !VARIABLE_NAME_REGEX.test(name) && (
              <span className="form-hint">Use only letters, numbers, and underscores. Must not start with a number.</span>
            )}
            {name.includes(' ') && <span className="form-hint">No spaces allowed.</span>}
          </div>
          <div className="form-group">
            <label>Scope</label>
            <select value={scope} onChange={(e) => setScope(e.target.value as 'workspace' | 'environment')}>
              <option value="workspace">Workspace (all environments)</option>
              <option value="environment">Current environment only</option>
            </select>
          </div>
          <div className="form-group form-group--checkbox">
            <label>
              <input type="checkbox" checked={isSecret} onChange={(e) => setIsSecret(e.target.checked)} />
              Store as secret (encrypted)
            </label>
          </div>
          {error && <div className="save-as-variable-error">{error}</div>}
          <div className="save-as-variable-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!nameValid || saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
