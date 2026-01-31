// Workspace types
export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
}

// Collection types
export interface Collection {
  id: string;
  name: string;
  description: string | null;
  schemaVersion: string;
  workspaceId: string;
  importedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  collectionId: string;
  order: number;
}

export interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: string; // JSON string
  body: string | null;
  folderId: string | null;
  collectionId: string;
  rawJson: string; // Full request JSON for reference
  // Analysis metadata
  variables?: string; // JSON string of VariableRef[]
  risk: 'Safe' | 'Write' | 'Dangerous'; // Always required
  hasScripts?: boolean;
  warnings?: string; // JSON string of string[]
}

export interface VariableRef {
  name: string;
  required: boolean;
  locations: Array<'url' | 'header' | 'body'>;
  description?: string; // Description from Postman collection
}

// Postman Collection types
export interface PostmanCollection {
  info: {
    name: string;
    description?: string;
    schema: string;
    _postman_id?: string;
  };
  item: PostmanItem[];
  variable?: PostmanVariable[];
}

export interface PostmanItem {
  name: string;
  item?: PostmanItem[]; // For folders
  request?: PostmanRequest; // For requests
  description?: string;
}

export interface PostmanRequest {
  method: string;
  header?: Array<{ key: string; value: string }>;
  body?: {
    mode?: string;
    raw?: string;
    formdata?: Array<{ key: string; value: string }>;
    urlencoded?: Array<{ key: string; value: string }>;
  };
  url: {
    raw?: string;
    host?: string[];
    path?: string[];
    query?: Array<{ key: string; value: string; description?: string }>;
    variable?: Array<{ key: string; value: string; description?: string }>;
  };
}

export interface PostmanVariable {
  key: string;
  value: string;
  type?: string;
}

// Variable Wallet types
export interface Variable {
  id: string;
  name: string;
  value: string; // Encrypted if isSecret
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
