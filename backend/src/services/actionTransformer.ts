import type { Request, Folder } from '../types';

export interface Action {
  id: string;
  name: string;
  description: string;
  method: string;
  url: string;
  risk: 'Safe' | 'Write' | 'Dangerous' | null;
  hasScripts: boolean;
  requiredVariablesCount: number;
  totalVariablesCount: number;
  folderPath: string;
  folderId: string | null;
  collectionId: string;
}

/**
 * Transforms Request entities into Action display models
 */
export class ActionTransformer {
  /**
   * Transforms a request and its folder context into an Action
   */
  static transformRequest(
    request: Request,
    folders: Folder[],
    folderMap: Map<string, Folder>
  ): Action {
    const folderPath = this.buildFolderPath(request.folderId, folderMap);
    const variables = request.variables ? JSON.parse(request.variables) : [];
    const requiredCount = variables.filter((v: { required: boolean }) => v.required).length;

    return {
      id: request.id,
      name: request.name,
      description: this.generateDescription(request.name, folderPath),
      method: request.method,
      url: request.url,
      risk: request.risk || null,
      hasScripts: request.hasScripts || false,
      requiredVariablesCount: requiredCount,
      totalVariablesCount: variables.length,
      folderPath,
      folderId: request.folderId,
      collectionId: request.collectionId,
    };
  }

  /**
   * Builds folder path string from folder hierarchy
   */
  private static buildFolderPath(folderId: string | null, folderMap: Map<string, Folder>): string {
    if (!folderId) {
      return '';
    }

    const path: string[] = [];
    let currentFolderId: string | null = folderId;

    while (currentFolderId) {
      const folder = folderMap.get(currentFolderId);
      if (!folder) break;

      path.unshift(folder.name);
      currentFolderId = folder.parentId;
    }

    return path.join(' / ');
  }

  /**
   * Generates a short description from action name and folder path
   */
  private static generateDescription(name: string, folderPath: string): string {
    if (folderPath) {
      return `${folderPath} - ${name}`;
    }
    return name;
  }

  /**
   * Groups actions by folder
   */
  static groupByFolder(actions: Action[]): Map<string, Action[]> {
    const grouped = new Map<string, Action[]>();

    actions.forEach((action) => {
      const key = action.folderPath || 'Root';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(action);
    });

    return grouped;
  }
}
