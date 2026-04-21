export type CrudAction = "create" | "read" | "update" | "delete";

export interface AccessModule {
  id: string;
  label: string;
  section: string;
  description: string;
}

export interface EmployeeAccessProfile {
  employeeId: string;
  modulePermissions: Record<
    string,
    {
      canView: boolean;
      crud: Record<CrudAction, boolean>;
    }
  >;
}

export interface AccessEmployee {
  id: string;
  fullName: string;
  role: "ROLE_ADMIN" | "ROLE_CHEF" | "ROLE_AGENT";
  service: string;
  domain: string;
  location: string;
  category: string;
  email: string;
}
