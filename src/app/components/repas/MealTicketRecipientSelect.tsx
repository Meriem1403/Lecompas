import React from "react";
import { AlertCircle, UserCheck, Users } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { AppUser } from "../admin/UserManagementView";
import {
  appUserDisplayName,
  isChefUser,
  mealTicketRecipientRoleLabel,
} from "../../utils/userRoles";

interface MealTicketRecipientSelectProps {
  service: string;
  recipients: AppUser[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  mealsPerPerson: number;
  getMonthTicketCount: (userId: string) => number;
}

function RecipientRow({
  user,
  checked,
  disabled,
  perPerson,
  count,
  onToggle,
}: {
  user: AppUser;
  checked: boolean;
  disabled: boolean;
  perPerson: number;
  count: number;
  onToggle: (checked: boolean) => void;
}) {
  const full = count >= perPerson;
  return (
    <label
      className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-amber-50/50 ${
        disabled || full ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      <Checkbox
        checked={checked}
        disabled={disabled || full}
        onCheckedChange={(value) => onToggle(value === true)}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-900">{appUserDisplayName(user)}</span>
          <Badge variant="secondary" className="text-xs">
            {mealTicketRecipientRoleLabel(user.role)}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${
              full ? "text-emerald-700 border-emerald-300" : "text-amber-700 border-amber-300"
            }`}
          >
            {count}/{perPerson} QR
          </Badge>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{user.email}</p>
        {(user.domain || user.location) && (
          <p className="text-xs text-slate-400 mt-0.5">
            {[user.domain, user.location].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </label>
  );
}

export function MealTicketRecipientSelect({
  service,
  recipients,
  selectedIds,
  onSelectionChange,
  mealsPerPerson,
  getMonthTicketCount,
}: MealTicketRecipientSelectProps) {
  const perPerson = Math.max(1, Math.min(31, Math.floor(mealsPerPerson)));

  const isFullyAllocated = (userId: string) => getMonthTicketCount(userId) >= perPerson;

  if (service === "all") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 flex gap-3 text-sm text-amber-900">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
        <p>
          Choisissez un <strong>service</strong> pour afficher les agents et chefs de service
          éligibles, puis cochez une ou plusieurs personnes.
        </p>
      </div>
    );
  }

  if (recipients.length === 0) {
    return (
      <p className="text-sm text-gray-500 rounded-xl border border-dashed p-4 text-center">
        Aucun agent ou chef de service pour ce service avec les filtres actuels.
      </p>
    );
  }

  const chefs = recipients
    .filter((u) => isChefUser(u))
    .sort((a, b) => appUserDisplayName(a).localeCompare(appUserDisplayName(b), "fr"));
  const agents = recipients
    .filter((u) => !isChefUser(u))
    .sort((a, b) => appUserDisplayName(a).localeCompare(appUserDisplayName(b), "fr"));

  const selectableIds = recipients
    .filter((u) => !isFullyAllocated(u.id))
    .map((u) => u.id);

  const toggleOne = (userId: string, checked: boolean) => {
    if (isFullyAllocated(userId)) return;
    if (checked) {
      onSelectionChange([...new Set([...selectedIds, userId])]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== userId));
    }
  };

  const renderGroup = (title: string, users: AppUser[]) => {
    if (users.length === 0) return null;
    return (
      <div>
        <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 bg-slate-50 border-b">
          {title} ({users.length})
        </p>
        {users.map((user) => (
          <RecipientRow
            key={user.id}
            user={user}
            checked={selectedIds.includes(user.id)}
            disabled={false}
            perPerson={perPerson}
            count={getMonthTicketCount(user.id)}
            onToggle={(c) => toggleOne(user.id, c)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Users className="h-4 w-4 text-amber-600" />
          Collaborateurs — {service} ({recipients.length} : {chefs.length} chef
          {chefs.length !== 1 ? "s" : ""}, {agents.length} agent
          {agents.length !== 1 ? "s" : ""})
        </Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectionChange(selectableIds)}
            disabled={selectableIds.length === 0}
          >
            Tout sélectionner (incomplets)
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onSelectionChange([])}>
            Tout désélectionner
          </Button>
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 divide-y bg-white">
        {renderGroup("Chefs de service", chefs)}
        {renderGroup("Agents", agents)}
      </div>

      <p className="text-xs text-slate-500 flex items-center gap-1.5">
        <UserCheck className="h-3.5 w-3.5" />
        {selectedIds.length} sélectionné(s) — jusqu&apos;à {perPerson} QR par personne ce mois-ci
      </p>
    </div>
  );
}
