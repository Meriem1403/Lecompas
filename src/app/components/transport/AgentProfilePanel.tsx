import { useMemo, useState } from "react";
import { Bus, Save } from "lucide-react";
import { toast } from "sonner";
import { useAppDataDocumentStore } from "@/app/hooks/useAppDataDocumentStore";
import { APP_DATA_KEYS } from "@/app/services/appDataApi";
import {
  EMPTY_AGENT_PROFILES,
  profileKey,
  type AgentTransportProfile,
} from "@/app/utils/agentTransportProfile";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { AddressSuggest } from "./AddressSuggest";
import { SignaturePad } from "./SignaturePad";

interface AgentProfilePanelProps {
  accessToken?: string;
  userEmail?: string;
  userName?: string;
}

function blankProfile(email: string, name: string): AgentTransportProfile {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    email,
    ministereDirectionAffectation: "DIRM Méditerranée",
    prenom: parts[0] || "",
    nom: parts.slice(1).join(" "),
    numeroSecuriteSociale: "",
    matricule: "",
    corps: "",
    grade: "",
    dateArriveeStructure: "",
    domicileNumeroRue: "",
    domicileCommune: "",
    domicileCodePostal: "",
    domicileArret: "",
    travailNumeroRue: "",
    travailCommune: "",
    travailCodePostal: "",
    travailArret: "",
    signatureAgent: name,
    signatureImage: "",
  };
}

export function AgentProfilePanel({
  accessToken = "",
  userEmail = "",
  userName = "",
}: AgentProfilePanelProps) {
  const [profiles, setProfiles] = useAppDataDocumentStore<Record<string, AgentTransportProfile>>(
    APP_DATA_KEYS.agentProfiles,
    accessToken,
    { seed: EMPTY_AGENT_PROFILES },
  );
  const key = profileKey(userEmail);
  const stored = key ? profiles[key] : undefined;
  const initial = useMemo(
    () => stored || blankProfile(userEmail, userName),
    [stored, userEmail, userName],
  );
  const [draft, setDraft] = useState<AgentTransportProfile>(initial);
  const [seen, setSeen] = useState(stored?.email || "");

  if ((stored?.email || "") !== seen) {
    setSeen(stored?.email || "");
    setDraft(stored || blankProfile(userEmail, userName));
  }

  const patch = (partial: Partial<AgentTransportProfile>) => setDraft((current) => ({ ...current, ...partial }));

  return (
    <Card className="border-0 shadow-xl bg-white/90">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg">
            <Bus className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle>Fiche profil</CardTitle>
            <CardDescription>
              Identité, adresses et signature. La première demande de transport les enregistre ici, puis les demandes suivantes se remplissent toutes seules.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="profil-affectation">Ministère / Direction / Affectation</Label>
            <Input id="profil-affectation" className="mt-1" value={draft.ministereDirectionAffectation} onChange={(event) => patch({ ministereDirectionAffectation: event.target.value })} />
          </div>
          <div>
            <Label htmlFor="profil-nom">Nom</Label>
            <Input id="profil-nom" className="mt-1" value={draft.nom} onChange={(event) => patch({ nom: event.target.value })} />
          </div>
          <div>
            <Label htmlFor="profil-prenom">Prénom</Label>
            <Input id="profil-prenom" className="mt-1" value={draft.prenom} onChange={(event) => patch({ prenom: event.target.value })} />
          </div>
          <div>
            <Label htmlFor="profil-nir">Numéro de sécurité sociale</Label>
            <Input id="profil-nir" className="mt-1" value={draft.numeroSecuriteSociale} onChange={(event) => patch({ numeroSecuriteSociale: event.target.value.replace(/\D/g, "").slice(0, 15) })} />
          </div>
          <div>
            <Label htmlFor="profil-matricule">Matricule</Label>
            <Input id="profil-matricule" className="mt-1" value={draft.matricule} onChange={(event) => patch({ matricule: event.target.value })} />
          </div>
          <div>
            <Label htmlFor="profil-corps">Corps</Label>
            <Input id="profil-corps" className="mt-1" value={draft.corps} onChange={(event) => patch({ corps: event.target.value })} />
          </div>
          <div>
            <Label htmlFor="profil-grade">Grade</Label>
            <Input id="profil-grade" className="mt-1" value={draft.grade} onChange={(event) => patch({ grade: event.target.value })} />
          </div>
          <div>
            <Label htmlFor="profil-arrivee">Date d'arrivée</Label>
            <Input id="profil-arrivee" className="mt-1" type="date" value={draft.dateArriveeStructure} onChange={(event) => patch({ dateArriveeStructure: event.target.value })} />
          </div>
        </div>
        <AddressSuggest
          idPrefix="profil-domicile"
          title="Domicile"
          value={{ rue: draft.domicileNumeroRue, commune: draft.domicileCommune, codePostal: draft.domicileCodePostal }}
          onChange={(value) => patch({ domicileNumeroRue: value.rue, domicileCommune: value.commune, domicileCodePostal: value.codePostal })}
        />
        <div>
          <Label htmlFor="profil-domicile-arret">Arrêt du domicile</Label>
          <Input id="profil-domicile-arret" className="mt-1" value={draft.domicileArret} onChange={(event) => patch({ domicileArret: event.target.value })} />
        </div>
        <AddressSuggest
          idPrefix="profil-travail"
          title="Lieu de travail"
          value={{ rue: draft.travailNumeroRue, commune: draft.travailCommune, codePostal: draft.travailCodePostal }}
          onChange={(value) => patch({ travailNumeroRue: value.rue, travailCommune: value.commune, travailCodePostal: value.codePostal })}
        />
        <div>
          <Label htmlFor="profil-travail-arret">Arrêt du lieu de travail</Label>
          <Input id="profil-travail-arret" className="mt-1" value={draft.travailArret} onChange={(event) => patch({ travailArret: event.target.value })} />
        </div>
        <div>
          <Label>Signature</Label>
          <div className="mt-2">
            <SignaturePad value={draft.signatureImage} onChange={(signatureImage) => patch({ signatureImage })} />
          </div>
        </div>
        <Button
          type="button"
          className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white"
          onClick={() => {
            if (!key) {
              toast.error("Aucun email n'est associé à cette session.");
              return;
            }
            setProfiles((current) => ({ ...current, [key]: { ...draft, email: userEmail } }));
            toast.success("Fiche profil enregistrée.");
          }}
        >
          <Save className="mr-2 h-4 w-4" />
          Enregistrer la fiche
        </Button>
      </CardContent>
    </Card>
  );
}
