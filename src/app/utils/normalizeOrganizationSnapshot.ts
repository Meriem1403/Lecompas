import type { OrganizationSnapshot } from "@/app/types/organization";

export function isOrganizationSnapshot(
  value: unknown,
): value is OrganizationSnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as OrganizationSnapshot;
  return (
    Array.isArray(v.services) &&
    Array.isArray(v.domains) &&
    Array.isArray(v.locations) &&
    Array.isArray(v.categories)
  );
}

export function normalizeOrganizationSnapshot(
  value: unknown,
  fallback: OrganizationSnapshot,
): OrganizationSnapshot {
  if (!isOrganizationSnapshot(value)) {
    return fallback;
  }
  return {
    ...value,
    services: value.services.map((service) => ({
      ...service,
      domains: Array.isArray(service.domains) ? service.domains : [],
      locations: Array.isArray(service.locations) ? service.locations : [],
    })),
  };
}
