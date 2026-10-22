import { AppUser } from "../components/admin/UserManagementView";
import {
  ROLE_ADMIN,
  ROLE_AGENT,
  ROLE_CHEF,
  ROLE_PRESTATAIRE,
  SessionRole,
  appUserDisplayName,
  sessionRoleFromAppRole,
} from "./userRoles";

/** Anciens e-mails de démo → fiche annuaire actuelle */
export const DEMO_EMAIL_ALIASES: Record<string, string> = {
  "chef@dirm-med.gouv.fr": "chef@dirm-med.gouv.fr",
  "agent@dirm-med.gouv.fr": "agent@dirm-med.gouv.fr",
  "marie.martin@example.com": "chef@dirm-med.gouv.fr",
  "pierre.leclerc@example.com": "agent@dirm-med.gouv.fr",
};

export const DEMO_LOGIN_ACCOUNTS = [
  {
    email: "admin@dirm-med.gouv.fr",
    password: "change-me",
    directoryEmail: "admin@dirm-med.gouv.fr",
  },
  {
    email: "chef@dirm-med.gouv.fr",
    password: "chef123",
    directoryEmail: "chef@dirm-med.gouv.fr",
  },
  {
    email: "agent@dirm-med.gouv.fr",
    password: "agent123",
    directoryEmail: "agent@dirm-med.gouv.fr",
  },
] as const;

export function resolveDirectoryEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const alias = DEMO_EMAIL_ALIASES[normalized];
  return alias ?? email;
}

export function resolveLinkedAppUser(
  adminUsers: AppUser[],
  currentUser: { id: string; email: string },
): AppUser | undefined {
  const lookupEmail = resolveDirectoryEmail(currentUser.email);
  const byEmail = adminUsers.find(
    (u) => u.email.toLowerCase() === lookupEmail.toLowerCase(),
  );
  if (byEmail) return byEmail;

  const byId = adminUsers.find((u) => u.id === currentUser.id);
  if (byId && byId.email.toLowerCase() === lookupEmail.toLowerCase()) {
    return byId;
  }

  return undefined;
}

export interface SessionUserSnapshot {
  id: string;
  email: string;
  name: string;
  role: SessionRole;
  service: string;
  domain?: string;
  location?: string;
}

export function directoryUserToSessionUser(
  adminUser: AppUser,
  roleOverride?: SessionRole,
): SessionUserSnapshot {
  return {
    id: adminUser.id,
    email: adminUser.email,
    name: appUserDisplayName(adminUser),
    role: roleOverride ?? sessionRoleFromAppRole(adminUser.role),
    service: adminUser.service,
    domain: adminUser.domain,
    location: adminUser.location,
  };
}

const DEMO_DIRECTORY_EMAIL_BY_ROLE: Partial<Record<SessionRole, string>> = {
  admin: "admin@dirm-med.gouv.fr",
  chef_service: "chef@dirm-med.gouv.fr",
  agent: "agent@dirm-med.gouv.fr",
};

export function findDemoDirectoryUser(
  adminUsers: AppUser[],
  sessionRole: SessionRole,
): AppUser | undefined {
  const preferredEmail = DEMO_DIRECTORY_EMAIL_BY_ROLE[sessionRole];
  if (preferredEmail) {
    const preferred = adminUsers.find(
      (u) => u.email.toLowerCase() === preferredEmail.toLowerCase(),
    );
    if (preferred) return preferred;
  }

  const roleCode =
    sessionRole === "admin"
      ? ROLE_ADMIN
      : sessionRole === "chef_service"
        ? ROLE_CHEF
        : sessionRole === "prestataire"
          ? ROLE_PRESTATAIRE
          : ROLE_AGENT;

  return adminUsers.find((u) => u.role === roleCode);
}

export function syncSessionWithDirectory(
  session: SessionUserSnapshot,
  adminUsers: AppUser[],
): SessionUserSnapshot {
  const linked = resolveLinkedAppUser(adminUsers, session);
  if (!linked) return session;

  return directoryUserToSessionUser(linked, session.role);
}

export function sessionUsersMatch(
  a: SessionUserSnapshot,
  b: SessionUserSnapshot,
): boolean {
  return (
    a.id === b.id &&
    a.email === b.email &&
    a.name === b.name &&
    a.role === b.role &&
    a.service === b.service &&
    (a.domain ?? "") === (b.domain ?? "") &&
    (a.location ?? "") === (b.location ?? "")
  );
}
