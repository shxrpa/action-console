import type { Request as DBRequest } from '../types';

export interface VariableRef {
  name: string;
  required: boolean;
  locations: Array<'url' | 'header' | 'body'>;
}

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
   */
  static analyzeRequest(request: DBRequest, rawJson: string): AnalysisResult {
    const variables = this.extractVariables(request);
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
   */
  private static extractVariables(request: DBRequest): VariableRef[] {
    const variableMap = new Map<string, VariableRef>();

    // Extract from URL
    const urlVars = this.extractVariablesFromUrl(request.url);
    urlVars.forEach((name) => {
      if (!variableMap.has(name)) {
        variableMap.set(name, {
          name,
          required: true, // URL variables are always required
          locations: ['url'],
        });
      } else {
        variableMap.get(name)!.locations.push('url');
      }
    });

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
   * Extracts variables from URL (path and query params)
   */
  private static extractVariablesFromUrl(url: string): string[] {
    const variables: string[] = [];
    let match: RegExpExecArray | null;

    // Reset regex
    this.VARIABLE_PATTERN.lastIndex = 0;

    while ((match = this.VARIABLE_PATTERN.exec(url)) !== null) {
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
