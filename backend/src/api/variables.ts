import { Router } from 'express';
import { VariableModel } from '../models/Variable';
import { EnvironmentModel } from '../models/Environment';
import type { CreateVariableRequest, UpdateVariableRequest } from '../types';
import { maskSecret } from '../services/encryption';

const router = Router();

// GET /api/variables - List variables for workspace/environment
router.get('/', (req, res) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    const environmentId = req.query.environmentId as string | null | undefined;

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId query parameter is required' });
    }

    const variables = VariableModel.findByWorkspace(workspaceId, environmentId || null);
    
    // Mask secrets for API response
    const maskedVariables = variables.map((v) => ({
      ...v,
      value: v.isSecret ? maskSecret(v.value) : v.value,
    }));

    res.json(maskedVariables);
  } catch (error) {
    console.error('Error fetching variables:', error);
    res.status(500).json({ error: 'Failed to fetch variables' });
  }
});

// GET /api/variables/:id - Get variable by ID (decrypted if needed)
router.get('/:id', (req, res) => {
  try {
    const decrypt = req.query.decrypt === 'true';
    const variable = VariableModel.findById(req.params.id, decrypt);
    
    if (!variable) {
      return res.status(404).json({ error: 'Variable not found' });
    }

    // Mask secret unless decrypt is explicitly requested
    if (variable.isSecret && !decrypt) {
      variable.value = maskSecret(variable.value);
    }

    res.json(variable);
  } catch (error) {
    console.error('Error fetching variable:', error);
    res.status(500).json({ error: 'Failed to fetch variable' });
  }
});

// POST /api/variables - Create variable
router.post('/', (req, res) => {
  try {
    const workspaceId = req.body.workspaceId as string;
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    const data: CreateVariableRequest = req.body;
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      return res.status(400).json({ error: 'Variable name is required' });
    }

    if (data.value === undefined || typeof data.value !== 'string') {
      return res.status(400).json({ error: 'Variable value is required' });
    }

    if (data.scope === 'environment' && !data.environmentId) {
      return res.status(400).json({ error: 'environmentId is required for environment-scoped variables' });
    }

    const variable = VariableModel.create(data, workspaceId);
    
    // Mask secret in response
    const response = {
      ...variable,
      value: variable.isSecret ? maskSecret(variable.value) : variable.value,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating variable:', error);
    res.status(500).json({ error: 'Failed to create variable' });
  }
});

// PUT /api/variables/:id - Update variable
router.put('/:id', (req, res) => {
  try {
    const data: UpdateVariableRequest = req.body;
    const variable = VariableModel.update(req.params.id, data);
    
    if (!variable) {
      return res.status(404).json({ error: 'Variable not found' });
    }

    // Mask secret in response
    const response = {
      ...variable,
      value: variable.isSecret ? maskSecret(variable.value) : variable.value,
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating variable:', error);
    res.status(500).json({ error: 'Failed to update variable' });
  }
});

// DELETE /api/variables/:id - Delete variable
router.delete('/:id', (req, res) => {
  try {
    const deleted = VariableModel.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Variable not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting variable:', error);
    res.status(500).json({ error: 'Failed to delete variable' });
  }
});

export default router;
