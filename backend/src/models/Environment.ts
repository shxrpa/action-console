import db from '../db/database';
import type { Environment, CreateEnvironmentRequest } from '../types';

export class EnvironmentModel {
  static create(data: CreateEnvironmentRequest, workspaceId: string): Environment {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO environments (id, name, workspaceId, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, data.name, workspaceId, now, now);

    return this.findById(id)!;
  }

  static findById(id: string): Environment | null {
    const row = db.prepare('SELECT * FROM environments WHERE id = ?').get(id) as Environment | undefined;
    return row || null;
  }

  static findByWorkspace(workspaceId: string): Environment[] {
    const rows = db
      .prepare('SELECT * FROM environments WHERE workspaceId = ? ORDER BY name ASC')
      .all(workspaceId) as Environment[];
    return rows;
  }

  static update(id: string, name: string): Environment | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updatedAt = new Date().toISOString();
    db.prepare('UPDATE environments SET name = ?, updatedAt = ? WHERE id = ?').run(name, updatedAt, id);

    return this.findById(id)!;
  }

  static delete(id: string): boolean {
    const result = db.prepare('DELETE FROM environments WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
