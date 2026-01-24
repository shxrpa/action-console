import db from '../db/database';
import type { Variable, CreateVariableRequest, UpdateVariableRequest } from '../types';
import { encryptSecret, decryptSecret } from '../services/encryption';

export class VariableModel {
  static create(data: CreateVariableRequest, workspaceId: string): Variable {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Encrypt value if it's a secret
    const value = data.isSecret ? encryptSecret(data.value) : data.value;
    const environmentId = data.scope === 'environment' ? data.environmentId : null;

    db.prepare(
      `INSERT INTO variables (id, name, value, isSecret, scope, environmentId, workspaceId, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.name,
      value,
      data.isSecret ? 1 : 0,
      data.scope,
      environmentId,
      workspaceId,
      now,
      now
    );

    return this.findById(id)!;
  }

  static findById(id: string, decrypt: boolean = false): Variable | null {
    const row = db.prepare('SELECT * FROM variables WHERE id = ?').get(id) as Variable | undefined;
    if (!row) return null;

    // Decrypt if requested and is secret
    if (decrypt && row.isSecret) {
      try {
        row.value = decryptSecret(row.value);
      } catch (error) {
        console.error('Error decrypting variable:', error);
      }
    }

    return row;
  }

  static findByWorkspace(workspaceId: string, environmentId?: string | null): Variable[] {
    let query = 'SELECT * FROM variables WHERE workspaceId = ?';
    const params: unknown[] = [workspaceId];

    if (environmentId !== undefined) {
      // Get workspace-level + environment-specific variables
      query += ' AND (scope = ? OR (scope = ? AND environmentId = ?))';
      params.push('workspace', 'environment', environmentId);
    }

    query += ' ORDER BY name ASC';

    const rows = db.prepare(query).all(...params) as Variable[];
    return rows;
  }

  static findByName(workspaceId: string, name: string, environmentId?: string | null): Variable | null {
    let query = 'SELECT * FROM variables WHERE workspaceId = ? AND name = ?';
    const params: unknown[] = [workspaceId, name];

    if (environmentId !== undefined) {
      query += ' AND (scope = ? OR (scope = ? AND environmentId = ?))';
      params.push('workspace', 'environment', environmentId);
    }

    query += ' LIMIT 1';

    const row = db.prepare(query).get(...params) as Variable | undefined;
    return row || null;
  }

  static update(id: string, data: UpdateVariableRequest): Variable | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updatedAt = new Date().toISOString();
    const name = data.name ?? existing.name;
    const scope = data.scope ?? existing.scope;
    const environmentId = scope === 'environment' ? (data.environmentId ?? existing.environmentId) : null;
    const isSecret = data.isSecret ?? existing.isSecret;

    let value = existing.value;
    if (data.value !== undefined) {
      // If changing secret status or value, re-encrypt if needed
      if (isSecret) {
        // Check if value is already encrypted (has ':')
        if (data.value.includes(':') && data.value.split(':').length === 2) {
          // Already encrypted, use as-is
          value = data.value;
        } else {
          // New value, encrypt it
          value = encryptSecret(data.value);
        }
      } else {
        value = data.value;
      }
    }

    db.prepare(
      `UPDATE variables 
       SET name = ?, value = ?, isSecret = ?, scope = ?, environmentId = ?, updatedAt = ? 
       WHERE id = ?`
    ).run(name, value, isSecret ? 1 : 0, scope, environmentId, updatedAt, id);

    return this.findById(id)!;
  }

  static delete(id: string): boolean {
    const result = db.prepare('DELETE FROM variables WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
