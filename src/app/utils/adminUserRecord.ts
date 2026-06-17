import { AppUser } from "../components/admin/UserManagementView";

const ADMIN_USERS_KEY = "lecompas_admin_users";

export function loadAdminUsers(defaultUsers: AppUser[]): AppUser[] {
  try {
    const raw = localStorage.getItem(ADMIN_USERS_KEY);
    if (!raw) return defaultUsers;
    const parsed = JSON.parse(raw) as AppUser[];
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultUsers;
    return parsed;
  } catch {
    return defaultUsers;
  }
}

export function saveAdminUsers(users: AppUser[]): void {
  localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
}
