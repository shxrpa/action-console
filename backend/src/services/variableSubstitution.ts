/**
 * Variable substitution service for replacing {{variable}} placeholders
 * Also handles path variables like :year, :segment
 */

export class VariableSubstitution {
  /**
   * Substitutes variables in a template string
   * Handles both {{variable}} and :variable patterns
   */
  static substitute(template: string, variables: Map<string, string>): string {
    let result = template;

    // Replace {{variable}} patterns first
    result = result.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const trimmedName = varName.trim();
      const value = variables.get(trimmedName);
      if (value === undefined) {
        throw new Error(`Missing required variable: ${trimmedName}`);
      }
      return value;
    });

    // Replace :variable patterns (path variables)
    // Match :variableName in path segments only (between / or at start, before /, ?, &, or end)
    // Use negative lookbehind to ensure we're not in the middle of a word or after :
    result = result.replace(/(?<!:):([a-zA-Z_][a-zA-Z0-9_]*)(?=\/|$|\?|&)/g, (match, varName) => {
      // Skip JavaScript keywords that shouldn't be variables
      const jsKeywords = ['true', 'false', 'null', 'undefined'];
      if (jsKeywords.includes(varName.toLowerCase())) {
        return match; // Don't substitute, return original
      }
      
      const value = variables.get(varName);
      if (value === undefined) {
        throw new Error(`Missing required path variable: ${varName}`);
      }
      return value;
    });

    return result;
  }

  /**
   * Substitutes variables in a URL
   * Handles base URL, path segments, and query parameters
   */
  static substituteUrl(url: string, variables: Map<string, string>): string {
    try {
      return this.substitute(url, variables);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`URL substitution failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Substitutes variables in headers
   * Only substitutes {{variable}} patterns, not :variable (path variables are URL-only)
   */
  static substituteHeaders(
    headers: Array<{ key: string; value: string }>,
    variables: Map<string, string>
  ): Array<{ key: string; value: string }> {
    return headers.map((header) => ({
      key: header.key,
      value: this.substituteTemplateOnly(header.value, variables),
    }));
  }

  /**
   * Substitutes variables in body
   * Handles JSON, form-encoded, and raw text
   * Note: Only substitutes {{variable}} patterns, not :variable (path variables are URL-only)
   */
  static substituteBody(body: string | null, variables: Map<string, string>): string | null {
    if (!body) {
      return null;
    }

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(body);
      const substituted = this.substituteInObject(parsed, variables);
      return JSON.stringify(substituted);
    } catch {
      // Not JSON, treat as raw string
      // Only substitute {{variable}} patterns, not :variable (to avoid matching :true, :false in JSON)
      return this.substituteTemplateOnly(body, variables);
    }
  }

  /**
   * Substitutes only {{variable}} patterns, not :variable patterns
   * Used for body/headers to avoid false matches
   */
  private static substituteTemplateOnly(template: string, variables: Map<string, string>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const trimmedName = varName.trim();
      const value = variables.get(trimmedName);
      if (value === undefined) {
        throw new Error(`Missing required variable: ${trimmedName}`);
      }
      return value;
    });
  }

  /**
   * Recursively substitutes variables in an object
   * Only substitutes {{variable}} patterns, not :variable (to avoid false matches in JSON)
   */
  private static substituteInObject(obj: unknown, variables: Map<string, string>): unknown {
    if (typeof obj === 'string') {
      // Only substitute {{variable}} patterns in JSON strings, not :variable
      return this.substituteTemplateOnly(obj, variables);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.substituteInObject(item, variables));
    }

    if (obj && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.substituteInObject(value, variables);
      }
      return result;
    }

    return obj;
  }
}
