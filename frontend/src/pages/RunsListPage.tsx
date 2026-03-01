import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  listRuns,
  listEnvironments,
  fetchActionsForWorkspace,
  type Run,
  type Action,
} from '../services/api';
import type { Environment } from '../types';
import { WorkspaceContext } from '../contexts/WorkspaceContext';
import './RunsListPage.css';

type SortKey = 'timestamp' | 'actionName' | 'success' | 'executionDuration';
type SortOrder = 'asc' | 'desc';

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function RunsListPage() {
  const context = useContext(WorkspaceContext);
  const workspaceId = context?.selectedWorkspaceId ?? null;
  const navigate = useNavigate();

  const [runs, setRuns] = useState<Run[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [sort, setSort] = useState<SortKey>('timestamp');
  const [order, setOrder] = useState<SortOrder>('desc');
  const [filterActionId, setFilterActionId] = useState<string>('');
  const [filterEnvironmentId, setFilterEnvironmentId] = useState<string>('');
  const [filterSuccess, setFilterSuccess] = useState<'all' | 'success' | 'failure'>('all');
  const [actions, setActions] = useState<Action[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listRuns({
        workspaceId,
        page,
        limit,
        sort,
        order,
        actionId: filterActionId || undefined,
        environmentId: filterEnvironmentId || undefined,
        success: filterSuccess === 'all' ? undefined : filterSuccess === 'success',
      });
      setRuns(result.runs);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, page, limit, sort, order, filterActionId, filterEnvironmentId, filterSuccess]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    if (!workspaceId) return;
    Promise.all([fetchActionsForWorkspace(workspaceId), listEnvironments(workspaceId)])
      .then(([a, e]) => {
        setActions(a);
        setEnvironments(e);
      })
      .catch(() => {});
  }, [workspaceId]);

  const handleSort = (key: SortKey) => {
    if (sort === key) {
      setOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
    } else {
      setSort(key);
      setOrder('desc');
    }
    setPage(1);
  };

  const sortIndicator = (key: SortKey) => {
    if (sort !== key) return null;
    return order === 'desc' ? ' ↓' : ' ↑';
  };

  const clearFilter = (which: 'action' | 'environment' | 'outcome') => {
    if (which === 'action') setFilterActionId('');
    if (which === 'environment') setFilterEnvironmentId('');
    if (which === 'outcome') setFilterSuccess('all');
    setPage(1);
  };

  const hasFilters = filterActionId || filterEnvironmentId || filterSuccess !== 'all';

  const listRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: runs.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 44,
    overscan: 5,
  });

  if (!workspaceId) {
    return (
      <div className="runs-list-page">
        <p>Please select a workspace to view run history.</p>
      </div>
    );
  }

  return (
    <div className="runs-list-page">
      <h2>Run History</h2>

      <div className="runs-filters">
        <label>
          Action
          <select
            value={filterActionId}
            onChange={(e) => {
              setFilterActionId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Environment
          <select
            value={filterEnvironmentId}
            onChange={(e) => {
              setFilterEnvironmentId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All environments</option>
            {environments.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Outcome
          <select
            value={filterSuccess}
            onChange={(e) => {
              setFilterSuccess(e.target.value as 'all' | 'success' | 'failure');
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </label>
        {hasFilters && (
          <button type="button" className="btn-clear-filters" onClick={() => { setFilterActionId(''); setFilterEnvironmentId(''); setFilterSuccess('all'); setPage(1); }}>
            Clear filters
          </button>
        )}
      </div>

      {hasFilters && (
        <div className="runs-filter-badges">
          {filterActionId && (
            <span className="filter-badge">
              Action: {actions.find((a) => a.id === filterActionId)?.name ?? filterActionId}
              <button type="button" aria-label="Remove filter" onClick={() => clearFilter('action')}>×</button>
            </span>
          )}
          {filterEnvironmentId && (
            <span className="filter-badge">
              Env: {environments.find((e) => e.id === filterEnvironmentId)?.name ?? filterEnvironmentId}
              <button type="button" aria-label="Remove filter" onClick={() => clearFilter('environment')}>×</button>
            </span>
          )}
          {filterSuccess !== 'all' && (
            <span className="filter-badge">
              {filterSuccess === 'success' ? 'Success' : 'Failure'}
              <button type="button" aria-label="Remove filter" onClick={() => clearFilter('outcome')}>×</button>
            </span>
          )}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p>Loading runs...</p>
      ) : (
        <>
          <div ref={listRef} className="runs-table-scroll">
            <div className="runs-table runs-table-header">
              <div>
                <button type="button" className="th-sort" onClick={() => handleSort('timestamp')}>
                  Timestamp{sortIndicator('timestamp')}
                </button>
              </div>
              <div>
                <button type="button" className="th-sort" onClick={() => handleSort('actionName')}>
                  Action{sortIndicator('actionName')}
                </button>
              </div>
              <div>Environment</div>
              <div>
                <button type="button" className="th-sort" onClick={() => handleSort('success')}>
                  Status{sortIndicator('success')}
                </button>
              </div>
              <div>
                <button type="button" className="th-sort" onClick={() => handleSort('executionDuration')}>
                  Duration{sortIndicator('executionDuration')}
                </button>
              </div>
              <div />
            </div>
            {runs.length === 0 ? (
              <div className="runs-table-empty">No runs found.</div>
            ) : (
              <div
                className="runs-table-body"
                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const run = runs[virtualRow.index];
                  return (
                    <div
                      key={run.id}
                      className="runs-table runs-table-row"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <div>{formatTimestamp(run.timestamp)}</div>
                      <div>
                        {run.collectionId ? (
                          <Link to={`/collections/${run.collectionId}/actions/${run.actionId}`}>
                            {run.actionName}
                          </Link>
                        ) : (
                          run.actionName
                        )}
                      </div>
                      <div><span className="env-badge">{run.environmentName}</span></div>
                      <div>
                        <span className={`status-badge ${run.success ? 'success' : 'error'}`}>
                          {run.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      <div>{formatDuration(run.executionDuration)}</div>
                      <div>
                        <button type="button" className="btn-link" onClick={() => navigate(`/runs/${run.id}`)}>
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="runs-pagination">
            <span>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div>
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <button type="button" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
