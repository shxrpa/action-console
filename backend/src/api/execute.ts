import { Router } from 'express';
import { RequestModel, CollectionModel } from '../models/Collection';
import { EnvironmentModel } from '../models/Environment';
import { VariableModel } from '../models/Variable';
import { RunModel } from '../models/Run';
import { RequestResolver } from '../services/requestResolver';
import { ActionExecutor } from '../services/actionExecutor';
import { maskSecrets } from '../services/secretMasker';
import { decryptSecret } from '../services/encryption';
import type { ExecutionContext } from '../services/requestResolver';

const router = Router();

const SENSITIVE_HEADER_NAMES = [
  'authorization',
  'x-api-key',
  'api-key',
  'x-auth-token',
  'cookie',
  'set-cookie',
  'proxy-authorization',
];

function maskForPreview(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    const isSensitive = SENSITIVE_HEADER_NAMES.some((h) => lower === h || lower.includes(h));
    out[key] = isSensitive && value ? '••••••' : value;
  }
  return out;
}

// POST /api/execute/:actionId/preview - Resolve request and return preview (no execution)
router.post('/:actionId/preview', async (req, res) => {
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

    const request = RequestModel.findById(actionId);
    if (!request) {
      return res.status(404).json({ error: 'Action not found' });
    }

    const context: ExecutionContext = {
      workspaceId,
      environmentId: environmentId || null,
      formValues,
    };
    const resolved = await RequestResolver.resolve(request, context);
    const headersMasked = maskForPreview(resolved.headers);
    const headerCount = Object.keys(resolved.headers).length;
    let bodyPreview: string | null = null;
    if (resolved.body) {
      try {
        const parsed = JSON.parse(resolved.body);
        bodyPreview = JSON.stringify(parsed).slice(0, 500);
        if (JSON.stringify(parsed).length > 500) bodyPreview += '…';
      } catch {
        bodyPreview = resolved.body.slice(0, 500);
        if (resolved.body.length > 500) bodyPreview += '…';
      }
    }
    res.json({
      method: resolved.method,
      url: resolved.url,
      headersCount: headerCount,
      headers: headersMasked,
      bodyPreview,
    });
  } catch (error) {
    console.error('Error previewing action:', error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to preview action' });
  }
});

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

    // Persist run for audit log (with secret masking and optional response truncation)
    const collection = CollectionModel.findById(request.collectionId);
    const runWorkspaceId = collection?.workspaceId ?? workspaceId;
    const runEnvironmentId = context.environmentId ?? '';
    const environment = runEnvironmentId ? EnvironmentModel.findById(runEnvironmentId) : null;
    const environmentName = environment?.name ?? '';

    const secretValues: string[] = [];
    try {
      const variables = VariableModel.findByWorkspace(runWorkspaceId, context.environmentId);
      for (const v of variables) {
        if (v.isSecret && (v as { value: string }).value) {
          try {
            secretValues.push(decryptSecret((v as { value: string }).value));
          } catch {
            // skip if decrypt fails
          }
        }
      }
    } catch {
      // ignore
    }
    const maskedRequest = maskSecrets(result.resolvedRequest, secretValues);

    const run = RunModel.create({
      actionId: request.id,
      actionName: request.name,
      collectionId: request.collectionId,
      environmentId: runEnvironmentId || 'none',
      environmentName: environmentName || 'None',
      workspaceId: runWorkspaceId,
      resolvedRequest: maskedRequest,
      responseStatus: result.responseStatus,
      responseHeaders: result.responseHeaders,
      responseBody: result.responseBody,
      success: result.success,
      error: result.error,
      executionDuration: result.executionDuration,
    });

    res.json({ ...result, runId: run.id });
  } catch (error) {
    console.error('Error executing action:', error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to execute action' });
  }
});

export default router;
