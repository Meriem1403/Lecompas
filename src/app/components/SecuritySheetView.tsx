import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Separator } from "@/app/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  FileText,
  Filter,
  Pencil,
  Plus,
  PlusCircle,
  Search,
  Shield,
  Table2,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export interface ControleRow {
  id: string;
  action: string;
  site: string;
  dateRapport: string;
  reference: string;
  observation: string;
  datePassage?: string;
  nomInspecteur?: string;
}

export interface SecuritySheetRecord {
  id: string;
  duerpTitre: string;
  referentielAnnee: string;
  titreFiche: string;
  nomSite: string;
  dateCreation: string;
  dateMiseAJour: string;
  effectif: string;
  adresse: string;
  telephoneBureau: string;
  telephoneAstreinte: string;
  activitesPrincipales: string;
  cyclesHoraires: string;
  correspondantPrevention: string;
  registreSst: string;
  lienIntranet: string;
  protocoleAccueil: string;
  registreControlesLieu: string;
  personnelHabilitationElectrique: string;
  procedureEvacuationIncendie: string;
  controleAmiante: ControleRow[];
  controlePlomb: ControleRow[];
  controleEquipementPression: ControleRow[];
  controleElectricite: ControleRow[];
  controleEquipements: ControleRow[];
  controleEpi: ControleRow[];
  controleLevage: ControleRow[];
  controleCvc: ControleRow[];
  controlePortes: ControleRow[];
  autresComplement: string;
  updatedBy?: string;
  updatedAt?: string;
}

const emptyRow = (): ControleRow => ({
  id: crypto.randomUUID(),
  action: "",
  site: "",
  dateRapport: "",
  reference: "",
  observation: "",
  datePassage: "",
  nomInspecteur: "",
});

export function newSecuritySheet(overrides?: Partial<SecuritySheetRecord>): SecuritySheetRecord {
  return {
    id: crypto.randomUUID(),
    duerpTitre: "DUERP de l'unité 2 : Services des Phares & Balises",
    referentielAnnee: "DIRM Méditerranée 2023",
    titreFiche: "Fiche sécurité secteur des Bouches du Rhône",
    nomSite: "COB Marseille",
    dateCreation: new Date().toISOString().slice(0, 10),
    dateMiseAJour: new Date().toISOString().slice(0, 10),
    effectif: "",
    adresse: "",
    telephoneBureau: "",
    telephoneAstreinte: "",
    activitesPrincipales: "",
    cyclesHoraires: "",
    correspondantPrevention: "",
    registreSst: "",
    lienIntranet: "",
    protocoleAccueil: "",
    registreControlesLieu: "",
    personnelHabilitationElectrique: "",
    procedureEvacuationIncendie: "",
    controleAmiante: [emptyRow()],
    controlePlomb: [emptyRow()],
    controleEquipementPression: [emptyRow()],
    controleElectricite: [emptyRow()],
    controleEquipements: [emptyRow()],
    controleEpi: [emptyRow()],
    controleLevage: [emptyRow()],
    controleCvc: [emptyRow()],
    controlePortes: [emptyRow()],
    autresComplement: "",
    ...overrides,
  };
}

export const defaultSecuritySheetsState: SecuritySheetRecord[] = [
  newSecuritySheet({
    id: "fiche-demo-cob-marseille",
    dateCreation: "2021-05-07",
    dateMiseAJour: "2024-05-07",
    effectif: "11 (COB) + 3 (BPST) + 1 (BAAF) + 1 (adj SPB) + marins (~13)",
    adresse: "Dirm-Med/Phares et Balises - Quai 123 de la digue du large – 13002 Marseille",
    telephoneBureau: "+33 4 13 94 89 40",
    telephoneAstreinte: "+33 6 24 91 62 00",
    activitesPrincipales:
      "Exploitation des Aides à la Navigation Maritime avec astreintes. Travaux technico-administratifs, de bureau, sur écran, archivage, mécaniques, tôlerie, soudure, peintures, électricité, électronique, maintenance du génie civil, des espaces verts…",
    cyclesHoraires:
      "Parc : 07h/12h et 13h/16h (1 vendredi sur 2 non travaillé). Encadrement, CEI, BAAF, BPST : horaires variables.",
    correspondantPrevention: "Maxime Suroy depuis 20/05/2019",
    registreSst: "n°15",
    lienIntranet:
      "https://enqueteur.dirm-mediterranee.e2.rie.gouv.fr/index.php?r=survey/index&sid=73544&lang=fr",
    protocoleAccueil: "À créer",
    registreControlesLieu: "Bureau Chef de centre – Armoire",
    personnelHabilitationElectrique: "Maxime Suroy\nDavid Violette",
    procedureEvacuationIncendie: "Oui",
    controleAmiante: [
      {
        id: "r1",
        action: "maj DTA",
        site: "COB Marseille",
        dateRapport: "06/07/22",
        reference: "7234948-001-1",
        observation: "EP 5 ans - AC1 sur toitures",
        datePassage: "",
        nomInspecteur: "",
      },
    ],
  }),
];

type ViewMode = "list" | "detail" | "create" | "edit";

const SECTIONS: { key: keyof SecuritySheetRecord; label: string; withInspector: boolean; hint?: string }[] = [
  { key: "controleAmiante", label: "Amiante", withInspector: false },
  { key: "controlePlomb", label: "Plomb", withInspector: false },
  { key: "controleEquipementPression", label: "Équipement sous pression", withInspector: false },
  { key: "controleElectricite", label: "Conformité électrique", withInspector: true, hint: "Champs optionnels : date de passage, inspecteur" },
  { key: "controleEquipements", label: "Équipements (machines)", withInspector: false },
  { key: "controleEpi", label: "EPI", withInspector: false },
  { key: "controleLevage", label: "Levage", withInspector: false },
  { key: "controleCvc", label: "Climatisation – Ventilation – Chauffage", withInspector: false },
  { key: "controlePortes", label: "Portes et portails", withInspector: true, hint: "Ex. vérification réglementaire" },
];

type SheetArrayKey = (typeof SECTIONS)[number]["key"];

function isRowArrayKey(k: string): k is SheetArrayKey {
  return SECTIONS.some((s) => s.key === k);
}

function countFilledControlRows(r: SecuritySheetRecord): number {
  let n = 0;
  for (const s of SECTIONS) {
    const arr = r[s.key] as ControleRow[];
    n += arr.filter(
      (row) => row.action || row.site || row.dateRapport || row.reference || row.observation || row.datePassage || row.nomInspecteur,
    ).length;
  }
  return n;
}

async function downloadFicheSecuritePdf(record: SecuritySheetRecord) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  const contentW = 182;
  let y = 20;
  const pageH = 297;
  const ensure = (h = 12) => {
    if (y + h > pageH - 14) {
      doc.addPage();
      y = 16;
    }
  };
  const addT = (t: string) => {
    ensure(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(t, margin, y);
    y += 6;
  };
  const addB = (label: string, val: string) => {
    ensure(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(label, margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(val || "—", contentW);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 2;
  };

  doc.setFillColor(190, 24, 93);
  doc.rect(0, 0, 210, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("FICHE SECURITE", margin, 8);
  doc.setTextColor(0, 0, 0);
  y = 18;
  addT(`${record.nomSite} — ${record.titreFiche}`);
  addB("Referentiel", record.referentielAnnee);
  addB("Dates", `Creation: ${record.dateCreation} | MAJ: ${record.dateMiseAJour}`);
  addB("Effectif", record.effectif);
  addB("Adresse", record.adresse);
  addB("Telephones", `Bureau: ${record.telephoneBureau} | Astreinte: ${record.telephoneAstreinte}`);
  addB("Activites", record.activitesPrincipales);
  addB("Horaires", record.cyclesHoraires);
  addB("Correspondant prevention", record.correspondantPrevention);
  addB("Autres complement", record.autresComplement);
  doc.save(`fiche-securite-${record.nomSite.replace(/\s+/g, "-") || record.id}.pdf`);
}

export interface SecuritySheetViewProps {
  currentUserRole: "admin" | "chef_service" | "agent";
  currentUserName: string;
  records: SecuritySheetRecord[];
  setRecords: React.Dispatch<React.SetStateAction<SecuritySheetRecord[]>>;
}

export function SecuritySheetView({
  currentUserRole,
  currentUserName,
  records,
  setRecords,
}: SecuritySheetViewProps) {
  const canEdit = currentUserRole !== "agent";
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [form, setForm] = useState<SecuritySheetRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const selected = useMemo(
    () => (selectedId ? records.find((r) => r.id === selectedId) ?? null : null),
    [records, selectedId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      const pack = [
        r.duerpTitre,
        r.titreFiche,
        r.nomSite,
        r.referentielAnnee,
        r.adresse,
        r.activitesPrincipales,
        r.correspondantPrevention,
      ]
        .join(" ")
        .toLowerCase();
      return pack.includes(q);
    });
  }, [records, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const startCreate = useCallback(() => {
    if (!canEdit) return;
    setForm(newSecuritySheet());
    setSelectedId(null);
    setViewMode("create");
  }, [canEdit]);

  const startEdit = (rec: SecuritySheetRecord) => {
    if (!canEdit) return;
    const next: SecuritySheetRecord = { ...rec };
    SECTIONS.forEach(({ key }) => {
      const arr = rec[key] as ControleRow[];
      (next as Record<string, ControleRow[]>)[key] =
        arr.length > 0 ? arr.map((r) => ({ ...r, id: r.id || crypto.randomUUID() })) : [emptyRow()];
    });
    setForm(next);
    setSelectedId(rec.id);
    setViewMode("edit");
  };

  const openDetail = (rec: SecuritySheetRecord) => {
    setSelectedId(rec.id);
    setViewMode("detail");
  };

  const saveForm = () => {
    if (!form) return;
    if (!form.nomSite.trim() || !form.titreFiche.trim()) {
      toast.error("Renseignez au minimum l'intitulé de fiche et le site.");
      return;
    }
    const stamp = { updatedBy: currentUserName, updatedAt: new Date().toISOString() };
    if (viewMode === "create") {
      setRecords((prev) => [
        { ...form, id: form.id || crypto.randomUUID(), dateMiseAJour: new Date().toISOString().slice(0, 10), ...stamp },
        ...prev,
      ]);
      toast.success("Fiche sécurité créée.");
    } else {
      setRecords((prev) =>
        prev.map((r) => (r.id === form.id ? { ...form, dateMiseAJour: new Date().toISOString().slice(0, 10), ...stamp } : r)),
      );
      toast.success("Fiche sécurité enregistrée.");
    }
    setViewMode("list");
    setForm(null);
  };

  const removeRecord = (id: string) => {
    if (!canEdit) return;
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setDeleteId(null);
    if (selectedId === id) {
      setSelectedId(null);
      setViewMode("list");
    }
    toast.success("Fiche supprimée.");
  };

  const patchForm = (patch: Partial<SecuritySheetRecord>) => {
    setForm((f) => (f ? { ...f, ...patch } : f));
  };

  const patchRow = (section: SheetArrayKey, rowId: string, patch: Partial<ControleRow>) => {
    setForm((f) => {
      if (!f) return f;
      const rows = f[section] as ControleRow[];
      return {
        ...f,
        [section]: rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
      };
    });
  };

  const addRow = (section: SheetArrayKey) => {
    setForm((f) => {
      if (!f) return f;
      const rows = f[section] as ControleRow[];
      return { ...f, [section]: [...rows, emptyRow()] };
    });
  };

  const removeRow = (section: SheetArrayKey, rowId: string) => {
    setForm((f) => {
      if (!f) return f;
      const rows = f[section] as ControleRow[];
      if (rows.length <= 1) return f;
      return { ...f, [section]: rows.filter((r) => r.id !== rowId) };
    });
  };

  const readSection = (rec: SecuritySheetRecord, key: SheetArrayKey) => {
    const arr = rec[key] as ControleRow[];
    return arr.filter((r) => r.action || r.site || r.dateRapport || r.reference || r.observation);
  };

  const statAvecPrevention = useMemo(
    () => filtered.filter((r) => r.correspondantPrevention?.trim()).length,
    [filtered],
  );
  const statAvecControles = useMemo(
    () => filtered.filter((r) => countFilledControlRows(r) > 0).length,
    [filtered],
  );

  if (viewMode === "create" && form && canEdit) {
    return (
      <EditBody
        form={form}
        isCreate
        onBack={() => {
          setViewMode("list");
          setForm(null);
        }}
        onSave={saveForm}
        patchForm={patchForm}
        patchRow={patchRow}
        addRow={addRow}
        removeRow={removeRow}
      />
    );
  }

  if (viewMode === "edit" && form && canEdit) {
    return (
      <EditBody
        form={form}
        isCreate={false}
        onBack={() => {
          setViewMode("list");
          setForm(null);
        }}
        onSave={saveForm}
        patchForm={patchForm}
        patchRow={patchRow}
        addRow={addRow}
        removeRow={removeRow}
      />
    );
  }

  if (viewMode === "detail" && selected) {
    return (
      <DetailBody
        record={selected}
        canEdit={canEdit}
        onBack={() => setViewMode("list")}
        onEdit={() => startEdit(selected)}
        onDownload={async () => {
          try {
            await downloadFicheSecuritePdf(selected);
            toast.success("Fiche telechargee en PDF.");
          } catch {
            toast.error("Impossible de generer le PDF.");
          }
        }}
        readSection={readSection}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-rose-900 to-pink-900 text-white overflow-hidden">
        <CardHeader className="py-8 sm:py-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-3xl sm:text-4xl font-bold">Fiches de sécurité</CardTitle>
                <p className="text-pink-100 text-lg mt-1">
                  Identification, prevention et controles reglementaires par site — meme logique que le plan de prevention.
                </p>
              </div>
            </div>
            <Badge className="w-full lg:w-auto justify-center bg-white text-slate-900 border border-slate-200 text-lg px-5 py-2">
              {filtered.length} fiche(s)
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50">
          <CardContent className="p-4">
            <p className="text-xs text-rose-800 uppercase font-semibold">Fiches visibles</p>
            <p className="text-2xl font-bold text-rose-950 mt-1">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
          <CardContent className="p-4">
            <p className="text-xs text-pink-800 uppercase font-semibold">Avec dispositif prevention</p>
            <p className="text-2xl font-bold text-pink-950 mt-1">{statAvecPrevention}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-stone-300 bg-gradient-to-br from-stone-100 to-stone-50">
          <CardContent className="p-4">
            <p className="text-xs text-stone-600 uppercase font-semibold">Avec controles saisis</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">{statAvecControles}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 bg-white/95">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col md:flex-row gap-3 w-full xl:flex-1">
              <div className="relative w-full xl:max-w-md">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une fiche (site, titre, adresse, activites...)"
                  className="pl-10 border-2 border-slate-300"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="hidden xl:flex items-center gap-2 text-sm text-slate-500">
                <Filter className="h-4 w-4" />
                Filtre recherche
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setCurrentPage(1);
                }}
              >
                Reinitialiser
              </Button>
            </div>
            {canEdit ? (
              <Button
                onClick={startCreate}
                className="w-full xl:w-auto bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Nouvelle fiche
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {pageRows.map((r) => (
          <Card key={r.id} className="border-0 shadow-xl hover:shadow-2xl transition-all bg-white/80 backdrop-blur overflow-hidden relative">
            <div className="h-2 bg-gradient-to-r from-pink-500 to-rose-500" />
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-pink-800">Fiche securite</p>
                    <p className="text-lg font-semibold text-slate-900 leading-snug break-words">{r.titreFiche || "Titre a renseigner"}</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-700 line-clamp-2">{r.duerpTitre}</p>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  <span className="font-bold uppercase tracking-wide text-rose-800">Site :</span>
                  <span className="text-sm font-semibold text-rose-900">{r.nomSite || "—"}</span>
                </div>
                <div className="flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-lg px-3 py-2">
                  <span className="font-bold uppercase tracking-wide text-pink-800">Referentiel :</span>
                  <span className="text-sm font-semibold text-pink-900">{r.referentielAnnee || "—"}</span>
                </div>
                <div className="flex items-center gap-2 bg-stone-100 border border-stone-300 rounded-lg px-3 py-2">
                  <span className="font-bold uppercase tracking-wide text-stone-600">Dernière mise à jour :</span>
                  <span className="text-sm font-semibold text-stone-900">{r.dateMiseAJour || "—"}</span>
                </div>
                <div className="flex items-center gap-2 bg-pink-100/80 border border-pink-200 rounded-lg px-3 py-2">
                  <span className="font-bold uppercase tracking-wide text-rose-900">Adresse :</span>
                  <span className="text-sm font-semibold text-rose-950 line-clamp-2">{r.adresse || "—"}</span>
                </div>
                <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
                  <span className="font-bold uppercase tracking-wide text-stone-600">Correspondant :</span>
                  <span className="text-sm font-semibold text-stone-800 line-clamp-1">{r.correspondantPrevention || "—"}</span>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <span className="text-xs text-gray-600 font-semibold">Creee le</span>
                  <div className="w-full text-center py-3 rounded-lg font-bold text-base border-2 bg-rose-50 border-rose-400 text-rose-800">
                    {r.dateCreation || "—"}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs text-gray-600 font-semibold">Lignes controle (total)</span>
                  <div className="w-full text-center py-3 rounded-lg font-bold text-base border-2 bg-stone-200 border-stone-400 text-stone-800">
                    {countFilledControlRows(r)}
                  </div>
                </div>
              </div>
              <Badge className="w-full justify-center font-bold border-0 bg-gradient-to-r from-pink-500 to-rose-600 text-white py-2">
                Controles reglementaires (amiante, plomb, CVC, etc.)
              </Badge>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="w-full sm:flex-1" onClick={() => openDetail(r)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Consulter
                </Button>
                {canEdit ? (
                  <>
                    <Button
                      className="w-full sm:flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                      onClick={() => startEdit(r)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button variant="outline" className="w-full sm:w-auto text-red-600" onClick={() => setDeleteId(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length > 0 ? (
        <Card className="border-2 bg-white/95">
          <CardContent className="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Page {currentPage} / {totalPages} - {filtered.length} resultat(s)
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                Precedent
              </Button>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                Suivant
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {filtered.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 bg-white/80">
          <CardContent className="py-14 text-center">
            <AlertTriangle className="h-10 w-10 text-pink-500 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold">Aucune fiche securite</p>
            <p className="text-gray-500 text-sm mt-1">Ajuste la recherche{canEdit ? " ou cree une nouvelle fiche." : "."}</p>
          </CardContent>
        </Card>
      ) : null}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la fiche ?</AlertDialogTitle>
            <AlertDialogDescription>La suppression est définitive.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteId) removeRecord(deleteId);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function IdentityFields({ form, patch }: { form: SecuritySheetRecord; patch: (p: Partial<SecuritySheetRecord>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>DUERP (titre de l&apos;unité)</Label>
          <Textarea
            value={form.duerpTitre}
            onChange={(e) => patch({ duerpTitre: e.target.value })}
            className="mt-1 min-h-[64px] border-2 border-slate-300"
          />
        </div>
        <div>
          <Label>Référentiel / année</Label>
          <Input value={form.referentielAnnee} onChange={(e) => patch({ referentielAnnee: e.target.value })} className="mt-1 border-2 border-slate-300" />
        </div>
        <div className="md:col-span-2">
          <Label>Titre de la fiche</Label>
          <Input value={form.titreFiche} onChange={(e) => patch({ titreFiche: e.target.value })} className="mt-1 border-2 border-slate-300" />
        </div>
        <div>
          <Label>Site (ex. COB)</Label>
          <Input value={form.nomSite} onChange={(e) => patch({ nomSite: e.target.value })} className="mt-1 border-2 border-slate-300" />
        </div>
        <div>
          <Label>Date création fiche</Label>
          <Input type="date" value={form.dateCreation} onChange={(e) => patch({ dateCreation: e.target.value })} className="mt-1 border-2 border-slate-300" />
        </div>
        <div>
          <Label>Date mise à jour</Label>
          <Input type="date" value={form.dateMiseAJour} onChange={(e) => patch({ dateMiseAJour: e.target.value })} className="mt-1 border-2 border-slate-300" />
        </div>
        <div>
          <Label>Effectif total</Label>
          <Textarea value={form.effectif} onChange={(e) => patch({ effectif: e.target.value })} className="mt-1 min-h-[60px] border-2 border-slate-300" />
        </div>
        <div>
          <Label>Adresse</Label>
          <Textarea value={form.adresse} onChange={(e) => patch({ adresse: e.target.value })} className="mt-1 min-h-[60px] border-2 border-slate-300" />
        </div>
        <div>
          <Label>Téléphone bureau</Label>
          <Input value={form.telephoneBureau} onChange={(e) => patch({ telephoneBureau: e.target.value })} className="mt-1 border-2 border-slate-300" />
        </div>
        <div>
          <Label>Astreinte</Label>
          <Input value={form.telephoneAstreinte} onChange={(e) => patch({ telephoneAstreinte: e.target.value })} className="mt-1 border-2 border-slate-300" />
        </div>
      </div>
    </div>
  );
}

function ActFields({ form, patch }: { form: SecuritySheetRecord; patch: (p: Partial<SecuritySheetRecord>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Activités principales</Label>
        <Textarea
          value={form.activitesPrincipales}
          onChange={(e) => patch({ activitesPrincipales: e.target.value })}
          className="mt-1 min-h-[100px] border-2 border-slate-300"
        />
      </div>
      <div>
        <Label>Cycles et horaires de fonctionnement</Label>
        <Textarea value={form.cyclesHoraires} onChange={(e) => patch({ cyclesHoraires: e.target.value })} className="mt-1 min-h-[80px] border-2 border-slate-300" />
      </div>
    </div>
  );
}

function PrevFields({ form, patch }: { form: SecuritySheetRecord; patch: (p: Partial<SecuritySheetRecord>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Correspondant sécurité / prévention</Label>
        <Textarea
          value={form.correspondantPrevention}
          onChange={(e) => patch({ correspondantPrevention: e.target.value })}
          className="mt-1 border-2 border-slate-300"
        />
      </div>
      <div>
        <Label>Présence registre SST (n°)</Label>
        <Input value={form.registreSst} onChange={(e) => patch({ registreSst: e.target.value })} className="mt-1 border-2 border-slate-300" />
      </div>
      <div>
        <Label>Lien intranet (enquête, etc.)</Label>
        <Input value={form.lienIntranet} onChange={(e) => patch({ lienIntranet: e.target.value })} className="mt-1 border-2 border-slate-300" />
      </div>
      <div>
        <Label>Protocole d&apos;accueil et de prévention des risques</Label>
        <Textarea value={form.protocoleAccueil} onChange={(e) => patch({ protocoleAccueil: e.target.value })} className="mt-1 border-2 border-slate-300" />
      </div>
      <div>
        <Label>Registre des contrôles / emplacement</Label>
        <Textarea value={form.registreControlesLieu} onChange={(e) => patch({ registreControlesLieu: e.target.value })} className="mt-1 border-2 border-slate-300" />
      </div>
      <div>
        <Label>Personnel habilité électrique (un nom par ligne)</Label>
        <Textarea
          value={form.personnelHabilitationElectrique}
          onChange={(e) => patch({ personnelHabilitationElectrique: e.target.value })}
          className="mt-1 min-h-[72px] border-2 border-slate-300"
        />
      </div>
      <div>
        <Label>Procédure d&apos;évacuation incendie</Label>
        <Input
          value={form.procedureEvacuationIncendie}
          onChange={(e) => patch({ procedureEvacuationIncendie: e.target.value })}
          className="mt-1 border-2 border-slate-300"
        />
      </div>
    </div>
  );
}

function TableEditor({
  title,
  hint,
  withInspector,
  rows,
  onPatch,
  onAdd,
  onRemove,
}: {
  title: string;
  hint?: string;
  withInspector: boolean;
  rows: ControleRow[];
  onPatch: (id: string, p: Partial<ControleRow>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {rows.map((row, i) => (
        <div key={row.id} className="rounded-lg border-2 border-pink-100 bg-pink-50/40 p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-pink-900">Ligne {i + 1}</span>
            {rows.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" className="h-7 text-red-600" onClick={() => onRemove(row.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Action</Label>
              <Textarea
                value={row.action}
                onChange={(e) => onPatch(row.id, { action: e.target.value })}
                className="min-h-[52px] mt-0.5 border-2 border-slate-300"
              />
            </div>
            <div>
              <Label className="text-xs">Site</Label>
              <Input value={row.site} onChange={(e) => onPatch(row.id, { site: e.target.value })} className="mt-0.5 border-2 border-slate-300" />
            </div>
            <div>
              <Label className="text-xs">Date rapport</Label>
              <Input value={row.dateRapport} onChange={(e) => onPatch(row.id, { dateRapport: e.target.value })} className="mt-0.5 border-2 border-slate-300" />
            </div>
            <div>
              <Label className="text-xs">Référence</Label>
              <Input value={row.reference} onChange={(e) => onPatch(row.id, { reference: e.target.value })} className="mt-0.5 border-2 border-slate-300" />
            </div>
            {withInspector ? (
              <>
                <div>
                  <Label className="text-xs">Date de passage (optionnel)</Label>
                  <Input
                    value={row.datePassage || ""}
                    onChange={(e) => onPatch(row.id, { datePassage: e.target.value })}
                    className="mt-0.5 border-2 border-slate-300"
                  />
                </div>
                <div>
                  <Label className="text-xs">Nom inspecteur (optionnel)</Label>
                  <Input
                    value={row.nomInspecteur || ""}
                    onChange={(e) => onPatch(row.id, { nomInspecteur: e.target.value })}
                    className="mt-0.5 border-2 border-slate-300"
                  />
                </div>
              </>
            ) : null}
            <div className="sm:col-span-2">
              <Label className="text-xs">Observation</Label>
              <Textarea
                value={row.observation}
                onChange={(e) => onPatch(row.id, { observation: e.target.value })}
                className="min-h-[56px] mt-0.5 border-2 border-slate-300"
              />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto border-dashed" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1" /> Ajouter une ligne — {title}
      </Button>
    </div>
  );
}

function TableRead({ title, rows, withInspector }: { title: string; rows: ControleRow[]; withInspector: boolean }) {
  if (!rows.length) return <p className="text-sm text-slate-500">Aucune ligne.</p>;
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={row.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-sm">
          <p className="font-medium text-slate-900">Ligne {i + 1}</p>
          <div className="grid sm:grid-cols-2 gap-1 mt-1 text-slate-700 text-xs sm:text-sm">
            <p>
              <span className="text-slate-500">Action :</span> {row.action || "—"}
            </p>
            <p>
              <span className="text-slate-500">Site :</span> {row.site || "—"}
            </p>
            <p>
              <span className="text-slate-500">Date rapport :</span> {row.dateRapport || "—"}
            </p>
            <p>
              <span className="text-slate-500">Réf. :</span> {row.reference || "—"}
            </p>
            {withInspector && (row.datePassage || row.nomInspecteur) ? (
              <>
                <p>
                  <span className="text-slate-500">Date passage :</span> {row.datePassage || "—"}
                </p>
                <p>
                  <span className="text-slate-500">Inspecteur :</span> {row.nomInspecteur || "—"}
                </p>
              </>
            ) : null}
            <p className="sm:col-span-2">
              <span className="text-slate-500">Obs. :</span> {row.observation || "—"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EditBody({
  form,
  isCreate,
  onBack,
  onSave,
  patchForm,
  patchRow,
  addRow,
  removeRow,
}: {
  form: SecuritySheetRecord;
  isCreate: boolean;
  onBack: () => void;
  onSave: () => void;
  patchForm: (p: Partial<SecuritySheetRecord>) => void;
  patchRow: (s: SheetArrayKey, id: string, p: Partial<ControleRow>) => void;
  addRow: (s: SheetArrayKey) => void;
  removeRow: (s: SheetArrayKey, id: string) => void;
}) {
  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isCreate ? "Nouvelle fiche securite" : "Modifier la fiche securite"}
          </h2>
          <p className="text-slate-600 mt-1">Edition en page complete, alignee sur le plan de prevention.</p>
        </div>
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      <Card className="border-0 shadow-2xl bg-white">
        <div className="h-2 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600" />
        <CardContent className="p-5 sm:p-8 space-y-5">
          <Card className="border-0 bg-gradient-to-r from-slate-900 via-rose-900 to-pink-900 text-white">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-pink-100">Document fiche securite</p>
                  <p className="text-lg font-semibold mt-1">{form.titreFiche || "Fiche a completer"}</p>
                  <p className="text-pink-100 text-sm mt-1">{form.referentielAnnee || "Referentiel"}</p>
                </div>
                <Badge className="bg-white text-slate-900 border-white/20">{isCreate ? "Creation" : "Modification"}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                <Shield className="h-4 w-4 text-pink-600" />
                Identification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IdentityFields form={form} patch={patchForm} />
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Activites &amp; horaires</CardTitle>
            </CardHeader>
            <CardContent>
              <ActFields form={form} patch={patchForm} />
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Dispositif de prevention</CardTitle>
              <CardDescription>Registres, protocole, habilitations, evacuation</CardDescription>
            </CardHeader>
            <CardContent>
              <PrevFields form={form} patch={patchForm} />
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Table2 className="h-4 w-4 text-pink-600" />
                Controles reglementaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full" defaultValue={["controleAmiante"]}>
                {SECTIONS.map((sec) => {
                  const key = sec.key;
                  if (!isRowArrayKey(key)) return null;
                  return (
                    <AccordionItem value={key} key={key}>
                      <AccordionTrigger className="text-left font-medium">{sec.label}</AccordionTrigger>
                      <AccordionContent>
                        <TableEditor
                          title={sec.label}
                          hint={sec.hint}
                          withInspector={sec.withInspector}
                          rows={form[key] as ControleRow[]}
                          onPatch={(id, p) => patchRow(key, id, p)}
                          onAdd={() => addRow(key)}
                          onRemove={(id) => removeRow(key, id)}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Autres (complements d&apos;information)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.autresComplement}
                onChange={(e) => patchForm({ autresComplement: e.target.value })}
                placeholder="Aeration, assainissement, extincteurs, controles specifiques..."
                className="min-h-[100px] border-2 border-slate-300"
              />
            </CardContent>
          </Card>

          <Separator />
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button
              onClick={onSave}
              className="w-full sm:w-auto bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
            >
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailBody({
  record,
  onBack,
  onEdit,
  onDownload,
  canEdit,
  readSection,
}: {
  record: SecuritySheetRecord;
  onBack: () => void;
  onEdit: () => void;
  onDownload: () => void;
  canEdit: boolean;
  readSection: (r: SecuritySheetRecord, k: SheetArrayKey) => ControleRow[];
}) {
  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onDownload} className="w-full sm:w-auto border-pink-300 text-pink-800 hover:bg-pink-50">
          <Download className="h-4 w-4 mr-2" />
          Telecharger
        </Button>
        {canEdit ? (
          <Button onClick={onEdit} className="w-full sm:w-auto bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700">
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        ) : null}
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>

      <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-rose-900 to-pink-900 text-white">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Shield className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-pink-100">Fiche securite</p>
                <CardTitle className="text-2xl mt-1">
                  {record.nomSite} — {record.titreFiche}
                </CardTitle>
                <CardDescription className="text-pink-100 mt-2">{record.duerpTitre}</CardDescription>
              </div>
            </div>
            <Badge className="bg-white/15 text-white border border-white/30">MAJ {record.dateMiseAJour}</Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-2 border-rose-200 bg-rose-50/80">
          <CardContent className="p-4">
            <p className="text-xs text-rose-800 font-semibold uppercase">Referentiel</p>
            <p className="font-semibold text-rose-950 mt-1 break-words">{record.referentielAnnee}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-pink-200 bg-pink-50/80">
          <CardContent className="p-4">
            <p className="text-xs text-pink-800 font-semibold uppercase">Creation fiche</p>
            <p className="font-semibold text-pink-950 mt-1">{record.dateCreation}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-stone-300 bg-stone-100/80">
          <CardContent className="p-4">
            <p className="text-xs text-stone-600 font-semibold uppercase">Effectif (indicatif)</p>
            <p className="font-semibold text-stone-900 mt-1 line-clamp-3">{record.effectif || "—"}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-stone-200 bg-stone-50/90">
          <CardContent className="p-4">
            <p className="text-xs text-stone-600 font-semibold uppercase">Lignes controle (total)</p>
            <p className="font-semibold text-stone-900 mt-1">{countFilledControlRows(record)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Adresse &amp; contacts</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-800 space-y-2">
          <p className="whitespace-pre-wrap">{record.adresse || "—"}</p>
          <p>
            <span className="text-slate-500">Bureau :</span> {record.telephoneBureau || "—"}{" "}
            <span className="text-slate-500">· Astreinte :</span> {record.telephoneAstreinte || "—"}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="border-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Activites &amp; horaires</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3 text-slate-800">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500 font-semibold uppercase">Principales</p>
              <p className="whitespace-pre-wrap mt-1">{record.activitesPrincipales || "—"}</p>
            </div>
            <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
              <p className="text-xs text-pink-900 font-semibold uppercase">Horaires</p>
              <p className="whitespace-pre-wrap mt-1">{record.cyclesHoraires || "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-pink-900">Dispositif de prevention</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-slate-800">
            <div className="rounded-lg bg-rose-50 p-3 border border-rose-100">
              <p className="text-xs text-rose-900 font-semibold">Correspondant</p>
              <p className="mt-1 whitespace-pre-wrap">{record.correspondantPrevention || "—"}</p>
            </div>
            <p>
              <span className="text-slate-500">Registre SST :</span> {record.registreSst || "—"}
            </p>
            <p>
              <span className="text-slate-500">Lien :</span>{" "}
              {record.lienIntranet ? (
                <a className="text-pink-700 underline" href={record.lienIntranet} target="_blank" rel="noreferrer">
                  Acces intranet
                </a>
              ) : (
                "—"
              )}
            </p>
            <p>
              <span className="text-slate-500">Protocole :</span> {record.protocoleAccueil || "—"}
            </p>
            <p>
              <span className="text-slate-500">Registre controles :</span> {record.registreControlesLieu || "—"}
            </p>
            <p className="whitespace-pre-wrap">
              <span className="text-slate-500">Habilitation elec. :</span> {record.personnelHabilitationElectrique || "—"}
            </p>
            <p>
              <span className="text-slate-500">Evacuation :</span> {record.procedureEvacuationIncendie || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {SECTIONS.map((sec) => {
        const rows = readSection(record, sec.key);
        return (
          <Card key={sec.key} className="border-2 border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{sec.label}</CardTitle>
            </CardHeader>
            <CardContent>
              {rows.length ? (
                <TableRead title={sec.label} rows={rows} withInspector={sec.withInspector} />
              ) : (
                <p className="text-sm text-slate-500">Aucune ligne renseignee pour cette rubrique.</p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {record.autresComplement ? (
        <Card className="border-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Autres</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-slate-800">{record.autresComplement}</p>
          </CardContent>
        </Card>
      ) : null}

      {record.updatedBy ? <p className="text-xs text-slate-500">Dernière saisie : {record.updatedBy}</p> : null}
    </div>
  );
}
