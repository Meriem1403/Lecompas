import { apiJson, setStoredAccessToken } from "@/lib/apiClient";

export interface ApiAuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  service: string;
  domain?: string;
  location?: string;
}

export interface LoginResponse {
  access_token: string;
  user: ApiAuthUser;
}

export async function loginWithApi(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const data = await apiJson<LoginResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setStoredAccessToken(data.access_token);
  return data;
}

export async function fetchProfile(
  token: string,
): Promise<ApiAuthUser | null> {
  try {
    const data = await apiJson<{ user: ApiAuthUser }>(
      "/profile",
      {},
      token,
    );
    return data.user ?? null;
  } catch {
    return null;
  }
}

export function mapApiRoleToSessionRole(
  role: string,
): "admin" | "chef_service" | "agent" | "prestataire" {
  switch (role) {
    case "admin":
      return "admin";
    case "chef_service":
      return "chef_service";
    case "prestataire":
      return "prestataire";
    default:
      return "agent";
  }
}
