import type { AppUser } from '@/app/components/admin/UserManagementView';
import type { MedicalVisit } from '../MedicalVisitsView';

export function normalizePersonName(value: string): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Résout l'utilisateur annuaire correspondant à une fiche (employeeId ou correspondance nom/prénom). */
export function resolveEmployeeForVisit(
  users: AppUser[],
  visit?: MedicalVisit,
): AppUser | undefined {
  if (!visit) return undefined;
  if (visit.employeeId) {
    return users.find((u) => u.id === visit.employeeId);
  }
  const nn = normalizePersonName(visit.nom);
  const pn = normalizePersonName(visit.prenom);
  return users.find(
    (u) =>
      normalizePersonName(u.lastName) === nn &&
      normalizePersonName(u.firstName) === pn,
  );
}

export function sortUsersForSelect(users: AppUser[]): AppUser[] {
  return [...users].sort((a, b) => {
    const ln = a.lastName.localeCompare(b.lastName, 'fr');
    if (ln !== 0) return ln;
    return a.firstName.localeCompare(b.firstName, 'fr');
  });
}
