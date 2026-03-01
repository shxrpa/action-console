# Action Console API

Base URL (development): `http://localhost:3001/api`

All request/response bodies are JSON unless noted.

---

## Workspaces

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/workspaces | List all workspaces |
| GET | /api/workspaces/:id | Get workspace by ID |
| POST | /api/workspaces | Create. Body: { "name": "string" } |
| PUT | /api/workspaces/:id | Update. Body: { "name": "string" } |
| DELETE | /api/workspaces/:id | Delete (cascades) |

---

## Collections

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/collections | List. Query: workspaceId (required) |
| GET | /api/collections/:id | Get by ID (includes folders, requests) |
| POST | /api/collections/import | Import. Multipart: file (JSON), workspaceId. Max 10MB |
| DELETE | /api/collections/:id | Delete (cascades) |

---

## Actions

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/actions | List. Query: collectionId (required) |
| GET | /api/actions/:id | Get action details. Optional: workspaceId, environmentId |

---

## Forms

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/forms/:actionId | Form schema. Optional: workspaceId, environmentId |

---

## Variables

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/variables | List. Query: workspaceId; optional environmentId |
| GET | /api/variables/:id | Get. Query: decrypt=true for secret value |
| POST | /api/variables | Create. Body: name, value, isSecret, scope, environmentId?; workspaceId |
| PUT | /api/variables/:id | Update (partial body) |
| DELETE | /api/variables/:id | Delete |

---

## Environments

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/environments | List. Query: workspaceId |
| GET | /api/environments/:id | Get by ID |
| POST | /api/environments | Create. Body: name; workspaceId |
| PUT | /api/environments/:id | Update. Body: { "name": "string" } |
| DELETE | /api/environments/:id | Delete |

---

## Execute

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/execute/:actionId/preview | Resolve only. Body: workspaceId, environmentId?, formValues |
| POST | /api/execute/:actionId | Execute. Body: workspaceId, environmentId?, formValues. Returns result + runId |

---

## Runs

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/runs | List. Query: workspaceId; optional page, limit, sort, order, actionId, environmentId, success |
| GET | /api/runs/:runId | Get run by ID |

---

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check (not under /api) |
