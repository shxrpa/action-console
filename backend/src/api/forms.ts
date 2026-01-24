import { Router } from 'express';
import { RequestModel, FolderModel } from '../models/Collection';
import { ActionTransformer } from '../services/actionTransformer';
import { FormGenerator } from '../services/formGenerator';
import { VariableModel } from '../models/Variable';

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
    const variables = request.variables ? JSON.parse(request.variables) : [];
    if (variables.length === 0) {
      return res.json({ fields: [] });
    }

    // Get default values from Variable Wallet if workspace is provided
    const variableDefaults = new Map<string, string>();
    if (workspaceId) {
      const walletVariables = VariableModel.findByWorkspace(workspaceId, environmentId || null);
      for (const walletVar of walletVariables) {
        // Only use non-secret values as defaults (secrets should be re-entered)
        if (!walletVar.isSecret) {
          variableDefaults.set(walletVar.name, walletVar.value);
        }
      }
    }

    // Generate form schema
    const schema = FormGenerator.generateFormSchema(variables, variableDefaults);

    res.json(schema);
  } catch (error) {
    console.error('Error generating form schema:', error);
    res.status(500).json({ error: 'Failed to generate form schema' });
  }
});

export default router;
