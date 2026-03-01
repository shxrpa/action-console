import db from '../db/database';
import type { Run } from '../types';

const MAX_RESPONSE_BODY_BYTES = 1024 * 1024; // 1MB

export interface CreateRunInput {
  actionId: string;
  actionName: string;
  collectionId: string;
  environmentId: string;
  environmentName: string;
  workspaceId: string;
  resolvedRequest: { method: string; url: string; headers: Record<string, string>; body: string | null };
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  success: boolean;
  error: string | null;
  executionDuration: number;
}

export interface ListRunsOptions {
  workspaceId: string;
  page?: number;
  limit?: number;
  sort?: 'timestamp' | 'actionName' | 'success' | 'executionDuration';
  order?: 'asc' | 'desc';
  actionId?: string;
  environmentId?: string;
  success?: boolean; // filter by outcome; undefined = all
}

export class RunModel {
  static create(input: CreateRunInput): Run {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    let responseBody = input.responseBody;
    let responseBodyTruncated = 0;
    const bodyBytes = Buffer.byteLength(responseBody, 'utf8');
    if (bodyBytes > MAX_RESPONSE_BODY_BYTES) {
      responseBody = responseBody.slice(0, MAX_RESPONSE_BODY_BYTES);
      responseBodyTruncated = 1;
    }

    db.prepare(
      `INSERT INTO runs (
        id, timestamp, actionId, actionName, collectionId, environmentId, environmentName, workspaceId,
        resolvedRequest, responseStatus, responseHeaders, responseBody, responseBodyTruncated,
        success, error, executionDuration
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      timestamp,
      input.actionId,
      input.actionName,
      input.collectionId,
      input.environmentId,
      input.environmentName,
      input.workspaceId,
      JSON.stringify(input.resolvedRequest),
      input.responseStatus,
      JSON.stringify(input.responseHeaders),
      responseBody,
      responseBodyTruncated,
      input.success ? 1 : 0,
      input.error,
      input.executionDuration
    );

    return this.findById(id)!;
  }

  static findById(id: string): Run | null {
    const row = db.prepare('SELECT * FROM runs WHERE id = ?').get(id) as Run | undefined;
    return row || null;
  }

  static findPage(options: ListRunsOptions): { runs: Run[]; total: number } {
    const {
      workspaceId,
      page = 1,
      limit = 50,
      sort = 'timestamp',
      order = 'desc',
      actionId,
      environmentId,
      success,
    } = options;

    const allowedSort: Record<string, string> = {
      timestamp: 'timestamp',
      actionName: 'actionName',
      success: 'success',
      executionDuration: 'executionDuration',
    };
    const sortCol = allowedSort[sort] || 'timestamp';
    const orderDir = order === 'asc' ? 'ASC' : 'DESC';

    const conditions: string[] = ['workspaceId = ?'];
    const params: unknown[] = [workspaceId];

    if (actionId) {
      conditions.push('actionId = ?');
      params.push(actionId);
    }
    if (environmentId) {
      conditions.push('environmentId = ?');
      params.push(environmentId);
    }
    if (success !== undefined) {
      conditions.push('success = ?');
      params.push(success ? 1 : 0);
    }

    const where = conditions.join(' AND ');
    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM runs WHERE ${where}`)
      .get(...params) as { total: number };
    const total = countRow.total;

    const offset = (page - 1) * limit;
    const rows = db
      .prepare(
        `SELECT * FROM runs WHERE ${where} ORDER BY ${sortCol} ${orderDir} LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as Run[];

    return { runs: rows, total };
  }
}

export { MAX_RESPONSE_BODY_BYTES };
