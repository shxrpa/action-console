import db from '../db/database';
import type { Collection, Folder, Request, VariableRef } from '../types';

export class CollectionModel {
  static create(data: {
    name: string;
    description: string | null;
    schemaVersion: string;
    workspaceId: string;
  }): Collection {
    const id = crypto.randomUUID();
    const importedAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO collections (id, name, description, schemaVersion, workspaceId, importedAt) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, data.name, data.description, data.schemaVersion, data.workspaceId, importedAt);

    return this.findById(id)!;
  }

  static findById(id: string): Collection | null {
    const row = db.prepare('SELECT * FROM collections WHERE id = ?').get(id) as Collection | undefined;
    return row || null;
  }

  static findByWorkspace(workspaceId: string): Collection[] {
    const rows = db
      .prepare('SELECT * FROM collections WHERE workspaceId = ? ORDER BY importedAt DESC')
      .all(workspaceId) as Collection[];
    return rows;
  }

  static delete(id: string): boolean {
    const result = db.prepare('DELETE FROM collections WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

export class FolderModel {
  static create(folder: { name: string; parentId: string | null; collectionId: string; order: number }): Folder {
    const id = crypto.randomUUID();
    db.prepare(`INSERT INTO folders (id, name, parentId, collectionId, "order") VALUES (?, ?, ?, ?, ?)`).run(
      id,
      folder.name,
      folder.parentId,
      folder.collectionId,
      folder.order
    );
    return {
      id,
      name: folder.name,
      parentId: folder.parentId,
      collectionId: folder.collectionId,
      order: folder.order,
    };
  }

  static createMany(folders: Array<{ name: string; parentId: string | null; collectionId: string; order: number }>): Folder[] {
    const insert = db.prepare(
      `INSERT INTO folders (id, name, parentId, collectionId, "order") 
       VALUES (?, ?, ?, ?, ?)`
    );

    const created: Folder[] = [];
    const transaction = db.transaction(() => {
      for (const folder of folders) {
        const id = crypto.randomUUID();
        insert.run(id, folder.name, folder.parentId, folder.collectionId, folder.order);
        created.push({
          id,
          name: folder.name,
          parentId: folder.parentId,
          collectionId: folder.collectionId,
          order: folder.order,
        });
      }
    });

    transaction();
    return created;
  }

  static findByCollection(collectionId: string): Folder[] {
    const rows = db
      .prepare('SELECT * FROM folders WHERE collectionId = ? ORDER BY "order" ASC')
      .all(collectionId) as Folder[];
    return rows;
  }
}

export class RequestModel {
  static createMany(
    requests: Array<{
      name: string;
      method: string;
      url: string;
      headers: string;
      body: string | null;
      folderId: string | null;
      collectionId: string;
      rawJson: string;
    }>
  ): Request[] {
    const insert = db.prepare(
      `INSERT INTO requests (id, name, method, url, headers, body, folderId, collectionId, rawJson) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const created: Request[] = [];
    const transaction = db.transaction(() => {
      for (const request of requests) {
        const id = crypto.randomUUID();
        insert.run(
          id,
          request.name,
          request.method,
          request.url,
          request.headers,
          request.body,
          request.folderId,
          request.collectionId,
          request.rawJson
        );
        created.push({
          id,
          name: request.name,
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body,
          folderId: request.folderId,
          collectionId: request.collectionId,
          rawJson: request.rawJson,
          risk: request.risk || 'Write', // Ensure risk is always set
        });
      }
    });

    transaction();
    return created;
  }

  static updateAnalysis(requestId: string, analysis: {
    variables: VariableRef[];
    risk: 'Safe' | 'Write' | 'Dangerous';
    hasScripts: boolean;
    warnings: string[];
  }): boolean {
    const result = db
      .prepare(
        `UPDATE requests 
         SET variables = ?, risk = ?, hasScripts = ?, warnings = ? 
         WHERE id = ?`
      )
      .run(
        JSON.stringify(analysis.variables),
        analysis.risk,
        analysis.hasScripts ? 1 : 0,
        JSON.stringify(analysis.warnings),
        requestId
      );
    return result.changes > 0;
  }

  static findByCollection(collectionId: string): Request[] {
    const rows = db.prepare('SELECT * FROM requests WHERE collectionId = ?').all(collectionId) as Request[];
    return rows;
  }

  static countByCollection(collectionId: string): number {
    const result = db.prepare('SELECT COUNT(*) as count FROM requests WHERE collectionId = ?').get(collectionId) as {
      count: number;
    };
    return result.count;
  }
}
