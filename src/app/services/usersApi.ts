import { apiJson } from "@/lib/apiClient";
import type { AppUser } from "@/app/components/admin/UserManagementView";

export interface ApiUserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  service: string;
  domain?: string;
  location?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  category?: string;
  inm?: number | null;
  createdAt?: string;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function mapApiUserToAppUser(record: ApiUserRecord): AppUser {
  const fromName = splitName(record.name || "");
  return {
    id: record.id,
    email: record.email,
    firstName: record.firstName || fromName.firstName,
    lastName: record.lastName || fromName.lastName,
    position: record.position || "",
    service: record.service || "",
    domain: record.domain || "",
    location: record.location || "",
    category: record.category || "",
    role: record.role || "agent",
    inm: record.inm ?? undefined,
    createdAt: record.createdAt || new Date().toISOString(),
    createdBy: "",
  };
}

function mapAppUserToApiBody(user: AppUser, includePassword?: string) {
  const body: Record<string, unknown> = {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim() || user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    service: user.service,
    domain: user.domain,
    location: user.location,
    position: user.position,
    category: user.category,
    inm: user.inm ?? null,
  };
  const password = includePassword ?? user.password;
  if (password) body.password = password;
  return body;
}

export async function fetchAdminUsers(token?: string): Promise<AppUser[]> {
  const data = await apiJson<{ users: ApiUserRecord[] }>("/users", {}, token);
  return (data.users ?? []).map(mapApiUserToAppUser);
}

export async function createAdminUser(
  user: AppUser,
  token?: string,
): Promise<AppUser> {
  const data = await apiJson<{ user: ApiUserRecord }>(
    "/users",
    {
      method: "POST",
      body: JSON.stringify(mapAppUserToApiBody(user, user.password)),
    },
    token,
  );
  return mapApiUserToAppUser(data.user);
}

export async function updateAdminUser(
  user: AppUser,
  token?: string,
): Promise<AppUser> {
  const data = await apiJson<{ user: ApiUserRecord }>(
    `/users/${encodeURIComponent(user.id)}`,
    {
      method: "PUT",
      body: JSON.stringify(mapAppUserToApiBody(user, user.password)),
    },
    token,
  );
  return mapApiUserToAppUser(data.user);
}

export async function deleteAdminUser(id: string, token?: string): Promise<void> {
  await apiJson<{ success: boolean }>(
    `/users/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    token,
  );
}

/** Réconcilie la liste locale avec le serveur (admin). */
export async function syncAdminUsersToApi(
  users: AppUser[],
  token?: string,
): Promise<void> {
  const serverUsers = await fetchAdminUsers(token);
  const serverIds = new Set(serverUsers.map((u) => u.id));
  const localIds = new Set(users.map((u) => u.id));

  for (const user of users) {
    if (serverIds.has(user.id)) {
      await updateAdminUser(user, token);
    } else {
      await createAdminUser(user, token);
    }
  }

  for (const serverUser of serverUsers) {
    if (!localIds.has(serverUser.id)) {
      await deleteAdminUser(serverUser.id, token);
    }
  }
}
