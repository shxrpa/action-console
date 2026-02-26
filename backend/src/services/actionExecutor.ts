import type { ResolvedRequest } from './requestResolver';

export interface ExecutionResult {
  resolvedRequest: ResolvedRequest;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  success: boolean;
  error: string | null;
  executionDuration: number; // milliseconds
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds

const SENSITIVE_HEADER_NAMES = [
  'authorization',
  'x-api-key',
  'api-key',
  'x-auth-token',
  'cookie',
  'set-cookie',
  'proxy-authorization',
];

function maskSensitiveHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    const isSensitive = SENSITIVE_HEADER_NAMES.some((h) => lower === h || lower.includes(h));
    out[key] = isSensitive && value ? '••••••' : value;
  }
  return out;
}

/**
 * Executes an HTTP request and returns the result
 */
export class ActionExecutor {
  /**
   * Executes a resolved HTTP request
   */
  static async execute(request: ResolvedRequest): Promise<ExecutionResult> {
    const startTime = Date.now();
    const resolvedRequest = { ...request };

    try {
      // Build fetch options
      const fetchOptions: RequestInit = {
        method: request.method,
        headers: request.headers,
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
      };

      // Add body for methods that support it
      if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase())) {
        fetchOptions.body = request.body;
      }

      // Execute request
      const response = await fetch(request.url, fetchOptions);
      
      // Capture response and mask sensitive headers so API keys etc. are never shown in UI
      const responseBody = await response.text();
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const executionDuration = Date.now() - startTime;
      const success = response.status >= 200 && response.status < 300;

      return {
        resolvedRequest: {
          ...resolvedRequest,
          headers: maskSensitiveHeaders(resolvedRequest.headers),
        },
        responseStatus: response.status,
        responseHeaders: maskSensitiveHeaders(responseHeaders),
        responseBody,
        success,
        error: success ? null : `HTTP ${response.status}: ${response.statusText}`,
        executionDuration,
      };
    } catch (error) {
      const executionDuration = Date.now() - startTime;
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          errorMessage = 'Request timeout';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Connection failed';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        resolvedRequest: {
          ...resolvedRequest,
          headers: maskSensitiveHeaders(resolvedRequest.headers),
        },
        responseStatus: 0,
        responseHeaders: {},
        responseBody: '',
        success: false,
        error: errorMessage,
        executionDuration,
      };
    }
  }
}
