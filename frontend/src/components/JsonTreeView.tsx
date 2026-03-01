import { useState } from 'react';
import './JsonTreeView.css';

const COLLAPSE_THRESHOLD = 10;

export interface JsonSelection {
  path: string;
  value: string | number | boolean;
}

interface JsonTreeViewProps {
  data: unknown;
  selectedPath: string | null;
  onSelect: (selection: JsonSelection | null) => void;
  defaultExpanded?: boolean;
}

function getValueType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value;
}

function pathJoin(parent: string, key: string | number): string {
  const keyStr = typeof key === 'number' ? `[${key}]` : parent === '' ? key : /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(String(key)) ? `.${key}` : `["${String(key).replace(/"/g, '\\"')}"]`;
  return parent === '' ? (typeof key === 'number' ? keyStr : key) : parent + keyStr;
}

interface NodeProps {
  path: string;
  keyLabel: string | number;
  value: unknown;
  selectedPath: string | null;
  onSelect: (selection: JsonSelection | null) => void;
  depth: number;
  defaultCollapsed: boolean;
}

function JsonNode({ path, keyLabel, value, selectedPath, onSelect, depth, defaultCollapsed }: NodeProps) {
  const isArray = Array.isArray(value);
  const entries = isArray ? (value as unknown[]).map((v, i) => ({ key: i, value: v })) : Object.entries(value as object).map(([k, v]) => ({ key: k, value: v }));
  const shouldDefaultCollapse = defaultCollapsed || entries.length > COLLAPSE_THRESHOLD;
  const [collapsed, setCollapsed] = useState(shouldDefaultCollapse);
  const [hovered, setHovered] = useState(false);
  const type = getValueType(value);
  const isPrimitive = type === 'string' || type === 'number' || type === 'boolean' || type === 'null';
  const isSelected = selectedPath === path;

  const handlePrimitiveClick = () => {
    if (isPrimitive) {
      const raw = value as string | number | boolean | null;
      onSelect(raw === null ? { path, value: '' } : { path, value: raw });
    }
  };

  if (isPrimitive) {
    const displayValue = value === null ? 'null' : String(value);
    const truncated = typeof value === 'string' && value.length > 80 ? value.slice(0, 80) + '…' : displayValue;
    return (
      <div
        className={`json-tree-node json-tree-leaf ${isSelected ? 'json-tree-node--selected' : ''}`}
        style={{ paddingLeft: depth * 16 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handlePrimitiveClick}
        title={path}
      >
        <span className="json-tree-key">{keyLabel}:</span>{' '}
        <span className={`json-tree-value json-tree-value--${type}`}>{truncated}</span>
        {hovered && <span className="json-tree-path">{path}</span>}
      </div>
    );
  }

  return (
    <div
      className="json-tree-node json-tree-branch"
      style={{ paddingLeft: depth * 16 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="json-tree-branch-header"
        onClick={() => setCollapsed((c) => !c)}
        title={path}
      >
        <span className="json-tree-toggle">{collapsed ? '▶' : '▼'}</span>
        <span className="json-tree-key">{keyLabel}</span>
        <span className="json-tree-bracket">
          {isArray ? `[${entries.length}]` : `{${entries.length}}`}
        </span>
        {hovered && <span className="json-tree-path">{path || (isArray ? '[]' : '{}')}</span>}
      </div>
      {!collapsed && (
        <div className="json-tree-children">
          {entries.map(({ key: k, value: v }) => (
            <JsonNode
              key={String(k)}
              path={pathJoin(path, k)}
              keyLabel={k}
              value={v}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={depth + 1}
              defaultCollapsed={Array.isArray(v) ? (v as unknown[]).length > COLLAPSE_THRESHOLD : typeof v === 'object' && v !== null && Object.keys(v as object).length > COLLAPSE_THRESHOLD}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function JsonTreeView({ data, selectedPath, onSelect, defaultExpanded = true }: JsonTreeViewProps) {
  const rootDefaultCollapsed = !defaultExpanded || (Array.isArray(data) ? (data as unknown[]).length > COLLAPSE_THRESHOLD : typeof data === 'object' && data !== null && Object.keys(data as object).length > COLLAPSE_THRESHOLD);

  if (Array.isArray(data)) {
    return (
      <div className="json-tree-view">
        <div className="json-tree-branch">
          <div className="json-tree-branch-header" onClick={() => {}}>
            <span className="json-tree-bracket">[{(data as unknown[]).length} items]</span>
          </div>
          <div className="json-tree-children">
            {(data as unknown[]).map((item, i) => (
              <JsonNode
                key={i}
                path={`[${i}]`}
                keyLabel={i}
                value={item}
                selectedPath={selectedPath}
                onSelect={onSelect}
                depth={1}
                defaultCollapsed={Array.isArray(item) ? item.length > COLLAPSE_THRESHOLD : typeof item === 'object' && item !== null && Object.keys(item as object).length > COLLAPSE_THRESHOLD}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data !== null && typeof data === 'object') {
    return (
      <div className="json-tree-view">
        {Object.entries(data as object).map(([k, v]) => (
          <JsonNode
            key={k}
            path={k}
            keyLabel={k}
            value={v}
            selectedPath={selectedPath}
            onSelect={onSelect}
            depth={0}
            defaultCollapsed={rootDefaultCollapsed}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="json-tree-view">
      <JsonNode
        path=""
        keyLabel=""
        value={data}
        selectedPath={selectedPath}
        onSelect={onSelect}
        depth={0}
        defaultCollapsed={false}
      />
    </div>
  );
}
