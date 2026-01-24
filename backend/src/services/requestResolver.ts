import type { Request as DBRequest } from '../types';
import { substituteVariables, validateRequiredVariables } from './variableSubstitution';
import { VariableModel } from '../models/Variable';
import { decryptSecret } from './encryption';

export interface ResolvedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
}

export interface ExecutionContext {
  workspaceId: string;
  environmentId: string | null;
  formValues: Record<string, string>;
}

/**
 * Resolves a request by substituting variables and injecting authentication
 */
export class RequestResolver {
  /**
   * Resolves a request with variable substitution and auth injection
   */
  static async resolve(
    request: DBRequest,
    context: ExecutionContext
  ): Promise<ResolvedRequest> {
    // Get all variables from Variable Wallet + form values
    const variables = await this.buildVariableMap(context);
    
    // Parse headers
    const headers = request.headers ? JSON.parse(request.headers) : [];
    
    // Substitute variables in URL
    const resolvedUrl = substituteVariables(request.url, variables);
    
    // Substitute variables in headers
    const resolvedHeaders: Record<string, string> = {};
    for (const header of headers) {
      const key = header.key || header.name || '';
      const value = substituteVariables(header.value || '', variables);
      if (key && value) {
        resolvedHeaders[key] = value;
      }
    }
    
    // Inject authentication
    this.injectAuthentication(resolvedHeaders, variables);
    
    // Substitute variables in body
    let resolvedBody: string | null = null;
    if (request.body) {
      resolvedBody = substituteVariables(request.body, variables);
    }
    
    // Validate required variables are present
    const urlValidation = validateRequiredVariables(request.url, variables);
    if (!urlValidation.valid) {
      throw new Error(`Missing required variables in URL: ${urlValidation.missing.join(', ')}`);
    }
    
    return {
      method: request.method,
      url: resolvedUrl,
      headers: resolvedHeaders,
      body: resolvedBody,
    };
  }

  /**
   * Builds a variable map from Variable Wallet and form values
   * Form values take precedence over Variable Wallet values
   */
  private static async buildVariableMap(
    context: ExecutionContext
  ): Promise<Map<string, string>> {
    const variables = new Map<string, string>();
    
    // Get variables from Variable Wallet
    const walletVariables = VariableModel.findByWorkspace(
      context.workspaceId,
      context.environmentId
    );
    
    for (const walletVar of walletVariables) {
      let value = walletVar.value;
      
      // Decrypt secrets if needed
      if (walletVar.isSecret) {
        try {
          value = decryptSecret(walletVar.value);
        } catch (error) {
          console.error(`Error decrypting variable ${walletVar.name}:`, error);
          // Continue with encrypted value (will likely fail substitution)
        }
      }
      
      variables.set(walletVar.name, value);
    }
    
    // Override with form values (form values take precedence)
    for (const [key, value] of Object.entries(context.formValues)) {
      if (value !== undefined && value !== null) {
        variables.set(key, value);
      }
    }
    
    return variables;
  }

  /**
   * Injects authentication headers based on variable names
   */
  private static injectAuthentication(
    headers: Record<string, string>,
    variables: Map<string, string>
  ): void {
    // Check for Bearer token
    const bearerToken = this.findAuthVariable(variables, ['token', 'bearer', 'accessToken', 'access_token']);
    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
      return; // Bearer token takes precedence
    }
    
    // Check for API key
    const apiKey = this.findAuthVariable(variables, ['apiKey', 'api_key', 'apikey', 'key']);
    if (apiKey) {
      // Try common API key header names
      if (!headers['X-API-Key'] && !headers['x-api-key']) {
        headers['X-API-Key'] = apiKey;
      }
    }
    
    // Check for Basic auth (username and password)
    const username = this.findAuthVariable(variables, ['username', 'user', 'userName']);
    const password = this.findAuthVariable(variables, ['password', 'pass', 'pwd']);
    if (username && password) {
      const credentials = Buffer.from(`${username}:${password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }
  }

  /**
   * Finds an authentication variable by checking multiple possible names
   */
  private static findAuthVariable(
    variables: Map<string, string>,
    possibleNames: string[]
  ): string | null {
    for (const name of possibleNames) {
      // Check exact match (case-insensitive)
      for (const [key, value] of variables.entries()) {
        if (key.toLowerCase() === name.toLowerCase() && value) {
          return value;
        }
      }
    }
    return null;
  }
}
