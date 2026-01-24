import { Router } from 'express';
import { EnvironmentModel } from '../models/Environment';
import type { CreateEnvironmentRequest } from '../types';

const router = Router();

// GET /api/environments - List environments for workspace
router.get('/', (req, res) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId query parameter is required' });
    }

    const environments = EnvironmentModel.findByWorkspace(workspaceId);
    res.json(environments);
  } catch (error) {
    console.error('Error fetching environments:', error);
    res.status(500).json({ error: 'Failed to fetch environments' });
  }
});

// GET /api/environments/:id - Get environment by ID
router.get('/:id', (req, res) => {
  try {
    const environment = EnvironmentModel.findById(req.params.id);
    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }
    res.json(environment);
  } catch (error) {
    console.error('Error fetching environment:', error);
    res.status(500).json({ error: 'Failed to fetch environment' });
  }
});

// POST /api/environments - Create environment
router.post('/', (req, res) => {
  try {
    const workspaceId = req.body.workspaceId as string;
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    const data: CreateEnvironmentRequest = req.body;
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      return res.status(400).json({ error: 'Environment name is required' });
    }

    const environment = EnvironmentModel.create(data, workspaceId);
    res.status(201).json(environment);
  } catch (error) {
    console.error('Error creating environment:', error);
    res.status(500).json({ error: 'Failed to create environment' });
  }
});

// PUT /api/environments/:id - Update environment
router.put('/:id', (req, res) => {
  try {
    const name = req.body.name as string;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Environment name is required' });
    }

    const environment = EnvironmentModel.update(req.params.id, name);
    if (!environment) {
      return res.status(404).json({ error: 'Environment not found' });
    }
    res.json(environment);
  } catch (error) {
    console.error('Error updating environment:', error);
    res.status(500).json({ error: 'Failed to update environment' });
  }
});

// DELETE /api/environments/:id - Delete environment
router.delete('/:id', (req, res) => {
  try {
    const deleted = EnvironmentModel.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Environment not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting environment:', error);
    res.status(500).json({ error: 'Failed to delete environment' });
  }
});

export default router;
