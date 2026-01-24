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

## Project Status

Currently implementing Story 1: Project Foundation & App Shell (SHX-207)

See `/specs/action-console/` for full specifications.
