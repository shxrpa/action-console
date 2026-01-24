import db from './database';

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

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_collections_workspace ON collections(workspaceId);
    CREATE INDEX IF NOT EXISTS idx_folders_collection ON folders(collectionId);
    CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parentId);
    CREATE INDEX IF NOT EXISTS idx_requests_collection ON requests(collectionId);
    CREATE INDEX IF NOT EXISTS idx_requests_folder ON requests(folderId);
  `);

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
  } catch (error) {
    console.error('Error adding analysis columns:', error);
    // Continue anyway - columns might already exist
  }

  console.log('Database migrations completed');
}
