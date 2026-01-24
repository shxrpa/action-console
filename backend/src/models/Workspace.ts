import db from '../db/database';
import type { Workspace, CreateWorkspaceRequest, UpdateWorkspaceRequest } from '../types';

export class WorkspaceModel {
  static create(data: CreateWorkspaceRequest): Workspace {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO workspaces (id, name, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?)`
    ).run(id, data.name, now, now);

    return this.findById(id)!;
  }

  static findAll(): Workspace[] {
    const rows = db.prepare('SELECT * FROM workspaces ORDER BY createdAt DESC').all() as Workspace[];
    return rows;
  }

  static findById(id: string): Workspace | null {
    const row = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(id) as Workspace | undefined;
    return row || null;
  }

  static update(id: string, data: UpdateWorkspaceRequest): Workspace | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updatedAt = new Date().toISOString();
    const name = data.name ?? existing.name;

    db.prepare('UPDATE workspaces SET name = ?, updatedAt = ? WHERE id = ?').run(name, updatedAt, id);

    return this.findById(id)!;
  }

  static delete(id: string): boolean {
    const result = db.prepare('DELETE FROM workspaces WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
