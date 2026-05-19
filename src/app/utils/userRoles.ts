import { AppUser } from "../components/admin/UserManagementView";

export const ROLE_ADMIN = "ROLE_ADMIN";
export const ROLE_CHEF = "ROLE_CHEF";
export const ROLE_AGENT = "ROLE_AGENT";
export const ROLE_PRESTATAIRE = "ROLE_PRESTATAIRE";

export type SessionRole = "admin" | "chef_service" | "agent" | "prestataire";

export function isPrestataireUser(user: AppUser): boolean {
  return user.role === ROLE_PRESTATAIRE;
}

export function sessionRoleFromAppRole(appRole: string): SessionRole {
  switch (appRole) {
    case ROLE_ADMIN:
      return "admin";
    case ROLE_CHEF:
      return "chef_service";
    case ROLE_PRESTATAIRE:
      return "prestataire";
    default:
      return "agent";
  }
}

export function appUserDisplayName(user: AppUser): string {
  if (isPrestataireUser(user)) {
    return user.lastName || `${user.firstName} ${user.lastName}`.trim();
  }
  return `${user.firstName} ${user.lastName}`.trim();
}

export interface MealProviderIdentity {
  id: string;
  name: string;
  email: string;
  location?: string;
}

export function appUserToMealProvider(user: AppUser): MealProviderIdentity {
  return {
    id: user.id,
    name: appUserDisplayName(user),
    email: user.email,
    location: user.location || undefined,
  };
}

export function resolvePrestataireByEmail(
  users: AppUser[],
  email: string,
): AppUser | undefined {
  return users.find(
    (u) =>
      isPrestataireUser(u) &&
      u.email.toLowerCase() === email.toLowerCase(),
  );
}

export function isAgentUser(user: AppUser): boolean {
  return user.role === ROLE_AGENT;
}

export function isChefUser(user: AppUser): boolean {
  return user.role === ROLE_CHEF;
}

/** Agents et chefs de service peuvent recevoir un ticket repas */
export function isMealTicketRecipient(user: AppUser): boolean {
  const role = (user.role ?? "").trim();
  return role === ROLE_AGENT || role === ROLE_CHEF;
}

export function mealTicketRecipientRoleLabel(role: string): string {
  if (role === ROLE_CHEF) return "Chef de service";
  if (role === ROLE_AGENT) return "Agent";
  return role;
}
