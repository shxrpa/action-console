import type { PostmanCollection, PostmanItem, PostmanRequest } from '../types';
import type { QueryParamDef } from '../types';

export type CollectionAuthHeaders = Array<{ key: string; value: string }>;

export interface BuildUrlResult {
  url: string;
  queryParams: QueryParamDef[];
}

/**
 * Resolves collection-level auth to a list of headers (with variable placeholders like {{postman-api-key}}).
 * These should be merged into each request so variable extraction and execution get the required auth vars.
 */
export function resolveCollectionAuth(collection: PostmanCollection): CollectionAuthHeaders {
  const auth = collection.auth;
  if (!auth || !auth.type || auth.type === 'noauth') return [];

  if (auth.type === 'apikey' && Array.isArray(auth.apikey)) {
    let headerName = 'Authorization';
    let headerValue = '';
    for (const entry of auth.apikey) {
      if (entry.key === 'key') headerName = entry.value;
      if (entry.key === 'value') headerValue = entry.value;
    }
    if (headerName && headerValue) return [{ key: headerName, value: headerValue }];
  }

  if (auth.type === 'bearer' && Array.isArray(auth.bearer)) {
    let token = '';
    for (const entry of auth.bearer) {
      if (entry.key === 'token') token = entry.value;
    }
    if (token) return [{ key: 'Authorization', value: `Bearer ${token}` }];
  }

  if (auth.type === 'basic' && Array.isArray(auth.basic)) {
    let username = '';
    let password = '';
    for (const entry of auth.basic) {
      if (entry.key === 'username') username = entry.value;
      if (entry.key === 'password') password = entry.value;
    }
    if (username || password) return [{ key: 'Authorization', value: `Basic {{base64(${username}:${password})}}` }];
  }

  return [];
}

export class PostmanParser {
  /**
   * Validates that the JSON is a valid Postman Collection v2.1
   */
  static validateCollection(data: unknown): data is PostmanCollection {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const obj = data as Record<string, unknown>;

    // Check for required 'info' object
    if (!obj.info || typeof obj.info !== 'object') {
      return false;
    }

    const info = obj.info as Record<string, unknown>;
    if (typeof info.name !== 'string') {
      return false;
    }

    // Check schema version (be lenient - accept v2.1 or v2.0, or missing schema)
    if (typeof info.schema === 'string') {
      // Accept v2.0, v2.1, or any v2.x schema
      if (!info.schema.includes('v2')) {
        console.warn(`Unsupported schema version: ${info.schema}. Expected v2.0 or v2.1`);
        // Still allow it - we'll try to parse anyway
      }
    }

    // Check for required 'item' array
    if (!Array.isArray(obj.item)) {
      return false;
    }

    return true;
  }

  /**
   * Extracts collection metadata
   */
  static extractMetadata(collection: PostmanCollection) {
    return {
      name: collection.info.name,
      description: collection.info.description || null,
      schemaVersion: collection.info.schema || 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    };
  }

  /**
   * Recursively parses items to extract folders and requests.
   * Collection auth headers are merged into each request so variables like {{postman-api-key}} are extracted and required.
   * Returns folders with temporary IDs that need to be replaced with actual DB IDs.
   */
  static parseItems(
    items: PostmanItem[],
    collectionId: string,
    parentFolderId: string | null = null,
    order: number = 0,
    collectionAuthHeaders: CollectionAuthHeaders = []
  ): {
    folders: Array<{ tempId: string; name: string; parentTempId: string | null; collectionId: string; order: number }>;
    requests: Array<{ name: string; method: string; url: string; headers: string; body: string | null; parentFolderTempId: string | null; collectionId: string; rawJson: string; queryParams: string }>;
  } {
    const folders: Array<{ tempId: string; name: string; parentTempId: string | null; collectionId: string; order: number }> = [];
    const requests: Array<{ name: string; method: string; url: string; headers: string; body: string | null; parentFolderTempId: string | null; collectionId: string; rawJson: string; queryParams: string }> = [];

    items.forEach((item, index) => {
      const currentOrder = order + index;

      if (item.item && Array.isArray(item.item)) {
        // This is a folder
        const folderTempId = crypto.randomUUID();
        folders.push({
          tempId: folderTempId,
          name: item.name,
          parentTempId: parentFolderId,
          collectionId,
          order: currentOrder,
        });

        // Recursively parse folder contents (inherit collection auth)
        const nested = this.parseItems(item.item, collectionId, folderTempId, currentOrder * 1000, collectionAuthHeaders);
        folders.push(...nested.folders);
        requests.push(...nested.requests);
      } else if (item.request) {
        // This is a request: merge collection-level auth into headers so API key etc. are extracted
        const request = item.request;
        const { url, queryParams } = this.buildUrl(request.url);
        const requestHeaders = request.header || [];
        const mergedHeaders = this.mergeAuthHeaders(requestHeaders, collectionAuthHeaders);
        const headers = JSON.stringify(mergedHeaders);
        const body = this.extractBody(request.body);

        requests.push({
          name: item.name,
          method: request.method || 'GET',
          url,
          headers,
          body,
          parentFolderTempId: parentFolderId,
          collectionId,
          rawJson: JSON.stringify(item),
          queryParams: JSON.stringify(queryParams),
        });
      }
    });

    return { folders, requests };
  }

  /** Collection auth headers first; request headers override by key and add extra. */
  private static mergeAuthHeaders(
    requestHeaders: Array<{ key: string; value: string }>,
    collectionAuthHeaders: CollectionAuthHeaders
  ): Array<{ key: string; value: string }> {
    const byKey = new Map<string, { key: string; value: string }>();
    for (const h of collectionAuthHeaders) {
      if (h.key) byKey.set(h.key.toLowerCase(), { key: h.key, value: h.value });
    }
    for (const h of requestHeaders) {
      if (h.key) byKey.set(h.key.toLowerCase(), { key: h.key, value: h.value });
    }
    return Array.from(byKey.values());
  }

  /**
   * Converts Postman path params (:paramName) to {{paramName}} so they are extracted as variables and substituted.
   * Only replaces :word when it appears as a path segment (after /) to avoid touching : in protocol.
   */
  private static convertPathParamsToVariables(url: string): string {
    return url.replace(/\/(:[a-zA-Z0-9_]+)(?=\/|$|\?)/g, (_, param) => `/{{${param.slice(1)}}}`);
  }

  /**
   * Builds URL string from Postman URL object. Empty query param values become {{key}} so they show as form variables.
   * Path params like :apiId are converted to {{apiId}}. Returns query param definitions for form labels/descriptions.
   */
  private static buildUrl(urlObj: PostmanRequest['url']): BuildUrlResult {
    const emptyQueryParams: QueryParamDef[] = [];

    if (typeof urlObj === 'string') {
      return { url: this.convertPathParamsToVariables(urlObj), queryParams: [] };
    }

    // Postman: query params with disabled: true are not sent; only include enabled params
    const enabledQuery = Array.isArray(urlObj.query)
      ? urlObj.query.filter((q) => !q.disabled)
      : [];
    const hasQueryWithDescriptions = enabledQuery.length > 0;
    if (hasQueryWithDescriptions) {
      // Build from components so we can use {{key}} for empty params and collect descriptions
      const host = urlObj.host?.join('.') || '';
      const path = urlObj.path?.join('/') || '';
      const queryParts = enabledQuery.map((q: { key: string; value?: string; description?: string }) => {
        const value = q.value?.trim() ?? '';
        const useVariable = !value || value.startsWith('{{');
        const paramValue = useVariable ? `{{${q.key}}}` : value;
        const desc = typeof q.description === 'string' ? q.description : (q.description && typeof q.description === 'object' && 'content' in q.description) ? (q.description as { content?: string }).content : undefined;
        if (useVariable) {
          emptyQueryParams.push({ key: q.key, value: paramValue, description: desc });
        }
        // Keep {{variable}} unencoded so substitution can find and replace them; only encode literal values
        const encodedValue = useVariable ? paramValue : encodeURIComponent(value);
        return `${encodeURIComponent(q.key)}=${encodedValue}`;
      });
      const query = queryParts.join('&');
      let url = host;
      if (path) url += '/' + path;
      if (query) url += '?' + query;
      return { url: this.convertPathParamsToVariables(url || ''), queryParams: emptyQueryParams };
    }

    if (urlObj.raw) {
      return { url: this.convertPathParamsToVariables(urlObj.raw), queryParams: [] };
    }

    // Build from components (no query or no descriptions)
    const host = urlObj.host?.join('.') || '';
    const path = urlObj.path?.join('/') || '';
    const query = urlObj.query
      ?.map((q: { key: string; value?: string }) => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value ?? '')}`)
      .join('&');
    let url = host;
    if (path) url += '/' + path;
    if (query) url += '?' + query;
    return { url: this.convertPathParamsToVariables(url || ''), queryParams: [] };
  }

  /**
   * Extracts body content from Postman request body
   */
  private static extractBody(body: PostmanRequest['body'] | undefined): string | null {
    if (!body) {
      return null;
    }

    if (body.raw) {
      return body.raw;
    }

    if (body.formdata && Array.isArray(body.formdata)) {
      const formData = body.formdata.map((f: { key: string; value?: string }) => `${f.key}=${f.value || ''}`).join('&');
      return formData;
    }

    if (body.urlencoded && Array.isArray(body.urlencoded)) {
      const urlEncoded = body.urlencoded.map((f: { key: string; value?: string }) => `${f.key}=${f.value || ''}`).join('&');
      return urlEncoded;
    }

    return null;
  }
}
