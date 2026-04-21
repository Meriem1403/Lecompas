import React from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { AccessCrudPill } from "./AccessCrudPill";
import { CRUD_LABELS } from "./constants";
import { CrudAction } from "./types";
import { Eye, EyeOff } from "lucide-react";

interface AccessPermissionRowProps {
  moduleLabel: string;
  moduleDescription: string;
  moduleSection?: string;
  canView: boolean;
  crud: Record<CrudAction, boolean>;
  onToggleView: (checked: boolean) => void;
  onToggleCrud: (action: CrudAction) => void;
}

export function AccessPermissionRow({
  moduleLabel,
  moduleDescription,
  moduleSection,
  canView,
  crud,
  onToggleView,
  onToggleCrud,
}: AccessPermissionRowProps) {
  const enabledCrudCount = Object.values(crud).filter(Boolean).length;

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
              {enabledCrudCount}/4 actions
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
      </div>
    </div>
  );
}
