import { Router } from 'express';
import { RunModel } from '../models/Run';

const router = Router();

// GET /api/runs - List runs with optional filters, sort, pagination
router.get('/', (req, res) => {
  try {
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
    const sort = (req.query.sort as 'timestamp' | 'actionName' | 'success' | 'executionDuration') || 'timestamp';
    const order = (req.query.order as 'asc' | 'desc') || 'desc';
    const actionId = req.query.actionId as string | undefined;
    const environmentId = req.query.environmentId as string | undefined;
    let success: boolean | undefined;
    if (req.query.success === 'true') success = true;
    else if (req.query.success === 'false') success = false;

    const { runs, total } = RunModel.findPage({
      workspaceId,
      page,
      limit,
      sort,
      order,
      actionId,
      environmentId,
      success,
    });

    res.json({ runs, total, page, limit });
  } catch (error) {
    console.error('Error listing runs:', error);
    res.status(500).json({ error: 'Failed to list runs' });
  }
});

// GET /api/runs/:runId - Get run by ID
router.get('/:runId', (req, res) => {
  try {
    const run = RunModel.findById(req.params.runId);
    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }
    res.json(run);
  } catch (error) {
    console.error('Error fetching run:', error);
    res.status(500).json({ error: 'Failed to fetch run' });
  }
});

export default router;
