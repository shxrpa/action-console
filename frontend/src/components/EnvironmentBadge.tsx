import type { Environment } from '../types';
import './EnvironmentBadge.css';

interface EnvironmentBadgeProps {
  environment: Environment | null;
}

function getVariant(name: string): 'sandbox' | 'production' | 'other' {
  const lower = name.toLowerCase();
  if (lower.includes('sandbox') || lower.includes('dev') || lower.includes('development') || lower.includes('staging') || lower.includes('test')) {
    return 'sandbox';
  }
  if (lower.includes('prod') || lower.includes('production') || lower.includes('live')) {
    return 'production';
  }
  return 'other';
}

export function EnvironmentBadge({ environment }: EnvironmentBadgeProps) {
  if (!environment) {
    return (
      <span className="environment-badge environment-badge--none" title="No environment selected">
        No environment
      </span>
    );
  }
  const variant = getVariant(environment.name);
  return (
    <span
      className={`environment-badge environment-badge--${variant}`}
      title={environment.name}
    >
      {environment.name}
    </span>
  );
}
