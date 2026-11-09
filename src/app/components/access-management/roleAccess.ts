import { ACCESS_MODULES } from "./constants";
import { EmployeeAccessProfile } from "./types";
import { blankActions, workflowActionsFor } from "./workflowActions";

export type ModulePermissions = EmployeeAccessProfile["modulePermissions"];

const ALL_OFF = { create: false, read: false, update: false, delete: false };
const ALL_ON = { create: true, read: true, update: true, delete: true };
const READ_ONLY = { create: false, read: true, update: false, delete: false };
const OPERATE = { create: true, read: true, update: true, delete: false };

const CHEF_HIDDEN = new Set(["users", "roles", "settings", "access-management"]);

const AGENT_VISIBLE = new Set([
  "dashboard",
  "team",
  "actualites",
  "risks",
  "risk-awareness",
  "actions",
  "documents",
  "cerbere",
  "reservations",
  "medical-visits",
  "sst-registry",
  "transport-coverage",
  "accidents",
  "registre",
  "asbestos",
  "asbestos-attestations",
  "risk-references",
]);

export type RoleAccessPreset = "admin" | "chef" | "agent";

export function presetForRoleCode(code: string): RoleAccessPreset {
  const normalized = String(code || "").toUpperCase();
  if (normalized.includes("ADMIN")) return "admin";
  if (normalized.includes("CHEF")) return "chef";
  return "agent";
}

export function roleCodeFromUserRole(userRole: string): string {
  const value = String(userRole || "");
  if (value.startsWith("ROLE_")) return value;
  if (value === "admin") return "ROLE_ADMIN";
  if (value === "chef_service" || value === "chef") return "ROLE_CHEF";
  return "ROLE_AGENT";
}

function actionsForPreset(moduleId: string, preset: RoleAccessPreset, visible: boolean) {
  return Object.fromEntries(
    workflowActionsFor(moduleId).map((action) => {
      if (!visible) return [action.id, false];
      if (preset === "agent") return [action.id, action.seats === 0];
      return [action.id, true];
    }),
  );
}

export function permissionsForPreset(preset: RoleAccessPreset): ModulePermissions {
  return Object.fromEntries(
    ACCESS_MODULES.map((moduleItem) => {
      if (preset === "admin") {
        return [
          moduleItem.id,
          { canView: true, crud: { ...ALL_ON }, actions: actionsForPreset(moduleItem.id, preset, true) },
        ];
      }
      if (preset === "chef") {
        const hidden = CHEF_HIDDEN.has(moduleItem.id);
        return [
          moduleItem.id,
          {
            canView: !hidden,
            crud: hidden ? { ...ALL_OFF } : { ...OPERATE },
            actions: actionsForPreset(moduleItem.id, preset, !hidden),
          },
        ];
      }
      const visible = AGENT_VISIBLE.has(moduleItem.id);
      return [
        moduleItem.id,
        {
          canView: visible,
          crud: visible ? { ...READ_ONLY } : { ...ALL_OFF },
          actions: actionsForPreset(moduleItem.id, preset, visible),
        },
      ];
    }),
  );
}

export function normalizeModulePermissions(
  code: string,
  stored?: ModulePermissions | null,
): ModulePermissions {
  const base = permissionsForPreset(presetForRoleCode(code));
  if (!stored) return base;
  const merged: ModulePermissions = { ...base };
  for (const moduleItem of ACCESS_MODULES) {
    const current = stored[moduleItem.id];
    if (!current) continue;
    const baseActions = base[moduleItem.id]?.actions ?? blankActions(moduleItem.id);
    merged[moduleItem.id] = {
      canView: Boolean(current.canView),
      crud: {
        create: Boolean(current.crud?.create),
        read: Boolean(current.crud?.read),
        update: Boolean(current.crud?.update),
        delete: Boolean(current.crud?.delete),
      },
      actions: Object.fromEntries(
        workflowActionsFor(moduleItem.id).map((action) => [
          action.id,
          current.actions && action.id in current.actions
            ? Boolean(current.actions[action.id])
            : Boolean(baseActions[action.id]),
        ]),
      ),
    };
  }
  return merged;
}

export function accessExtentSummary(permissions: ModulePermissions): string {
  const visible = Object.values(permissions).filter((permission) => permission.canView).length;
  const rights = Object.values(permissions).reduce(
    (total, permission) => total + Object.values(permission.crud).filter(Boolean).length,
    0,
  );
  const circuits = Object.values(permissions).reduce(
    (total, permission) => total + Object.values(permission.actions || {}).filter(Boolean).length,
    0,
  );
  return `${visible} modules visibles · ${rights} droits · ${circuits} actions de circuit`;
}

export function profileHasAnyGrant(profile?: EmployeeAccessProfile | null): boolean {
  if (!profile?.modulePermissions) return false;
  return Object.values(profile.modulePermissions).some(
    (permission) =>
      Boolean(permission?.canView) ||
      Object.values(permission?.crud || {}).some(Boolean) ||
      Object.values(permission?.actions || {}).some(Boolean),
  );
}

export function profileFromRoleCode(
  employeeId: string,
  roleCode: string,
  roles: Array<{ code: string; modulePermissions?: ModulePermissions }>,
): EmployeeAccessProfile {
  const code = roleCodeFromUserRole(roleCode);
  const match = roles.find((role) => role.code === code);
  return {
    employeeId,
    modulePermissions: normalizeModulePermissions(code, match?.modulePermissions),
  };
}
