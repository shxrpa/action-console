import { Router } from 'express';
import { WorkspaceModel } from '../models/Workspace';
import type { CreateWorkspaceRequest, UpdateWorkspaceRequest } from '../../shared/types';

const router = Router();

// GET /api/workspaces - List all workspaces
router.get('/', (req, res) => {
  try {
    const workspaces = WorkspaceModel.findAll();
    res.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

// GET /api/workspaces/:id - Get workspace by ID
router.get('/:id', (req, res) => {
  try {
    const workspace = WorkspaceModel.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    res.json(workspace);
  } catch (error) {
    console.error('Error fetching workspace:', error);
    res.status(500).json({ error: 'Failed to fetch workspace' });
  }
});

// POST /api/workspaces - Create new workspace
router.post('/', (req, res) => {
  try {
    const data: CreateWorkspaceRequest = req.body;
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const workspace = WorkspaceModel.create({ name: data.name.trim() });
    res.status(201).json(workspace);
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// PUT /api/workspaces/:id - Update workspace
router.put('/:id', (req, res) => {
  try {
    const data: UpdateWorkspaceRequest = req.body;
    if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
      return res.status(400).json({ error: 'Workspace name must be a non-empty string' });
    }

    const workspace = WorkspaceModel.update(req.params.id, data);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    res.json(workspace);
  } catch (error) {
    console.error('Error updating workspace:', error);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

// DELETE /api/workspaces/:id - Delete workspace
router.delete('/:id', (req, res) => {
  try {
    const deleted = WorkspaceModel.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting workspace:', error);
    res.status(500).json({ error: 'Failed to delete workspace' });
  }
});

export default router;
