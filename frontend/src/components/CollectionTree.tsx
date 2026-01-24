import { useState, useEffect } from 'react';

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  collectionId: string;
  order: number;
}

interface Request {
  id: string;
  name: string;
  method: string;
  url: string;
  folderId: string | null;
}

interface CollectionDetail {
  id: string;
  name: string;
  folders: Folder[];
  requests: Request[];
}

interface CollectionTreeProps {
  collectionId: string;
}

function CollectionTree({ collectionId }: CollectionTreeProps) {
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCollection();
  }, [collectionId]);

  const loadCollection = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/collections/${collectionId}`);
      if (!response.ok) {
        throw new Error('Failed to load collection');
      }
      const data = await response.json();
      setCollection(data);
      // Expand all folders by default
      setExpandedFolders(new Set(data.folders.map((f: Folder) => f.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collection');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const buildTree = (): { rootFolders: FolderNode[]; rootRequests: Request[] } => {
    if (!collection) return { rootFolders: [], rootRequests: [] };

    const folderMap = new Map<string, FolderNode>();
    const rootFolders: FolderNode[] = [];

    // Create folder map
    collection.folders.forEach((folder) => {
      folderMap.set(folder.id, { ...folder, children: [], requests: [] });
    });

    // Build tree structure
    collection.folders.forEach((folder) => {
      const folderNode = folderMap.get(folder.id)!;
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId)!.children.push(folderNode);
      } else {
        rootFolders.push(folderNode);
      }
    });

    // Add requests to folders
    collection.requests.forEach((request) => {
      if (request.folderId && folderMap.has(request.folderId)) {
        folderMap.get(request.folderId)!.requests.push(request);
      }
    });

    // Add root-level requests
    const rootRequests = collection.requests.filter((r) => !r.folderId);

    return { rootFolders, rootRequests };
  };

  type FolderNode = Folder & { children: FolderNode[]; requests: Request[] };

  const renderFolder = (folder: FolderNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children.length > 0 || folder.requests.length > 0;

    return (
      <li key={folder.id} className="tree-item folder-item" style={{ paddingLeft: `${depth * 20}px` }}>
        <div className="tree-node" onClick={() => hasChildren && toggleFolder(folder.id)}>
          <span className="tree-icon">
            {hasChildren && (isExpanded ? '📂' : '📁')}
            {!hasChildren && '📄'}
          </span>
          <span className="tree-label">{folder.name}</span>
        </div>
        {isExpanded && (
          <ul className="tree-children">
            {folder.children.map((child) => renderFolder(child, depth + 1))}
            {folder.requests.map((request) => (
              <li key={request.id} className="tree-item request-item" style={{ paddingLeft: `${(depth + 1) * 20}px` }}>
                <div className="tree-node">
                  <span className="method-badge method-{request.method.toLowerCase()}">{request.method}</span>
                  <span className="tree-label">{request.name}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  if (isLoading) {
    return <div className="collection-tree">Loading...</div>;
  }

  if (error) {
    return <div className="collection-tree error-message">{error}</div>;
  }

  if (!collection) {
    return <div className="collection-tree">Collection not found</div>;
  }

  const { rootFolders, rootRequests } = buildTree();

  return (
    <div className="collection-tree">
      <h3>{collection.name}</h3>
      <ul className="tree-root">
        {rootFolders.map((folder) => renderFolder(folder))}
        {rootRequests.map((request) => (
          <li key={request.id} className="tree-item request-item">
            <div className="tree-node">
              <span className={`method-badge method-${request.method.toLowerCase()}`}>{request.method}</span>
              <span className="tree-label">{request.name}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CollectionTree;
