import React, { useState } from 'react';
import { UserManagementView, AppUser } from '@/app/components/admin/UserManagementView';
import { RoleManagementView, Role } from '@/app/components/admin/RoleManagementView';
import { ServiceManagementView, Service } from '@/app/components/admin/ServiceManagementView';
import { SimpleEntityManagementView } from '@/app/components/admin/SimpleEntityManagementView';
import { Layers, MapPin, Tag } from 'lucide-react';

// Fake data
export const FAKE_USERS: AppUser[] = [
  {
    id: '0',
    firstName: 'Jean-Marc',
    lastName: 'DUBOIS',
    email: 'admin@dirm-med.gouv.fr',
    position: 'Directeur interrégional',
    service: 'Direction',
    domain: 'Pilotage',
    location: 'Siège Paris',
    category: 'Cadre dirigeant',
    role: 'ROLE_ADMIN',
    createdAt: '2025-01-01T08:00:00Z',
    createdBy: 'Système'
  },
  {
    id: '1',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@example.com',
    position: 'Responsable HSE',
    service: 'Sécurité',
    domain: 'Prévention',
    location: 'Siège Paris',
    category: 'Cadre',
    role: 'ROLE_ADMIN',
    createdAt: '2025-01-15T10:00:00Z',
    createdBy: 'Système'
  },
  {
    id: '2',
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'marie.martin@example.com',
    position: 'Chef de service Maintenance',
    service: 'Maintenance',
    domain: 'Technique',
    location: 'Site Lyon',
    category: 'Cadre',
    role: 'ROLE_CHEF',
    createdAt: '2025-02-01T09:00:00Z',
    createdBy: 'Jean Dupont'
  },
  {
    id: '4',
    firstName: 'Sophie',
    lastName: 'Bernard',
    email: 'sophie.bernard@example.com',
    position: 'Chef de service Maintenance',
    service: 'Maintenance',
    domain: 'Informatique',
    location: 'Marseille',
    category: 'Cadre',
    role: 'ROLE_CHEF',
    createdAt: '2025-03-05T09:30:00Z',
    createdBy: 'Jean-Marc DUBOIS'
  },
  {
    id: '3',
    firstName: 'Pierre',
    lastName: 'Leclerc',
    email: 'pierre.leclerc@example.com',
    position: 'Technicien maintenance',
    service: 'Maintenance',
    domain: 'Technique',
    location: 'Site Lyon',
    category: 'Agent de maîtrise',
    role: 'ROLE_AGENT',
    createdAt: '2025-02-10T14:00:00Z',
    createdBy: 'Marie Martin'
  }
];

const FAKE_ROLES: Role[] = [
  { id: 1, code: 'ROLE_ADMIN', displayName: 'Administrateur' },
  { id: 2, code: 'ROLE_AGENT', displayName: 'Agent' },
  { id: 3, code: 'ROLE_CHEF', displayName: 'Chef de service' }
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
  }
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
  }
];

export const FAKE_LOCATIONS = [
  {
    id: '1',
    name: 'Siège Paris',
    services: ['Sécurité']
  },
  {
    id: '2',
    name: 'Site Lyon',
    services: ['Sécurité', 'Maintenance', 'Production']
  },
  {
    id: '3',
    name: 'Site Marseille',
    services: ['Maintenance', 'Production']
  },
  {
    id: '4',
    name: 'Site Bordeaux',
    services: ['Production']
  }
];

const FAKE_CATEGORIES = [
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
}: AdminTabsViewProps) {
  const [internalUsers, setInternalUsers] = useState<AppUser[]>(FAKE_USERS);
  const [roles, setRoles] = useState<Role[]>(FAKE_ROLES);
  const [internalServices, setInternalServices] = useState<Service[]>(FAKE_SERVICES);
  const [internalDomains, setInternalDomains] = useState(FAKE_DOMAINS);
  const [internalLocations, setInternalLocations] = useState(FAKE_LOCATIONS);
  const [categories, setCategories] = useState(FAKE_CATEGORIES);

  const users = usersData ?? internalUsers;
  const setUsers = setUsersData ?? setInternalUsers;
  const services = servicesData ?? internalServices;
  const setServices = setServicesData ?? setInternalServices;
  const domains = domainsData ?? internalDomains;
  const setDomains = setDomainsData ?? setInternalDomains;
  const locations = locationsData ?? internalLocations;
  const setLocations = setLocationsData ?? setInternalLocations;

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
        title="Gestion des Domaines"
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
      <SimpleEntityManagementView
        title="Gestion des Lieux"
        description="Gérez les sites et localisations"
        items={locations}
        setItems={setLocations}
        icon={MapPin}
        color="cyan"
        gradient="from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
        hasServices={true}
        availableServices={services.map((service) => service.name)}
        protectedNames={Array.from(new Set(services.flatMap((service) => service.locations)))}
        protectedLabel="service"
      />
    );
  }

  if (activeTab === 'categories') {
    return (
      <SimpleEntityManagementView
        title="Gestion des Catégories"
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
