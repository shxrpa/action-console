// Frontend types

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Variable {
  id: string;
  name: string;
  value: string; // Masked if isSecret
  isSecret: boolean;
  scope: 'workspace' | 'environment';
  environmentId: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVariableRequest {
  name: string;
  value: string;
  isSecret: boolean;
  scope: 'workspace' | 'environment';
  environmentId?: string | null;
}

export interface UpdateVariableRequest {
  name?: string;
  value?: string;
  isSecret?: boolean;
  scope?: 'workspace' | 'environment';
  environmentId?: string | null;
}

export interface CreateEnvironmentRequest {
  name: string;
}
