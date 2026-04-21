import React, { useEffect, useMemo, useState } from "react";
import { AppUser } from "./admin/UserManagementView";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { ArrowLeft, ChevronRight, Layers, MapPin, Save, Search, Shield, UserCheck } from "lucide-react";
import { AccessPermissionRow } from "./access-management/AccessPermissionRow";
import { ACCESS_MODULES } from "./access-management/constants";
import { AccessEmployee, CrudAction, EmployeeAccessProfile } from "./access-management/types";
import {
  AppShell,
  InfoChip,
  MetricBox,
  ProgressSection,
  RiskCard,
  SectionHeader,
  StatusBadge,
  Topbar,
} from "./access-management/AccessUi";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";

interface AccessManagementViewProps {
  users: AppUser[];
  profiles: Record<string, EmployeeAccessProfile>;
  onProfilesChange: React.Dispatch<
    React.SetStateAction<Record<string, EmployeeAccessProfile>>
  >;
}

const buildDefaultProfile = (employeeId: string): EmployeeAccessProfile => ({
  employeeId,
  modulePermissions: Object.fromEntries(
    ACCESS_MODULES.map((moduleItem) => [
      moduleItem.id,
      {
        canView: false,
        crud: { create: false, read: false, update: false, delete: false },
      },
    ]),
  ),
});

const mapEmployee = (user: AppUser): AccessEmployee => ({
  id: user.id,
  fullName: `${user.firstName} ${user.lastName}`,
  role: user.role as AccessEmployee["role"],
  service: user.service || "",
  domain: user.domain || "",
  location: user.location || "",
  category: user.category || "",
  email: user.email,
});

const roleLabel = (role: string) =>
  role === "ROLE_ADMIN" ? "Administrateur" : role === "ROLE_CHEF" ? "Chef de service" : "Agent";

const crudLabel = (action: CrudAction) => {
  if (action === "create") return "Créer";
  if (action === "read") return "Lire";
  if (action === "update") return "Modifier";
  return "Supprimer";
};

export function AccessManagementView({
  users,
  profiles,
  onProfilesChange,
}: AccessManagementViewProps) {
  const employees = useMemo(() => users.map(mapEmployee), [users]);

  const [accessStep, setAccessStep] = useState<"perimetre" | "configuration">("perimetre");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || "");

  const services = useMemo(
    () => Array.from(new Set(employees.map((employee) => employee.service).filter(Boolean))),
    [employees],
  );

  const scopedByService = useMemo(
    () =>
      employees.filter((employee) =>
        serviceFilter === "all" ? true : employee.service === serviceFilter,
      ),
    [employees, serviceFilter],
  );

  const domains = useMemo(
    () => Array.from(new Set(scopedByService.map((employee) => employee.domain).filter(Boolean))),
    [scopedByService],
  );

  const scopedByDomain = useMemo(
    () =>
      scopedByService.filter((employee) =>
        domainFilter === "all" ? true : employee.domain === domainFilter,
      ),
    [domainFilter, scopedByService],
  );

  const locations = useMemo(
    () => Array.from(new Set(scopedByDomain.map((employee) => employee.location).filter(Boolean))),
    [scopedByDomain],
  );

  const filteredEmployees = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return employees.filter((employee) => {
      if (serviceFilter !== "all" && employee.service !== serviceFilter) return false;
      if (domainFilter !== "all" && employee.domain !== domainFilter) return false;
      if (locationFilter !== "all" && employee.location !== locationFilter) return false;
      if (!normalized) return true;
      return (
        employee.fullName.toLowerCase().includes(normalized) ||
        employee.email.toLowerCase().includes(normalized)
      );
    });
  }, [domainFilter, employees, locationFilter, query, serviceFilter]);

  const scopeFilteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      if (serviceFilter !== "all" && employee.service !== serviceFilter) return false;
      if (domainFilter !== "all" && employee.domain !== domainFilter) return false;
      if (locationFilter !== "all" && employee.location !== locationFilter) return false;
      return true;
    });
  }, [domainFilter, employees, locationFilter, serviceFilter]);

  useEffect(() => {
    if (accessStep !== "configuration") return;
    if (filteredEmployees.length === 0) return;
    const stillThere = filteredEmployees.some((e) => e.id === selectedEmployeeId);
    if (!stillThere) {
      setSelectedEmployeeId(filteredEmployees[0].id);
    }
  }, [accessStep, filteredEmployees, selectedEmployeeId]);

  const selectedEmployee =
    filteredEmployees.find((employee) => employee.id === selectedEmployeeId) ||
    employees.find((employee) => employee.id === selectedEmployeeId) ||
    null;

  const currentProfile = selectedEmployee
    ? profiles[selectedEmployee.id] || buildDefaultProfile(selectedEmployee.id)
    : null;

  const visibleModulesCount = useMemo(
    () =>
      currentProfile
        ? Object.values(currentProfile.modulePermissions).filter((permission) => permission.canView).length
        : 0,
    [currentProfile],
  );
  const crudCount = useMemo(
    () =>
      currentProfile
        ? Object.values(currentProfile.modulePermissions).reduce(
            (acc, permission) => acc + Object.values(permission.crud).filter(Boolean).length,
            0,
          )
        : 0,
    [currentProfile],
  );
  const completionPercent = Math.round((visibleModulesCount / ACCESS_MODULES.length) * 100);
  const coveredServicesCount = useMemo(
    () => new Set(filteredEmployees.map((employee) => employee.service).filter(Boolean)).size,
    [filteredEmployees],
  );
  const coveredDomainsCount = useMemo(
    () => new Set(filteredEmployees.map((employee) => employee.domain).filter(Boolean)).size,
    [filteredEmployees],
  );
  const grantedRights = useMemo(() => {
    if (!currentProfile) return [];
    return ACCESS_MODULES.map((moduleItem) => {
      const permission = currentProfile.modulePermissions[moduleItem.id];
      const crudEnabled = permission
        ? (Object.entries(permission.crud)
            .filter(([, enabled]) => enabled)
            .map(([action]) => action) as CrudAction[])
        : [];
      return {
        moduleId: moduleItem.id,
        moduleLabel: moduleItem.label,
        canView: permission?.canView ?? false,
        crud: crudEnabled,
      };
    });
  }, [currentProfile]);

  const updatePermission = (
    moduleId: string,
    updater: (
      permission: EmployeeAccessProfile["modulePermissions"][string],
    ) => EmployeeAccessProfile["modulePermissions"][string],
  ) => {
    if (!selectedEmployee) return;
    onProfilesChange((prev) => {
      const profile = prev[selectedEmployee.id] || buildDefaultProfile(selectedEmployee.id);
      return {
        ...prev,
        [selectedEmployee.id]: {
          ...profile,
          modulePermissions: {
            ...profile.modulePermissions,
            [moduleId]: updater(profile.modulePermissions[moduleId]),
          },
        },
      };
    });
  };

  const handleToggleView = (moduleId: string, checked: boolean) => {
    updatePermission(moduleId, (permission) => ({
      ...permission,
      canView: checked,
      crud: checked ? permission.crud : { create: false, read: false, update: false, delete: false },
    }));
  };

  const handleToggleCrud = (moduleId: string, action: CrudAction) => {
    updatePermission(moduleId, (permission) => ({
      ...permission,
      canView: true,
      crud: { ...permission.crud, [action]: !permission.crud[action] },
    }));
  };

  const scopeLabel = (value: string, allLabel: string) =>
    value === "all" ? allLabel : value;

  const goToConfiguration = () => {
    setQuery("");
    setAccessStep("configuration");
    const first = scopeFilteredEmployees[0];
    if (first) setSelectedEmployeeId(first.id);
  };

  const goBackToPerimetre = () => {
    setAccessStep("perimetre");
  };

  const pickService = (value: string) => {
    setServiceFilter(value);
    setDomainFilter("all");
    setLocationFilter("all");
  };

  const pickDomain = (value: string) => {
    setDomainFilter(value);
    setLocationFilter("all");
  };

  const isScopeReady =
    serviceFilter !== "all" && domainFilter !== "all" && locationFilter !== "all";

  if (accessStep === "perimetre") {
    return (
      <AppShell>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <Topbar
            title="Gestion des accès"
            subtitle="Choisissez d'abord le service, le domaine et le lieu : vous accéderez ensuite à l'écran de configuration des droits."
            right={<StatusBadge tone="violet">Le Compas Access</StatusBadge>}
          />
        </div>

        <div className="space-y-4">
          <SectionHeader title="Service" subtitle="Sélectionnez un service pour commencer." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <Card
                key={service}
                onClick={() => pickService(service)}
                className={`group cursor-pointer transition-all duration-300 border-2 bg-white/80 backdrop-blur-sm ${
                  serviceFilter === service
                    ? "border-cyan-300 shadow-xl"
                    : "border-transparent hover:border-cyan-200 hover:shadow-2xl"
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-lg">
                      <Shield className="h-7 w-7 text-white" />
                    </div>
                    <div className="bg-gradient-to-r from-blue-100 to-cyan-100 px-3 py-1 rounded-full">
                      <span className="text-xs font-bold text-blue-700">Service</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-800">{service}</p>
                    <p className="text-sm text-gray-600 mt-1">Sélectionner ce service</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium">Continuer</span>
                    <ChevronRight className="h-5 w-5 text-cyan-500 group-hover:translate-x-2 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {serviceFilter !== "all" ? (
          <div className="space-y-4">
            <SectionHeader title="Domaine" subtitle="Choisissez un domaine du service sélectionné." />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {domains.map((domain) => (
                <Card
                  key={domain}
                  onClick={() => pickDomain(domain)}
                  className={`group cursor-pointer transition-all duration-300 border-2 bg-white/80 backdrop-blur-sm ${
                    domainFilter === domain
                      ? "border-cyan-300 shadow-xl"
                      : "border-transparent hover:border-cyan-200 hover:shadow-2xl"
                  }`}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                        <Layers className="h-7 w-7 text-white" />
                      </div>
                      <div className="bg-gradient-to-r from-violet-100 to-indigo-100 px-3 py-1 rounded-full">
                        <span className="text-xs font-bold text-violet-700">Domaine</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-800">{domain}</p>
                      <p className="text-sm text-gray-600 mt-1">{serviceFilter}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Continuer</span>
                      <ChevronRight className="h-5 w-5 text-cyan-500 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        {domainFilter !== "all" ? (
          <div className="space-y-4">
            <SectionHeader title="Lieu" subtitle="Choisissez un lieu avant d’accéder aux fiches agents." />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((location) => (
                <Card
                  key={location}
                  onClick={() => setLocationFilter(location)}
                  className={`group cursor-pointer transition-all duration-300 border-2 bg-white/80 backdrop-blur-sm ${
                    locationFilter === location
                      ? "border-cyan-300 shadow-xl"
                      : "border-transparent hover:border-cyan-200 hover:shadow-2xl"
                  }`}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                        <MapPin className="h-7 w-7 text-white" />
                      </div>
                      <div className="bg-gradient-to-r from-teal-100 to-cyan-100 px-3 py-1 rounded-full">
                        <span className="text-xs font-bold text-teal-700">Lieu</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-800">{location}</p>
                      <p className="text-sm text-gray-600 mt-1">{`${serviceFilter} · ${domainFilter}`}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Continuer</span>
                      <ChevronRight className="h-5 w-5 text-cyan-500 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        <Card className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-indigo-50/50 shadow-sm">
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">Périmètre sélectionné</p>
              <p className="text-sm text-slate-600 break-words">
                <span className="font-medium text-slate-800">{scopeLabel(serviceFilter, "Tous les services")}</span>
                {" · "}
                <span className="font-medium text-slate-800">{scopeLabel(domainFilter, "Tous les domaines")}</span>
                {" · "}
                <span className="font-medium text-slate-800">{scopeLabel(locationFilter, "Tous les lieux")}</span>
              </p>
              <p className="text-xs text-slate-500">
                {scopeFilteredEmployees.length} agent(s) dans ce périmètre
              </p>
            </div>
            <Button
              type="button"
              onClick={goToConfiguration}
              disabled={!isScopeReady}
              className="shrink-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-6 h-11"
            >
              Continuer vers la configuration
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-3 min-w-0 lg:flex-1">
          <Button
            type="button"
            variant="ghost"
            onClick={goBackToPerimetre}
            className="w-fit -ml-2 text-slate-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Modifier le périmètre (service, domaine, lieu)
          </Button>
          <Topbar
            title="Configuration des accès"
            subtitle="À gauche : fiche et sélection de l'agent. À droite : autorisations par module."
            right={<StatusBadge tone="violet">Le Compas Access</StatusBadge>}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center text-sm text-slate-600">
        <StatusBadge tone="violet">{scopeLabel(serviceFilter, "Tous les services")}</StatusBadge>
        <StatusBadge tone="orange">{scopeLabel(domainFilter, "Tous les domaines")}</StatusBadge>
        <StatusBadge tone="neutral" className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {scopeLabel(locationFilter, "Tous les lieux")}
        </StatusBadge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricBox label="Agents filtrés" value={filteredEmployees.length} icon={UserCheck} tone="slate" />
        <MetricBox label="Services couverts" value={coveredServicesCount} icon={Shield} tone="violet" />
        <MetricBox label="Domaines couverts" value={coveredDomainsCount} icon={Layers} tone="orange" />
        <MetricBox label="Modules configurables" value={ACCESS_MODULES.length} icon={Shield} tone="slate" />
      </div>

      <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un agent"
              className="h-11 rounded-xl pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(300px,440px)_minmax(0,1fr)] gap-6 items-start">
        <div className="space-y-4 min-w-0">
          <SectionHeader
            title="Agents et fiche"
            subtitle="Sélectionnez un agent, consultez sa fiche et le récapitulatif des droits."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
            {filteredEmployees.length === 0 ? (
              <Card className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80">
                <CardContent className="p-6 text-sm text-slate-600">
                  Aucun agent ne correspond à ce périmètre et à la recherche. Modifiez les filtres ou le périmètre.
                </CardContent>
              </Card>
            ) : (
              filteredEmployees.map((employee) => (
                <RiskCard
                  key={employee.id}
                  title={employee.fullName}
                  description={employee.email}
                  icon={Shield}
                  selected={selectedEmployeeId === employee.id}
                  onClick={() => setSelectedEmployeeId(employee.id)}
                  badge={
                    <StatusBadge tone={employee.role === "ROLE_ADMIN" ? "violet" : "orange"}>
                      {roleLabel(employee.role)}
                    </StatusBadge>
                  }
                  footer={
                    <div className="space-y-2">
                      <InfoChip icon={Layers} label="Domaine" value={employee.domain || "Non renseigne"} tone="violet" />
                      <InfoChip icon={Shield} label="Service" value={employee.service || "Non renseigne"} tone="blue" />
                    </div>
                  }
                />
              ))
            )}
          </div>

          {selectedEmployee && currentProfile ? (
            <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-lg font-semibold text-slate-900 break-words">
                      {selectedEmployee.fullName}
                    </p>
                    <p className="text-sm text-slate-600 break-all">{selectedEmployee.email}</p>
                  </div>
                  <StatusBadge tone={selectedEmployee.role === "ROLE_ADMIN" ? "violet" : "orange"}>
                    {roleLabel(selectedEmployee.role)}
                  </StatusBadge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <InfoChip
                    icon={Shield}
                    label="Service"
                    value={selectedEmployee.service || "Non renseigne"}
                    tone="blue"
                  />
                  <InfoChip
                    icon={Layers}
                    label="Domaine"
                    value={selectedEmployee.domain || "Non renseigne"}
                    tone="violet"
                  />
                </div>
                <InfoChip
                  icon={MapPin}
                  label="Lieu"
                  value={selectedEmployee.location || "Non renseigne"}
                  tone="teal"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                      Onglets visibles
                    </p>
                    <p className="text-xl font-bold text-violet-900">{visibleModulesCount}</p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                      Actions CRUD
                    </p>
                    <p className="text-xl font-bold text-blue-900">{crudCount}</p>
                  </div>
                </div>
                <ProgressSection label="Completion des acces (agent)" value={completionPercent} />

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Liste des droits accordes
                  </p>
                  <div className="space-y-2">
                    {grantedRights.map((right) => (
                      <div
                        key={right.moduleId}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-semibold text-slate-900">
                            {right.moduleLabel}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {right.canView ? (
                              <StatusBadge tone="green">Visible</StatusBadge>
                            ) : (
                              <StatusBadge tone="orange">Accès limité</StatusBadge>
                            )}
                            {right.crud.length > 0 ? (
                              right.crud.map((action) => (
                                <StatusBadge key={`${right.moduleId}-${action}`} tone="violet">
                                  {crudLabel(action)}
                                </StatusBadge>
                              ))
                            ) : (
                              <StatusBadge tone="neutral">Aucune action CRUD</StatusBadge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4 min-w-0">
          <SectionHeader
            title="Autorisations"
            subtitle="Activez la visibilité des onglets et les actions CRUD pour l'agent sélectionné."
            right={
              <Button
                type="button"
                onClick={() => toast.success("Autorisations enregistrees.")}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            }
          />

          <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 sm:p-5 space-y-3">
              {ACCESS_MODULES.map((moduleItem) => {
                const permission = currentProfile?.modulePermissions[moduleItem.id];
                return (
                  <AccessPermissionRow
                    key={moduleItem.id}
                    moduleLabel={moduleItem.label}
                    moduleDescription={moduleItem.description}
                    moduleSection={moduleItem.section}
                    canView={permission?.canView ?? false}
                    crud={
                      permission?.crud ?? {
                        create: false,
                        read: false,
                        update: false,
                        delete: false,
                      }
                    }
                    onToggleView={(checked) => handleToggleView(moduleItem.id, checked)}
                    onToggleCrud={(action) => handleToggleCrud(moduleItem.id, action)}
                  />
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
