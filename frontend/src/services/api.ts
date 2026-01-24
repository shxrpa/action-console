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
