# Action Console Data Models

This document describes the main entities stored by the backend (SQLite) and used by the API.

---

## Workspace

Top-level container. All collections, environments, variables, and runs are scoped to a workspace.

| Field     | Type   | Description |
|----------|--------|-------------|
| id       | string | UUID. |
| name     | string | Display name. |
| createdAt| string | ISO 8601. |
| updatedAt| string | ISO 8601. |

---

## Collection

Imported Postman collection. Belongs to one workspace.

| Field        | Type   | Description |
|-------------|--------|-------------|
| id          | string | UUID. |
| name        | string | From Postman `info.name`. |
| description | string \| null | From Postman `info.description`. |
| schemaVersion | string | Postman schema (e.g. v2.1). |
| workspaceId | string | FK to Workspace. |
| importedAt  | string | ISO 8601. |

**Related:** Folders and Requests (stored separately; linked by `collectionId`).

---

## Folder

Postman folder (group of requests or nested folders). Used to organize the action catalog.

| Field        | Type   | Description |
|-------------|--------|-------------|
| id          | string | UUID. |
| name        | string | Folder name. |
| parentId    | string \| null | Parent folder ID, or null for root. |
| collectionId| string | FK to Collection. |
| order       | number | Display order. |

---

## Request (Action)

A single HTTP request from a Postman collection. Exposed in the UI as an "action."

| Field        | Type   | Description |
|-------------|--------|-------------|
| id          | string | UUID. |
| name        | string | Request name. |
| method      | string | HTTP method. |
| url         | string | Raw URL (may contain `{{variable}}`). |
| headers     | string | JSON string of `{ key, value }[]`. |
| body        | string \| null | Request body. |
| folderId    | string \| null | FK to Folder. |
| collectionId| string | FK to Collection. |
| rawJson     | string | Full Postman request JSON. |
| variables   | string \| null | JSON of VariableRef[] (extracted from URL/headers/body). |
| risk        | string | `Safe` \| `Write` \| `Dangerous`. |
| hasScripts   | boolean | Whether pre-request/test scripts exist. |
| warnings    | string \| null | JSON of string[]. |
| query_params| string \| null | JSON of QueryParamDef[] for form labels. |

---

## Environment

Named environment within a workspace (e.g. Sandbox, Production). Variables can be workspace-scoped or environment-scoped.

| Field        | Type   | Description |
|-------------|--------|-------------|
| id          | string | UUID. |
| name        | string | Display name. |
| workspaceId | string | FK to Workspace. |
| createdAt   | string | ISO 8601. |
| updatedAt   | string | ISO 8601. |

---

## Variable

Key-value used for substitution in requests (Variable Wallet). Can be workspace or environment scope. Secret values are encrypted at rest.

| Field        | Type   | Description |
|-------------|--------|-------------|
| id          | string | UUID. |
| name        | string | Variable name (e.g. `api_key`). |
| value       | string | Stored value (plain or encrypted if isSecret). |
| isSecret    | boolean | If true, value is encrypted; API may mask in responses. |
| scope       | string | `workspace` \| `environment`. |
| environmentId | string \| null | Set when scope is `environment`. |
| workspaceId | string | FK to Workspace. |
| createdAt   | string | ISO 8601. |
| updatedAt   | string | ISO 8601. |

---

## Run

One execution of an action. Used for run history and audit. Resolved request is stored with secrets masked; response body may be truncated (e.g. 1MB max).

| Field               | Type   | Description |
|---------------------|--------|-------------|
| id                  | string | UUID. |
| timestamp           | string | ISO 8601. |
| actionId            | string | FK to Request. |
| actionName          | string | Denormalized. |
| collectionId        | string | Denormalized. |
| environmentId       | string | Environment used (or sentinel if none). |
| environmentName     | string | Denormalized. |
| workspaceId         | string | FK to Workspace. |
| resolvedRequest     | string | JSON: method, url, headers, body (secrets masked). |
| responseStatus      | number | HTTP status. |
| responseHeaders     | string | JSON object. |
| responseBody        | string | Response body (possibly truncated). |
| responseBodyTruncated | number | 0 or 1. |
| success             | number | 0 or 1. |
| error               | string \| null | Error message if failed. |
| executionDuration   | number | Milliseconds. |
