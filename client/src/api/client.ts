/**
 * Typed API client for the ALU Hub backend.
 *
 * The frontend knows nothing about backend internals — it only speaks
 * HTTP/JSON to this CORS-guarded surface. Access tokens are kept in
 * memory; the refresh token lives in an httpOnly cookie set by the
 * server. On a 401 the client transparently rotates tokens and retries.
 */

interface AluHubEnv {
  API_URL?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

const API_URL =
  (window as unknown as { __ALUHUB_ENV?: AluHubEnv }).__ALUHUB_ENV?.API_URL ??
  'http://localhost:4000';

export interface SessionUser {
  id: string;
  email: string;
  role: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });

  if (response.status === 401 && retry && path !== '/api/auth/refresh') {
    if (await rotateTokens()) {
      return request<T>(path, init, false);
    }
  }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error((data.error as string) ?? response.statusText);
  }
  return data as T;
}

async function rotateTokens(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      accessToken = null;
      return false;
    }
    const data = (await response.json()) as AuthResponse;
    accessToken = data.accessToken;
    return true;
  } catch {
    accessToken = null;
    return false;
  }
}

export const api = {
  async register(email: string, password: string): Promise<AuthResponse> {
    const result = await request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    accessToken = result.accessToken;
    return result;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    accessToken = result.accessToken;
    return result;
  },

  async logout(): Promise<void> {
    await request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
    accessToken = null;
  },

  me(): Promise<{ user: SessionUser }> {
    return request<{ user: SessionUser }>('/api/auth/me');
  },
};
