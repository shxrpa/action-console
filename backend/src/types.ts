// Workspace types (copied from shared for now)

export interface Workspace {
  id: string;
  name: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

export interface CreateWorkspaceRequest {
  name: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
}
