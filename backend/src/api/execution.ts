import { Router } from 'express';
import { ActionExecutor } from '../services/actionExecutor';
import type { ExecutionRequest } from '../services/actionExecutor';

const router = Router();

// POST /api/execution/execute - Execute an action
router.post('/execute', async (req, res) => {
  try {
    const request: ExecutionRequest = {
      actionId: req.body.actionId,
      variables: req.body.variables || {},
      workspaceId: req.body.workspaceId,
      environmentId: req.body.environmentId || null,
    };

    if (!request.actionId) {
      return res.status(400).json({ error: 'actionId is required' });
    }

    if (!request.workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    const result = await ActionExecutor.execute(request);
    res.json(result);
  } catch (error) {
    console.error('Error executing action:', error);
    res.status(500).json({
      error: 'Failed to execute action',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
