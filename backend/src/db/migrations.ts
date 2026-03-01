import db from './database';
import crypto from 'crypto';

export function runMigrations() {
  // Workspace table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Collection table
  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      schemaVersion TEXT NOT NULL,
      workspaceId TEXT NOT NULL,
      importedAt TEXT NOT NULL,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    )
  `);

  // Folder table
  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parentId TEXT,
      collectionId TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      FOREIGN KEY (collectionId) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY (parentId) REFERENCES folders(id) ON DELETE CASCADE
    )
  `);

  // Request table
  db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      headers TEXT NOT NULL,
      body TEXT,
      folderId TEXT,
      collectionId TEXT NOT NULL,
      rawJson TEXT NOT NULL,
      variables TEXT,
      risk TEXT NOT NULL CHECK(risk IN ('Safe', 'Write', 'Dangerous')) DEFAULT 'Write',
      hasScripts INTEGER DEFAULT 0,
      warnings TEXT,
      FOREIGN KEY (collectionId) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL
    )
  `);

  // Environment table
  db.exec(`
    CREATE TABLE IF NOT EXISTS environments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      workspaceId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    )
  `);

  // Variable table
  db.exec(`
    CREATE TABLE IF NOT EXISTS variables (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      isSecret INTEGER DEFAULT 0,
      scope TEXT NOT NULL CHECK(scope IN ('workspace', 'environment')),
      environmentId TEXT,
      workspaceId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (environmentId) REFERENCES environments(id) ON DELETE CASCADE,
      UNIQUE(workspaceId, environmentId, name)
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_collections_workspace ON collections(workspaceId);
    CREATE INDEX IF NOT EXISTS idx_folders_collection ON folders(collectionId);
    CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parentId);
    CREATE INDEX IF NOT EXISTS idx_requests_collection ON requests(collectionId);
    CREATE INDEX IF NOT EXISTS idx_requests_folder ON requests(folderId);
    CREATE INDEX IF NOT EXISTS idx_environments_workspace ON environments(workspaceId);
    CREATE INDEX IF NOT EXISTS idx_variables_workspace ON variables(workspaceId);
    CREATE INDEX IF NOT EXISTS idx_variables_environment ON variables(environmentId);
    CREATE INDEX IF NOT EXISTS idx_variables_name ON variables(name);
  `);

  // Runs table (execution history / audit log)
  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      actionId TEXT NOT NULL,
      actionName TEXT NOT NULL,
      collectionId TEXT NOT NULL,
      environmentId TEXT NOT NULL,
      environmentName TEXT NOT NULL,
      workspaceId TEXT NOT NULL,
      resolvedRequest TEXT NOT NULL,
      responseStatus INTEGER NOT NULL,
      responseHeaders TEXT NOT NULL,
      responseBody TEXT NOT NULL,
      responseBodyTruncated INTEGER NOT NULL DEFAULT 0,
      success INTEGER NOT NULL,
      error TEXT,
      executionDuration INTEGER NOT NULL,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    )
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_runs_timestamp ON runs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_runs_actionId ON runs(actionId);
    CREATE INDEX IF NOT EXISTS idx_runs_environmentId ON runs(environmentId);
    CREATE INDEX IF NOT EXISTS idx_runs_workspaceId ON runs(workspaceId);
  `);

  // Add collectionId to runs if table existed from before (migration)
  try {
    const runsInfo = db.prepare('PRAGMA table_info(runs)').all() as Array<{ name: string }>;
    const runsColumns = runsInfo.map((c) => c.name);
    if (!runsColumns.includes('collectionId')) {
      db.exec(`ALTER TABLE runs ADD COLUMN collectionId TEXT NOT NULL DEFAULT ''`);
    }
  } catch {
    // ignore
  }

  // Add analysis columns to existing requests table if they don't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(requests)").all() as Array<{ name: string }>;
    const columnNames = tableInfo.map((col) => col.name);

    if (!columnNames.includes('variables')) {
      db.exec(`ALTER TABLE requests ADD COLUMN variables TEXT`);
    }
    if (!columnNames.includes('risk')) {
      db.exec(`ALTER TABLE requests ADD COLUMN risk TEXT NOT NULL DEFAULT 'Write' CHECK(risk IN ('Safe', 'Write', 'Dangerous'))`);
    }
    if (!columnNames.includes('hasScripts')) {
      db.exec(`ALTER TABLE requests ADD COLUMN hasScripts INTEGER DEFAULT 0`);
    }
    if (!columnNames.includes('warnings')) {
      db.exec(`ALTER TABLE requests ADD COLUMN warnings TEXT`);
    }
    if (!columnNames.includes('query_params')) {
      db.exec(`ALTER TABLE requests ADD COLUMN query_params TEXT`);
    }
  } catch (error) {
    console.error('Error adding analysis columns:', error);
    // Continue anyway - columns might already exist
  }

  // Create default environments for existing workspaces
  try {
    const workspaces = db.prepare('SELECT id FROM workspaces').all() as Array<{ id: string }>;
    for (const workspace of workspaces) {
      const existingEnvs = db.prepare('SELECT COUNT(*) as count FROM environments WHERE workspaceId = ?').get(workspace.id) as { count: number };
      if (existingEnvs.count === 0) {
        const now = new Date().toISOString();
        db.prepare('INSERT INTO environments (id, name, workspaceId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)').run(
          crypto.randomUUID(),
          'Sandbox',
          workspace.id,
          now,
          now
        );
        db.prepare('INSERT INTO environments (id, name, workspaceId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)').run(
          crypto.randomUUID(),
          'Production',
          workspace.id,
          now,
          now
        );
      }
    }
  } catch (error) {
    console.error('Error creating default environments:', error);
  }

  console.log('Database migrations completed');
}
