import type { PostmanCollection, PostmanItem, PostmanRequest } from '../types';

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

    // Check schema version
    if (typeof info.schema === 'string') {
      if (!info.schema.includes('v2.1')) {
        return false;
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
   * Recursively parses items to extract folders and requests
   * Returns folders with temporary IDs that need to be replaced with actual DB IDs
   */
  static parseItems(
    items: PostmanItem[],
    collectionId: string,
    parentFolderId: string | null = null,
    order: number = 0
  ): {
    folders: Array<{ tempId: string; name: string; parentTempId: string | null; collectionId: string; order: number }>;
    requests: Array<{ name: string; method: string; url: string; headers: string; body: string | null; parentFolderTempId: string | null; collectionId: string; rawJson: string }>;
  } {
    const folders: Array<{ tempId: string; name: string; parentTempId: string | null; collectionId: string; order: number }> = [];
    const requests: Array<{ name: string; method: string; url: string; headers: string; body: string | null; parentFolderTempId: string | null; collectionId: string; rawJson: string }> = [];

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

        // Recursively parse folder contents
        const nested = this.parseItems(item.item, collectionId, folderTempId, currentOrder * 1000);
        folders.push(...nested.folders);
        requests.push(...nested.requests);
      } else if (item.request) {
        // This is a request
        const request = item.request;
        const url = this.buildUrl(request.url);
        const headers = JSON.stringify(request.header || []);
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
        });
      }
    });

    return { folders, requests };
  }

  /**
   * Builds URL string from Postman URL object
   */
  private static buildUrl(urlObj: PostmanRequest['url']): string {
    if (typeof urlObj === 'string') {
      return urlObj;
    }

    if (urlObj.raw) {
      return urlObj.raw;
    }

    // Build from components
    const host = urlObj.host?.join('.') || '';
    const path = urlObj.path?.join('/') || '';
    const query = urlObj.query
      ?.map((q: { key: string; value?: string }) => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value || '')}`)
      .join('&');

    let url = host;
    if (path) {
      url += '/' + path;
    }
    if (query) {
      url += '?' + query;
    }

    return url || '';
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
