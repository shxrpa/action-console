import { Router } from 'express';
import { RequestModel } from '../models/Collection';
import { FormGenerator } from '../services/formGenerator';
import { VariableModel } from '../models/Variable';
import type { VariableRef, QueryParamDef } from '../types';

const router = Router();

// GET /api/forms/:actionId - Get form schema for an action
router.get('/:actionId', (req, res) => {
  try {
    const actionId = req.params.actionId;
    const workspaceId = req.query.workspaceId as string | undefined;
    const environmentId = req.query.environmentId as string | null | undefined;

    // Get the request
    const request = RequestModel.findById(actionId);
    if (!request) {
      return res.status(404).json({ error: 'Action not found' });
    }

    // Parse variables from request
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

    console.log(`Form generation for action ${actionId}: Found ${variablesWithDescriptions.length} variables`);
    if (variablesWithDescriptions.length === 0) {
      return res.json({ fields: [] });
    }

    // Get default values from Variable Wallet if workspace is provided
    const variableDefaults = new Map<string, string>();
    if (workspaceId) {
      const walletVariables = VariableModel.findByWorkspace(workspaceId, environmentId || null);
      for (const walletVar of walletVariables) {
        if (!walletVar.isSecret) {
          variableDefaults.set(walletVar.name, walletVar.value);
        }
      }
    }

    const schema = FormGenerator.generateFormSchema(variablesWithDescriptions, variableDefaults);
    res.json(schema);
  } catch (error) {
    console.error('Error generating form schema:', error);
    res.status(500).json({ error: 'Failed to generate form schema' });
  }
});

export default router;
