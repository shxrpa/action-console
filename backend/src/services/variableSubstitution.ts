/**
 * Substitutes variables in a template string
 * Replaces {{variable}} with values from the variables map
 */
export function substituteVariables(
  template: string,
  variables: Map<string, string>
): string {
  if (!template) {
    return template;
  }

  // Match {{variable}} pattern (case-insensitive, allows whitespace)
  return template.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    const trimmedVarName = varName.trim();
    const value = variables.get(trimmedVarName);

    // Never send unresolved placeholders (missing or value still "{{x}}")
    if (value === undefined || (typeof value === 'string' && value.includes('{{') && value.includes('}}'))) {
      if (value === undefined) {
        console.warn(`Variable ${trimmedVarName} not found in variables map`);
      }
      return '';
    }

    return value;
  });
}

/**
 * Validates that all required variables are present
 */
export function validateRequiredVariables(
  template: string,
  variables: Map<string, string>
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  const variablePattern = /\{\{([^}]+)\}\}/g;
  const matches = template.matchAll(variablePattern);
  
  for (const match of matches) {
    const varName = match[1].trim();
    if (!variables.has(varName)) {
      missing.push(varName);
    }
  }
  
  // Remove duplicates
  const uniqueMissing = Array.from(new Set(missing));
  
  return {
    valid: uniqueMissing.length === 0,
    missing: uniqueMissing,
  };
}
