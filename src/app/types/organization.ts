import type { Service } from "@/app/components/admin/ServiceManagementView";

export interface AdminDomainRecord {
  id: string;
  name: string;
  services: string[];
}

export interface AdminLocationRecord {
  id: string;
  name: string;
  services: string[];
  regionCode?: string;
}

export interface AdminCategoryRecord {
  id: string;
  name: string;
}

export interface OrganizationSnapshot {
  services: Service[];
  domains: AdminDomainRecord[];
  locations: AdminLocationRecord[];
  categories: AdminCategoryRecord[];
}
