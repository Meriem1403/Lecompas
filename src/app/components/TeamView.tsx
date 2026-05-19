import React, { useEffect, useMemo, useState } from "react";
import { AppUser } from "./admin/UserManagementView";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Building2,
  ChevronRight,
  Mail,
  Layers,
  MapPin,
  Search,
  Shield,
  Users,
  Eye,
} from "lucide-react";

interface TeamService {
  id: string;
  name: string;
  domains?: string[];
  locations?: string[];
}

interface TeamDomain {
  id: string;
  name: string;
  services?: string[];
}

interface TeamLocation {
  id: string;
  name: string;
  services?: string[];
}

interface TeamViewProps {
  users: AppUser[];
  services: TeamService[];
  domains: TeamDomain[];
  locations: TeamLocation[];
  currentUserRole?: "admin" | "chef_service" | "agent";
  currentUserService?: string;
}

type ServiceScope = "all_services" | "by_service";

const getRoleLabel = (role: string) => {
  if (role === "ROLE_ADMIN") return "Administrateur";
  if (role === "ROLE_CHEF") return "Chef de service";
  if (role === "ROLE_AGENT") return "Agent";
  if (role === "ROLE_PRESTATAIRE") return "Prestataire";
  return role;
};

const getRoleBadgeClasses = (role: string) => {
  if (role === "ROLE_ADMIN") {
    return "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700";
  }
  if (role === "ROLE_CHEF") {
    return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-700";
  }
  return "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-700";
};

export function TeamView({
  users,
  services,
  domains,
  locations,
  currentUserRole = "agent",
  currentUserService,
}: TeamViewProps) {
  const isAdmin = currentUserRole === "admin";
  const normalizedUserService = (currentUserService || "").trim().toLowerCase();

  const [query, setQuery] = useState("");
  const [serviceScope, setServiceScope] = useState<ServiceScope | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<AppUser | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setServiceScope("by_service");
      setSelectedService(currentUserService || null);
    }
  }, [currentUserService, isAdmin]);

  const availableServices = useMemo(
    () => services.filter((service) => service.name),
    [services],
  );

  const availableDomains = useMemo(() => {
    if (serviceScope !== "by_service" || !selectedService) {
      return domains.map((domain) => domain.name);
    }

    const selectedServiceData = services.find(
      (service) => service.name === selectedService,
    );
    if (selectedServiceData?.domains?.length) return selectedServiceData.domains;

    return domains
      .filter((domain) => (domain.services || []).includes(selectedService))
      .map((domain) => domain.name);
  }, [domains, selectedService, serviceScope, services]);

  const availableLocations = useMemo(() => {
    if (serviceScope !== "by_service" || !selectedService) {
      return locations.map((location) => location.name);
    }

    const selectedServiceData = services.find(
      (service) => service.name === selectedService,
    );
    if (selectedServiceData?.locations?.length) {
      return selectedServiceData.locations;
    }

    return locations
      .filter((location) => (location.services || []).includes(selectedService))
      .map((location) => location.name);
  }, [locations, selectedService, serviceScope, services]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const userService = (user.service || "").trim();
      const userDomain = (user.domain || "").trim();
      const userLocation = (user.location || "").trim();

      if (
        !isAdmin &&
        normalizedUserService &&
        userService.toLowerCase() !== normalizedUserService
      ) {
        return false;
      }

      if (serviceScope === "by_service") {
        if (!selectedService) return false;
        if (userService !== selectedService) return false;
      }

      if (selectedDomain !== "all" && userDomain !== selectedDomain) return false;
      if (selectedLocation !== "all" && userLocation !== selectedLocation) {
        return false;
      }

      if (!normalizedQuery) return true;

      const fullname = `${user.firstName} ${user.lastName}`.toLowerCase();
      return (
        fullname.includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        user.role.toLowerCase().includes(normalizedQuery) ||
        userService.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [
    isAdmin,
    normalizedUserService,
    query,
    selectedDomain,
    selectedLocation,
    selectedService,
    serviceScope,
    users,
  ]);

  const canShowStep3 =
    serviceScope === "all_services" || (serviceScope === "by_service" && !!selectedService);
  const canShowStep4 = canShowStep3 && selectedDomain !== "";
  const canShowTeam = canShowStep4 && selectedLocation !== "";
  const adminCount = filteredUsers.filter((member) => member.role === "ROLE_ADMIN").length;
  const agentCount = filteredUsers.filter((member) => member.role === "ROLE_AGENT").length;
  const uniqueServicesCount = new Set(
    filteredUsers.map((member) => member.service).filter(Boolean),
  ).size;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8 p-3 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
            Équipe
          </h3>
          <p className="text-gray-600">
            Sélection progressive : navigation, service, domaine, lieu, puis équipe.
          </p>
        </div>
        <Badge className="w-fit bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200 hover:from-blue-100 hover:to-cyan-100">
          {filteredUsers.length} membre{filteredUsers.length > 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Membres filtrés
                </p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {filteredUsers.length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
                  Administrateurs
                </p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {adminCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Agents
                </p>
                <p className="text-2xl font-bold text-amber-900 mt-1">
                  {agentCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                  Services couverts
                </p>
                <p className="text-2xl font-bold text-teal-900 mt-1">
                  {uniqueServicesCount}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <div className="space-y-4">
          <h4 className="text-2xl font-bold text-gray-800">
            Choisissez une navigation
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {[
              {
                id: "all_services" as ServiceScope,
                title: "Tous les services",
                description: "Acceder a l'ensemble des equipes.",
                icon: Building2,
                gradient: "from-blue-500 via-cyan-500 to-teal-500",
              },
              {
                id: "by_service" as ServiceScope,
                title: "Par service",
                description:
                  "Affinez la recherche en choisissant successivement le service, puis le domaine et le lieu.",
                icon: Layers,
                gradient: "from-indigo-500 via-purple-500 to-pink-500",
              },
            ].map((option) => {
              const Icon = option.icon;
              return (
                <Card
                  key={option.id}
                  onClick={() => {
                    setServiceScope(option.id);
                    setSelectedService(null);
                    setSelectedDomain("all");
                    setSelectedLocation("all");
                  }}
                  className={`group h-full cursor-pointer border-2 bg-white/90 backdrop-blur-sm transition-all duration-300 md:hover:shadow-2xl md:hover:scale-[1.02] ${
                    serviceScope === option.id
                      ? "border-cyan-300 shadow-xl"
                      : "border-transparent hover:border-cyan-200"
                  }`}
                >
                  <CardHeader className="space-y-3 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${option.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}
                      >
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-800 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                      {option.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-2">
                      {option.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto p-6 pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Sélectionner</span>
                      <ChevronRight className="h-5 w-5 text-cyan-500 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {(!isAdmin || serviceScope === "by_service") && (
        <div className="space-y-4">
          <h4 className="text-2xl font-bold text-gray-800">
            Choisissez un service
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {availableServices.map((service) => (
              <Card
                key={service.id}
                onClick={() => {
                  setSelectedService(service.name);
                  setSelectedDomain("all");
                  setSelectedLocation("all");
                }}
                className={`group h-full cursor-pointer border-2 bg-white/90 backdrop-blur-sm transition-all duration-300 md:hover:shadow-2xl md:hover:scale-[1.02] ${
                  selectedService === service.name
                    ? "border-indigo-300 shadow-xl"
                    : "border-transparent hover:border-indigo-200"
                }`}
              >
                <CardHeader className="space-y-3 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <div className="bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-1 rounded-full">
                      <span className="text-sm font-bold text-indigo-700">
                        {(service.domains || []).length +
                          (service.locations || []).length}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                    {service.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    {(service.domains || []).length} domaine(s),{" "}
                    {(service.locations || []).length} lieu(x)
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto p-6 pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium">
                      Choisir ce service
                    </span>
                    <ChevronRight className="h-5 w-5 text-indigo-500 group-hover:translate-x-2 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {canShowStep3 && (
        <div className="space-y-4">
          <h4 className="text-2xl font-bold text-gray-800">
            Choisissez un domaine
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {["all", ...availableDomains].map((domain) => {
              const isSelected = selectedDomain === domain;
              const title = domain === "all" ? "Tous les domaines" : domain;
              return (
                <Card
                  key={domain}
                  onClick={() => setSelectedDomain(domain)}
                  className={`group h-full cursor-pointer border-2 bg-white/90 backdrop-blur-sm transition-all duration-300 md:hover:shadow-2xl md:hover:scale-[1.02] ${
                    isSelected
                      ? "border-purple-300 shadow-xl"
                      : "border-transparent hover:border-purple-200"
                  }`}
                >
                  <CardHeader className="space-y-3 p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                        <Layers className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-800 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-indigo-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                      {title}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {domain === "all"
                        ? "Afficher tous les domaines disponibles."
                        : "Filtrer l’équipe sur ce domaine."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto p-6 pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Sélectionner</span>
                      <ChevronRight className="h-5 w-5 text-purple-500 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {canShowStep4 && (
        <div className="space-y-4">
          <h4 className="text-2xl font-bold text-gray-800">Choisissez un lieu</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {["all", ...availableLocations].map((location) => {
              const isSelected = selectedLocation === location;
              const title = location === "all" ? "Tous les lieux" : location;
              return (
                <Card
                  key={location}
                  onClick={() => setSelectedLocation(location)}
                  className={`group h-full cursor-pointer border-2 bg-white/90 backdrop-blur-sm transition-all duration-300 md:hover:shadow-2xl md:hover:scale-[1.02] ${
                    isSelected
                      ? "border-teal-300 shadow-xl"
                      : "border-transparent hover:border-teal-200"
                  }`}
                >
                  <CardHeader className="space-y-3 p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                        <MapPin className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-800 group-hover:bg-gradient-to-r group-hover:from-teal-600 group-hover:to-cyan-600 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                      {title}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {location === "all"
                        ? "Afficher tous les lieux disponibles."
                        : "Filtrer l’équipe sur ce lieu."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto p-6 pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-medium">Sélectionner</span>
                      <ChevronRight className="h-5 w-5 text-teal-500 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {canShowTeam && (
        <>
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-gray-800">Équipe</h4>
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-700" />
                  Rechercher dans l’equipe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nom, email, role ou service..."
                    className="pl-9"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                className="group h-full border border-slate-200/70 shadow-sm bg-white transition-all duration-300 md:hover:shadow-xl md:hover:border-cyan-200"
              >
                <CardContent className="p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shrink-0">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 break-words">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-600 break-all">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`w-fit shrink-0 font-semibold ${getRoleBadgeClasses(user.role)}`}
                    >
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Identifiant
                      </p>
                      <p className="mt-1 text-slate-800 break-all">{user.id}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Poste
                      </p>
                      <p className="mt-1 text-slate-800 break-words">
                        {user.position || "Non renseigne"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Service
                      </p>
                      <Badge
                        variant="outline"
                        className="mt-1 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-700 font-medium"
                      >
                        {user.service || "Non renseigne"}
                      </Badge>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Domaine
                      </p>
                      <Badge
                        variant="outline"
                        className="mt-1 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 text-purple-700 font-medium"
                      >
                        {user.domain || "Non renseigne"}
                      </Badge>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Lieu
                      </p>
                      <Badge
                        variant="outline"
                        className="mt-1 bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200 text-teal-700 font-medium"
                      >
                        {user.location || "Non renseigne"}
                      </Badge>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Categorie
                      </p>
                      <Badge
                        variant="outline"
                        className="mt-1 bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200 text-rose-700 font-medium"
                      >
                        {user.category || "Non renseigne"}
                      </Badge>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Cree le
                      </p>
                      <p className="mt-1 text-slate-800">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("fr-FR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Non renseigne"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Cree par
                      </p>
                      <p className="mt-1 text-slate-800 break-words">
                        {user.createdBy || "Non renseigne"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wide text-blue-700">
                        Service :
                      </span>
                      <span className="text-sm font-semibold text-blue-700 truncate">
                        {user.service || "Non renseigne"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                      <Layers className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                        Domaine :
                      </span>
                      <span className="text-sm font-semibold text-indigo-700 truncate">
                        {user.domain || "Non renseigne"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                      <MapPin className="h-4 w-4 text-teal-600 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wide text-teal-700">
                        Lieu :
                      </span>
                      <span className="text-sm font-semibold text-teal-700 truncate">
                        {user.location || "Non renseigne"}
                      </span>
                    </div>
                  </div>

                </CardContent>
                <CardFooter className="px-4 sm:px-5 py-3 border-t bg-slate-50/80 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Profil equipe
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                    onClick={() => setSelectedMember(user)}
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    Consulter
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={!!selectedMember}
        onOpenChange={(open) => {
          if (!open) setSelectedMember(null);
        }}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-0 shadow-2xl">
          {selectedMember && (
            <>
              <DialogHeader className="px-4 sm:px-6 py-5 border-b bg-gradient-to-r from-slate-50 to-cyan-50">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shrink-0">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <DialogTitle className="text-xl font-semibold text-slate-900 break-words">
                        {selectedMember.firstName} {selectedMember.lastName}
                      </DialogTitle>
                      <p className="mt-1 text-sm text-slate-600 break-all">
                        {selectedMember.email}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`w-fit font-semibold ${getRoleBadgeClasses(selectedMember.role)}`}
                  >
                    {getRoleLabel(selectedMember.role)}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="p-4 sm:p-6 space-y-6 bg-white">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-700 font-medium"
                  >
                    <Building2 className="h-3.5 w-3.5 mr-1" />
                    {selectedMember.service || "Service non renseigne"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 text-purple-700 font-medium"
                  >
                    <Layers className="h-3.5 w-3.5 mr-1" />
                    {selectedMember.domain || "Domaine non renseigne"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200 text-teal-700 font-medium"
                  >
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    {selectedMember.location || "Lieu non renseigne"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200 text-rose-700 font-medium"
                  >
                    {selectedMember.category || "Categorie non renseignee"}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h5 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Affectation
                  </h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                      <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wide text-blue-700">
                        Service :
                      </span>
                      <span className="text-sm font-semibold text-blue-700 truncate">
                        {selectedMember.service || "Non renseigne"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                      <Layers className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">
                        Domaine :
                      </span>
                      <span className="text-sm font-semibold text-indigo-700 truncate">
                        {selectedMember.domain || "Non renseigne"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                      <MapPin className="h-4 w-4 text-teal-600 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wide text-teal-700">
                        Lieu :
                      </span>
                      <span className="text-sm font-semibold text-teal-700 truncate">
                        {selectedMember.location || "Non renseigne"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Identifiant
                    </p>
                    <p className="mt-1 text-slate-800 break-all">{selectedMember.id}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Poste
                    </p>
                    <p className="mt-1 text-slate-800 break-words">
                      {selectedMember.position || "Non renseigne"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Cree le
                    </p>
                    <p className="mt-1 text-slate-800">
                      {selectedMember.createdAt
                        ? new Date(selectedMember.createdAt).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Non renseigne"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Cree par
                    </p>
                    <p className="mt-1 text-slate-800 break-words">
                      {selectedMember.createdBy || "Non renseigne"}
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter className="px-4 sm:px-6 py-4 border-t bg-slate-50/80 flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <p className="text-xs text-slate-500">
                  Consultation du profil membre
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-100"
                  onClick={() => setSelectedMember(null)}
                >
                  Fermer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
