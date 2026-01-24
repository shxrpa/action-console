import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runMigrations } from './db/migrations';
import workspacesRouter from './api/workspaces';
import collectionsRouter from './api/collections';
import actionsRouter from './api/actions';
import variablesRouter from './api/variables';
import environmentsRouter from './api/environments';
import formsRouter from './api/forms';
import executionRouter from './api/execution';

dotenv.config();

// Initialize database
runMigrations();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Action Console API is running' });
});

// API routes
app.use('/api/workspaces', workspacesRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/variables', variablesRouter);
app.use('/api/environments', environmentsRouter);
app.use('/api/forms', formsRouter);
app.use('/api/execution', executionRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
