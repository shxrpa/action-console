import { Router } from 'express';
import { RequestModel } from '../models/Collection';
import { RequestResolver } from '../services/requestResolver';
import { ActionExecutor } from '../services/actionExecutor';
import type { ExecutionContext } from '../services/requestResolver';

const router = Router();

// POST /api/execute/:actionId - Execute an action
router.post('/:actionId', async (req, res) => {
  try {
    const actionId = req.params.actionId;
    const { workspaceId, environmentId, formValues } = req.body as {
      workspaceId: string;
      environmentId?: string | null;
      formValues: Record<string, string>;
    };

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    if (!formValues || typeof formValues !== 'object') {
      return res.status(400).json({ error: 'formValues is required' });
    }

    // Get the request
    const request = RequestModel.findById(actionId);
    if (!request) {
      return res.status(404).json({ error: 'Action not found' });
    }

    // Resolve the request (substitute variables, inject auth)
    const context: ExecutionContext = {
      workspaceId,
      environmentId: environmentId || null,
      formValues,
    };

    const resolvedRequest = await RequestResolver.resolve(request, context);

    // Execute the request
    const result = await ActionExecutor.execute(resolvedRequest);

    res.json(result);
  } catch (error) {
    console.error('Error executing action:', error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to execute action' });
  }
});

export default router;
