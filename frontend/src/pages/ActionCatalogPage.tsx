import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Action {
  id: string;
  name: string;
  description: string;
  method: string;
  url: string;
  risk: 'Safe' | 'Write' | 'Dangerous';
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

  const MAX_ACTION_NAME_LENGTH = 56;
  const truncateName = (name: string) =>
    name.length > MAX_ACTION_NAME_LENGTH ? `${name.slice(0, MAX_ACTION_NAME_LENGTH)}…` : name;

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

  // Group actions by folder, then flatten for virtualization (header row + action rows)
  const groupedActions = useMemo(() => {
    const map = new Map<string, Action[]>();
    filteredActions.forEach((action) => {
      const key = action.folderPath || 'Root';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(action);
    });
    return map;
  }, [filteredActions]);

  type CatalogRow = { type: 'header'; folderPath: string } | { type: 'action'; action: Action };
  const catalogRows = useMemo((): CatalogRow[] => {
    const rows: CatalogRow[] = [];
    Array.from(groupedActions.entries()).forEach(([folderPath, folderActions]) => {
      rows.push({ type: 'header', folderPath });
      folderActions.forEach((action) => rows.push({ type: 'action', action }));
    });
    return rows;
  }, [groupedActions]);

  const listRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: catalogRows.length,
    getScrollElement: () => listRef.current,
    estimateSize: (index) => (catalogRows[index]?.type === 'header' ? 44 : 110),
    overscan: 5,
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

      <div
        ref={listRef}
        className="actions-list actions-list-virtual"
        style={{ maxHeight: '65vh', overflow: 'auto' }}
      >
        {groupedActions.size === 0 ? (
          <div className="empty-actions">
            {actions.length === 0
              ? 'This collection has no requests. Add requests in Postman and re-export, or import a different collection.'
              : 'No actions match your filters.'}
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = catalogRows[virtualRow.index];
              if (!row) return null;
              if (row.type === 'header') {
                return (
                  <div
                    key={`header-${row.folderPath}`}
                    className="folder-header-virtual"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <h3 className="folder-header">{row.folderPath || 'Root'}</h3>
                  </div>
                );
              }
              const action = row.action;
              return (
                <div
                  key={action.id}
                  className="action-card action-card-virtual"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => handleActionClick(action.id)}
                >
                  <div className="action-card-header">
                    <h4 className="action-name" title={action.name}>
                      {truncateName(action.name)}
                    </h4>
                    <span className={`method-badge method-${action.method.toLowerCase()}`}>
                      {action.method}
                    </span>
                  </div>
                  <p className="action-description">{action.description}</p>
                  <div className="action-meta">
                    <span className={`risk-badge risk-${action.risk.toLowerCase()}`}>
                      {action.risk}
                    </span>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActionCatalogPage;
