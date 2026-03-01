import type { ResolvedRequest } from './requestResolver';

const MASK = '***MASKED***';

/**
 * Masks secret values in a resolved request (headers and body).
 * Preserves structure and formatting; replaces any occurrence of a secret value with ***MASKED***.
 */
export function maskSecrets(
  request: ResolvedRequest,
  secrets: string[]
): ResolvedRequest {
  const filteredSecrets = secrets.filter((s) => s != null && String(s).length > 0);
  if (filteredSecrets.length === 0) {
    return request;
  }

  const maskValue = (value: string): string => {
    let out = value;
    for (const secret of filteredSecrets) {
      if (secret && out.includes(secret)) {
        out = out.split(secret).join(MASK);
      }
    }
    return out;
  };

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(request.headers)) {
    headers[key] = maskValue(value);
  }

  const body = request.body ? maskValue(request.body) : null;

  return {
    method: request.method,
    url: request.url,
    headers,
    body,
  };
}
