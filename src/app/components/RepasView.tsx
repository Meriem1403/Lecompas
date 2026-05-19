import React from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { RepasPrestataireView } from "./repas/RepasPrestataireView";
import { RepasAgentView } from "./repas/RepasAgentView";
import { RepasChefServiceView } from "./repas/RepasChefServiceView";
import { RepasAdminView } from "./repas/RepasAdminView";
import { AppUser, Location } from "./admin/UserManagementView";
import { MealProviderIdentity } from "../utils/userRoles";
import { resolveLinkedAppUser } from "../utils/demoAccounts";
import { MealTicket } from "../utils/mealTicketRecord";
import { MealSubsidyConfig, UserInmHistoryEntry } from "../utils/mealSubsidyRecord";

interface RepasViewProps {
  currentUser: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "chef_service" | "agent" | "prestataire";
    service: string;
    domain?: string;
    location?: string;
  };
  adminUsers: AppUser[];
  services: string[];
  domains: string[];
  locations: string[];
  locationCatalog?: Location[];
  mealTickets: MealTicket[];
  setMealTickets: React.Dispatch<React.SetStateAction<MealTicket[]>>;
  currentProvider?: MealProviderIdentity | null;
  mealSubsidyConfig?: MealSubsidyConfig;
  setMealSubsidyConfig?: React.Dispatch<React.SetStateAction<MealSubsidyConfig>>;
  userInmHistory?: UserInmHistoryEntry[];
}

export function RepasView({
  currentUser,
  adminUsers,
  services,
  domains,
  locations,
  mealTickets,
  setMealTickets,
  currentProvider,
  locationCatalog = [],
  mealSubsidyConfig,
  setMealSubsidyConfig,
  userInmHistory = [],
}: RepasViewProps) {
  const linkedUser = resolveLinkedAppUser(adminUsers, currentUser);

  if (currentUser.role === "prestataire") {
    if (!currentProvider) {
      return (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-amber-900">Compte prestataire non reconnu</h2>
            <p className="text-amber-700 mt-2 max-w-md mx-auto">
              Votre adresse e-mail ({currentUser.email}) n&apos;est pas enregistrée comme prestataire
              dans Utilisateurs &gt; Prestataires. Contactez l&apos;administration.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <RepasPrestataireView
        provider={currentProvider}
        mealTickets={mealTickets}
        setMealTickets={setMealTickets}
      />
    );
  }

  if (currentUser.role === "agent") {
    if (!linkedUser) {
      return (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-amber-900">Profil agent introuvable</h2>
            <p className="text-amber-700 mt-2 max-w-md mx-auto">
              Votre compte ({currentUser.email}) n&apos;est pas associé à un agent dans
              l&apos;annuaire utilisateurs. Contactez l&apos;administration.
            </p>
          </CardContent>
        </Card>
      );
    }

    return <RepasAgentView agent={linkedUser} mealTickets={mealTickets} />;
  }

  if (currentUser.role === "chef_service") {
    if (!linkedUser) {
      return (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-amber-900">Profil chef de service introuvable</h2>
            <p className="text-amber-700 mt-2 max-w-md mx-auto">
              Votre compte ({currentUser.email}) n&apos;est pas associé à un chef de service dans
              l&apos;annuaire utilisateurs. Contactez l&apos;administration.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6 sm:space-y-8">
        <RepasAgentView agent={linkedUser} mealTickets={mealTickets} />
        <RepasChefServiceView
          chef={linkedUser}
          adminUsers={adminUsers}
          mealTickets={mealTickets}
        />
      </div>
    );
  }

  return (
    <RepasAdminView
      adminUsers={adminUsers}
      services={services}
      domains={domains}
      locations={locations}
      locationCatalog={locationCatalog}
      mealTickets={mealTickets}
      setMealTickets={setMealTickets}
      generatedBy={currentUser.name}
      mealSubsidyConfig={mealSubsidyConfig}
      setMealSubsidyConfig={setMealSubsidyConfig}
      userInmHistory={userInmHistory}
    />
  );
}
