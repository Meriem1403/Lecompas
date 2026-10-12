import React, { useState } from 'react';
import { UserManagementView, AppUser } from '@/app/components/admin/UserManagementView';
import { RoleManagementView, Role } from '@/app/components/admin/RoleManagementView';
import { ServiceManagementView, Service } from '@/app/components/admin/ServiceManagementView';
import { SimpleEntityManagementView } from '@/app/components/admin/SimpleEntityManagementView';
import { LocationManagementView } from '@/app/components/admin/LocationManagementView';
import { Layers, MapPin, Tag } from 'lucide-react';
import { PERSONNEL_USER_FIXTURES } from '@/app/fixtures/personnelUserFixtures';
export const FAKE_USERS: AppUser[] = [...PERSONNEL_USER_FIXTURES];

export const DEFAULT_ADMIN_ROLES: Role[] = [
  { id: 1, code: 'ROLE_ADMIN', displayName: 'Administrateur' },
  { id: 2, code: 'ROLE_AGENT', displayName: 'Agent' },
  { id: 3, code: 'ROLE_CHEF', displayName: 'Chef de service' },
];

export const FAKE_SERVICES: Service[] = [
  {
    id: '1',
    name: 'Sécurité',
    active: true,
    domains: ['Prévention', 'Formation'],
    locations: ['Siège Paris', 'Site Lyon']
  },
  {
    id: '2',
    name: 'Maintenance',
    active: true,
    domains: ['Technique', 'Prévention'],
    locations: ['Site Lyon', 'Site Marseille']
  },
  {
    id: '3',
    name: 'Production',
    active: true,
    domains: ['Fabrication', 'Qualité'],
    locations: ['Site Lyon', 'Site Marseille', 'Site Bordeaux']
  },
  {
    id: '4',
    name: 'CSN PACA-CORSE',
    active: true,
    domains: ['CSN'],
    locations: [
      'Tous sites inspections CSN (Navires, ateliers, chantiers ..)',
      'Locaux-bureaux tous CSN',
      'Martigues-Antenne CSN PACA Corse',
      'Sète-CSN Occitanie',
      'Antennes CSN (agents hébergés) en PACA, Corse et Occitanie',
    ],
  },
];

export const FAKE_DOMAINS = [
  {
    id: '1',
    name: 'Prévention',
    services: ['Sécurité', 'Maintenance']
  },
  {
    id: '2',
    name: 'Technique',
    services: ['Maintenance']
  },
  {
    id: '3',
    name: 'Formation',
    services: ['Sécurité']
  },
  {
    id: '4',
    name: 'Fabrication',
    services: ['Production']
  },
  {
    id: '5',
    name: 'Qualité',
    services: ['Production']
  },
  {
    id: '6',
    name: 'CSN',
    services: ['CSN PACA-CORSE'],
  },
];

export const FAKE_LOCATIONS = [
  {
    id: '1',
    name: 'Siège Paris',
    services: ['Sécurité'],
    regionCode: '13',
  },
  {
    id: '2',
    name: 'Site Lyon',
    services: ['Sécurité', 'Maintenance', 'Production'],
    regionCode: '13',
  },
  {
    id: '3',
    name: 'Site Marseille',
    services: ['Maintenance', 'Production'],
    regionCode: '13',
  },
  {
    id: '4',
    name: 'Site Bordeaux',
    services: ['Production'],
    regionCode: '33',
  },
  {
    id: '5',
    name: 'Ajaccio',
    services: ['Maintenance', 'Sécurité'],
    regionCode: '2A',
  },
  {
    id: '6',
    name: 'Bastia',
    services: ['Maintenance'],
    regionCode: '2B',
  },
  {
    id: '7',
    name: 'Sète',
    services: ['Production'],
    regionCode: '34',
  },
  {
    id: '8',
    name: 'Tous sites inspections CSN (Navires, ateliers, chantiers ..)',
    services: ['CSN PACA-CORSE'],
    regionCode: '13',
  },
  {
    id: '9',
    name: 'Locaux-bureaux tous CSN',
    services: ['CSN PACA-CORSE'],
    regionCode: '13',
  },
  {
    id: '10',
    name: 'Martigues-Antenne CSN PACA Corse',
    services: ['CSN PACA-CORSE'],
    regionCode: '13',
  },
  {
    id: '11',
    name: 'Sète-CSN Occitanie',
    services: ['CSN PACA-CORSE'],
    regionCode: '34',
  },
  {
    id: '12',
    name: 'Antennes CSN (agents hébergés) en PACA, Corse et Occitanie',
    services: ['CSN PACA-CORSE'],
    regionCode: '2A',
  },
];

export const DEFAULT_ADMIN_CATEGORIES = [
  { id: '1', name: 'Cadre' },
  { id: '2', name: 'Agent de maîtrise' },
  { id: '3', name: 'Employé' },
  { id: '4', name: 'Ouvrier' }
];

interface AdminTabsViewProps {
  activeTab: 'users' | 'roles' | 'services' | 'domains' | 'locations' | 'categories';
  usersData?: AppUser[];
  setUsersData?: React.Dispatch<React.SetStateAction<AppUser[]>>;
  servicesData?: Service[];
  setServicesData?: React.Dispatch<React.SetStateAction<Service[]>>;
  domainsData?: typeof FAKE_DOMAINS;
  setDomainsData?: React.Dispatch<React.SetStateAction<typeof FAKE_DOMAINS>>;
  locationsData?: typeof FAKE_LOCATIONS;
  setLocationsData?: React.Dispatch<React.SetStateAction<typeof FAKE_LOCATIONS>>;
  categoriesData?: typeof DEFAULT_ADMIN_CATEGORIES;
  setCategoriesData?: React.Dispatch<
    React.SetStateAction<typeof DEFAULT_ADMIN_CATEGORIES>
  >;
  rolesData?: Role[];
  setRolesData?: React.Dispatch<React.SetStateAction<Role[]>>;
  adminDisplayName?: string;
}

export function AdminTabsView({
  activeTab,
  usersData,
  setUsersData,
  servicesData,
  setServicesData,
  domainsData,
  setDomainsData,
  locationsData,
  setLocationsData,
  categoriesData,
  setCategoriesData,
  rolesData,
  setRolesData,
  adminDisplayName,
}: AdminTabsViewProps) {
  const [internalUsers, setInternalUsers] = useState<AppUser[]>(FAKE_USERS);
  const [internalRoles, setInternalRoles] = useState<Role[]>(DEFAULT_ADMIN_ROLES);
  const [internalServices, setInternalServices] = useState<Service[]>(FAKE_SERVICES);
  const [internalDomains, setInternalDomains] = useState(FAKE_DOMAINS);
  const [internalLocations, setInternalLocations] = useState(FAKE_LOCATIONS);
  const [internalCategories, setInternalCategories] = useState(
    DEFAULT_ADMIN_CATEGORIES,
  );

  const users = usersData ?? internalUsers;
  const setUsers = setUsersData ?? setInternalUsers;
  const services = servicesData ?? internalServices;
  const setServices = setServicesData ?? setInternalServices;
  const domains = domainsData ?? internalDomains;
  const setDomains = setDomainsData ?? setInternalDomains;
  const locations = locationsData ?? internalLocations;
  const setLocations = setLocationsData ?? setInternalLocations;
  const categories = categoriesData ?? internalCategories;
  const setCategories = setCategoriesData ?? setInternalCategories;
  const roles = rolesData ?? internalRoles;
  const setRoles = setRolesData ?? setInternalRoles;

  if (activeTab === 'users') {
    return (
      <UserManagementView
        users={users}
        setUsers={setUsers}
        roles={roles}
        services={services}
        domains={domains}
        locations={locations}
        categories={categories}
        createdByName={adminDisplayName ?? "Administrateur"}
      />
    );
  }

  if (activeTab === 'roles') {
    return (
      <RoleManagementView
        roles={roles}
        setRoles={setRoles}
      />
    );
  }

  if (activeTab === 'services') {
    return (
      <ServiceManagementView
        services={services}
        setServices={setServices}
        availableDomains={domains.map((domain) => domain.name)}
        availableLocations={locations.map((location) => location.name)}
      />
    );
  }

  if (activeTab === 'domains') {
    return (
      <SimpleEntityManagementView
        title="Gestion des domaines"
        description="Gérez les domaines d'activité"
        items={domains}
        setItems={setDomains}
        icon={Layers}
        color="orange"
        gradient="from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
        hasServices={true}
        availableServices={services.map((service) => service.name)}
        protectedNames={Array.from(new Set(services.flatMap((service) => service.domains)))}
        protectedLabel="service"
      />
    );
  }

  if (activeTab === 'locations') {
    return (
      <LocationManagementView
        locations={locations}
        setLocations={setLocations}
        protectedNames={Array.from(new Set(services.flatMap((service) => service.locations)))}
      />
    );
  }

  if (activeTab === 'categories') {
    return (
      <SimpleEntityManagementView
        title="Gestion des catégories"
        description="Gérez les catégories de personnel"
        items={categories}
        setItems={setCategories}
        icon={Tag}
        color="pink"
        gradient="from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
        hasServices={false}
      />
    );
  }

  return null;
}
