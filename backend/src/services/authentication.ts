import type { Variable } from '../types';
import { decryptSecret } from './encryption';

export interface AuthConfig {
  type: 'bearer' | 'apikey' | 'basic' | 'none';
  token?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  username?: string;
  password?: string;
}

/**
 * Detects and extracts authentication from Variable Wallet
 */
export class AuthenticationDetector {
  /**
   * Detects authentication type and extracts credentials from variables
   */
  static detectAuth(variables: Variable[]): AuthConfig;
  static detectAuth(variableMap: Map<string, string>): AuthConfig;
  static detectAuth(variablesOrMap: Variable[] | Map<string, string>): AuthConfig {
    let variableMap: Map<string, string>;
    
    if (variablesOrMap instanceof Map) {
      // Already a map of string values
      variableMap = new Map();
      for (const [key, value] of variablesOrMap.entries()) {
        variableMap.set(key.toLowerCase(), value);
      }
    } else {
      // Array of Variable objects - convert to map
      variableMap = new Map<string, string>();
      for (const variable of variablesOrMap) {
        let value = variable.value;
        if (variable.isSecret) {
          try {
            value = decryptSecret(value);
          } catch (error) {
            console.error(`Error decrypting variable ${variable.name}:`, error);
            continue;
          }
        }
        variableMap.set(variable.name.toLowerCase(), value);
      }
    }

    // Check for Bearer token
    const bearerToken = this.findBearerTokenFromMap(variableMap);
    if (bearerToken) {
      return {
        type: 'bearer',
        token: bearerToken,
      };
    }

    // Check for API key
    const apiKey = this.findApiKeyFromMap(variableMap);
    if (apiKey) {
      return {
        type: 'apikey',
        apiKey: apiKey.value,
        apiKeyHeader: this.determineApiKeyHeader(apiKey.name),
      };
    }

    // Check for Basic auth
    const basicAuth = this.findBasicAuthFromMap(variableMap);
    if (basicAuth) {
      return {
        type: 'basic',
        username: basicAuth.username,
        password: basicAuth.password,
      };
    }

    return { type: 'none' };
  }

  /**
   * Finds Bearer token variable from Variable objects
   */
  private static findBearerToken(variableMap: Map<string, Variable>): string | null {
    const patterns = ['token', 'bearer', 'access_token', 'accesstoken', 'auth_token', 'authtoken'];
    
    for (const pattern of patterns) {
      const variable = variableMap.get(pattern);
      if (variable) {
        // Decrypt if secret
        if (variable.isSecret) {
          try {
            return decryptSecret(variable.value);
          } catch (error) {
            console.error('Error decrypting bearer token:', error);
            return null;
          }
        }
        return variable.value;
      }
    }

    return null;
  }

  /**
   * Finds Bearer token from string map
   */
  private static findBearerTokenFromMap(variableMap: Map<string, string>): string | null {
    const patterns = ['token', 'bearer', 'access_token', 'accesstoken', 'auth_token', 'authtoken'];
    
    for (const pattern of patterns) {
      const value = variableMap.get(pattern);
      if (value) {
        return value;
      }
    }

    return null;
  }

  /**
   * Finds API key variable from Variable objects
   */
  private static findApiKey(variableMap: Map<string, Variable>): Variable | null {
    const patterns = ['apikey', 'api_key', 'api-key', 'key'];
    
    for (const pattern of patterns) {
      const variable = variableMap.get(pattern);
      if (variable) {
        return variable;
      }
    }

    return null;
  }

  /**
   * Finds API key from string map
   */
  private static findApiKeyFromMap(variableMap: Map<string, string>): { name: string; value: string } | null {
    const patterns = ['apikey', 'api_key', 'api-key', 'key'];
    
    for (const pattern of patterns) {
      const value = variableMap.get(pattern);
      if (value) {
        return { name: pattern, value };
      }
    }

    return null;
  }

  /**
   * Determines API key header name based on variable name
   */
  private static determineApiKeyHeader(variableName: string): string {
    const lower = variableName.toLowerCase();
    
    // Check for specific header patterns
    if (lower.includes('x-api')) {
      return 'X-API-Key';
    }
    if (lower.includes('authorization')) {
      return 'Authorization';
    }
    
    // Default to X-API-Key
    return 'X-API-Key';
  }

  /**
   * Finds Basic auth credentials from Variable objects
   */
  private static findBasicAuth(
    variableMap: Map<string, Variable>
  ): { username: string; password: string } | null {
    const usernamePatterns = ['username', 'user', 'user_name', 'username'];
    const passwordPatterns = ['password', 'pass', 'pwd'];

    let username: string | null = null;
    let password: string | null = null;

    for (const pattern of usernamePatterns) {
      const variable = variableMap.get(pattern);
      if (variable) {
        username = variable.value;
        break;
      }
    }

    for (const pattern of passwordPatterns) {
      const variable = variableMap.get(pattern);
      if (variable) {
        if (variable.isSecret) {
          try {
            password = decryptSecret(variable.value);
          } catch (error) {
            console.error('Error decrypting password:', error);
            return null;
          }
        } else {
          password = variable.value;
        }
        break;
      }
    }

    if (username && password) {
      return { username, password };
    }

    return null;
  }

  /**
   * Finds Basic auth credentials from string map
   */
  private static findBasicAuthFromMap(
    variableMap: Map<string, string>
  ): { username: string; password: string } | null {
    const usernamePatterns = ['username', 'user', 'user_name', 'username'];
    const passwordPatterns = ['password', 'pass', 'pwd'];

    let username: string | null = null;
    let password: string | null = null;

    for (const pattern of usernamePatterns) {
      const value = variableMap.get(pattern);
      if (value) {
        username = value;
        break;
      }
    }

    for (const pattern of passwordPatterns) {
      const value = variableMap.get(pattern);
      if (value) {
        password = value;
        break;
      }
    }

    if (username && password) {
      return { username, password };
    }

    return null;
  }

  /**
   * Applies authentication to headers
   */
  static applyAuth(headers: Array<{ key: string; value: string }>, auth: AuthConfig): Array<{ key: string; value: string }> {
    const result = [...headers];

    // Remove existing Authorization header if present
    const authIndex = result.findIndex((h) => h.key.toLowerCase() === 'authorization');
    if (authIndex >= 0) {
      result.splice(authIndex, 1);
    }

    // Apply new authentication
    if (auth.type === 'bearer' && auth.token) {
      result.push({ key: 'Authorization', value: `Bearer ${auth.token}` });
    } else if (auth.type === 'apikey' && auth.apiKey && auth.apiKeyHeader) {
      if (auth.apiKeyHeader === 'Authorization') {
        result.push({ key: 'Authorization', value: `ApiKey ${auth.apiKey}` });
      } else {
        result.push({ key: auth.apiKeyHeader, value: auth.apiKey });
      }
    } else if (auth.type === 'basic' && auth.username && auth.password) {
      const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
      result.push({ key: 'Authorization', value: `Basic ${credentials}` });
    }

    return result;
  }
}
