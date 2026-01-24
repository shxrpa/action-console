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
