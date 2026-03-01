# Action Console

Turn Postman collections into safe, plain-English actions that non-developers can run.

## Project Structure

```
Action Console/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Node.js + Express + TypeScript
├── docs/              # Documentation
│   ├── API.md        # Backend API endpoints
│   ├── DATA_MODELS.md # Data models
│   ├── USER_GUIDE.md  # User guide
│   └── TROUBLESHOOTING.md
├── specs/             # Specifications
│   └── action-console/
│       ├── spec.md    # Requirements
│       ├── plan.md    # Technical approach
│       └── tasks.md   # Implementation tasks
└── ai/                # AI agent playbook
```

## Technology Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite (MVP)

## Getting Started

### Prerequisites

- **Node.js 18+**
- **npm** or yarn

### Setup

1. **Clone the repo** (if applicable) and open the project directory.

2. **Install dependencies** for both frontend and backend:
   ```bash
   cd frontend && npm install && cd ..
   cd backend && npm install && cd ..
   ```

3. **Start the backend** (API server):
   ```bash
   cd backend
   npm run dev
   ```
   Backend runs at **http://localhost:3001** by default. Set `PORT` in a `.env` file to change it.

4. **Start the frontend** (in a separate terminal):
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs at **http://localhost:5173** by default. Set `VITE_API_URL` (e.g. `http://localhost:3001/api`) if your API is on a different host.

5. **Open the app** in a browser at the frontend URL (e.g. http://localhost:5173). The UI will call the backend API for workspaces, collections, and execution.

### Optional environment variables

| Location   | Variable       | Description |
|-----------|----------------|-------------|
| Backend   | `PORT`         | API server port (default: 3001). |
| Backend   | `ENCRYPTION_KEY` | Key for encrypting secret variables (default: random at startup). Set in production for stable secrets. |
| Frontend  | `VITE_API_URL` | Full base URL for the API (e.g. `http://localhost:3001/api`). Defaults to `http://localhost:3001/api` when unset. |

## Demo workflow

1. **Start backend and frontend** (see Development above). Open the app (e.g. http://localhost:5173).
2. **Create or select a workspace** in the header.
3. **Import a Postman collection**: Home → choose a workspace → upload a Postman Collection v2.x JSON file (Export from Postman: Collection → Export → Collection v2.1).
4. **Open Collections** → select the imported collection → **View actions** to open the Action Catalog.
5. **Configure variables**: use **Variable Wallet** or the in-form defaults. For auth, add variables (e.g. API key) in the correct scope (workspace or environment).
6. **Run an action**: open an action from the catalog → fill any required variables → **Run Action**. View response and optionally **Save as variable**.
7. **Run History**: use **Run History** in the sidebar to list and inspect past runs.

## Known limitations (MVP)

- **Postman scripts** (pre-request, tests) are not executed; requests may behave differently from Postman.
- **GraphQL** and other non-REST patterns are not specially supported.
- **Response body storage** is truncated at 1MB per run for very large responses.
- **Collection format**: only Postman Collection v2.x JSON is supported; other export formats are not.
- **Large collections** (100+ requests): catalog and run history use virtualization; import may take a few seconds.
- **Unicode**: Collection names, request names, and variable names support UTF-8. Ensure your JSON file is saved as UTF-8.

## Troubleshooting

See **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** for detailed fixes. Quick tips:

- **Invalid JSON on import**: Validate at [jsonlint.com](https://jsonlint.com); ensure Postman Collection v2.x format.
- **Missing required variables**: Add variables in Variable Wallet (correct scope) or fill the action form.
- **Empty collection**: Add requests in Postman and re-export the collection.

## Documentation

- **[docs/API.md](docs/API.md)** – Backend API endpoints
- **[docs/DATA_MODELS.md](docs/DATA_MODELS.md)** – Data models (Workspace, Collection, Request, Variable, Environment, Run)
- **[docs/USER_GUIDE.md](docs/USER_GUIDE.md)** – User guide for import, variables, running actions, run history
- **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** – Common issues and fixes

## Project Status

See `specs/action-console/tasks.md` for story and task status.


TEST
