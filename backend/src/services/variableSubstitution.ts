/**
 * Substitutes variables in a template string
 * Replaces {{variable}} with actual values
 */
export function substituteVariables(template: string, variables: Map<string, string>): string {
  if (!template) return template;

  // Replace all {{variable}} occurrences
  return template.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    const trimmedName = varName.trim();
    const value = variables.get(trimmedName);
    
    if (value === undefined || value === null) {
      // Missing variable - return empty string or throw error?
      // For now, return empty string and let validation catch required ones
      return '';
    }
    
    return value;
  });
}

/**
 * Substitutes variables in URL components
 */
export function substituteUrl(url: string, variables: Map<string, string>): string {
  return substituteVariables(url, variables);
}

/**
 * Substitutes variables in header values
 */
export function substituteHeaders(
  headers: Array<{ key: string; value: string }>,
  variables: Map<string, string>
): Array<{ key: string; value: string }> {
  return headers.map((header) => ({
    key: header.key,
    value: substituteVariables(header.value, variables),
  }));
}

/**
 * Substitutes variables in body content
 */
export function substituteBody(body: string | null, variables: Map<string, string>): string | null {
  if (!body) return body;
  return substituteVariables(body, variables);
}
