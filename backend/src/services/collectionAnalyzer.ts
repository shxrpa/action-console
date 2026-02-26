import type { Request as DBRequest, VariableRef } from '../types';

export interface AnalysisResult {
  variables: VariableRef[];
  risk: 'Safe' | 'Write' | 'Dangerous';
  hasScripts: boolean;
  warnings: string[];
}

/**
 * Analyzes a request to extract variables, classify risk, and detect scripts
 */
export class CollectionAnalyzer {
  private static readonly VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

  /**
   * Analyzes a request and returns analysis results
   * @param variableDescriptions Optional map of variable descriptions from the full collection
   */
  static analyzeRequest(
    request: DBRequest,
    rawJson: string,
    variableDescriptions?: Map<string, string>
  ): AnalysisResult {
    const variables = this.extractVariables(request, rawJson, variableDescriptions);
    const risk = this.classifyRisk(request);
    const hasScripts = this.detectScripts(rawJson);
    const warnings = this.generateWarnings(request, variables, hasScripts);

    return {
      variables,
      risk,
      hasScripts,
      warnings,
    };
  }

  /**
   * Extracts all variables from URL, headers, and body
   * Also extracts path variables and descriptions from Postman collection raw JSON
   * @param variableDescriptions Optional map of variable descriptions from the full collection
   */
  private static extractVariables(
    request: DBRequest,
    rawJson: string,
    variableDescriptions?: Map<string, string>
  ): VariableRef[] {
    const variableMap = new Map<string, VariableRef>();
    const pathVarsWithDescriptions = this.extractPathVariablesAndDescriptions(rawJson);

    // Extract from URL (including {{variable}} patterns)
    const urlVars = this.extractVariablesFromUrl(request.url);
    urlVars.forEach((name) => {
      const pathVarInfo = pathVarsWithDescriptions.get(name);
      // Use description from path vars, request-level vars, or collection-level descriptions
      const description = pathVarInfo?.description || variableDescriptions?.get(name);
      if (!variableMap.has(name)) {
        variableMap.set(name, {
          name,
          required: true, // URL variables are always required
          locations: ['url'],
          description,
        });
      } else {
        variableMap.get(name)!.locations.push('url');
        const existing = variableMap.get(name)!;
        if (!existing.description) {
          existing.description = description;
        }
      }
    });

    // Extract path variables (like :year, :segment) from raw JSON
    pathVarsWithDescriptions.forEach((info, name) => {
      if (!variableMap.has(name)) {
        // Use description from path vars, or fall back to collection-level descriptions
        const description = info.description || variableDescriptions?.get(name);
        variableMap.set(name, {
          name,
          required: true, // Path variables are always required
          locations: ['url'],
          description,
        });
      } else {
        // Update description if not already set
        const existing = variableMap.get(name)!;
        if (!existing.description) {
          existing.description = info.description || variableDescriptions?.get(name);
        }
      }
    });

    // Apply collection-level descriptions to any variables that don't have descriptions yet
    if (variableDescriptions) {
      variableMap.forEach((variableRef, name) => {
        if (!variableRef.description && variableDescriptions.has(name)) {
          variableRef.description = variableDescriptions.get(name);
        }
      });
    }

    // Extract from headers
    const headerVars = this.extractVariablesFromHeaders(request.headers);
    headerVars.forEach((name) => {
      if (!variableMap.has(name)) {
        variableMap.set(name, {
          name,
          required: this.isRequiredHeader(name),
          locations: ['header'],
        });
      } else {
        const existing = variableMap.get(name)!;
        if (!existing.locations.includes('header')) {
          existing.locations.push('header');
        }
        // If it's in a required header, mark as required
        if (this.isRequiredHeader(name)) {
          existing.required = true;
        }
      }
    });

    // Extract from body
    if (request.body) {
      const bodyVars = this.extractVariablesFromBody(request.body);
      bodyVars.forEach((name) => {
        if (!variableMap.has(name)) {
          variableMap.set(name, {
            name,
            required: false, // Body variables default to optional
            locations: ['body'],
          });
        } else {
          const existing = variableMap.get(name)!;
          if (!existing.locations.includes('body')) {
            existing.locations.push('body');
          }
        }
      });
    }

    return Array.from(variableMap.values());
  }

  /**
   * Extracts path variables (like :year, :segment) and their descriptions from Postman collection
   * Also searches parent item/folder levels for variable definitions
   * Returns a map of variable name to description
   */
  private static extractPathVariablesAndDescriptions(rawJson: string): Map<string, { description?: string }> {
    const pathVars = new Map<string, { description?: string }>();

    try {
      const requestData = JSON.parse(rawJson);
      const urlObj = requestData.request?.url;

      if (urlObj) {
        // Extract path variables (like :year, :segment)
        if (Array.isArray(urlObj.path)) {
          urlObj.path.forEach((segment: string) => {
            if (segment.startsWith(':')) {
              const varName = segment.substring(1);
              pathVars.set(varName, {});
            }
          });
        }

        // Extract URL variables with descriptions from url.variable array
        if (Array.isArray(urlObj.variable)) {
          urlObj.variable.forEach((varDef: { key: string; description?: string }) => {
            const varName = varDef.key;
            if (varDef.description) {
              // Only update if we have a description (don't overwrite with undefined)
              const existing = pathVars.get(varName);
              if (existing) {
                existing.description = varDef.description;
              } else {
                pathVars.set(varName, { description: varDef.description });
              }
            }
          });
        }
      }

      // Also check parent item levels for variable definitions
      // In Postman, folders can define variables that apply to all child requests
      let currentItem = requestData;
      while (currentItem) {
        // Check if this item has a variable array (folder-level variables)
        if (Array.isArray(currentItem.variable)) {
          currentItem.variable.forEach((varDef: { key: string; description?: string }) => {
            const varName = varDef.key;
            // Only set if we don't already have a description for this variable
            if (varDef.description && !pathVars.get(varName)?.description) {
              const existing = pathVars.get(varName);
              if (existing) {
                existing.description = varDef.description;
              } else {
                pathVars.set(varName, { description: varDef.description });
              }
            }
          });
        }

        // Check parent item (if this is nested)
        // Note: Postman structure doesn't have explicit parent references,
        // but we can check if there's a parent context in the raw JSON
        // For now, we'll also check the full collection structure if available
        currentItem = null; // We'd need the full collection to traverse up
      }
    } catch (error) {
      // If parsing fails, silently continue
      console.warn('Failed to parse raw JSON for path variables:', error);
    }

    return pathVars;
  }

  /**
   * Extracts variables from URL (path and query params)
   * Handles both {{variable}} and :variable patterns
   */
  private static extractVariablesFromUrl(url: string): string[] {
    const variables: string[] = [];
    let match: RegExpExecArray | null;

    // Extract {{variable}} patterns
    this.VARIABLE_PATTERN.lastIndex = 0;
    while ((match = this.VARIABLE_PATTERN.exec(url)) !== null) {
      const varName = match[1].trim();
      if (varName && !variables.includes(varName)) {
        variables.push(varName);
      }
    }

    // Extract :variable patterns (path variables)
    const pathVariablePattern = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
    pathVariablePattern.lastIndex = 0;
    while ((match = pathVariablePattern.exec(url)) !== null) {
      const varName = match[1].trim();
      if (varName && !variables.includes(varName)) {
        variables.push(varName);
      }
    }

    return variables;
  }

  /**
   * Extracts variables from headers
   */
  private static extractVariablesFromHeaders(headersJson: string): string[] {
    const variables: string[] = [];

    try {
      const headers = JSON.parse(headersJson) as Array<{ key: string; value: string }>;
      headers.forEach((header) => {
        if (header.value) {
          this.VARIABLE_PATTERN.lastIndex = 0;
          let match: RegExpExecArray | null;
          while ((match = this.VARIABLE_PATTERN.exec(header.value)) !== null) {
            const varName = match[1].trim();
            if (varName && !variables.includes(varName)) {
              variables.push(varName);
            }
          }
        }
      });
    } catch (error) {
      // Invalid JSON, skip header parsing
    }

    return variables;
  }

  /**
   * Extracts variables from body
   */
  private static extractVariablesFromBody(body: string): string[] {
    const variables: string[] = [];

    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(body);
      const bodyString = JSON.stringify(parsed);
      this.VARIABLE_PATTERN.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = this.VARIABLE_PATTERN.exec(bodyString)) !== null) {
        const varName = match[1].trim();
        if (varName && !variables.includes(varName)) {
          variables.push(varName);
        }
      }
    } catch {
      // Not JSON, treat as raw string
      this.VARIABLE_PATTERN.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = this.VARIABLE_PATTERN.exec(body)) !== null) {
        const varName = match[1].trim();
        if (varName && !variables.includes(varName)) {
          variables.push(varName);
        }
      }
    }

    return variables;
  }

  /**
   * Determines if a header variable is required
   */
  private static isRequiredHeader(headerName: string): boolean {
    const requiredHeaders = ['authorization', 'authorization', 'x-api-key', 'api-key'];
    return requiredHeaders.some((req) => headerName.toLowerCase().includes(req));
  }

  /**
   * Classifies the risk level of a request
   */
  private static classifyRisk(request: DBRequest): 'Safe' | 'Write' | 'Dangerous' {
    const method = request.method.toUpperCase();

    // Check for destructive keywords in URL or name
    const destructiveKeywords = ['delete', 'remove', 'destroy', 'drop', 'kill', 'terminate'];
    const searchText = `${request.url} ${request.name}`.toLowerCase();
    const hasDestructiveKeyword = destructiveKeywords.some((keyword) => searchText.includes(keyword));

    if (method === 'GET') {
      return 'Safe';
    }

    if (method === 'DELETE' || hasDestructiveKeyword) {
      return 'Dangerous';
    }

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      return 'Write';
    }

    // Default to Write for unknown methods
    return 'Write';
  }

  /**
   * Detects if request has pre-request or test scripts
   */
  private static detectScripts(rawJson: string): boolean {
    try {
      const requestData = JSON.parse(rawJson);
      const event = requestData.event || requestData.events;

      if (Array.isArray(event)) {
        return event.some((e: { listen?: string }) => e.listen === 'prerequest' || e.listen === 'test');
      }

      if (event) {
        return !!(event.prerequest || event.test || event.preRequestScript || event.testScript);
      }

      return false;
    } catch {
      // If parsing fails, check raw string for script indicators
      return rawJson.includes('prerequest') || rawJson.includes('test') || rawJson.includes('script');
    }
  }

  /**
   * Generates warnings for the request
   */
  private static generateWarnings(
    request: DBRequest,
    variables: VariableRef[],
    hasScripts: boolean
  ): string[] {
    const warnings: string[] = [];
    const risk = this.classifyRisk(request);

    if (hasScripts) {
      warnings.push('This request contains scripts that may affect execution behavior');
    }

    if (risk === 'Dangerous') {
      warnings.push('This is a destructive operation - use with caution');
    }

    const requiredVars = variables.filter((v) => v.required);
    if (requiredVars.length > 5) {
      warnings.push(`This request requires ${requiredVars.length} variables - ensure all are provided`);
    }

    return warnings;
  }
}
