import type { AppUser } from "@/app/components/admin/UserManagementView";
import type { EmployeeAccessProfile } from "@/app/components/access-management/types";
import { ACCESS_MODULES } from "@/app/components/access-management/constants";
import { workflowActionsFor } from "@/app/components/access-management/workflowActions";

export function buildDefaultAccessProfiles(
  users: AppUser[],
): Record<string, EmployeeAccessProfile> {
  const defaultCrud = {
    create: true,
    read: true,
    update: true,
    delete: true,
  };
  return Object.fromEntries(
    users.map((employee) => [
      employee.id,
      {
        employeeId: employee.id,
        modulePermissions: Object.fromEntries(
          ACCESS_MODULES.map((moduleItem) => [
            moduleItem.id,
            {
              canView: true,
              crud: defaultCrud,
              actions: Object.fromEntries(
                workflowActionsFor(moduleItem.id).map((action) => [action.id, true]),
              ),
            },
          ]),
        ),
      },
    ]),
  );
}
