import type { VariableRef } from '../types';

export interface FormField {
  variableName: string;
  label: string;
  inputType: 'text' | 'password' | 'number';
  defaultValue: string;
  required: boolean;
  locations: Array<'url' | 'header' | 'body'>;
}

export interface FormSchema {
  fields: FormField[];
}

/**
 * Generates a form schema from an action's variables
 */
export class FormGenerator {
  /**
   * Generates a form schema from action variables
   */
  static generateFormSchema(
    variables: VariableRef[],
    variableDefaults: Map<string, string> = new Map()
  ): FormSchema {
    console.log(`Generating form schema for ${variables.length} variables`);
    const fields: FormField[] = variables.map((variable) => {
      const defaultValue = variableDefaults.get(variable.name) || '';
      const label = this.generateLabel(variable.name);
      const inputType = this.detectInputType(variable.name);

      console.log(`  - ${variable.name}: required=${variable.required}, defaultValue=${defaultValue ? '***' : '(empty)'}, locations=${variable.locations.join(',')}`);

      return {
        variableName: variable.name,
        label,
        inputType,
        defaultValue,
        required: variable.required,
        locations: variable.locations,
      };
    });

    console.log(`Generated ${fields.length} form fields`);
    return { fields };
  }

  /**
   * Generates a human-readable label from a variable name
   */
  static generateLabel(variableName: string): string {
    // Convert camelCase/PascalCase to Title Case
    let label = variableName
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
      .trim();

    // Capitalize first letter of each word
    label = label
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // If label is empty or just whitespace, use the original name with first letter capitalized
    if (!label || label.trim().length === 0) {
      label = variableName.charAt(0).toUpperCase() + variableName.slice(1);
    }

    return label;
  }

  /**
   * Detects the appropriate input type based on variable name
   */
  static detectInputType(variableName: string): 'text' | 'password' | 'number' {
    const lower = variableName.toLowerCase();

    // Check for secret/password keywords
    if (
      lower.includes('secret') ||
      lower.includes('password') ||
      lower.includes('token') ||
      lower.includes('key') ||
      lower.includes('apikey') ||
      lower.includes('api_key') ||
      lower.includes('api-key')
    ) {
      return 'password';
    }

    // Check for number keywords
    if (
      lower.includes('id') ||
      lower.includes('count') ||
      lower.includes('number') ||
      lower.includes('size') ||
      lower.includes('quantity') ||
      lower.includes('amount') ||
      lower.endsWith('_id') ||
      lower.endsWith('id')
    ) {
      return 'number';
    }

    return 'text';
  }
}
