import { Router } from 'express';
import { RequestModel, FolderModel } from '../models/Collection';
import { ActionTransformer } from '../services/actionTransformer';
import { detectMissingVariables } from '../services/variableDetector';
import type { Action } from '../services/actionTransformer';
import type { VariableRef, QueryParamDef } from '../types';

const router = Router();

// GET /api/actions?collectionId=xxx - Get all actions for a collection
router.get('/', (req, res) => {
  try {
    const collectionId = req.query.collectionId as string;
    if (!collectionId) {
      return res.status(400).json({ error: 'collectionId query parameter is required' });
    }

    const requests = RequestModel.findByCollection(collectionId);
    const folders = FolderModel.findByCollection(collectionId);

    // Build folder map for path resolution
    const folderMap = new Map(folders.map((f) => [f.id, f]));

    // Transform requests to actions
    const actions: Action[] = requests.map((request) =>
      ActionTransformer.transformRequest(request, folders, folderMap)
    );

    res.json(actions);
  } catch (error) {
    console.error('Error fetching actions:', error);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

// GET /api/actions/:id - Get action details
router.get('/:id', (req, res) => {
  try {
    const request = RequestModel.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Action not found' });
    }

    const folders = FolderModel.findByCollection(request.collectionId);
    const folderMap = new Map(folders.map((f) => [f.id, f]));
    const action = ActionTransformer.transformRequest(request, folders, folderMap);

    // Parse variables for response and merge query param descriptions (for SetupWizard and form)
    const variables: VariableRef[] = request.variables ? JSON.parse(request.variables) : [];
    const requestRow = request as unknown as { query_params?: string; queryParams?: string };
    const rawQueryParams = requestRow.query_params ?? requestRow.queryParams;
    const queryParams: QueryParamDef[] = rawQueryParams && typeof rawQueryParams === 'string' ? JSON.parse(rawQueryParams) : [];
    const descriptionByKey = new Map<string, string>();
    for (const q of queryParams) {
      if (q.key && q.description) descriptionByKey.set(q.key, q.description);
    }
    const variablesWithDescriptions = variables.map((v) => ({
      ...v,
      description: v.description ?? descriptionByKey.get(v.name),
    }));

    const warnings = request.warnings ? JSON.parse(request.warnings) : [];

    // Optionally include missing variables info
    const workspaceId = req.query.workspaceId as string | undefined;
    const environmentId = req.query.environmentId as string | null | undefined;

    const response: any = {
      ...action,
      variables: variablesWithDescriptions,
      warnings,
      headers: request.headers ? JSON.parse(request.headers) : [],
      body: request.body,
    };

    if (workspaceId) {
      const missing = detectMissingVariables(variables, workspaceId, environmentId || null);
      response.missingVariables = missing;
    }

    res.json(response);
  } catch (error) {
    console.error('Error fetching action:', error);
    res.status(500).json({ error: 'Failed to fetch action' });
  }
});

export default router;
