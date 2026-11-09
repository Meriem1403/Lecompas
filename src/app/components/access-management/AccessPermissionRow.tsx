import React from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { AccessCrudPill } from "./AccessCrudPill";
import { CRUD_LABELS } from "./constants";
import { CrudAction } from "./types";
import { Eye, EyeOff } from "lucide-react";

export interface WorkflowToggle {
  id: string;
  label: string;
  active: boolean;
}

export interface WorkflowHolderGroup {
  actionId: string;
  label: string;
  seats: number;
  people: Array<{ id: string; fullName: string; selected: boolean }>;
}

interface AccessPermissionRowProps {
  moduleLabel: string;
  moduleDescription: string;
  moduleSection?: string;
  canView: boolean;
  crud: Record<CrudAction, boolean>;
  onToggleView: (checked: boolean) => void;
  onToggleCrud: (action: CrudAction) => void;
  workflowActions?: WorkflowToggle[];
  onToggleWorkflow?: (actionId: string) => void;
  holders?: WorkflowHolderGroup[];
  onToggleHolder?: (actionId: string, employeeId: string) => void;
}

export function AccessPermissionRow({
  moduleLabel,
  moduleDescription,
  moduleSection,
  canView,
  crud,
  onToggleView,
  onToggleCrud,
  workflowActions = [],
  onToggleWorkflow,
  holders = [],
  onToggleHolder,
}: AccessPermissionRowProps) {
  const enabledCrudCount = Object.values(crud).filter(Boolean).length;
  const circuitCount =
    workflowActions.filter((action) => action.active).length +
    holders.filter((group) => group.people.some((person) => person.selected)).length;
  const circuitTotal = workflowActions.length + holders.length;

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-1">
            {moduleSection ? (
              <Badge
                variant="outline"
                className="bg-violet-50 border-violet-200 text-violet-700 font-medium"
              >
                {moduleSection}
              </Badge>
            ) : null}
            <p className="font-semibold text-slate-900">{moduleLabel}</p>
            <p className="text-sm text-slate-600">{moduleDescription}</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Badge
              variant="outline"
              className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-700 font-medium"
            >
              CRUD {enabledCrudCount}/4
              {circuitTotal > 0 ? ` · circuit ${circuitCount}/${circuitTotal}` : ""}
            </Badge>
            <div className="inline-flex items-center rounded-xl border border-violet-200 bg-violet-50/50 p-1 transition-all duration-200 group-hover:border-violet-300">
              <Button
                type="button"
                size="sm"
                variant={canView ? "default" : "ghost"}
                className={
                  canView
                    ? "h-8 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white px-3 transition-all duration-200 hover:shadow-sm"
                    : "h-8 rounded-lg text-slate-600 px-3 hover:bg-white transition-all duration-200"
                }
                onClick={() => onToggleView(true)}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Visible
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!canView ? "default" : "ghost"}
                className={
                  !canView
                    ? "h-8 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 text-white px-3 transition-all duration-200 hover:shadow-sm"
                    : "h-8 rounded-lg text-slate-600 px-3 hover:bg-white transition-all duration-200"
                }
                onClick={() => onToggleView(false)}
              >
                <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                Masque
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(CRUD_LABELS) as CrudAction[]).map((action) => (
            <AccessCrudPill
              key={action}
              label={CRUD_LABELS[action]}
              active={crud[action]}
              onToggle={() => onToggleCrud(action)}
            />
          ))}
        </div>

        {workflowActions.length > 0 || holders.length > 0 ? (
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
              Actions hors CRUD
            </p>
            {workflowActions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {workflowActions.map((action) => (
                  <AccessCrudPill
                    key={action.id}
                    label={action.label}
                    active={action.active}
                    onToggle={() => onToggleWorkflow?.(action.id)}
                  />
                ))}
              </div>
            ) : null}
            {holders.map((group) => {
              const filled = group.people.filter((person) => person.selected).length;
              const names = group.people.filter((person) => person.selected).map((person) => person.fullName);
              return (
                <div key={group.actionId} className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">
                    {group.label}
                    <span className="ml-2 font-medium text-amber-800">
                      {filled}/{group.seats}
                    </span>
                  </p>
                  <p className="text-xs text-slate-600">
                    {names.length > 0 ? names.join(", ") : "Aucun responsable désigné"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.people.map((person) => (
                      <AccessCrudPill
                        key={person.id}
                        label={person.fullName}
                        active={person.selected}
                        onToggle={() => onToggleHolder?.(group.actionId, person.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
