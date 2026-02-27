import './FriendlyResponseView.css';

function toLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toLocaleString();
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    try {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) return d.toLocaleString();
    } catch {
      /* use as-is */
    }
  }
  return String(value);
}

function isPrimitive(value: unknown): value is string | number | boolean | null {
  return value === null || typeof value !== 'object';
}

interface FriendlyBlockProps {
  data: unknown;
  depth?: number;
}

function FriendlyBlock({ data, depth = 0 }: FriendlyBlockProps) {
  if (data === null || data === undefined) {
    return <span className="friendly-value friendly-value--empty">—</span>;
  }

  if (typeof data === 'boolean') {
    return (
      <span className={`friendly-value friendly-value--boolean friendly-value--${data ? 'true' : 'false'}`}>
        {data ? 'Yes' : 'No'}
      </span>
    );
  }

  if (typeof data === 'number') {
    return <span className="friendly-value friendly-value--number">{formatValue(data)}</span>;
  }

  if (typeof data === 'string') {
    const isLong = data.length > 200;
    const display = isLong ? data.slice(0, 200) + '…' : data;
    return (
      <span className="friendly-value friendly-value--string" title={isLong ? data : undefined}>
        {display}
      </span>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="friendly-value friendly-value--empty">No items</span>;
    }
    const allPrimitive = data.every(isPrimitive);
    if (allPrimitive && data.length <= 10) {
      return (
        <ul className="friendly-list friendly-list--inline">
          {data.map((item, i) => (
            <li key={i} className="friendly-list-item">
              {formatValue(item)}
            </li>
          ))}
        </ul>
      );
    }
    if (data.length > 8) {
      return (
        <div className="friendly-cards">
          {data.slice(0, 8).map((item, i) => (
            <div key={i} className="friendly-card">
              <FriendlyBlock data={item} depth={depth + 1} />
            </div>
          ))}
          <p className="friendly-more">+ {data.length - 8} more items</p>
        </div>
      );
    }
    return (
      <div className="friendly-cards">
        {data.map((item, i) => (
          <div key={i} className="friendly-card">
            {typeof item === 'object' && item !== null && !Array.isArray(item) ? (
              <FriendlyBlock data={item} depth={depth + 1} />
            ) : (
              formatValue(item)
            )}
          </div>
        ))}
      </div>
    );
  }

  if (typeof data === 'object') {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    if (entries.length === 0) {
      return <span className="friendly-value friendly-value--empty">—</span>;
    }
    return (
      <dl className="friendly-dl">
        {entries.map(([key, value]) => (
          <div key={key} className="friendly-row">
            <dt className="friendly-dt">{toLabel(key)}</dt>
            <dd className="friendly-dd">
              {isPrimitive(value) ? (
                formatValue(value)
              ) : (
                <FriendlyBlock data={value} depth={depth + 1} />
              )}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <span className="friendly-value">{String(data)}</span>;
}

interface FriendlyResponseViewProps {
  data: unknown;
}

export function FriendlyResponseView({ data }: FriendlyResponseViewProps) {
  if (data === null || data === undefined) {
    return (
      <div className="friendly-response-view">
        <p className="friendly-empty">No content</p>
      </div>
    );
  }

  if (Array.isArray(data)) {
    return (
      <div className="friendly-response-view">
        <p className="friendly-summary">{data.length} item{data.length === 1 ? '' : 's'}</p>
        <div className="friendly-root">
          <FriendlyBlock data={data} depth={0} />
        </div>
      </div>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    return (
      <div className="friendly-response-view">
        <div className="friendly-root">
          <FriendlyBlock data={data} depth={0} />
        </div>
      </div>
    );
  }

  return (
    <div className="friendly-response-view">
      <div className="friendly-root">
        <span className="friendly-value">{formatValue(data)}</span>
      </div>
    </div>
  );
}
