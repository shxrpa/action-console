import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkspaceContext } from '../contexts/WorkspaceContext';

interface Action {
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
}

function ActionCatalogPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const [actions, setActions] = useState<Action[]>([]);
  const [filteredActions, setFilteredActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilters, setRiskFilters] = useState({
    Safe: true,
    Write: true,
    Dangerous: true,
  });

  useEffect(() => {
    if (collectionId) {
      loadActions();
    }
  }, [collectionId]);

  useEffect(() => {
    applyFilters();
  }, [actions, searchQuery, riskFilters]);

  const loadActions = async () => {
    if (!collectionId) return;

    try {
      setIsLoading(true);
      setError(null);
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_BASE_URL}/actions?collectionId=${collectionId}`);
      if (!response.ok) {
        throw new Error('Failed to load actions');
      }
      const data = await response.json();
      setActions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load actions');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...actions];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (action) =>
          action.name.toLowerCase().includes(query) ||
          action.description.toLowerCase().includes(query) ||
          action.folderPath.toLowerCase().includes(query)
      );
    }

    // Apply risk filters
    filtered = filtered.filter((action) => {
      if (!action.risk) return true;
      return riskFilters[action.risk];
    });

    setFilteredActions(filtered);
  };

  const toggleRiskFilter = (risk: 'Safe' | 'Write' | 'Dangerous') => {
    setRiskFilters((prev) => ({
      ...prev,
      [risk]: !prev[risk],
    }));
  };

  const handleActionClick = (actionId: string) => {
    navigate(`/collections/${collectionId}/actions/${actionId}`);
  };

  if (isLoading) {
    return (
      <div className="action-catalog-page">
        <p>Loading actions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="action-catalog-page">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  // Group actions by folder
  const groupedActions = new Map<string, Action[]>();
  filteredActions.forEach((action) => {
    const key = action.folderPath || 'Root';
    if (!groupedActions.has(key)) {
      groupedActions.set(key, []);
    }
    groupedActions.get(key)!.push(action);
  });

  return (
    <div className="action-catalog-page">
      <div className="catalog-header">
        <h2>Action Catalog</h2>
        <div className="catalog-stats">
          {filteredActions.length} of {actions.length} actions
        </div>
      </div>

      <div className="catalog-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="risk-filters">
          <label className="filter-label">Filter by Risk:</label>
          <div className="filter-checkboxes">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={riskFilters.Safe}
                onChange={() => toggleRiskFilter('Safe')}
              />
              <span className="risk-badge risk-safe">Safe</span>
            </label>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={riskFilters.Write}
                onChange={() => toggleRiskFilter('Write')}
              />
              <span className="risk-badge risk-write">Write</span>
            </label>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={riskFilters.Dangerous}
                onChange={() => toggleRiskFilter('Dangerous')}
              />
              <span className="risk-badge risk-dangerous">Dangerous</span>
            </label>
          </div>
        </div>
      </div>

      <div className="actions-list">
        {groupedActions.size === 0 ? (
          <div className="empty-actions">No actions found</div>
        ) : (
          Array.from(groupedActions.entries()).map(([folderPath, folderActions]) => (
            <div key={folderPath} className="folder-group">
              {folderPath && <h3 className="folder-header">{folderPath}</h3>}
              <div className="actions-grid">
                {folderActions.map((action) => (
                  <div
                    key={action.id}
                    className="action-card"
                    onClick={() => handleActionClick(action.id)}
                  >
                    <div className="action-card-header">
                      <h4 className="action-name">{action.name}</h4>
                      <span className={`method-badge method-${action.method.toLowerCase()}`}>
                        {action.method}
                      </span>
                    </div>
                    <p className="action-description">{action.description}</p>
                    <div className="action-meta">
                      {action.risk && (
                        <span className={`risk-badge risk-${action.risk.toLowerCase()}`}>
                          {action.risk}
                        </span>
                      )}
                      {action.hasScripts && (
                        <span className="script-badge" title="Contains scripts">
                          ⚠️ Scripts
                        </span>
                      )}
                      {action.totalVariablesCount > 0 && (
                        <span className="variables-badge">
                          {action.requiredVariablesCount}/{action.totalVariablesCount} variables
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ActionCatalogPage;
