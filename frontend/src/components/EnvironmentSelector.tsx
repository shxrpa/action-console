import { useEnvironment } from '../contexts/EnvironmentContext';
import './EnvironmentSelector.css';

export function EnvironmentSelector() {
  const { selectedEnvironmentId, setSelectedEnvironmentId, environments, loading } = useEnvironment();

  if (loading || environments.length === 0) {
    return null;
  }

  return (
    <div className="environment-selector">
      <label htmlFor="environment-select">Environment:</label>
      <select
        id="environment-select"
        value={selectedEnvironmentId || ''}
        onChange={(e) => setSelectedEnvironmentId(e.target.value || null)}
      >
        {environments.map((env) => (
          <option key={env.id} value={env.id}>
            {env.name}
          </option>
        ))}
      </select>
    </div>
  );
}
