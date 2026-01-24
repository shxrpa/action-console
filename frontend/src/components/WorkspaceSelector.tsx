import { useState, useEffect, useContext } from 'react';
import type { Workspace } from '../types';
import { fetchWorkspaces, createWorkspace } from '../services/api';
import { WorkspaceContext } from '../contexts/WorkspaceContext';

interface WorkspaceSelectorProps {
  selectedWorkspaceId: string | null;
  onWorkspaceSelect: (workspaceId: string) => void;
}

function WorkspaceSelector({ selectedWorkspaceId, onWorkspaceSelect }: WorkspaceSelectorProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const context = useContext(WorkspaceContext);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    // Sync with context
    if (context && selectedWorkspaceId && context.selectedWorkspaceId !== selectedWorkspaceId) {
      context.setSelectedWorkspaceId(selectedWorkspaceId);
    }
  }, [selectedWorkspaceId, context]);

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true);
      const data = await fetchWorkspaces();
      setWorkspaces(data);
      if (data.length > 0 && !selectedWorkspaceId) {
        const firstId = data[0].id;
        onWorkspaceSelect(firstId);
        if (context) {
          context.setSelectedWorkspaceId(firstId);
        }
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newWorkspaceName.trim()) return;

    try {
      setIsCreating(true);
      const workspace = await createWorkspace(newWorkspaceName.trim());
      setWorkspaces([workspace, ...workspaces]);
      onWorkspaceSelect(workspace.id);
      if (context) {
        context.setSelectedWorkspaceId(workspace.id);
      }
      setNewWorkspaceName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create workspace:', error);
      alert('Failed to create workspace');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <div className="workspace-selector">Loading workspaces...</div>;
  }

  return (
    <div className="workspace-selector">
      <select
        value={selectedWorkspaceId || ''}
        onChange={(e) => onWorkspaceSelect(e.target.value)}
        className="workspace-dropdown"
      >
        {workspaces.map((ws) => (
          <option key={ws.id} value={ws.id}>
            {ws.name}
          </option>
        ))}
      </select>
      <button
        onClick={() => setShowCreateModal(true)}
        className="btn-create-workspace"
      >
        + New Workspace
      </button>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Workspace</h3>
            <input
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Workspace name"
              className="workspace-name-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setShowCreateModal(false);
              }}
            />
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button onClick={handleCreate} disabled={isCreating || !newWorkspaceName.trim()}>
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkspaceSelector;
