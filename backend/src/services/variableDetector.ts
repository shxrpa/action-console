import { VariableModel } from '../models/Variable';
import type { VariableRef } from '../types';

/**
 * Detects missing required variables for an action
 * @param variables Array of variable references from the action
 * @param workspaceId The workspace ID
 * @param environmentId The environment ID (optional)
 * @returns Array of missing variable names
 */
export function detectMissingVariables(
  variables: VariableRef[],
  workspaceId: string,
  environmentId?: string | null
): string[] {
  if (!variables || variables.length === 0) {
    return [];
  }

  // Get all variables for the workspace/environment
  const walletVariables = VariableModel.findByWorkspace(workspaceId, environmentId || null);
  const variableNames = new Set(walletVariables.map((v) => v.name.toLowerCase()));

  // Find required variables that are missing
  const missing: string[] = [];
  for (const variableRef of variables) {
    if (variableRef.required && !variableNames.has(variableRef.name.toLowerCase())) {
      missing.push(variableRef.name);
    }
  }

  return missing;
}
