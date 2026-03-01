import type { Workspace } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const response = await fetch(`${API_BASE_URL}/workspaces`);
  if (!response.ok) {
    throw new Error('Failed to fetch workspaces');
  }
  return response.json();
}

export async function createWorkspace(name: string): Promise<Workspace> {
  const response = await fetch(`${API_BASE_URL}/workspaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error('Failed to create workspace');
  }
  return response.json();
}

export async function deleteWorkspace(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/workspaces/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete workspace');
  }
}

// Collection API
export interface Collection {
  id: string;
  name: string;
  description: string | null;
  schemaVersion: string;
  workspaceId: string;
  importedAt: string;
  requestCount?: number;
}

export async function importCollection(file: File, workspaceId: string): Promise<Collection> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('workspaceId', workspaceId);

  const response = await fetch(`${API_BASE_URL}/collections/import`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to import collection' }));
    const errorMessage = errorData.error || 'Failed to import collection';
    console.error('Import error:', errorData);
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function fetchCollections(workspaceId: string): Promise<Collection[]> {
  const response = await fetch(`${API_BASE_URL}/collections?workspaceId=${workspaceId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch collections');
  }
  return response.json();
}

export async function getCollection(collectionId: string): Promise<Collection & { folders?: unknown; requests?: unknown }> {
  const response = await fetch(`${API_BASE_URL}/collections/${collectionId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch collection');
  }
  return response.json();
}

/** Fetch all actions across all collections in a workspace (for run history filters) */
export async function fetchActionsForWorkspace(workspaceId: string): Promise<Action[]> {
  const collections = await fetchCollections(workspaceId);
  const allActions: Action[] = [];
  for (const c of collections) {
    const response = await fetch(`${API_BASE_URL}/actions?collectionId=${c.id}`);
    if (response.ok) {
      const actions: Action[] = await response.json();
      allActions.push(...actions);
    }
  }
  return allActions;
}

export async function deleteCollection(collectionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/collections/${collectionId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Collection not found');
    }
    throw new Error('Failed to delete collection');
  }
}

// Variable Wallet API
import type {
  Variable,
  Environment,
  CreateVariableRequest,
  UpdateVariableRequest,
  CreateEnvironmentRequest,
} from '../types';

export async function listVariables(workspaceId: string, environmentId?: string | null): Promise<Variable[]> {
  const params = new URLSearchParams({ workspaceId });
  if (environmentId) {
    params.append('environmentId', environmentId);
  }
  const response = await fetch(`${API_BASE_URL}/variables?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch variables');
  }
  return response.json();
}

export async function getVariable(variableId: string, decrypt = false): Promise<Variable> {
  const params = decrypt ? '?decrypt=true' : '';
  const response = await fetch(`${API_BASE_URL}/variables/${variableId}${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch variable');
  }
  return response.json();
}

export async function createVariable(workspaceId: string, data: CreateVariableRequest): Promise<Variable> {
  const response = await fetch(`${API_BASE_URL}/variables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, workspaceId }),
  });
  if (!response.ok) {
    throw new Error('Failed to create variable');
  }
  return response.json();
}

export async function updateVariable(variableId: string, data: UpdateVariableRequest): Promise<Variable> {
  const response = await fetch(`${API_BASE_URL}/variables/${variableId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update variable');
  }
  return response.json();
}

export async function deleteVariable(variableId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/variables/${variableId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete variable');
  }
}

// Environment API
export async function listEnvironments(workspaceId: string): Promise<Environment[]> {
  const response = await fetch(`${API_BASE_URL}/environments?workspaceId=${workspaceId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch environments');
  }
  return response.json();
}

export async function getEnvironment(environmentId: string): Promise<Environment> {
  const response = await fetch(`${API_BASE_URL}/environments/${environmentId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch environment');
  }
  return response.json();
}

export async function createEnvironment(workspaceId: string, data: CreateEnvironmentRequest): Promise<Environment> {
  const response = await fetch(`${API_BASE_URL}/environments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, workspaceId }),
  });
  if (!response.ok) {
    throw new Error('Failed to create environment');
  }
  return response.json();
}

export async function updateEnvironment(environmentId: string, name: string): Promise<Environment> {
  const response = await fetch(`${API_BASE_URL}/environments/${environmentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error('Failed to update environment');
  }
  return response.json();
}

export async function deleteEnvironment(environmentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/environments/${environmentId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete environment');
  }
}

// Action API
export interface Action {
  id: string;
  name: string;
  description: string;
  method: string;
  url: string;
  risk: 'Safe' | 'Write' | 'Dangerous' | null;
  hasScripts: boolean;
  requiredVariablesCount: number;
  totalVariablesCount: number;
  folderPath: string;
  folderId: string | null;
  collectionId: string;
  variables?: VariableRef[];
  warnings?: string[];
  headers?: Array<{ key: string; value: string }>;
  body?: string | null;
  missingVariables?: string[];
}

export interface VariableRef {
  name: string;
  required: boolean;
  locations: Array<'url' | 'header' | 'body'>;
  description?: string;
}

export async function getActionDetails(
  actionId: string,
  workspaceId?: string,
  environmentId?: string | null | undefined
): Promise<Action> {
  const params = new URLSearchParams();
  if (workspaceId) {
    params.append('workspaceId', workspaceId);
  }
  if (environmentId !== undefined && environmentId !== null) {
    params.append('environmentId', environmentId);
  }
  const queryString = params.toString();
  const url = `${API_BASE_URL}/actions/${actionId}${queryString ? `?${queryString}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch action details');
  }
  return response.json();
}

// Form API
export interface FormField {
  variableName: string;
  label: string;
  description?: string;
  inputType: 'text' | 'password' | 'number';
  defaultValue: string;
  required: boolean;
  locations: Array<'url' | 'header' | 'body'>;
}

export interface FormSchema {
  fields: FormField[];
}

export async function getFormSchema(
  actionId: string,
  workspaceId?: string,
  environmentId?: string | null | undefined
): Promise<FormSchema> {
  const params = new URLSearchParams();
  if (workspaceId) {
    params.append('workspaceId', workspaceId);
  }
  if (environmentId !== undefined && environmentId !== null) {
    params.append('environmentId', environmentId);
  }
  const queryString = params.toString();
  const url = `${API_BASE_URL}/forms/${actionId}${queryString ? `?${queryString}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch form schema');
  }
  return response.json();
}

// Execution API
export interface ExecutionResult {
  resolvedRequest: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string | null;
  };
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  success: boolean;
  error: string | null;
  executionDuration: number;
  runId?: string;
}

// Runs (execution history) API
export interface Run {
  id: string;
  timestamp: string;
  actionId: string;
  actionName: string;
  collectionId: string;
  environmentId: string;
  environmentName: string;
  workspaceId: string;
  resolvedRequest: string; // JSON string
  responseStatus: number;
  responseHeaders: string; // JSON string
  responseBody: string;
  responseBodyTruncated: number;
  success: number;
  error: string | null;
  executionDuration: number;
}

export interface ListRunsParams {
  workspaceId: string;
  page?: number;
  limit?: number;
  sort?: 'timestamp' | 'actionName' | 'success' | 'executionDuration';
  order?: 'asc' | 'desc';
  actionId?: string;
  environmentId?: string;
  success?: boolean;
}

export async function listRuns(params: ListRunsParams): Promise<{ runs: Run[]; total: number; page: number; limit: number }> {
  const sp = new URLSearchParams();
  sp.set('workspaceId', params.workspaceId);
  if (params.page != null) sp.set('page', String(params.page));
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.sort) sp.set('sort', params.sort);
  if (params.order) sp.set('order', params.order);
  if (params.actionId) sp.set('actionId', params.actionId);
  if (params.environmentId) sp.set('environmentId', params.environmentId);
  if (params.success !== undefined) sp.set('success', String(params.success));
  const response = await fetch(`${API_BASE_URL}/runs?${sp}`);
  if (!response.ok) throw new Error('Failed to fetch runs');
  return response.json();
}

export async function getRun(runId: string): Promise<Run> {
  const response = await fetch(`${API_BASE_URL}/runs/${runId}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error('Run not found');
    throw new Error('Failed to fetch run');
  }
  return response.json();
}

export interface ResolvedPreview {
  method: string;
  url: string;
  headersCount: number;
  headers: Record<string, string>;
  bodyPreview: string | null;
}

export async function getResolvedPreview(
  actionId: string,
  workspaceId: string,
  environmentId: string | null,
  formValues: Record<string, string>
): Promise<ResolvedPreview> {
  const response = await fetch(`${API_BASE_URL}/execute/${actionId}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceId,
      environmentId,
      formValues,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to preview' }));
    throw new Error(errorData.error || 'Failed to preview request');
  }
  return response.json();
}

export async function executeAction(
  actionId: string,
  workspaceId: string,
  environmentId: string | null,
  formValues: Record<string, string>
): Promise<ExecutionResult> {
  const response = await fetch(`${API_BASE_URL}/execute/${actionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceId,
      environmentId,
      formValues,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to execute action' }));
    throw new Error(errorData.error || 'Failed to execute action');
  }

  return response.json();
}
