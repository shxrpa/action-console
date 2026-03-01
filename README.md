# Action Console

Turn Postman collections into safe, plain-English actions that non-developers can run.

## Project Structure

```
Action Console/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Node.js + Express + TypeScript
├── shared/            # Shared types/utilities
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

- Node.js 18+ 
- npm or yarn

### Development

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Backend
```bash
cd backend
npm install
npm run dev
```

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

## Troubleshooting

- **Invalid JSON on import**: Ensure the file is valid JSON (no trailing commas, matched braces). Validate at [jsonlint.com](https://jsonlint.com) or in a code editor.
- **"Missing required variables"**: Add the listed variables in Variable Wallet (workspace or environment scope) or fill them in the action form.
- **Empty collection**: If the catalog shows "This collection has no requests", the exported collection has no requests; add requests in Postman and re-export.

## Project Status

See `specs/action-console/tasks.md` for story and task status.
