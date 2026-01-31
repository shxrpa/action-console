import { VariableSubstitution } from './variableSubstitution';
import type { Request as DBRequest } from '../types';
import { VariableModel } from '../models/Variable';

export interface ResolvedRequest {
  method: string;
  url: string;
  headers: Array<{ key: string; value: string }>;
  body: string | null;
}

/**
 * Resolves a request by substituting variables and injecting authentication
 */
export class RequestResolver {
  /**
   * Resolves a request with variable substitution and authentication
   */
  static async resolve(
    request: DBRequest,
    formVariables: Record<string, string>,
    workspaceId: string,
    environmentId: string | null
  ): Promise<ResolvedRequest> {
    // Get variables from Variable Wallet
    const walletVariables = VariableModel.findByWorkspace(workspaceId, environmentId);
    const variablesMap = new Map<string, string>();

    // Add variables from Variable Wallet
    walletVariables.forEach((v) => {
      variablesMap.set(v.name, v.value);
    });

    // Override with form variables (form takes precedence)
    // Convert all values to strings to ensure proper substitution
    Object.entries(formVariables).forEach(([name, value]) => {
      // Convert value to string (handles numbers, booleans, etc.)
      const stringValue = value !== null && value !== undefined ? String(value) : '';
      variablesMap.set(name, stringValue);
    });

    // Parse headers
    let headers: Array<{ key: string; value: string }> = [];
    try {
      headers = JSON.parse(request.headers || '[]');
    } catch {
      headers = [];
    }

    // Substitute variables in URL
    const resolvedUrl = VariableSubstitution.substituteUrl(request.url, variablesMap);

    // Substitute variables in headers
    const resolvedHeaders = VariableSubstitution.substituteHeaders(headers, variablesMap);

    // Inject authentication
    const headersWithAuth = this.injectAuthentication(resolvedHeaders, variablesMap);

    // Substitute variables in body
    const resolvedBody = VariableSubstitution.substituteBody(request.body, variablesMap);

    return {
      method: request.method,
      url: resolvedUrl,
      headers: headersWithAuth,
      body: resolvedBody,
    };
  }

  /**
   * Injects authentication headers based on detected variables
   */
  private static injectAuthentication(
    headers: Array<{ key: string; value: string }>,
    variables: Map<string, string>
  ): Array<{ key: string; value: string }> {
    const result = [...headers];
    const headerKeys = new Set(result.map((h) => h.key.toLowerCase()));

    // Check for Bearer token
    const bearerToken = this.findVariable(variables, ['token', 'bearer', 'accessToken', 'access_token']);
    if (bearerToken && !headerKeys.has('authorization')) {
      result.push({
        key: 'Authorization',
        value: `Bearer ${bearerToken}`,
      });
    }

    // Check for API key
    const apiKey = this.findVariable(variables, ['apiKey', 'api_key', 'apikey', 'x-api-key']);
    if (apiKey) {
      // Check if already exists
      const existingApiKey = result.find((h) => h.key.toLowerCase() === 'x-api-key' || h.key.toLowerCase() === 'api-key');
      if (!existingApiKey) {
        result.push({
          key: 'X-API-Key',
          value: apiKey,
        });
      }
    }

    // Check for Basic auth (username and password)
    const username = this.findVariable(variables, ['username', 'user', 'userName']);
    const password = this.findVariable(variables, ['password', 'pass', 'pwd']);
    if (username && password && !headerKeys.has('authorization')) {
      const credentials = Buffer.from(`${username}:${password}`).toString('base64');
      result.push({
        key: 'Authorization',
        value: `Basic ${credentials}`,
      });
    }

    return result;
  }

  /**
   * Finds a variable by checking multiple possible names
   */
  private static findVariable(variables: Map<string, string>, possibleNames: string[]): string | undefined {
    for (const name of possibleNames) {
      // Check exact match
      if (variables.has(name)) {
        return variables.get(name);
      }
      // Check case-insensitive match
      for (const [key, value] of variables.entries()) {
        if (key.toLowerCase() === name.toLowerCase()) {
          return value;
        }
      }
    }
    return undefined;
  }
}
