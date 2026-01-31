import { RequestResolver, type ResolvedRequest } from './requestResolver';
import type { Request as DBRequest } from '../types';

export interface ExecutionResult {
  success: boolean;
  resolvedRequest: ResolvedRequest;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  executionDuration: number;
  error: string | null;
}

/**
 * Executes HTTP requests
 */
export class ActionExecutor {
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds

  /**
   * Executes an action request
   */
  static async execute(
    request: DBRequest,
    formVariables: Record<string, string>,
    workspaceId: string,
    environmentId: string | null
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Resolve the request (substitute variables, inject auth)
      const resolvedRequest = await RequestResolver.resolve(
        request,
        formVariables,
        workspaceId,
        environmentId
      );

      // Execute the HTTP request
      const response = await this.executeHttpRequest(resolvedRequest);

      const executionDuration = Date.now() - startTime;

      return {
        success: response.status >= 200 && response.status < 300,
        resolvedRequest,
        responseStatus: response.status,
        responseHeaders: this.headersToObject(response.headers),
        responseBody: await response.text(),
        executionDuration,
        error: null,
      };
    } catch (error) {
      const executionDuration = Date.now() - startTime;

      // Resolve request even on error for debugging
      let resolvedRequest: ResolvedRequest | null = null;
      try {
        resolvedRequest = await RequestResolver.resolve(
          request,
          formVariables,
          workspaceId,
          environmentId
        );
      } catch {
        // If resolution fails, create a minimal resolved request
        resolvedRequest = {
          method: request.method,
          url: request.url,
          headers: [],
          body: request.body,
        };
      }

      return {
        success: false,
        resolvedRequest,
        responseStatus: 0,
        responseHeaders: {},
        responseBody: '',
        executionDuration,
        error: this.formatError(error),
      };
    }
  }

  /**
   * Executes an HTTP request with timeout
   */
  private static async executeHttpRequest(request: ResolvedRequest): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_TIMEOUT);

    try {
      const headers: Record<string, string> = {};
      request.headers.forEach((h) => {
        headers[h.key] = h.value;
      });

      const fetchOptions: RequestInit = {
        method: request.method,
        headers,
        signal: controller.signal,
      };

      if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        fetchOptions.body = request.body;
      }

      const response = await fetch(request.url, fetchOptions);
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Converts Headers object to plain object
   */
  private static headersToObject(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Formats error messages for user display
   */
  private static formatError(error: unknown): string {
    if (error instanceof Error) {
      // Handle AbortError (timeout)
      if (error.name === 'AbortError') {
        return 'Request timeout: The request took longer than 30 seconds to complete';
      }

      // Handle network errors
      if (error.message.includes('fetch')) {
        return `Connection failed: ${error.message}`;
      }

      return error.message;
    }

    return 'An unknown error occurred during request execution';
  }
}
