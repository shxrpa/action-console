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
