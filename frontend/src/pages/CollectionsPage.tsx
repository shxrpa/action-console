import { useState, useEffect, useContext } from 'react';
import { fetchCollections, deleteCollection, type Collection } from '../services/api';
import { WorkspaceContext } from '../contexts/WorkspaceContext';
import CollectionTree from '../components/CollectionTree';

function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const context = useContext(WorkspaceContext);
  const workspaceId = context?.selectedWorkspaceId;

  useEffect(() => {
    if (workspaceId) {
      loadCollections();
    }
  }, [workspaceId]);

  const loadCollections = async () => {
    if (!workspaceId) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchCollections(workspaceId);
      setCollections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, collection: Collection) => {
    e.stopPropagation();
    if (!window.confirm(`Delete collection "${collection.name}"? This will remove all its requests and cannot be undone.`)) {
      return;
    }
    try {
      await deleteCollection(collection.id);
      if (selectedCollection?.id === collection.id) {
        setSelectedCollection(null);
      }
      await loadCollections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete collection');
    }
  };

  if (!workspaceId) {
    return (
      <div className="collections-page">
        <p>Please select a workspace to view collections.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="collections-page">
        <p>Loading collections...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="collections-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="collections-page">
      <div className="collections-layout">
        <div className="collections-list">
          <h2>Collections</h2>
          {collections.length === 0 ? (
            <p className="empty-collections">No collections imported yet.</p>
          ) : (
            <ul className="collection-items">
              {collections.map((collection) => (
                <li
                  key={collection.id}
                  className={`collection-item ${selectedCollection?.id === collection.id ? 'active' : ''}`}
                  onClick={() => setSelectedCollection(collection)}
                >
                  <div className="collection-actions">
                    <button
                      className="btn-view-actions"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/collections/${collection.id}/actions`;
                      }}
                    >
                      View Actions
                    </button>
                    <button
                      type="button"
                      className="btn-delete-collection"
                      onClick={(e) => handleDelete(e, collection)}
                      title="Delete collection"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="collection-item-header">
                    <h3>{collection.name}</h3>
                    <span className="collection-meta">
                      {collection.requestCount || 0} requests
                    </span>
                  </div>
                  {collection.description && (
                    <p className="collection-description">{collection.description}</p>
                  )}
                  <p className="collection-date">
                    Imported {new Date(collection.importedAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="collection-detail">
          {selectedCollection ? (
            <CollectionTree collectionId={selectedCollection.id} />
          ) : (
            <div className="collection-placeholder">
              <p>Select a collection to view its structure</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CollectionsPage;
