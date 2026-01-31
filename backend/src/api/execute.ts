import { Router, type Request, type Response } from 'express';
import { RequestModel } from '../models/Collection';
import { ActionExecutor } from '../services/actionExecutor';

const router = Router();

interface ExecuteRequest {
  requestId: string;
  variables: Record<string, string>;
  workspaceId: string;
  environmentId?: string | null;
}

/**
 * POST /api/execute
 * Executes an action request
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { requestId, variables, workspaceId, environmentId } = req.body as ExecuteRequest;

    if (!requestId) {
      return res.status(400).json({ error: 'requestId is required' });
    }

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    if (!variables || typeof variables !== 'object') {
      return res.status(400).json({ error: 'variables must be an object' });
    }

    // Find the request
    const request = RequestModel.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Verify workspace matches
    // Note: We should check if request belongs to a collection in this workspace
    // For now, we'll trust the client, but this should be validated

    // Execute the request
    const result = await ActionExecutor.execute(
      request,
      variables,
      workspaceId,
      environmentId || null
    );

    res.json(result);
  } catch (error) {
    console.error('Error executing request:', error);
    res.status(500).json({
      error: 'Failed to execute request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
