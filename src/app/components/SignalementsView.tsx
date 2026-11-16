import { useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import {
  Activity,
  BatteryLow,
  Brain,
  Briefcase,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  CloudRain,
  Download,
  EyeOff,
  FolderHeart,
  Heart,
  Home,
  Inbox,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Moon,
  Paperclip,
  PenLine,
  Phone,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Send,
  Settings2,
  Shield,
  Sparkles,
  TriangleAlert,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
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
import { APP_DATA_KEYS } from "@/app/services/appDataApi";
import { useAppDataDocumentStore } from "@/app/hooks/useAppDataDocumentStore";
import { useLeaveGuard } from "@/app/components/leaveGuard";

const STORAGE_KEY = "lecompas_rps_signalements_v1";

const ICONS = {
  activity: Activity,
  battery: BatteryLow,
  brain: Brain,
  briefcase: Briefcase,
  building: Building2,
  cloud: CloudRain,
  clock: Clock,
  heart: Heart,
  hidden: EyeOff,
  home: Home,
  mail: Mail,
  messages: MessagesSquare,
  moon: Moon,
  phone: Phone,
  refresh: RefreshCw,
  scale: Scale,
  shield: Shield,
  sparkles: Sparkles,
  talk: MessageCircle,
  alert: TriangleAlert,
  user: UserRound,
  users: Users,
} as const;

type IconName = keyof typeof ICONS;

const TONES = {
  rose: { tile: "border-rose-200 bg-rose-50", icon: "bg-rose-600 text-white", ring: "ring-rose-400", dot: "bg-rose-600", label: "Rose" },
  amber: { tile: "border-amber-200 bg-amber-50", icon: "bg-amber-500 text-white", ring: "ring-amber-400", dot: "bg-amber-500", label: "Ambre" },
  sky: { tile: "border-sky-200 bg-sky-50", icon: "bg-sky-600 text-white", ring: "ring-sky-400", dot: "bg-sky-600", label: "Ciel" },
  violet: { tile: "border-violet-200 bg-violet-50", icon: "bg-violet-600 text-white", ring: "ring-violet-400", dot: "bg-violet-600", label: "Violet" },
  emerald: { tile: "border-emerald-200 bg-emerald-50", icon: "bg-emerald-600 text-white", ring: "ring-emerald-400", dot: "bg-emerald-600", label: "Émeraude" },
  teal: { tile: "border-teal-200 bg-teal-50", icon: "bg-teal-600 text-white", ring: "ring-teal-400", dot: "bg-teal-600", label: "Sarcelle" },
  orange: { tile: "border-orange-200 bg-orange-50", icon: "bg-orange-500 text-white", ring: "ring-orange-400", dot: "bg-orange-500", label: "Orange" },
  slate: { tile: "border-slate-200 bg-slate-50", icon: "bg-slate-600 text-white", ring: "ring-slate-400", dot: "bg-slate-600", label: "Ardoise" },
} as const;

type Tone = keyof typeof TONES;

const ICON_LABELS: Record<IconName, string> = {
  activity: "Santé",
  battery: "Fatigue",
  brain: "Concentration",
  briefcase: "Travail",
  building: "Service",
  cloud: "Poids",
  clock: "Temps",
  heart: "Écoute",
  hidden: "Discrétion",
  home: "Locaux",
  mail: "Message",
  messages: "Échange",
  moon: "Sommeil",
  phone: "Appel",
  refresh: "Répétition",
  scale: "Charge",
  shield: "Protection",
  sparkles: "Autre",
  talk: "Parole",
  alert: "Urgence",
  user: "Personne",
  users: "Groupe",
};

interface Proposal {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  tone: Tone;
  active: boolean;
}

interface FormCatalog {
  feelings: Proposal[];
  relations: Proposal[];
  impacts: Proposal[];
  outcomes: Proposal[];
  frequencies: Proposal[];
  urgencies: Proposal[];
  contacts: Proposal[];
}

const option = (id: string, label: string, icon: IconName, tone: Tone, hint = ""): Proposal => ({ id, label, hint, icon, tone, active: true });

const DEFAULT_CATALOG: FormCatalog = {
  feelings: [
    option("feel-fatigue", "Fatigue ou épuisement", "battery", "amber"),
    option("feel-isolement", "Isolement", "user", "violet"),
    option("feel-tension", "Tension ou conflit", "messages", "rose"),
    option("feel-surcharge", "Surcharge", "scale", "orange"),
    option("feel-sens", "Perte de sens", "cloud", "slate"),
    option("feel-blessant", "Situation blessante", "shield", "rose"),
    option("feel-sante", "Inquiétude pour ma santé", "activity", "teal"),
    option("feel-autre", "Autre", "sparkles", "sky"),
  ],
  relations: [
    option("rel-hierarchie", "Avec la hiérarchie", "building", "violet"),
    option("rel-collegues", "Avec des collègues", "users", "sky"),
    option("rel-orga", "Organisation du travail", "briefcase", "amber"),
    option("rel-charge", "Charge et délais", "clock", "orange"),
    option("rel-public", "Public ou usagers", "messages", "teal"),
    option("rel-locaux", "Locaux et conditions", "home", "emerald"),
  ],
  impacts: [
    option("imp-sommeil", "Sommeil", "moon", "violet"),
    option("imp-concentration", "Concentration", "brain", "sky"),
    option("imp-moral", "Moral", "cloud", "rose"),
    option("imp-sante", "Santé", "activity", "teal"),
    option("imp-relations", "Relations", "users", "amber"),
    option("imp-motivation", "Motivation", "sparkles", "emerald"),
  ],
  outcomes: [
    option("out-ecoute", "Être écouté", "talk", "sky"),
    option("out-amenagement", "Un aménagement", "clock", "amber"),
    option("out-mediation", "Une médiation", "users", "violet"),
    option("out-protection", "Une protection", "shield", "rose"),
    option("out-suivi", "Un suivi dans le temps", "clock", "emerald"),
  ],
  frequencies: [
    option("freq-une", "Une fois", "sparkles", "slate"),
    option("freq-revient", "Cela revient", "refresh", "amber"),
    option("freq-permanent", "C'est devenu permanent", "alert", "rose"),
  ],
  urgencies: [
    option("urg-parler", "Je veux en parler", "talk", "sky", "Un échange peut attendre."),
    option("urg-pese", "La situation pèse", "scale", "amber", "Elle occupe le quotidien."),
    option("urg-vite", "J'ai besoin d'être reçu vite", "alert", "rose", "Un contact rapide est nécessaire."),
  ],
  contacts: [
    option("ctc-entretien", "Un entretien", "users", "violet"),
    option("ctc-message", "Un message", "mail", "sky"),
    option("ctc-appel", "Un appel", "phone", "teal"),
    option("ctc-aucun", "Pas de contact", "hidden", "slate"),
  ],
};

const CATALOG_SECTIONS: { key: keyof FormCatalog; title: string; help: string }[] = [
  { key: "feelings", title: "Ce qui vous pèse", help: "Plusieurs réponses possibles." },
  { key: "frequencies", title: "Fréquence", help: "Un seul choix." },
  { key: "relations", title: "Cela concerne surtout", help: "Plusieurs réponses possibles." },
  { key: "impacts", title: "Ce que cela change", help: "Plusieurs réponses possibles." },
  { key: "outcomes", title: "Ce que vous attendez", help: "Un seul choix." },
  { key: "urgencies", title: "L'urgence pour vous", help: "Un seul choix. La précision s'affiche sous le titre." },
  { key: "contacts", title: "Contact souhaité", help: "Un seul choix." },
];

const STATUSES = ["Reçu", "En étude", "Action en cours", "Clos"] as const;
const ACTION_STATUSES = ["À faire", "En cours", "Fait"] as const;
const STEPS = ["Ce que vous vivez", "Le contexte", "Comment vous joindre", "Relecture"];

const STATUS_STYLE: Record<(typeof STATUSES)[number], string> = {
  Reçu: "bg-sky-100 text-sky-800 ring-sky-200",
  "En étude": "bg-amber-100 text-amber-900 ring-amber-200",
  "Action en cours": "bg-violet-100 text-violet-800 ring-violet-200",
  Clos: "bg-emerald-100 text-emerald-800 ring-emerald-200",
};

type Status = (typeof STATUSES)[number];
type ActionStatus = (typeof ACTION_STATUSES)[number];
type Screen = "deposer" | "suivi" | "cellule" | "organisation";
export interface DirectoryPerson {
  id: string;
  name: string;
  email: string;
  service?: string;
}

interface CellMember {
  id: string;
  name: string;
  email: string;
}

interface WorkCell {
  id: string;
  name: string;
  mission: string;
  members: CellMember[];
  createdAt: string;
}

interface FollowUpAction {
  id: string;
  title: string;
  detail: string;
  ownerName: string;
  dueDate: string;
  status: ActionStatus;
  createdAt: string;
}

interface Attachment {
  id: string;
  name: string;
  mime: string;
  dataUrl: string;
}

interface ThreadMessage {
  id: string;
  at: string;
  authorId: string;
  authorName: string;
  fromCell: boolean;
  body: string;
  attachments: Attachment[];
}

interface Signalement {
  id: string;
  reference: string;
  createdAt: string;
  anonymous: boolean;
  authorId: string;
  authorName: string;
  authorEmail: string;
  cellId: string;
  cellName: string;
  feelings: string[];
  situation: string;
  since: string;
  frequency: string;
  workplace: string;
  relations: string[];
  impacts: string[];
  alreadySpoken: string;
  outcome: string;
  urgency: string;
  contact: string;
  availability: string;
  status: Status;
  publicUpdate: string;
  actions: FollowUpAction[];
  messages?: ThreadMessage[];
  notifyEmail?: string;
}

const ACTION_STYLE: Record<ActionStatus, string> = {
  "À faire": "border-amber-300 bg-amber-50",
  "En cours": "border-sky-300 bg-sky-50",
  Fait: "border-emerald-300 bg-emerald-50",
};

interface Store {
  cells: WorkCell[];
  reports: Signalement[];
  catalog?: Partial<FormCatalog>;
}

const EMPTY_STORE: Store = { cells: [], reports: [] };
const lineInput = "h-12 w-full min-w-0 rounded-xl border border-rose-100 bg-white text-base text-stone-900 shadow-none placeholder:text-stone-400 focus-visible:border-rose-300 focus-visible:ring-2 focus-visible:ring-rose-100";

function loadStore(): Store | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || !Array.isArray(parsed.cells) || !Array.isArray(parsed.reports)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStore(value: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // La session garde les signalements si le navigateur refuse l'enregistrement.
  }
}

function formatDay(value?: string) {
  if (!value) return "";
  if (!value.includes("T")) {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return value;
    return new Date(year, month - 1, day).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  }
  return new Date(value).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "?";
}

const AVATARS = ["bg-rose-100 text-rose-800", "bg-amber-100 text-amber-800", "bg-sky-100 text-sky-800", "bg-violet-100 text-violet-800", "bg-emerald-100 text-emerald-800", "bg-teal-100 text-teal-800"];

function avatarTone(name: string) {
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return AVATARS[sum % AVATARS.length];
}

function iconOf(name: string): LucideIcon {
  return name in ICONS ? ICONS[name as IconName] : Sparkles;
}

function toneOf(name: string) {
  return name in TONES ? TONES[name as Tone] : TONES.rose;
}

function catalogFrom(store: Store): FormCatalog {
  const saved = store.catalog;
  const pick = (key: keyof FormCatalog): Proposal[] => {
    const list = saved?.[key];
    if (!Array.isArray(list) || list.length === 0) return DEFAULT_CATALOG[key];
    return list.map((item, index) => ({
      id: item?.id || `${key}-${index}`,
      label: item?.label?.trim() || "Proposition",
      hint: item?.hint || "",
      icon: item?.icon in ICONS ? item.icon : "sparkles",
      tone: item?.tone in TONES ? item.tone : "rose",
      active: item?.active !== false,
    }));
  };
  return {
    feelings: pick("feelings"),
    relations: pick("relations"),
    impacts: pick("impacts"),
    outcomes: pick("outcomes"),
    frequencies: pick("frequencies"),
    urgencies: pick("urgencies"),
    contacts: pick("contacts"),
  };
}

function openPicker(input: HTMLInputElement | null) {
  if (!input) return;
  input.focus();
  try {
    input.showPicker?.();
  } catch {
    input.click();
  }
}

function paintPageChrome(pdf: jsPDF, page: number, pages: number, footer: string) {
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  pdf.setFillColor(0, 85, 164);
  pdf.rect(0, 0, width / 3, 6, "F");
  pdf.setFillColor(255, 255, 255);
  pdf.rect(width / 3, 0, width / 3, 6, "F");
  pdf.setFillColor(239, 65, 53);
  pdf.rect((width / 3) * 2, 0, width / 3, 6, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(0, 35, 90);
  pdf.text("RÉPUBLIQUE FRANÇAISE", 46, 26);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(80, 80, 85);
  pdf.text("Liberté  ·  Égalité  ·  Fraternité", 46, 38);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(136, 19, 55);
  pdf.text("DIRM MÉDITERRANÉE", width - 46, 26, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(80, 80, 85);
  pdf.text("Santé et sécurité au travail", width - 46, 38, { align: "right" });
  pdf.setDrawColor(226, 206, 210);
  pdf.setLineWidth(0.6);
  pdf.line(46, 48, width - 46, 48);
  pdf.setFontSize(8);
  pdf.setTextColor(120, 113, 108);
  pdf.text(footer, 46, height - 26);
  pdf.text(`Page ${page} / ${pages}`, width - 46, height - 26, { align: "right" });
  pdf.setFontSize(7);
  pdf.text("Diffusion limitée à la cellule de travail et à la personne concernée.", width / 2, height - 14, { align: "center" });
}

function clipText(pdf: jsPDF, value: string, max: number) {
  let text = value || "—";
  if (pdf.getTextWidth(text) <= max) return text;
  while (text.length > 1 && pdf.getTextWidth(`${text}…`) > max) text = text.slice(0, -1);
  return `${text}…`;
}

function downloadSignalementPdf(report: Signalement) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  const margin = 46;
  const inner = width - margin * 2;
  let y = 136;

  const ensure = (needed: number) => {
    if (y + needed <= height - 48) return;
    pdf.addPage();
    y = 72;
  };
  const band = (title: string, rgb: [number, number, number]) => {
    ensure(34);
    pdf.setFillColor(...rgb);
    pdf.roundedRect(margin, y, inner, 20, 3, 3, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text(title, margin + 10, y + 14);
    y += 30;
  };
  const paragraph = (body: string) => {
    const lines = pdf.splitTextToSize(body || "—", inner);
    ensure(lines.length * 14 + 8);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(41, 37, 36);
    pdf.text(lines, margin, y);
    y += lines.length * 14 + 12;
  };

  pdf.setFont("times", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(76, 5, 25);
  pdf.text("Fiche de signalement", margin, 72);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(136, 19, 55);
  pdf.text("CONFIDENTIEL", width - margin, 72, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(87, 83, 78);
  pdf.text(`${report.reference}   ·   ${formatDay(report.createdAt)}   ·   ${report.cellName}`, margin, 90);
  const stage = Math.max(0, STATUSES.indexOf(report.status));
  const slot = inner / STATUSES.length;
  STATUSES.forEach((status, index) => {
    const x = margin + index * slot;
    pdf.setFillColor(index <= stage ? 190 : 231, index <= stage ? 18 : 229, index <= stage ? 60 : 228);
    pdf.roundedRect(x, 102, slot - 6, 8, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(index === stage ? 136 : 120, index === stage ? 19 : 113, index === stage ? 55 : 108);
    pdf.text(status, x, 122);
  });

  band("Situation", [190, 18, 60]);
  paragraph(`${report.feelings.join("  ·  ")}\n\n${report.situation}`);
  band("Contexte", [3, 105, 161]);
  paragraph(`Depuis le ${formatDay(report.since)}. ${report.frequency}.\nLieu : ${report.workplace}.\nCela concerne : ${report.relations.join(", ")}.\nEffets : ${report.impacts.join(", ")}.\n${report.alreadySpoken ? `Déjà évoqué : ${report.alreadySpoken}` : "La personne n'a pas indiqué en avoir déjà parlé."}`);
  band("Suite souhaitée", [109, 40, 217]);
  paragraph(`${report.outcome}\nUrgence : ${report.urgency}\nContact souhaité : ${report.contact}${report.availability ? `\nDisponibilités : ${report.availability}` : ""}`);
  band("Actions engagées", [180, 83, 9]);
  if (report.actions.length === 0) paragraph("Aucune action enregistrée.");
  report.actions.forEach((action) => {
    const lines = pdf.splitTextToSize(`${action.status}  —  ${action.title}${action.ownerName ? `  ·  ${action.ownerName}` : ""}${action.dueDate ? `  ·  échéance ${formatDay(action.dueDate)}` : ""}${action.detail ? `\n${action.detail}` : ""}`, inner - 16);
    ensure(lines.length * 13 + 16);
    pdf.setFillColor(255, 247, 237);
    pdf.roundedRect(margin, y, inner, lines.length * 13 + 10, 3, 3, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(67, 20, 7);
    pdf.text(lines, margin + 8, y + 14);
    y += lines.length * 13 + 18;
  });
  band("Échanges", [14, 116, 144]);
  const messages = report.messages || [];
  if (messages.length === 0 && !report.publicUpdate) paragraph("Aucun échange enregistré.");
  if (report.publicUpdate) paragraph(`Message transmis : ${report.publicUpdate}`);
  messages.forEach((message) => {
    const who = message.fromCell ? `Cellule · ${message.authorName || "Membre"}` : report.anonymous ? "Personne concernée" : message.authorName || "Personne concernée";
    const files = message.attachments?.length ? `\nPièces jointes : ${message.attachments.map((file) => file.name).join(", ")}` : "";
    paragraph(`${who} · ${formatDay(message.at)}\n${message.body || "Pièce jointe"}${files}`);
  });
  band("Identité", [68, 64, 60]);
  paragraph(report.anonymous ? "La personne a demandé à rester anonyme. Son nom ne figure pas sur cette fiche." : `${report.authorName || "—"}${report.authorEmail ? `\n${report.authorEmail}` : ""}`);

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    paintPageChrome(pdf, page, pages, "DIRM Méditerranée  ·  Fiche de signalement RPS");
  }
  pdf.save(`${report.reference}.pdf`);
}

function downloadRegisterPdf(reports: Signalement[], cellName: string) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  const margin = 46;
  const columns = [
    { title: "Référence", width: 78 },
    { title: "Date", width: 88 },
    { title: "Statut", width: 78 },
    { title: "Urgence", width: 100 },
    { title: "Lieu", width: 90 },
    { title: "Personne", width: width - margin * 2 - 434 },
  ];
  let y = 118;
  const drawHeader = () => {
    pdf.setFont("times", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(76, 5, 25);
    pdf.text("Registre de la cellule", margin, 72);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(87, 83, 78);
    pdf.text(`${cellName}   ·   ${reports.length} signalement(s)   ·   Confidentiel`, margin, 90);
    y = 108;
    pdf.setFillColor(136, 19, 55);
    pdf.rect(margin, y, width - margin * 2, 22, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    let x = margin;
    columns.forEach((column) => {
      pdf.text(column.title, x + 6, y + 14);
      x += column.width;
    });
    y += 22;
  };
  drawHeader();
  reports.forEach((report, index) => {
    if (y > 760) {
      pdf.addPage();
      drawHeader();
    }
    if (index % 2 === 0) {
      pdf.setFillColor(255, 241, 242);
      pdf.rect(margin, y, width - margin * 2, 22, "F");
    }
    const values = [report.reference, formatDay(report.createdAt), report.status, report.urgency, report.workplace, report.anonymous ? "Anonyme" : report.authorName || "Identifié"];
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(41, 37, 36);
    let x = margin;
    values.forEach((value, column) => {
      pdf.text(clipText(pdf, value, columns[column].width - 12), x + 6, y + 14);
      x += columns[column].width;
    });
    y += 22;
  });
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    paintPageChrome(pdf, page, pages, "DIRM Méditerranée  ·  Registre RPS");
  }
  pdf.save("Registre_cellule_RPS.pdf");
}

function FieldLegend({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h3 className="text-[15px] font-semibold text-stone-900">{title}</h3>
      <p className="text-[12px] text-stone-500">{hint}</p>
    </div>
  );
}

function ProposalTile({ item, active, onClick }: { item: Proposal; active: boolean; onClick: () => void }) {
  const Icon = iconOf(item.icon);
  const tone = toneOf(item.tone);
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`flex min-h-[68px] w-full min-w-0 items-center gap-3 rounded-2xl border p-3 text-left ${active ? `${tone.tile} ring-2 ${tone.ring}` : "border-stone-200 bg-white hover:border-stone-300"}`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}><Icon className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium leading-5 text-stone-900">{item.label}</span>
        {item.hint ? <span className="mt-0.5 block text-[13px] leading-5 text-stone-600">{item.hint}</span> : null}
      </span>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${active ? tone.icon : "border border-stone-300 bg-white"}`}>{active ? <Check className="h-3 w-3" /> : null}</span>
    </button>
  );
}

function ChoiceGrid({ items, selected, onToggle }: { items: Proposal[]; selected: string[]; onToggle: (label: string) => void }) {
  const visible = items.filter((item) => item.active);
  return (
    <div className={`grid grid-cols-1 gap-2 ${visible.length > 3 ? "min-[520px]:grid-cols-2" : ""}`}>
      {visible.map((item) => <ProposalTile key={item.id} item={item} active={selected.includes(item.label)} onClick={() => onToggle(item.label)} />)}
    </div>
  );
}

function ChoiceChips({ labels, source }: { labels: string[]; source: Proposal[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label) => {
        const item = source.find((entry) => entry.label === label);
        const Icon = iconOf(item?.icon || "sparkles");
        const tone = toneOf(item?.tone || "slate");
        return <span key={label} className={`inline-flex max-w-full items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[13px] font-medium text-stone-800 ${tone.tile}`}><Icon className="h-3.5 w-3.5 shrink-0" /><span className="min-w-0 break-words">{label}</span></span>;
      })}
    </div>
  );
}

function DateField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id} className="px-1 text-[13px] font-medium text-stone-600">{label}</Label>
      <div className="relative">
        <Input ref={ref} id={id} type="date" value={value} onChange={(event) => onChange(event.target.value)} className={`${lineInput} pl-3 pr-12 [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0`} />
        <button type="button" aria-label={`Ouvrir le calendrier pour ${label}`} onClick={() => openPicker(ref.current)} className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100">
          <Calendar className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function IconField({ id, label, icon: Icon, value, onChange, placeholder, listId }: { id: string; label: string; icon: LucideIcon; value: string; onChange: (value: string) => void; placeholder?: string; listId?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id} className="px-1 text-[13px] font-medium text-stone-600">{label}</Label>
      <div className="relative">
        <button type="button" aria-label={`Placer le curseur dans ${label}`} onClick={() => ref.current?.focus()} className="absolute left-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100">
          <Icon className="h-4 w-4" />
        </button>
        <Input ref={ref} id={id} list={listId} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`${lineInput} pl-12`} />
      </div>
    </div>
  );
}

function NotedText({ id, label, value, onChange, placeholder, minHeight = "min-h-[120px]" }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder?: string; minHeight?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2 px-1 text-[13px] font-medium text-stone-600">
        <button type="button" aria-label={`Placer le curseur dans ${label}`} onClick={() => ref.current?.focus()} className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100">
          <MessageSquare className="h-3.5 w-3.5" />
        </button>
        {label}
      </Label>
      <Textarea ref={ref} id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`${minHeight} rounded-2xl border border-rose-100 bg-white px-4 py-3 text-base leading-6 text-stone-900 shadow-none focus-visible:border-rose-300 focus-visible:ring-2 focus-visible:ring-rose-100`} />
    </div>
  );
}

export function SignalementsView({
  accessToken, currentUserId, currentUserName, currentUserEmail, isAdmin, directory, serviceOptions, onNotify,
}: {
  accessToken: string;
  currentUserId: string;
  currentUserName: string;
  currentUserEmail: string;
  isAdmin: boolean;
  directory: DirectoryPerson[];
  serviceOptions: string[];
  onNotify: (notice: { titre: string; contenu: string; recipientEmail?: string }) => void;
}) {
  const [store, setStore] = useAppDataDocumentStore<Store>(APP_DATA_KEYS.rpsSignalements, accessToken, { seed: EMPTY_STORE, loadLocal: loadStore, saveLocal: saveStore });
  const [screen, setScreen] = useState<Screen>("deposer");
  const [step, setStep] = useState(1);
  const [tried, setTried] = useState(false);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [situation, setSituation] = useState("");
  const [since, setSince] = useState("");
  const [frequency, setFrequency] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [relations, setRelations] = useState<string[]>([]);
  const [impacts, setImpacts] = useState<string[]>([]);
  const [alreadySpoken, setAlreadySpoken] = useState("");
  const [outcome, setOutcome] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [urgency, setUrgency] = useState("");
  const [contact, setContact] = useState("");
  const [availability, setAvailability] = useState("");
  const [cellId, setCellId] = useState("");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [actionTitle, setActionTitle] = useState("");
  const [actionDetail, setActionDetail] = useState("");
  const [actionOwner, setActionOwner] = useState("");
  const [actionDue, setActionDue] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupMission, setGroupMission] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [memberQuery, setMemberQuery] = useState("");
  const [cellToDelete, setCellToDelete] = useState<WorkCell | null>(null);

  const catalog = catalogFrom(store);
  const dirty = screen === "deposer" && (feelings.length > 0 || situation.trim().length > 0 || relations.length > 0 || impacts.length > 0);
  const requestLeave = useLeaveGuard(dirty);
  const cells = store.cells;
  const myCells = cells.filter((cell) => isAdmin || cell.members.some((member) => member.email.toLowerCase() === currentUserEmail.toLowerCase()));
  const canHandle = isAdmin || myCells.length > 0;
  const myReports = store.reports.filter((report) => report.authorId === currentUserId);
  const cellReports = store.reports.filter((report) => isAdmin || myCells.some((cell) => cell.id === report.cellId));
  const selectedReport = [...cellReports, ...myReports].find((report) => report.id === selectedReportId) ?? null;

  const filteredPeople = useMemo(() => {
    const needle = memberQuery.trim().toLowerCase();
    return directory.filter((person) => !needle || `${person.name} ${person.email} ${person.service || ""}`.toLowerCase().includes(needle));
  }, [directory, memberQuery]);
  const selectedPeople = directory.filter((person) => groupMembers.includes(person.id));

  const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  const chooseOne = (current: string, value: string) => (current === value ? "" : value);

  const resetForm = () => {
    setStep(1); setTried(false); setFeelings([]); setSituation(""); setSince(""); setFrequency(""); setWorkplace("");
    setRelations([]); setImpacts([]); setAlreadySpoken(""); setOutcome(""); setAnonymous(false);
    setUrgency(""); setContact(""); setAvailability(""); setCellId("");
  };

  const stepValid = (index: number) => {
    if (index === 1) return feelings.length > 0 && situation.trim().length >= 20 && Boolean(since) && Boolean(frequency) && Boolean(workplace.trim());
    if (index === 2) return relations.length > 0 && impacts.length > 0 && Boolean(outcome);
    if (index === 3) return Boolean(urgency) && Boolean(contact) && (cells.length === 0 || Boolean(cellId));
    return true;
  };

  const missing = (index: number) => {
    if (index === 1) {
      if (!feelings.length) return "Choisissez au moins ce qui vous pèse.";
      if (situation.trim().length < 20) return "Décrivez la situation en quelques lignes.";
      if (!since) return "Indiquez depuis quand.";
      if (!frequency) return "Indiquez si cela revient.";
      if (!workplace.trim()) return "Indiquez le lieu ou le service.";
    }
    if (index === 2) {
      if (!relations.length) return "Indiquez ce que cela concerne.";
      if (!impacts.length) return "Indiquez ce que cela change pour vous.";
      if (!outcome) return "Indiquez ce que vous attendez.";
    }
    if (index === 3) {
      if (!urgency) return "Indiquez l'urgence pour vous.";
      if (!contact) return "Indiquez le contact souhaité.";
      if (cells.length > 0 && !cellId) return "Choisissez la cellule destinataire.";
    }
    return "";
  };

  const submitReport = () => {
    if (![1, 2, 3].every(stepValid)) {
      toast.error("Certaines réponses manquent encore.");
      return;
    }
    const cell = cells.find((item) => item.id === cellId);
    const reference = `SIG-${new Date().getFullYear()}-${String(store.reports.length + 1).padStart(3, "0")}`;
    const report: Signalement = {
      id: `sig-${Date.now()}`,
      reference,
      createdAt: new Date().toISOString(),
      anonymous,
      authorId: currentUserId,
      authorName: anonymous ? "" : currentUserName,
      authorEmail: anonymous ? "" : currentUserEmail,
      cellId: cell?.id || "",
      cellName: cell?.name || "À orienter",
      feelings, situation: situation.trim(), since, frequency, workplace: workplace.trim(),
      relations, impacts, alreadySpoken: alreadySpoken.trim(), outcome, urgency, contact,
      availability: availability.trim(), status: "Reçu", publicUpdate: "", actions: [], messages: [], notifyEmail: currentUserEmail,
    };
    setStore((current) => ({ ...current, reports: [report, ...current.reports] }));
    (cell?.members || []).filter((member) => member.email.toLowerCase() !== currentUserEmail.toLowerCase()).forEach((member) => {
      onNotify({
        titre: "Nouveau signalement",
        contenu: `${reference} est arrivé pour ${cell?.name}. ${anonymous ? "La personne reste anonyme." : "La personne a laissé son nom."}`,
        recipientEmail: member.email,
      });
    });
    toast.success(cell ? `${reference} est transmis à ${cell.name}.` : `${reference} est enregistré. Il sera orienté vers une cellule.`);
    resetForm();
    setScreen("suivi");
    setSelectedReportId(report.id);
  };

  const saveCell = () => {
    if (!groupName.trim() || groupMembers.length === 0) {
      toast.error("Nommez le groupe et désignez au moins une personne.");
      return;
    }
    const members = selectedPeople.map((person) => ({ id: person.id, name: person.name, email: person.email }));
    setStore((current) => editingCellId
      ? { ...current, cells: current.cells.map((cell) => cell.id === editingCellId ? { ...cell, name: groupName.trim(), mission: groupMission.trim(), members } : cell) }
      : { ...current, cells: [{ id: `cell-${Date.now()}`, name: groupName.trim(), mission: groupMission.trim(), members, createdAt: new Date().toISOString() }, ...current.cells] });
    toast.success(editingCellId ? "Le groupe est mis à jour." : "Le groupe de travail est créé.");
    setGroupName(""); setGroupMission(""); setGroupMembers([]); setEditingCellId(null); setMemberQuery("");
  };

  const updateReport = (next: Signalement, notice?: string) => {
    setStore((current) => ({ ...current, reports: current.reports.map((item) => item.id === next.id ? next : item) }));
    if (notice && next.authorEmail) onNotify({ titre: "Suivi de votre signalement", contenu: notice, recipientEmail: next.authorEmail });
  };

  const updateList = (key: keyof FormCatalog, items: Proposal[]) => {
    setStore((current) => ({ ...current, catalog: { ...catalogFrom(current), [key]: items } }));
  };

  const sendMessage = (report: Signalement, body: string, attachments: Attachment[], fromCell: boolean) => {
    const text = body.trim();
    if (!text && attachments.length === 0) { toast.error("Écrivez un message ou joignez un fichier."); return false; }
    const message: ThreadMessage = {
      id: `msg-${Date.now()}`,
      at: new Date().toISOString(),
      authorId: currentUserId,
      authorName: fromCell || !report.anonymous ? currentUserName : "",
      fromCell,
      body: text,
      attachments,
    };
    const next = { ...report, messages: [...(report.messages || []), message] };
    setStore((current) => ({ ...current, reports: current.reports.map((item) => item.id === next.id ? next : item) }));
    if (fromCell) {
      const email = report.notifyEmail || report.authorEmail;
      if (email) onNotify({ titre: "Message de la cellule", contenu: `${report.reference} : ${text || "Une pièce jointe a été ajoutée."}`, recipientEmail: email });
    } else {
      cells.filter((cell) => !report.cellId || cell.id === report.cellId).flatMap((cell) => cell.members).filter((member) => member.email.toLowerCase() !== currentUserEmail.toLowerCase()).forEach((member) => {
        onNotify({ titre: "Message sur un signalement", contenu: `${report.reference} : la personne a écrit à la cellule.`, recipientEmail: member.email });
      });
    }
    toast.success("Le message est envoyé.");
    return true;
  };

  const go = (next: Screen) => requestLeave(() => { setScreen(next); setSelectedReportId(null); });
  const visible: Screen = screen === "organisation" && !isAdmin ? "deposer" : screen === "cellule" && !canHandle ? "deposer" : screen;
  const tabs = [
    { id: "deposer" as const, short: "Déposer", full: "Déposer", icon: PenLine, active: "bg-rose-600 text-white" },
    { id: "suivi" as const, short: "Suivi", full: "Mon suivi", icon: Inbox, active: "bg-sky-600 text-white" },
    ...(canHandle ? [{ id: "cellule" as const, short: "Dossiers", full: "Dossiers", icon: FolderHeart, active: "bg-violet-600 text-white" }] : []),
    ...(isAdmin ? [{ id: "organisation" as const, short: "Cellules", full: "Cellules", icon: Settings2, active: "bg-amber-600 text-white" }] : []),
  ];
  const roleNote = isAdmin
    ? "Vous organisez les cellules, vous suivez tous les dossiers et vous pouvez écrire dans la messagerie."
    : canHandle
      ? `Vous êtes désigné dans ${myCells.map((cell) => cell.name).join(", ")}. Vous menez les actions et répondez aux personnes.`
      : "Vous déposez un signalement et suivez vos échanges. La conduite des dossiers est réservée aux personnes désignées.";

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-4 overflow-x-hidden text-stone-900">
      <header className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-rose-950 sm:text-3xl">Signalements</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600 sm:text-[15px]">{roleNote}</p>
        </div>
        <div className={`grid w-full gap-1 rounded-2xl bg-rose-100/80 p-1 ${tabs.length > 3 ? "grid-cols-2 sm:grid-cols-4" : tabs.length === 3 ? "grid-cols-3" : "grid-cols-2"} lg:w-auto`} role="tablist">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={visible === tab.id} onClick={() => go(tab.id)} className={`flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 text-[12px] font-medium sm:px-3 sm:text-[13px] ${visible === tab.id ? tab.active : "text-stone-600"}`}>
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="truncate sm:hidden">{tab.short}</span>
              <span className="hidden truncate sm:inline">{tab.full}</span>
            </button>
          ))}
        </div>
      </header>

      {visible === "deposer" ? (
        <form className="mx-auto w-full min-w-0 max-w-3xl" onSubmit={(event) => {
          event.preventDefault();
          if (step < 4) {
            if (!stepValid(step)) { setTried(true); toast.error(missing(step)); return; }
            setTried(false); setStep(step + 1); return;
          }
          submitReport();
        }}>
          <div className="mb-4 rounded-2xl bg-white p-3 ring-1 ring-rose-100">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-rose-950">Étape {step} sur 4</p>
              <p className="truncate text-sm text-stone-500">{STEPS[step - 1]}</p>
            </div>
            <div className="mt-3 flex gap-1.5" aria-hidden>
              {STEPS.map((label, index) => <span key={label} className={`h-1.5 flex-1 rounded-full ${index < step ? "bg-rose-600" : "bg-rose-100"}`} />)}
            </div>
            <ol className="mt-3 hidden gap-2 sm:grid sm:grid-cols-4">
              {STEPS.map((label, index) => {
                const number = index + 1;
                const done = step > number;
                const current = step === number;
                return (
                  <li key={label}>
                    <button type="button" disabled={number > step} onClick={() => { if (number < step) { setTried(false); setStep(number); } }} className={`flex w-full items-center gap-2 text-left text-[13px] ${current ? "font-semibold text-rose-800" : done ? "text-stone-700" : "text-stone-400"}`}>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${done || current ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-700"}`}>{done ? <Check className="h-3 w-3" /> : number}</span>
                      <span className="min-w-0 leading-4">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="space-y-5 rounded-3xl border border-rose-100 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-rose-950">{STEPS[step - 1]}</h2>
            {step === 1 ? (
              <>
                <div>
                  <FieldLegend title="Ce qui vous pèse" hint="Plusieurs choix" />
                  <ChoiceGrid items={catalog.feelings} selected={feelings} onToggle={(value) => setFeelings((current) => toggle(current, value))} />
                </div>
                <NotedText id="situation" label="La situation, avec vos mots" value={situation} onChange={setSituation} placeholder="Depuis quand, où, avec qui, et ce que cela change pour vous" />
                <p className={`px-1 text-[12px] ${situation.trim().length >= 20 ? "text-emerald-700" : "text-stone-500"}`}>{situation.trim().length} / 20 caractères</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DateField id="since" label="Depuis quand" value={since} onChange={setSince} />
                  <div>
                    <IconField id="workplace" label="Lieu ou service" icon={MapPin} value={workplace} onChange={setWorkplace} placeholder="Service, site, unité" listId="signalement-services" />
                    <datalist id="signalement-services">{serviceOptions.map((service) => <option key={service} value={service} />)}</datalist>
                  </div>
                </div>
                <div>
                  <FieldLegend title="Fréquence" hint="Un seul choix" />
                  <ChoiceGrid items={catalog.frequencies} selected={frequency ? [frequency] : []} onToggle={(value) => setFrequency((current) => chooseOne(current, value))} />
                </div>
              </>
            ) : null}
            {step === 2 ? (
              <>
                <div><FieldLegend title="Cela concerne surtout" hint="Plusieurs choix" /><ChoiceGrid items={catalog.relations} selected={relations} onToggle={(value) => setRelations((current) => toggle(current, value))} /></div>
                <div><FieldLegend title="Ce que cela change" hint="Plusieurs choix" /><ChoiceGrid items={catalog.impacts} selected={impacts} onToggle={(value) => setImpacts((current) => toggle(current, value))} /></div>
                <NotedText id="spoken" label="En avez-vous déjà parlé" value={alreadySpoken} onChange={setAlreadySpoken} placeholder="Facultatif" minHeight="min-h-[96px]" />
                <div><FieldLegend title="Ce que vous attendez" hint="Un seul choix" /><ChoiceGrid items={catalog.outcomes} selected={outcome ? [outcome] : []} onToggle={(value) => setOutcome((current) => chooseOne(current, value))} /></div>
              </>
            ) : null}
            {step === 3 ? (
              <>
                <div>
                  <FieldLegend title="Ce que la cellule peut connaître" hint="Un seul choix" />
                  <div className="grid grid-cols-1 gap-2">
                    <button type="button" aria-pressed={!anonymous} onClick={() => setAnonymous(false)} className={`flex min-h-[68px] items-center gap-3 rounded-2xl border p-3 text-left ${!anonymous ? "border-emerald-200 bg-emerald-50 ring-2 ring-emerald-400" : "border-stone-200 bg-white"}`}>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"><UserRound className="h-5 w-5" /></span>
                      <span className="min-w-0"><span className="block text-[15px] font-medium">Mon nom peut être lu</span><span className="block break-words text-[13px] text-stone-600">{currentUserName}</span></span>
                    </button>
                    <button type="button" aria-pressed={anonymous} onClick={() => setAnonymous(true)} className={`flex min-h-[68px] items-center gap-3 rounded-2xl border p-3 text-left ${anonymous ? "border-violet-200 bg-violet-50 ring-2 ring-violet-400" : "border-stone-200 bg-white"}`}>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white"><EyeOff className="h-5 w-5" /></span>
                      <span className="min-w-0"><span className="block text-[15px] font-medium">Rester anonyme</span><span className="block text-[13px] text-stone-600">Le nom n'apparaît ni à la cellule, ni sur le PDF.</span></span>
                    </button>
                  </div>
                </div>
                <div><FieldLegend title="L'urgence pour vous" hint="Un seul choix" /><ChoiceGrid items={catalog.urgencies} selected={urgency ? [urgency] : []} onToggle={(value) => setUrgency((current) => chooseOne(current, value))} /></div>
                <div><FieldLegend title="Contact souhaité" hint="Un seul choix" /><ChoiceGrid items={catalog.contacts} selected={contact ? [contact] : []} onToggle={(value) => setContact((current) => chooseOne(current, value))} /></div>
                <IconField id="availability" label="Disponibilités" icon={Clock} value={availability} onChange={setAvailability} placeholder="Par exemple mardi après-midi" />
                <div>
                  <FieldLegend title="Cellule destinataire" hint={cells.length ? "Un seul choix" : "Orientation ensuite"} />
                  {cells.length === 0 ? <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">Aucun groupe n'est encore constitué. Le signalement sera conservé pour être orienté.</p> : (
                    <div className="grid grid-cols-1 gap-2">
                      {cells.map((cell) => (
                        <button key={cell.id} type="button" aria-pressed={cellId === cell.id} onClick={() => setCellId(cell.id)} className={`flex min-h-[68px] items-center gap-3 rounded-2xl border p-3 text-left ${cellId === cell.id ? "border-violet-200 bg-violet-50 ring-2 ring-violet-400" : "border-stone-200 bg-white"}`}>
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white"><Users className="h-5 w-5" /></span>
                          <span className="min-w-0"><span className="block text-[15px] font-medium">{cell.name}</span><span className="block break-words text-[13px] text-stone-600">{cell.members.map((member) => member.name).join(", ")}</span></span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
            {step === 4 ? (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-stone-600">Relisez avant d'envoyer. La fiche PDF reste disponible ensuite.</p>
                <article className="space-y-3 rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
                  <ChoiceChips labels={feelings} source={catalog.feelings} />
                  <p className="text-[15px] leading-6">{situation}</p>
                  <p className="text-[13px] text-stone-600">Depuis le {formatDay(since)} · {frequency} · {workplace}</p>
                </article>
                <article className="space-y-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
                  <ChoiceChips labels={relations} source={catalog.relations} />
                  <ChoiceChips labels={impacts} source={catalog.impacts} />
                  <p className="text-sm text-stone-700">Attente : {outcome}</p>
                  <p className="text-sm text-stone-700">{anonymous ? "Anonyme. Le nom ne sera pas transmis." : `Nom transmis : ${currentUserName}.`}</p>
                  <p className="text-sm text-stone-700">{urgency} · {contact}</p>
                </article>
              </div>
            ) : null}
            {tried && missing(step) ? <p className="text-sm font-medium text-rose-700">{missing(step)}</p> : null}
            <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t border-rose-100 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <button type="button" onClick={() => { if (step === 1) requestLeave(resetForm); else { setTried(false); setStep(step - 1); } }} className="order-2 h-11 w-full rounded-xl px-4 text-[15px] font-medium text-stone-800 hover:bg-stone-100 sm:order-1 sm:w-auto">{step === 1 ? "Effacer" : "Retour"}</button>
              <button type="submit" className="order-1 h-11 w-full rounded-xl bg-rose-700 px-5 text-[15px] font-medium text-white hover:bg-rose-800 sm:order-2 sm:w-auto">{step < 4 ? "Continuer" : "Envoyer le signalement"}</button>
            </div>
          </div>
        </form>
      ) : null}

      {visible === "suivi" ? (
        <CaseWorkspace reports={myReports} selected={myReports.find((report) => report.id === selectedReportId) ?? null} empty="Aucun signalement déposé depuis ce compte." onSelect={setSelectedReportId} viewer="author" canAct={false} onSendMessage={sendMessage} />
      ) : null}

      {visible === "cellule" ? (
        <div className="space-y-4">
          {!isAdmin ? <CellRoster cells={myCells} /> : null}
          <CaseWorkspace
            reports={cellReports}
            selected={cellReports.find((report) => report.id === selectedReportId) ?? null}
            empty="Aucun signalement pour vos cellules."
            onSelect={setSelectedReportId}
            viewer="cell"
            canAct
            onDownloadRegister={cellReports.length > 0 ? () => downloadRegisterPdf(cellReports, myCells[0]?.name || cells[0]?.name || "Cellule de travail") : undefined}
            actionTitle={actionTitle}
            setActionTitle={setActionTitle}
            actionDetail={actionDetail}
            setActionDetail={setActionDetail}
            actionOwner={actionOwner}
            setActionOwner={setActionOwner}
            actionDue={actionDue}
            setActionDue={setActionDue}
            members={cells.find((cell) => cell.id === selectedReport?.cellId)?.members || myCells[0]?.members || []}
            onStatus={(status) => selectedReport && updateReport({ ...selectedReport, status }, `${selectedReport.reference} est maintenant « ${status} ».`)}
            onAction={() => {
              if (!selectedReport || !actionTitle.trim()) { toast.error("Indiquez l'action à mener."); return; }
              const action: FollowUpAction = { id: `act-${Date.now()}`, title: actionTitle.trim(), detail: actionDetail.trim(), ownerName: actionOwner, dueDate: actionDue, status: "À faire", createdAt: new Date().toISOString() };
              updateReport({ ...selectedReport, status: selectedReport.status === "Reçu" || selectedReport.status === "En étude" ? "Action en cours" : selectedReport.status, actions: [action, ...selectedReport.actions] }, `${selectedReport.reference} : une action est engagée, « ${action.title} ».`);
              setActionTitle(""); setActionDetail(""); setActionOwner(""); setActionDue("");
              toast.success("L'action est ajoutée.");
            }}
            onActionStatus={(actionId, status) => selectedReport && updateReport({ ...selectedReport, actions: selectedReport.actions.map((action) => action.id === actionId ? { ...action, status } : action) })}
            onSendMessage={sendMessage}
          />
        </div>
      ) : null}

      {visible === "organisation" ? (
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(280px,440px)_minmax(0,1fr)]">
          <GroupEditor
            editing={Boolean(editingCellId)}
            name={groupName}
            mission={groupMission}
            people={filteredPeople}
            selected={selectedPeople}
            query={memberQuery}
            cells={cells}
            openCounts={Object.fromEntries(cells.map((cell) => [cell.id, store.reports.filter((report) => report.cellId === cell.id && report.status !== "Clos").length]))}
            onName={setGroupName}
            onMission={setGroupMission}
            onQuery={setMemberQuery}
            onToggle={(id) => setGroupMembers((current) => toggle(current, id))}
            onSave={saveCell}
            onCancel={() => { setEditingCellId(null); setGroupName(""); setGroupMission(""); setGroupMembers([]); setMemberQuery(""); }}
            onEdit={(cell) => { setEditingCellId(cell.id); setGroupName(cell.name); setGroupMission(cell.mission); setGroupMembers(cell.members.map((member) => member.id)); }}
            onDelete={setCellToDelete}
          />
          <section className="min-w-0 space-y-3">
            <h2 className="text-lg font-semibold text-amber-950">Propositions du formulaire</h2>
            <p className="text-sm leading-6 text-stone-600">Ces listes alimentent le dépôt. Les dossiers déjà enregistrés gardent le texte d'origine.</p>
            {CATALOG_SECTIONS.map((section) => (
              <ProposalEditor key={section.key} title={section.title} help={section.help} items={catalog[section.key]} onChange={(items) => updateList(section.key, items)} />
            ))}
          </section>
        </div>
      ) : null}

      <AlertDialog open={Boolean(cellToDelete)} onOpenChange={(open) => { if (!open) setCellToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce groupe ?</AlertDialogTitle>
            <AlertDialogDescription>{cellToDelete ? `${cellToDelete.name} ne recevra plus de signalement. Les dossiers déjà ouverts restent lisibles.` : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-700 hover:bg-rose-800" onClick={() => { if (!cellToDelete) return; setStore((current) => ({ ...current, cells: current.cells.filter((cell) => cell.id !== cellToDelete.id) })); setCellToDelete(null); }}>Retirer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GroupEditor({
  editing, name, mission, people, selected, query, cells, openCounts, onName, onMission, onQuery, onToggle, onSave, onCancel, onEdit, onDelete,
}: {
  editing: boolean;
  name: string;
  mission: string;
  people: DirectoryPerson[];
  selected: DirectoryPerson[];
  query: string;
  cells: WorkCell[];
  openCounts: Record<string, number>;
  onName: (value: string) => void;
  onMission: (value: string) => void;
  onQuery: (value: string) => void;
  onToggle: (id: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: (cell: WorkCell) => void;
  onDelete: (cell: WorkCell) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-4 rounded-3xl border border-violet-100 bg-white p-4">
        <h2 className="text-lg font-semibold text-violet-950">{editing ? "Modifier la cellule" : "Créer une cellule"}</h2>
        <p className="text-sm leading-6 text-stone-600">Donnez un nom, une mission, puis désignez au moins une personne. Elle verra les dossiers et pourra mener les actions.</p>
        <IconField id="cell-name" label="Nom" icon={Users} value={name} onChange={onName} placeholder="Cellule d'écoute" />
        <NotedText id="cell-mission" label="Mission" value={mission} onChange={onMission} placeholder="Écouter, orienter, suivre" minHeight="min-h-[84px]" />
        <PeoplePicker people={people} selected={selected} query={query} onQuery={onQuery} onToggle={onToggle} />
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {editing ? <button type="button" onClick={onCancel} className="h-11 rounded-xl px-4 text-[15px] font-medium hover:bg-stone-100">Annuler</button> : null}
          <button type="button" onClick={onSave} className="h-11 rounded-xl bg-violet-700 px-5 text-[15px] font-medium text-white hover:bg-violet-800">{editing ? "Enregistrer la cellule" : "Créer la cellule"}</button>
        </div>
      </div>
      {cells.length === 0 ? <p className="rounded-2xl border border-dashed border-violet-200 px-4 py-6 text-sm text-stone-500">Aucune cellule pour le moment.</p> : null}
      <div className="grid grid-cols-1 gap-3">
      {cells.map((cell) => (
        <article key={cell.id} className="rounded-3xl border border-violet-200 bg-gradient-to-br from-white to-violet-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-semibold text-violet-950">{cell.name}</p>
              <p className="mt-1 text-sm leading-5 text-stone-600">{cell.mission || "Mission à préciser."}</p>
            </div>
            <span className="shrink-0 rounded-lg bg-amber-100 px-2 py-1 text-[12px] font-medium text-amber-900 ring-1 ring-amber-200">{openCounts[cell.id] || 0} ouvert{(openCounts[cell.id] || 0) > 1 ? "s" : ""}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {cell.members.map((member) => (
              <span key={member.id} className="inline-flex max-w-full items-center gap-2 rounded-xl bg-white py-1 pl-1 pr-3 text-[13px] ring-1 ring-violet-100">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-semibold ${avatarTone(member.name)}`}>{initials(member.name)}</span>
                <span className="min-w-0"><span className="block truncate font-medium">{member.name}</span><span className="block truncate text-[11px] text-stone-500">{member.email}</span></span>
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => onEdit(cell)} className="h-10 rounded-xl bg-violet-700 px-3 text-[13px] font-medium text-white">Modifier</button>
            <button type="button" onClick={() => onDelete(cell)} className="h-10 rounded-xl px-3 text-[13px] font-medium text-rose-700 hover:bg-rose-50">Retirer</button>
          </div>
        </article>
      ))}
      </div>
    </div>
  );
}

function ProposalEditor({ title, help, items, onChange }: { title: string; help: string; items: Proposal[]; onChange: (items: Proposal[]) => void }) {
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState("");
  const [icon, setIcon] = useState<IconName>("heart");
  const [tone, setTone] = useState<Tone>("rose");
  const [open, setOpen] = useState(false);

  const add = () => {
    const label = draft.trim();
    if (label.length < 2) { toast.error("L'intitulé est trop court."); return; }
    if (items.some((item) => item.label.toLowerCase() === label.toLowerCase())) { toast.error("Cette proposition existe déjà."); return; }
    onChange([{ id: `opt-${Date.now()}`, label, hint: hint.trim(), icon, tone, active: true }, ...items]);
    setDraft(""); setHint("");
  };
  const patch = (id: string, partial: Partial<Proposal>) => onChange(items.map((item) => item.id === id ? { ...item, ...partial } : item));
  const move = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= items.length) return;
    const copy = [...items];
    const [row] = copy.splice(index, 1);
    copy.splice(next, 0, row);
    onChange(copy);
  };
  const hide = (item: Proposal) => {
    if (item.active && items.filter((row) => row.active).length <= 1) { toast.error("Gardez au moins une proposition visible."); return; }
    patch(item.id, { active: !item.active });
  };
  const remove = (item: Proposal) => {
    if (item.active && items.filter((row) => row.active).length <= 1) { toast.error("Gardez au moins une proposition visible."); return; }
    onChange(items.filter((row) => row.id !== item.id));
  };

  return (
    <section className="rounded-3xl border border-rose-100 bg-white p-4">
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex w-full items-start justify-between gap-3 text-left">
        <span>
          <span className="block font-semibold text-rose-950">{title}</span>
          <span className="mt-0.5 block text-[13px] text-stone-500">{help} · {items.filter((item) => item.active).length} visibles</span>
        </span>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-rose-700 ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="mt-4 space-y-3">
          <div className="space-y-2 rounded-2xl bg-rose-50/60 p-3">
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Nouvelle proposition" aria-label={`Nouvelle proposition pour ${title}`} className={lineInput} />
            <Input value={hint} onChange={(event) => setHint(event.target.value)} placeholder="Précision, facultative" aria-label="Précision" className={lineInput} />
            <div className="flex flex-wrap gap-1" role="group" aria-label="Icône">
              {(Object.keys(ICONS) as IconName[]).map((key) => {
                const Icon = ICONS[key];
                return <button key={key} type="button" aria-label={ICON_LABELS[key]} aria-pressed={icon === key} onClick={() => setIcon(key)} className={`flex h-9 w-9 items-center justify-center rounded-lg ${icon === key ? "bg-rose-700 text-white" : "bg-white text-rose-700 ring-1 ring-rose-100"}`}><Icon className="h-4 w-4" /></button>;
              })}
            </div>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Couleur">
              {(Object.keys(TONES) as Tone[]).map((key) => (
                <button key={key} type="button" aria-label={TONES[key].label} aria-pressed={tone === key} onClick={() => setTone(key)} className={`h-7 w-7 rounded-lg ${TONES[key].dot} ${tone === key ? "ring-2 ring-stone-900 ring-offset-2" : ""}`} />
              ))}
            </div>
            <button type="button" onClick={add} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-700 text-[15px] font-medium text-white sm:w-auto sm:px-4"><Plus className="h-4 w-4" />Ajouter</button>
          </div>
          {items.map((item, index) => {
            const Icon = iconOf(item.icon);
            const tone = toneOf(item.tone);
            return (
              <article key={item.id} className={`rounded-2xl border p-3 ${item.active ? "border-stone-200" : "border-dashed border-stone-300 opacity-70"}`}>
                <div className="flex items-start gap-2">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <Input value={item.label} aria-label={`Intitulé ${item.label}`} onChange={(event) => patch(item.id, { label: event.target.value })} className={lineInput} />
                    <Input value={item.hint} aria-label={`Précision de ${item.label}`} placeholder="Précision affichée sous le choix" onChange={(event) => patch(item.id, { hint: event.target.value })} className={lineInput} />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap justify-end gap-1">
                  <button type="button" aria-label="Monter" onClick={() => move(index, -1)} className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100"><ChevronUp className="h-4 w-4" /></button>
                  <button type="button" aria-label="Descendre" onClick={() => move(index, 1)} className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100"><ChevronDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => hide(item)} className="h-9 rounded-lg px-2 text-[13px] font-medium text-violet-700 hover:bg-violet-50">{item.active ? "Masquer" : "Afficher"}</button>
                  <button type="button" onClick={() => remove(item)} className="h-9 rounded-lg px-2 text-[13px] font-medium text-rose-700 hover:bg-rose-50">Retirer</button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function PeoplePicker({ people, selected, query, onQuery, onToggle }: { people: DirectoryPerson[]; selected: DirectoryPerson[]; query: string; onQuery: (value: string) => void; onToggle: (id: string) => void }) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [limit, setLimit] = useState(8);
  const shown = people.slice(0, limit);
  return (
    <div className="space-y-3">
      <p className="px-1 text-[13px] font-medium text-stone-600">Personnes désignées</p>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((person) => (
            <button key={person.id} type="button" onClick={() => onToggle(person.id)} className="inline-flex max-w-full items-center gap-2 rounded-xl bg-violet-50 py-1 pl-1 pr-2 text-left text-[13px]">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold ${avatarTone(person.name)}`}>{initials(person.name)}</span>
              <span className="min-w-0"><span className="block truncate leading-4">{person.name}</span><span className="block truncate text-[11px] text-stone-500">{person.service || "Agent"}</span></span>
              <X className="h-3.5 w-3.5 shrink-0 text-rose-700" />
            </button>
          ))}
        </div>
      ) : <p className="px-1 text-[13px] text-stone-500">Aucune personne pour le moment.</p>}
      <div className="relative">
        <button type="button" aria-label="Rechercher une personne" onClick={() => searchRef.current?.focus()} className="absolute left-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
          <Search className="h-4 w-4" />
        </button>
        <Input ref={searchRef} value={query} onChange={(event) => { onQuery(event.target.value); setLimit(8); }} className={`${lineInput} pl-12`} placeholder="Rechercher une personne" aria-label="Rechercher une personne" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white">
        {shown.map((person, index) => {
          const active = selected.some((item) => item.id === person.id);
          return (
            <button key={person.id} type="button" aria-pressed={active} onClick={() => onToggle(person.id)} className={`flex w-full min-w-0 items-center gap-3 px-3 py-2.5 text-left ${index > 0 ? "border-t border-violet-50" : ""} ${active ? "bg-violet-50" : ""}`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold ${avatarTone(person.name)}`}>{initials(person.name)}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[14px]">{person.name}</span><span className="block truncate text-[12px] text-stone-500">{person.service || person.email}</span></span>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${active ? "bg-violet-600 text-white" : "border border-stone-300"}`}>{active ? <Check className="h-3 w-3" /> : null}</span>
            </button>
          );
        })}
        {people.length > shown.length ? <button type="button" onClick={() => setLimit((current) => current + 8)} className="h-11 w-full border-t border-violet-50 text-[13px] font-medium text-violet-700">Voir d'autres personnes</button> : null}
      </div>
    </div>
  );
}

function CellRoster({ cells }: { cells: WorkCell[] }) {
  return (
    <section className="space-y-3">
      {cells.map((cell) => (
        <article key={cell.id} className="rounded-3xl border border-violet-100 bg-white p-4">
          <h2 className="text-lg font-semibold text-violet-950">{cell.name}</h2>
          <p className="mt-1 text-sm text-stone-600">{cell.mission}</p>
          <div className="mt-4 space-y-2">
            {cell.members.map((member) => (
              <div key={member.id} className="flex min-w-0 items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold ${avatarTone(member.name)}`}>{initials(member.name)}</span>
                <span className="min-w-0"><span className="block truncate text-[14px]">{member.name}</span><span className="block truncate text-[12px] text-stone-500">{member.email}</span></span>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}

function ProgressRail({ status, onChange }: { status: Status; onChange?: (status: Status) => void }) {
  const current = Math.max(0, STATUSES.indexOf(status));
  return (
    <ol className="grid grid-cols-1 gap-2 sm:grid-cols-4">
      {STATUSES.map((item, index) => {
        const state = index < current ? "done" : index === current ? "now" : "later";
        return (
          <li key={item}>
            <button type="button" disabled={!onChange} onClick={() => onChange?.(item)} className={`flex h-full w-full items-center gap-2 rounded-2xl border px-3 py-3 text-left ${state === "now" ? "border-rose-300 bg-rose-50" : state === "done" ? "border-emerald-200 bg-emerald-50" : "border-stone-200 bg-stone-50"} ${onChange ? "" : "cursor-default"}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${state === "now" ? "bg-rose-600 text-white" : state === "done" ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-500"}`}>{state === "done" ? <Check className="h-3.5 w-3.5" /> : index + 1}</span>
              <span className="min-w-0 text-[14px] font-semibold leading-5 text-stone-900">{item}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function downloadAttachment(file: Attachment) {
  const link = document.createElement("a");
  link.href = file.dataUrl;
  link.download = file.name;
  link.click();
}

function CaseThread({ report, viewer, onSend }: { report: Signalement; viewer: "author" | "cell"; onSend: (report: Signalement, body: string, attachments: Attachment[], fromCell: boolean) => boolean }) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const messages = report.messages || [];
  const addFiles = async (list: FileList | null) => {
    const incoming = [...(list || [])];
    if (files.length + incoming.length > 3) { toast.error("Trois pièces jointes maximum par message."); return; }
    const next = [...files];
    for (const file of incoming) {
      if (file.size > 600_000) { toast.error(`${file.name} dépasse 600 Ko.`); continue; }
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") { toast.error("Joignez une image ou un PDF."); continue; }
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.readAsDataURL(file);
      });
      next.push({ id: `file-${Date.now()}-${next.length}`, name: file.name, mime: file.type, dataUrl });
    }
    setFiles(next);
  };
  return (
    <section className="rounded-3xl border border-sky-200 bg-sky-50/40 p-4">
      <h3 className="text-lg font-semibold text-sky-950">Messagerie</h3>
      <p className="mt-1 text-sm text-stone-600">{viewer === "cell" ? "La personne concernée voit ces messages. Une pièce jointe reste dans le dossier." : "Écrivez à la cellule. Vous pouvez joindre une image ou un PDF."}</p>
      <div className="mt-4 space-y-3">
        {messages.length === 0 ? <p className="rounded-2xl bg-white px-4 py-5 text-sm text-stone-500">Aucun message pour le moment.</p> : messages.map((message) => {
          const mine = viewer === "cell" ? message.fromCell : !message.fromCell;
          const label = message.fromCell ? (message.authorName || "Cellule") : report.anonymous && viewer === "cell" ? "Personne concernée" : "Vous";
          return (
            <article key={message.id} className={`max-w-[95%] rounded-2xl px-4 py-3 ${mine ? "ml-auto bg-sky-700 text-white" : "bg-white text-stone-900 ring-1 ring-sky-100"}`}>
              <p className={`text-[12px] font-medium ${mine ? "text-sky-100" : "text-sky-800"}`}>{label} · {formatDay(message.at)}</p>
              {message.body ? <p className="mt-1 whitespace-pre-wrap text-[15px] leading-6">{message.body}</p> : null}
              {message.attachments?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {message.attachments.map((file) => (
                    <button key={file.id} type="button" onClick={() => downloadAttachment(file)} className={`rounded-xl px-2 py-1 text-left text-[12px] font-medium ${mine ? "bg-white/15" : "bg-sky-50 text-sky-900"}`}>
                      <Paperclip className="mr-1 inline h-3.5 w-3.5" />{file.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      <div className="mt-4 space-y-2 rounded-2xl bg-white p-3 ring-1 ring-sky-100">
        <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Votre message" className="min-h-[88px] rounded-xl border border-sky-100 text-base shadow-none" />
        {files.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {files.map((file) => (
              <button key={file.id} type="button" onClick={() => setFiles((current) => current.filter((item) => item.id !== file.id))} className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-1 text-[12px] text-sky-900"><Paperclip className="h-3.5 w-3.5" />{file.name}<X className="h-3 w-3" /></button>
            ))}
          </div>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 text-[14px] font-medium text-sky-800 hover:bg-sky-50">
            <Paperclip className="h-4 w-4" />Joindre
            <input type="file" accept="image/*,application/pdf" multiple className="sr-only" onChange={(event) => { void addFiles(event.target.files); event.target.value = ""; }} />
          </label>
          <button type="button" onClick={() => { if (onSend(report, body, files, viewer === "cell")) { setBody(""); setFiles([]); } }} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 text-[15px] font-medium text-white"><Send className="h-4 w-4" />Envoyer</button>
        </div>
      </div>
    </section>
  );
}

function CaseWorkspace({
  reports, selected, empty, onSelect, viewer, canAct, onDownloadRegister,
  actionTitle = "", setActionTitle, actionDetail = "", setActionDetail, actionOwner = "", setActionOwner, actionDue = "", setActionDue,
  members = [], onStatus, onAction, onActionStatus, onSendMessage,
}: {
  reports: Signalement[];
  selected: Signalement | null;
  empty: string;
  onSelect: (id: string | null) => void;
  viewer: "author" | "cell";
  canAct: boolean;
  onDownloadRegister?: () => void;
  actionTitle?: string;
  setActionTitle?: (value: string) => void;
  actionDetail?: string;
  setActionDetail?: (value: string) => void;
  actionOwner?: string;
  setActionOwner?: (value: string) => void;
  actionDue?: string;
  setActionDue?: (value: string) => void;
  members?: CellMember[];
  onStatus?: (status: Status) => void;
  onAction?: () => void;
  onActionStatus?: (actionId: string, status: ActionStatus) => void;
  onSendMessage?: (report: Signalement, body: string, attachments: Attachment[], fromCell: boolean) => boolean;
}) {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(200px,280px)_minmax(0,1fr)]">
      <section className={`min-w-0 rounded-3xl border border-rose-100 bg-white p-3 ${selected ? "hidden lg:block" : ""}`}>
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-rose-950"><FolderHeart className="h-4 w-4 text-rose-600" />Dossiers</h2>
          {onDownloadRegister ? <button type="button" onClick={onDownloadRegister} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-rose-50 px-2.5 text-[13px] font-medium text-rose-800"><Download className="h-3.5 w-3.5" />Registre</button> : null}
        </div>
        {reports.length === 0 ? <p className="px-2 py-6 text-sm text-stone-500">{empty}</p> : reports.map((report) => (
          <button key={report.id} type="button" onClick={() => onSelect(report.id)} className={`flex w-full min-w-0 flex-col gap-1 rounded-2xl px-3 py-3 text-left ${selected?.id === report.id ? "bg-rose-50" : "hover:bg-rose-50/50"}`}>
            <span className="flex items-center justify-between gap-2"><span className="text-[14px] font-medium">{report.reference}</span><span className={`rounded-lg px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_STYLE[report.status]}`}>{report.status}</span></span>
            <span className="mt-2 flex gap-1" aria-hidden>{STATUSES.map((status, index) => <span key={status} className={`h-1.5 flex-1 rounded-full ${index <= STATUSES.indexOf(report.status) ? "bg-rose-500" : "bg-rose-100"}`} />)}</span>
            <span className="truncate text-[13px] text-stone-600">{report.feelings[0] || "Signalement"} · {report.anonymous && viewer === "cell" ? "Anonyme" : report.authorName || report.cellName}</span>
          </button>
        ))}
      </section>
      {selected ? (
        <article className="min-w-0 space-y-5 rounded-3xl border border-rose-100 bg-white p-4 sm:p-6">
          <button type="button" onClick={() => onSelect(null)} className="text-[13px] font-medium text-rose-700 lg:hidden">Retour aux dossiers</button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-rose-950">{selected.reference}</h2>
              <p className="mt-1 break-words text-[13px] text-stone-500">{selected.cellName} · {formatDay(selected.createdAt)} · {selected.anonymous && viewer === "cell" ? "Anonyme" : selected.authorName || "Identifié"}</p>
            </div>
            <button type="button" onClick={() => downloadSignalementPdf(selected)} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-[14px] font-medium text-white hover:bg-rose-800 sm:w-auto"><Download className="h-4 w-4" />Télécharger la fiche</button>
          </div>
          <ProgressRail status={selected.status} onChange={canAct ? onStatus : undefined} />
          <section className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4">
            <h3 className="text-lg font-semibold text-amber-950">Actions</h3>
            <p className="mt-1 text-sm text-stone-600">{canAct ? "Une action engagée fait avancer le dossier. Le statut se choisit sur la carte." : "Ce que la cellule a engagé pour votre situation."}</p>
            <div className="mt-3 space-y-3">
              {selected.actions.length === 0 ? <p className="rounded-2xl bg-white px-4 py-4 text-sm text-stone-500">Aucune action pour le moment.</p> : selected.actions.map((action) => (
                <article key={action.id} className={`rounded-2xl border-l-4 bg-white p-4 shadow-sm ${action.status === "Fait" ? "border-emerald-500" : action.status === "En cours" ? "border-sky-500" : "border-amber-500"}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[16px] font-semibold text-stone-900">{action.title}</p>
                      {action.detail ? <p className="mt-1 text-[14px] leading-6 text-stone-700">{action.detail}</p> : null}
                      <p className="mt-2 text-[13px] text-stone-500">{action.ownerName || "La cellule"}{action.dueDate ? ` · échéance ${formatDay(action.dueDate)}` : ""}</p>
                    </div>
                    {canAct && onActionStatus ? (
                      <div className="flex shrink-0 flex-wrap gap-1">
                        {ACTION_STATUSES.map((status) => (
                          <button key={status} type="button" aria-pressed={action.status === status} onClick={() => onActionStatus(action.id, status)} className={`h-8 rounded-lg px-2.5 text-[12px] font-medium ring-1 ${action.status === status ? ACTION_STYLE[status] : "bg-white text-stone-500 ring-stone-200"}`}>{status}</button>
                        ))}
                      </div>
                    ) : <span className={`inline-flex h-8 items-center rounded-lg px-2.5 text-[12px] font-medium ring-1 ${ACTION_STYLE[action.status]}`}>{action.status}</span>}
                  </div>
                </article>
              ))}
            </div>
            {canAct ? (
              <div className="mt-4 space-y-3 rounded-2xl bg-white p-3 ring-1 ring-amber-100">
                <IconField id="action-title" label="Nouvelle action" icon={ClipboardList} value={actionTitle} onChange={(value) => setActionTitle?.(value)} placeholder="Ce que la cellule engage" />
                <NotedText id="action-detail" label="Précision" value={actionDetail} onChange={(value) => setActionDetail?.(value)} minHeight="min-h-[72px]" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="action-owner" className="px-1 text-[13px] font-medium text-stone-600">Personne chargée</Label>
                    <select id="action-owner" value={actionOwner} onChange={(event) => setActionOwner?.(event.target.value)} className={lineInput}>
                      <option value="">La cellule</option>
                      {members.map((member) => <option key={member.id} value={member.name}>{member.name}</option>)}
                    </select>
                  </div>
                  <DateField id="action-due" label="Échéance" value={actionDue} onChange={(value) => setActionDue?.(value)} />
                </div>
                <div className="flex justify-end"><button type="button" onClick={onAction} className="h-11 w-full rounded-xl bg-amber-700 px-5 text-[15px] font-medium text-white sm:w-auto">Ajouter l'action</button></div>
              </div>
            ) : null}
          </section>
          <p className="text-[16px] leading-7">{selected.situation}</p>
          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[["Vécu", selected.feelings.join(", ")], ["Contexte", selected.relations.join(", ")], ["Effets", selected.impacts.join(", ")], ["Attente", `${selected.outcome} · ${selected.contact}`]].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-rose-50/70 p-3"><dt className="text-[12px] font-medium text-rose-800">{label}</dt><dd className="mt-1 break-words text-[14px]">{value}</dd></div>
            ))}
          </dl>
          {selected.publicUpdate ? <p className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-[14px] leading-6">Ancien message de la cellule — {selected.publicUpdate}</p> : null}
          {onSendMessage ? <CaseThread report={selected} viewer={viewer} onSend={onSendMessage} /> : null}
        </article>
      ) : <section className="hidden rounded-3xl border border-rose-100 bg-white p-8 text-[15px] text-stone-500 lg:block">Choisissez un dossier pour le lire ou le télécharger.</section>}
    </div>
  );
}
