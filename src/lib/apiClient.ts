import { API_BASE } from "@/lib/supabase";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const TOKEN_KEY = "duerp_token";

export function getStoredAccessToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAccessToken(token: string | null): void {
  if (typeof localStorage === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function isApiAccessToken(token: string): boolean {
  return token.length > 0 && !token.startsWith("token-");
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<Response> {
  const authToken = token ?? getStoredAccessToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (authToken && isApiAccessToken(authToken)) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  return fetch(url, { ...options, headers });
}

export async function apiJson<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const response = await apiFetch(path, options, token);
  let body: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : `Erreur API (${response.status})`;
    throw new ApiError(message, response.status, body);
  }
  return body as T;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const data = await apiJson<{ status?: string }>("/health");
    return data.status === "ok";
  } catch {
    return false;
  }
}
