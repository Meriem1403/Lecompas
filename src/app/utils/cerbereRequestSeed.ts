import type { AppUser } from "@/app/components/admin/UserManagementView";

export interface CerbereRequestSeed {
  id: string;
  agentConcerne: string;
  demandeur: string;
  applications: string[];
  profils: string[];
  reglePortee: string;
  restrictions: string;
  soumiseLe: string;
  statut:
    | "en_attente_chef"
    | "en_attente_admin"
    | "validee"
    | "refusee";
  valideePar?: string;
  dateValidation?: string;
  chefValidationPar?: string;
  chefValidationLe?: string;
  justification?: string;
}

export function buildCerbereRequestSeed(
  usersData: AppUser[],
  currentUserName: string,
  currentUserRole: "admin" | "chef_service" | "agent",
  currentUserService?: string,
): CerbereRequestSeed[] {
  const normalize = (value?: string) => (value || "").trim().toLowerCase();
  const fullName = (u: AppUser) => `${u.firstName} ${u.lastName}`.trim();
  const currentUserData =
    usersData.find(
      (u) => normalize(fullName(u)) === normalize(currentUserName),
    ) || null;
  const users = usersData.length > 0 ? usersData : [];
  if (users.length === 0) {
    return [
      {
        id: "fx-fallback",
        agentConcerne: currentUserName,
        demandeur: currentUserName,
        applications: ["CHORUS"],
        profils: ["CHORUS_LECTEUR"],
        reglePortee: currentUserService || "Mon service",
        restrictions: "Aucune",
        soumiseLe: new Date().toISOString().split("T")[0],
        statut:
          currentUserRole === "agent" ? "en_attente_chef" : "en_attente_admin",
      },
    ];
  }

  const serviceChefs = users.filter((u) => normalize(u.role) === "role_chef");
  const appSets = [
    { apps: ["CHORUS"], profils: ["CHORUS_LECTEUR"] },
    { apps: ["SAFIR"], profils: ["SAFIR_CONSULTANT"] },
    { apps: ["SIRHIUS"], profils: ["SIRHIUS_GESTIONNAIRE"] },
    { apps: ["REGLISSE"], profils: ["REGLISSE_LECTEUR"] },
  ];

  const generated = users.slice(0, 10).map((target, idx) => {
    const sameServiceChef = serviceChefs.find(
      (chef) => normalize(chef.service) === normalize(target.service),
    );
    const demandeurName = sameServiceChef
      ? fullName(sameServiceChef)
      : fullName(target);
    const selectedSet = appSets[idx % appSets.length];
    const statusCycle: CerbereRequestSeed["statut"][] = [
      "en_attente_chef",
      "en_attente_admin",
      "validee",
      "refusee",
    ];
    const statut = statusCycle[idx % statusCycle.length];
    const day = String((idx % 9) + 1).padStart(2, "0");

    return {
      id: `fx-${target.id}`,
      agentConcerne: fullName(target),
      demandeur: demandeurName,
      applications: selectedSet.apps,
      profils: selectedSet.profils,
      reglePortee: target.service || "Mon service",
      restrictions: idx % 2 === 0 ? "Aucune" : "Accès en lecture seule",
      soumiseLe: `2026-02-${day}`,
      statut,
      chefValidationPar:
        statut === "en_attente_admin" ||
        statut === "validee" ||
        statut === "refusee"
          ? "Sophie Bernard"
          : undefined,
      chefValidationLe:
        statut === "en_attente_admin" ||
        statut === "validee" ||
        statut === "refusee"
          ? `2026-02-${String((idx % 9) + 8).padStart(2, "0")}`
          : undefined,
      valideePar:
        statut === "validee" || statut === "refusee"
          ? "Admin Système"
          : undefined,
      dateValidation:
        statut === "validee" || statut === "refusee"
          ? `2026-02-${String((idx % 9) + 10).padStart(2, "0")}`
          : undefined,
    };
  });

  const currentName = currentUserData
    ? fullName(currentUserData)
    : currentUserName;
  const hasCurrentUserRequest = generated.some(
    (r) => normalize(r.demandeur) === normalize(currentName),
  );
  if (!hasCurrentUserRequest) {
    generated.unshift({
      id: `fx-self-${Date.now()}`,
      agentConcerne: currentName,
      demandeur: currentName,
      applications: ["CHORUS"],
      profils: ["CHORUS_LECTEUR"],
      reglePortee:
        currentUserData?.service || currentUserService || "Mon service",
      restrictions: "Aucune",
      soumiseLe: new Date().toISOString().split("T")[0],
      statut:
        currentUserRole === "agent" ? "en_attente_chef" : "en_attente_admin",
    });
  }

  const sophie = users.find(
    (u) => normalize(fullName(u)) === normalize("Sophie Bernard"),
  );
  if (sophie) {
    const sophieTeam = users.filter(
      (u) =>
        normalize(u.service) === normalize(sophie.service) &&
        normalize(fullName(u)) !== normalize("Sophie Bernard"),
    );
    sophieTeam.slice(0, 2).forEach((member, index) => {
      const memberName = fullName(member);
      const alreadyExists = generated.some(
        (r) =>
          normalize(r.demandeur) === normalize("Sophie Bernard") &&
          normalize(r.agentConcerne) === normalize(memberName),
      );
      if (!alreadyExists) {
        generated.unshift({
          id: `fx-sophie-${member.id}`,
          agentConcerne: memberName,
          demandeur: "Sophie Bernard",
          applications: index % 2 === 0 ? ["CHORUS"] : ["SAFIR"],
          profils:
            index % 2 === 0 ? ["CHORUS_GESTIONNAIRE"] : ["SAFIR_CONSULTANT"],
          reglePortee: sophie.service || member.service || "Mon service",
          restrictions: "Aucune",
          soumiseLe: `2026-03-${String(index + 1).padStart(2, "0")}`,
          statut: "en_attente_admin",
        });
      }
    });
  }

  return generated;
}
