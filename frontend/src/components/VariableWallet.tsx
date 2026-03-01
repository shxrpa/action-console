import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useEnvironment } from '../contexts/EnvironmentContext';
import {
  listVariables,
  createVariable,
  updateVariable,
  deleteVariable,
} from '../services/api';
import type { Variable, CreateVariableRequest } from '../types';
import { VARIABLE_WALLET_REFRESH_EVENT } from './ResponseViewer';
import './VariableWallet.css';

export function VariableWallet() {
  const { selectedWorkspaceId } = useWorkspace();
  const { selectedEnvironmentId } = useEnvironment();
  const [variables, setVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CreateVariableRequest>({
    name: '',
    value: '',
    isSecret: false,
    scope: 'workspace',
    environmentId: null,
  });

  useEffect(() => {
    if (selectedWorkspaceId) {
      loadVariables();
    }
  }, [selectedWorkspaceId, selectedEnvironmentId]);

  useEffect(() => {
    const handler = () => loadVariables();
    window.addEventListener(VARIABLE_WALLET_REFRESH_EVENT, handler);
    return () => window.removeEventListener(VARIABLE_WALLET_REFRESH_EVENT, handler);
  }, [selectedWorkspaceId, selectedEnvironmentId]);

  const loadVariables = async () => {
    if (!selectedWorkspaceId) return;

    setLoading(true);
    try {
      const vars = await listVariables(selectedWorkspaceId, selectedEnvironmentId);
      setVariables(vars);
    } catch (error) {
      console.error('Error loading variables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceId || !formData.name.trim()) return;

    try {
      if (editingId) {
        await updateVariable(editingId, formData);
      } else {
        await createVariable(selectedWorkspaceId, {
          ...formData,
          environmentId: formData.scope === 'environment' ? selectedEnvironmentId : null,
        });
      }
      await loadVariables();
      setShowAddForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        value: '',
        isSecret: false,
        scope: 'workspace',
        environmentId: null,
      });
    } catch (error) {
      console.error('Error saving variable:', error);
      alert('Failed to save variable. Please try again.');
    }
  };

  const handleEdit = (variable: Variable) => {
    setEditingId(variable.id);
    setFormData({
      name: variable.name,
      value: '', // Don't show value for secrets
      isSecret: variable.isSecret,
      scope: variable.scope,
      environmentId: variable.environmentId,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variable?')) return;

    try {
      await deleteVariable(id);
      await loadVariables();
    } catch (error) {
      console.error('Error deleting variable:', error);
      alert('Failed to delete variable. Please try again.');
    }
  };

  const groupedVariables = {
    workspace: variables.filter((v) => v.scope === 'workspace'),
    environment: variables.filter((v) => v.scope === 'environment'),
  };

  return (
    <div className="variable-wallet">
      <div className="variable-wallet-header">
        <h2>Variable Wallet</h2>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setShowAddForm(true);
            setEditingId(null);
            setFormData({
              name: '',
              value: '',
              isSecret: false,
              scope: 'workspace',
              environmentId: null,
            });
          }}
        >
          + Add Variable
        </button>
      </div>

      {showAddForm && (
        <form className="variable-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="var-name">Name</label>
            <input
              id="var-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="var-value">Value</label>
            <input
              id="var-value"
              type={formData.isSecret ? 'password' : 'text'}
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
              placeholder={editingId && formData.isSecret ? 'Leave blank to keep current value' : ''}
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isSecret}
                onChange={(e) => setFormData({ ...formData, isSecret: e.target.checked })}
              />
              Secret (encrypted)
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="var-scope">Scope</label>
            <select
              id="var-scope"
              value={formData.scope}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  scope: e.target.value as 'workspace' | 'environment',
                  environmentId: e.target.value === 'environment' ? selectedEnvironmentId : null,
                })
              }
            >
              <option value="workspace">Workspace</option>
              <option value="environment">Environment</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="loading">Loading variables...</div>
      ) : (
        <>
          {groupedVariables.workspace.length > 0 && (
            <div className="variable-group">
              <h3>Workspace Variables</h3>
              <VariableList
                variables={groupedVariables.workspace}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}

          {groupedVariables.environment.length > 0 && (
            <div className="variable-group">
              <h3>Environment Variables</h3>
              <VariableList
                variables={groupedVariables.environment}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}

          {variables.length === 0 && !showAddForm && (
            <div className="empty-state">
              <p>No variables yet. Click "Add Variable" to create one.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const MAX_VARIABLE_NAME_LEN = 40;
const MAX_VARIABLE_VALUE_LEN = 60;
function truncate(str: string, max: number) {
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

function VariableList({
  variables,
  onEdit,
  onDelete,
}: {
  variables: Variable[];
  onEdit: (v: Variable) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="variable-list">
      {variables.map((variable) => (
        <div key={variable.id} className="variable-item">
          <div className="variable-info">
            <div className="variable-name-row">
              <span className="variable-name" title={variable.name}>
                {truncate(variable.name, MAX_VARIABLE_NAME_LEN)}
              </span>
              {variable.isSecret && <span className="secret-badge">🔒</span>}
              <span className={`status-dot ${variable.value ? 'has-value' : 'empty'}`} />
            </div>
            <div className="variable-value" title={variable.isSecret ? undefined : (variable.value || '')}>
              {variable.isSecret ? '••••••' : (variable.value ? truncate(variable.value, MAX_VARIABLE_VALUE_LEN) : '(empty)')}
            </div>
            <div className="variable-meta">
              {variable.scope === 'environment' && <span className="env-badge">Environment</span>}
            </div>
          </div>
          <div className="variable-actions">
            <button className="btn-icon" onClick={() => onEdit(variable)} title="Edit">
              ✏️
            </button>
            <button className="btn-icon" onClick={() => onDelete(variable.id)} title="Delete">
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
