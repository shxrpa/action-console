import { RequestModel } from '../models/Collection';
import { VariableModel } from '../models/Variable';
import { substituteUrl, substituteHeaders, substituteBody } from './variableSubstitution';
import { AuthenticationDetector } from './authentication';
import type { Request as DBRequest } from '../types';

export interface ExecutionRequest {
  actionId: string;
  variables: Record<string, string>;
  workspaceId: string;
  environmentId?: string | null;
}

export interface ResolvedRequest {
  method: string;
  url: string;
  headers: Array<{ key: string; value: string }>;
  body: string | null;
}

export interface ExecutionResult {
  resolvedRequest: ResolvedRequest;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  success: boolean;
  error: string | null;
  executionDuration: number;
}

/**
 * Executes an action with provided variables
 */
export class ActionExecutor {
  /**
   * Executes an action
   */
  static async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Get the request from database
      const dbRequest = RequestModel.findById(request.actionId);
      if (!dbRequest) {
        throw new Error('Action not found');
      }

      // Get variables from Variable Wallet
      const walletVariables = VariableModel.findByWorkspace(
        request.workspaceId,
        request.environmentId || null
      );

      // Merge form variables with wallet variables (form takes precedence)
      const allVariables = new Map<string, string>();
      
      // First, add wallet variables
      for (const walletVar of walletVariables) {
        let value = walletVar.value;
        if (walletVar.isSecret) {
          try {
            const { decryptSecret } = await import('./encryption');
            value = decryptSecret(value);
          } catch (error) {
            console.error(`Error decrypting variable ${walletVar.name}:`, error);
            // Skip this variable if decryption fails
            continue;
          }
        }
        allVariables.set(walletVar.name, value);
      }

      // Then, override with form-provided variables
      for (const [key, value] of Object.entries(request.variables)) {
        allVariables.set(key, value);
      }

      // Resolve request components
      const resolvedRequest = this.resolveRequest(dbRequest, allVariables, walletVariablesForAuth);

      // Execute HTTP request
      const response = await this.executeHttpRequest(resolvedRequest);

      const executionDuration = Date.now() - startTime;

      return {
        resolvedRequest,
        responseStatus: response.status,
        responseHeaders: response.headers,
        responseBody: response.body,
        success: response.status >= 200 && response.status < 300,
        error: response.status >= 400 ? `HTTP ${response.status}: ${response.statusText}` : null,
        executionDuration,
      };
    } catch (error) {
      const executionDuration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        resolvedRequest: {
          method: 'GET',
          url: '',
          headers: [],
          body: null,
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

  /**
   * Resolves request components with variable substitution
   */
  private static resolveRequest(
    dbRequest: DBRequest,
    variables: Map<string, string>
  ): ResolvedRequest {
    // Substitute URL
    const resolvedUrl = substituteUrl(dbRequest.url, variables);

    // Substitute headers
    const headers = dbRequest.headers ? JSON.parse(dbRequest.headers) : [];
    let resolvedHeaders = substituteHeaders(headers, variables);

    // Apply authentication
    const walletVariables = Array.from(variables.entries()).map(([name, value]) => ({
      name,
      value,
      isSecret: false, // We already decrypted
      scope: 'workspace' as const,
      environmentId: null,
      workspaceId: '',
      id: '',
      createdAt: '',
      updatedAt: '',
    }));

    const auth = AuthenticationDetector.detectAuth(walletVariables);
    resolvedHeaders = AuthenticationDetector.applyAuth(resolvedHeaders, auth);

    // Substitute body
    const resolvedBody = substituteBody(dbRequest.body, variables);

    return {
      method: dbRequest.method,
      url: resolvedUrl,
      headers: resolvedHeaders,
      body: resolvedBody,
    };
  }

  /**
   * Executes HTTP request
   */
  private static async executeHttpRequest(
    request: ResolvedRequest
  ): Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
  }> {
    // Build headers object
    const headersObj: Record<string, string> = {};
    for (const header of request.headers) {
      headersObj[header.key] = header.value;
    }

    // Set timeout (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: headersObj,
        body: request.body || undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Read response body
      const body = await response.text();

      // Convert headers to object
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout (30 seconds)');
      }
      
      if (error instanceof Error) {
        throw new Error(`Connection failed: ${error.message}`);
      }
      
      throw new Error('Unknown network error');
    }
  }
}
