import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { DocumentFileViewer } from "@/app/components/DocumentFileViewer";
import { jsPDF } from "jspdf";
import {
  Activity,
  BatteryLow,
  Brain,
  Briefcase,
  Building2,
  Calendar,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  CloudRain,
  Download,
  EyeOff,
  FilePen,
  FileText,
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

interface Appointment {
  date: string;
  time: string;
  mode: string;
  place: string;
}

interface ThreadMessage {
  id: string;
  at: string;
  authorId: string;
  authorName: string;
  fromCell: boolean;
  kind?: "message" | "rdv" | "rapport";
  body: string;
  attachments: Attachment[];
  appointment?: Appointment;
  reportTitle?: string;
}

interface MessageDraft {
  kind: "message" | "rdv" | "rapport";
  body: string;
  attachments: Attachment[];
  appointment?: Appointment;
  reportTitle?: string;
}

interface Signalement {
  id: string;
  reference: string;
  createdAt: string;
  anonymous: boolean;
  authorId: string;
  authorName: string;
  authorEmail: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  delegated?: boolean;
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
  referent?: CellMember | null;
}

const EMPTY_STORE: Store = { cells: [], reports: [] };
const lineInput = "flex h-12 w-full min-w-0 items-center rounded-xl border border-rose-100 bg-white px-3 text-base leading-6 text-stone-900 shadow-none placeholder:text-stone-400 focus-visible:border-rose-300 focus-visible:ring-2 focus-visible:ring-rose-100";

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

function emailsMatch(left?: string, right?: string) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

function isAssignee(report: Signalement, userId: string, email: string) {
  return report.assigneeId === userId || emailsMatch(report.assigneeEmail, email);
}

function reportIsDelegated(report: Signalement) {
  if (typeof report.delegated === "boolean") return report.delegated && Boolean(report.cellId);
  return Boolean(report.cellId);
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
  pdf.text("Diffusion limitée à la personne concernée, à la personne désignée et, si elle l'autorise, à sa cellule.", width / 2, height - 14, { align: "center" });
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
    const kind = message.kind === "rdv" ? "Rendez-vous" : message.kind === "rapport" ? `Rapport${message.reportTitle ? ` — ${message.reportTitle}` : ""}` : "Message";
    const slot = message.appointment ? `\n${formatDay(message.appointment.date)} à ${message.appointment.time} · ${message.appointment.mode}${message.appointment.place ? ` · ${message.appointment.place}` : ""}` : "";
    paragraph(`${kind}\n${who} · ${formatDay(message.at)}${slot}\n${message.body || "Pièce jointe"}${files}`);
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
    <div className={`grid grid-cols-1 gap-2 ${visible.length > 2 ? "md:grid-cols-2" : ""} ${visible.length > 4 ? "xl:grid-cols-3" : ""}`}>
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

function FieldGlyph({ side, label, tone = "text-rose-700", onClick, children }: { side: "left" | "right"; label: string; tone?: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={`absolute top-0 flex h-12 w-10 items-center justify-center ${tone} ${side === "left" ? "left-0" : "right-0"}`}>
      {children}
    </button>
  );
}

function DateField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id} className="px-1 text-[13px] font-medium text-stone-600">{label}</Label>
      <div className="relative">
        <Input ref={ref} id={id} type="date" value={value} onChange={(event) => onChange(event.target.value)} className={`${lineInput} pr-10 [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0`} />
        <FieldGlyph side="right" label={`Ouvrir le calendrier pour ${label}`} onClick={() => openPicker(ref.current)}><Calendar className="h-4 w-4" /></FieldGlyph>
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
        <Input ref={ref} id={id} list={listId} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`${lineInput} pl-10`} />
        <FieldGlyph side="left" label={`Placer le curseur dans ${label}`} onClick={() => ref.current?.focus()}><Icon className="h-4 w-4" /></FieldGlyph>
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
  const [referentQuery, setReferentQuery] = useState("");
  const [cellToDelete, setCellToDelete] = useState<WorkCell | null>(null);
  const location = useLocation();
  const depositToken = (location.state as { deposit?: number } | null)?.deposit ?? 0;

  useEffect(() => {
    if (!depositToken) return;
    setScreen("deposer");
    setSelectedReportId(null);
    setStep(1);
    setTried(false);
    setFeelings([]);
    setSituation("");
    setSince("");
    setFrequency("");
    setWorkplace("");
    setRelations([]);
    setImpacts([]);
    setAlreadySpoken("");
    setOutcome("");
    setAnonymous(false);
    setUrgency("");
    setContact("");
    setAvailability("");
  }, [depositToken]);

  const catalog = catalogFrom(store);
  const dirty = screen === "deposer" && (feelings.length > 0 || situation.trim().length > 0 || relations.length > 0 || impacts.length > 0);
  const requestLeave = useLeaveGuard(dirty);
  const cells = store.cells;
  const referent = store.referent || null;
  const iAmReferent = Boolean(referent && (referent.id === currentUserId || emailsMatch(referent.email, currentUserEmail)));
  const inDelegatedCell = (report: Signalement) => reportIsDelegated(report) && cells.some((cell) => cell.id === report.cellId && cell.members.some((member) => member.id === currentUserId || emailsMatch(member.email, currentUserEmail)));
  const myCells = cells.filter((cell) => cell.members.some((member) => member.id === currentUserId || emailsMatch(member.email, currentUserEmail)));
  const myReports = store.reports.filter((report) => report.authorId === currentUserId || emailsMatch(report.authorEmail, currentUserEmail));
  const handledReports = store.reports.filter((report) => isAssignee(report, currentUserId, currentUserEmail) || inDelegatedCell(report));
  const waitingCount = store.reports.filter((report) => !report.assigneeId && !report.assigneeEmail && !report.cellId).length;
  const canHandle = iAmReferent || handledReports.length > 0;
  const selectedReport = [...handledReports, ...myReports].find((report) => report.id === selectedReportId) ?? null;
  const referentPeople = useMemo(() => {
    const needle = referentQuery.trim().toLowerCase();
    return directory.filter((person) => !needle || `${person.name} ${person.email} ${person.service || ""}`.toLowerCase().includes(needle)).slice(0, 8);
  }, [directory, referentQuery]);

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
    setUrgency(""); setContact(""); setAvailability("");
  };

  const stepValid = (index: number) => {
    if (index === 1) return feelings.length > 0 && situation.trim().length >= 20 && Boolean(since) && Boolean(frequency) && Boolean(workplace.trim());
    if (index === 2) return relations.length > 0 && impacts.length > 0 && Boolean(outcome);
    if (index === 3) return Boolean(urgency) && Boolean(contact);
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
    }
    return "";
  };

  const submitReport = () => {
    if (![1, 2, 3].every(stepValid)) {
      toast.error("Certaines réponses manquent encore.");
      return;
    }
    const referent = store.referent;
    const reference = `SIG-${new Date().getFullYear()}-${String(store.reports.length + 1).padStart(3, "0")}`;
    const report: Signalement = {
      id: `sig-${Date.now()}`,
      reference,
      createdAt: new Date().toISOString(),
      anonymous,
      authorId: currentUserId,
      authorName: anonymous ? "" : currentUserName,
      authorEmail: anonymous ? "" : currentUserEmail,
      assigneeId: referent?.id || "",
      assigneeName: referent?.name || "",
      assigneeEmail: referent?.email || "",
      delegated: false,
      cellId: "",
      cellName: "",
      feelings, situation: situation.trim(), since, frequency, workplace: workplace.trim(),
      relations, impacts, alreadySpoken: alreadySpoken.trim(), outcome, urgency, contact,
      availability: availability.trim(), status: "Reçu", publicUpdate: "", actions: [], messages: [], notifyEmail: currentUserEmail,
    };
    setStore((current) => ({ ...current, reports: [report, ...current.reports] }));
    if (referent && !emailsMatch(referent.email, currentUserEmail)) {
      onNotify({
        titre: "Nouveau signalement",
        contenu: `${reference} vous est adressé. Aucune cellule ne le voit tant que vous ne l'y autorisez pas.`,
        recipientEmail: referent.email,
      });
    }
    toast.success(referent ? `${reference} est transmis à ${referent.name}.` : `${reference} est enregistré. Vous seul le voyez tant qu'une personne n'est pas désignée.`);
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

  const chooseReferent = (person: DirectoryPerson) => {
    const next = { id: person.id, name: person.name, email: person.email };
    setStore((current) => ({
      ...current,
      referent: next,
      reports: current.reports.map((report) => report.assigneeId || report.assigneeEmail || report.cellId ? report : {
        ...report,
        assigneeId: next.id,
        assigneeName: next.name,
        assigneeEmail: next.email,
        delegated: false,
      }),
    }));
    if (!emailsMatch(next.email, currentUserEmail)) {
      onNotify({ titre: "Signalements à recevoir", contenu: "Vous êtes la personne qui reçoit les signalements. Une cellule ne les voit que si vous l'autorisez.", recipientEmail: next.email });
    }
    toast.success(`${next.name} reçoit désormais les signalements.`);
  };

  const delegateReport = (report: Signalement, cell: WorkCell) => {
    updateReport({ ...report, delegated: true, cellId: cell.id, cellName: cell.name }, `${report.reference} est maintenant suivi par ${cell.name}.`);
    cell.members.filter((member) => !emailsMatch(member.email, currentUserEmail)).forEach((member) => {
      onNotify({ titre: "Dossier confié à votre cellule", contenu: `${report.reference} vous est confié. La personne désignée a autorisé cette délégation.`, recipientEmail: member.email });
    });
    toast.success(`${report.reference} est confié à ${cell.name}.`);
  };

  const revokeDelegation = (report: Signalement) => {
    const previous = cells.find((cell) => cell.id === report.cellId);
    updateReport({ ...report, delegated: false, cellId: "", cellName: "" }, `${report.reference} n'est plus partagé avec une cellule.`);
    previous?.members.filter((member) => !emailsMatch(member.email, currentUserEmail)).forEach((member) => {
      onNotify({ titre: "Délégation retirée", contenu: `${report.reference} n'est plus accessible à votre cellule.`, recipientEmail: member.email });
    });
    toast.success("La cellule ne voit plus ce signalement.");
  };

  const createCellForReport = (report: Signalement, name: string, mission: string, memberIds: string[]) => {
    if (!name.trim() || memberIds.length === 0) { toast.error("Nommez la cellule et désignez au moins une personne."); return false; }
    const members = directory.filter((person) => memberIds.includes(person.id)).map((person) => ({ id: person.id, name: person.name, email: person.email }));
    const cell: WorkCell = { id: `cell-${Date.now()}`, name: name.trim(), mission: mission.trim(), members, createdAt: new Date().toISOString() };
    const next = { ...report, delegated: true, cellId: cell.id, cellName: cell.name };
    setStore((current) => ({
      ...current,
      cells: [cell, ...current.cells],
      reports: current.reports.map((item) => item.id === report.id ? next : item),
    }));
    if (next.authorEmail) onNotify({ titre: "Suivi de votre signalement", contenu: `${report.reference} est maintenant suivi par ${cell.name}.`, recipientEmail: next.authorEmail });
    members.filter((member) => !emailsMatch(member.email, currentUserEmail)).forEach((member) => {
      onNotify({ titre: "Dossier confié à votre cellule", contenu: `${report.reference} vous est confié.`, recipientEmail: member.email });
    });
    toast.success(`${cell.name} est créée et reçoit ${report.reference}.`);
    return true;
  };

  const updateReport = (next: Signalement, notice?: string) => {
    setStore((current) => ({ ...current, reports: current.reports.map((item) => item.id === next.id ? next : item) }));
    if (notice && next.authorEmail) onNotify({ titre: "Suivi de votre signalement", contenu: notice, recipientEmail: next.authorEmail });
  };

  const updateList = (key: keyof FormCatalog, items: Proposal[]) => {
    setStore((current) => ({ ...current, catalog: { ...catalogFrom(current), [key]: items } }));
  };

  const sendMessage = (report: Signalement, draft: MessageDraft, fromCell: boolean) => {
    const text = draft.body.trim();
    if (draft.kind === "message" && !text && draft.attachments.length === 0) { toast.error("Écrivez un message ou déposez une pièce."); return false; }
    if (draft.kind === "rdv" && (!draft.appointment?.date || !draft.appointment.time)) { toast.error("Indiquez le jour et l'heure du rendez-vous."); return false; }
    if (draft.kind === "rapport" && (!draft.reportTitle?.trim() || text.length < 20)) { toast.error("Le rapport a besoin d'un titre et d'un texte."); return false; }
    const message: ThreadMessage = {
      id: `msg-${Date.now()}`,
      at: new Date().toISOString(),
      authorId: currentUserId,
      authorName: fromCell || !report.anonymous ? currentUserName : "",
      fromCell,
      kind: draft.kind,
      body: text,
      attachments: draft.attachments,
      appointment: draft.appointment,
      reportTitle: draft.reportTitle?.trim(),
    };
    const next = { ...report, messages: [...(report.messages || []), message] };
    setStore((current) => ({ ...current, reports: current.reports.map((item) => item.id === next.id ? next : item) }));
    const notice = draft.kind === "rdv"
      ? `${report.reference} : un rendez-vous est proposé le ${formatDay(draft.appointment?.date)} à ${draft.appointment?.time}.`
      : draft.kind === "rapport"
        ? `${report.reference} : un rapport a été versé au dossier.`
        : `${report.reference} : ${text || "Une pièce jointe a été ajoutée."}`;
    if (fromCell) {
      const email = report.notifyEmail || report.authorEmail;
      if (email) onNotify({ titre: draft.kind === "rdv" ? "Rendez-vous proposé" : draft.kind === "rapport" ? "Rapport au dossier" : "Message de la cellule", contenu: notice, recipientEmail: email });
    } else {
      const recipients = [
        ...(report.assigneeEmail ? [{ email: report.assigneeEmail }] : []),
        ...(reportIsDelegated(report) ? (cells.find((cell) => cell.id === report.cellId)?.members || []) : []),
      ];
      recipients.filter((member) => !emailsMatch(member.email, currentUserEmail)).forEach((member) => {
        onNotify({ titre: "Message sur un signalement", contenu: notice, recipientEmail: member.email });
      });
    }
    toast.success(draft.kind === "rdv" ? "Le rendez-vous est proposé." : draft.kind === "rapport" ? "Le rapport est versé au dossier." : "Le message est envoyé.");
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
  const roleNote = iAmReferent
    ? "Vous recevez les signalements. Tant que vous ne déléguez pas, seule la personne qui a signalé le voit avec vous."
    : isAdmin
      ? "Vous désignez la personne qui reçoit les signalements et vous préparez les cellules. Sans son autorisation, une cellule ne voit aucun dossier."
      : canHandle
        ? "Vous voyez seulement les dossiers que la personne désignée a confiés à votre cellule."
        : "Vous déposez un signalement et vous suivez ses étapes. Il reste entre vous et la personne désignée tant qu'elle ne le délègue pas.";

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 overflow-x-hidden text-stone-900">
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
        <form className="w-full min-w-0" onSubmit={(event) => {
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
              <div className="grid items-start gap-5 xl:grid-cols-2">
                <div className="space-y-5">
                  <div>
                    <FieldLegend title="Ce qui vous pèse" hint="Plusieurs choix" />
                    <ChoiceGrid items={catalog.feelings} selected={feelings} onToggle={(value) => setFeelings((current) => toggle(current, value))} />
                  </div>
                  <NotedText id="situation" label="La situation, avec vos mots" value={situation} onChange={setSituation} placeholder="Depuis quand, où, avec qui, et ce que cela change pour vous" />
                  <p className={`px-1 text-[12px] ${situation.trim().length >= 20 ? "text-emerald-700" : "text-stone-500"}`}>{situation.trim().length} / 20 caractères</p>
                </div>
                <div className="space-y-5">
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
                </div>
              </div>
            ) : null}
            {step === 2 ? (
              <div className="grid items-start gap-5 xl:grid-cols-2">
                <div className="space-y-5">
                  <div><FieldLegend title="Cela concerne surtout" hint="Plusieurs choix" /><ChoiceGrid items={catalog.relations} selected={relations} onToggle={(value) => setRelations((current) => toggle(current, value))} /></div>
                  <div><FieldLegend title="Ce que cela change" hint="Plusieurs choix" /><ChoiceGrid items={catalog.impacts} selected={impacts} onToggle={(value) => setImpacts((current) => toggle(current, value))} /></div>
                </div>
                <div className="space-y-5">
                  <NotedText id="spoken" label="En avez-vous déjà parlé" value={alreadySpoken} onChange={setAlreadySpoken} placeholder="Facultatif" minHeight="min-h-[96px]" />
                  <div><FieldLegend title="Ce que vous attendez" hint="Un seul choix" /><ChoiceGrid items={catalog.outcomes} selected={outcome ? [outcome] : []} onToggle={(value) => setOutcome((current) => chooseOne(current, value))} /></div>
                </div>
              </div>
            ) : null}
            {step === 3 ? (
              <div className="grid items-start gap-5 xl:grid-cols-2">
              <div className="space-y-5">
                <div>
                  <FieldLegend title="Ce que la personne désignée peut connaître" hint="Un seul choix" />
                  <div className="grid grid-cols-1 gap-2">
                    <button type="button" aria-pressed={!anonymous} onClick={() => setAnonymous(false)} className={`flex min-h-[68px] items-center gap-3 rounded-2xl border p-3 text-left ${!anonymous ? "border-emerald-200 bg-emerald-50 ring-2 ring-emerald-400" : "border-stone-200 bg-white"}`}>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"><UserRound className="h-5 w-5" /></span>
                      <span className="min-w-0"><span className="block text-[15px] font-medium">Mon nom peut être lu</span><span className="block break-words text-[13px] text-stone-600">{currentUserName}</span></span>
                    </button>
                    <button type="button" aria-pressed={anonymous} onClick={() => setAnonymous(true)} className={`flex min-h-[68px] items-center gap-3 rounded-2xl border p-3 text-left ${anonymous ? "border-violet-200 bg-violet-50 ring-2 ring-violet-400" : "border-stone-200 bg-white"}`}>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white"><EyeOff className="h-5 w-5" /></span>
                      <span className="min-w-0"><span className="block text-[15px] font-medium">Rester anonyme</span><span className="block text-[13px] text-stone-600">Le nom n'apparaît ni à la personne qui reçoit le signalement, ni sur le PDF.</span></span>
                    </button>
                  </div>
                </div>
                </div>
                <div className="space-y-5">
                <div><FieldLegend title="L'urgence pour vous" hint="Un seul choix" /><ChoiceGrid items={catalog.urgencies} selected={urgency ? [urgency] : []} onToggle={(value) => setUrgency((current) => chooseOne(current, value))} /></div>
                <div><FieldLegend title="Contact souhaité" hint="Un seul choix" /><ChoiceGrid items={catalog.contacts} selected={contact ? [contact] : []} onToggle={(value) => setContact((current) => chooseOne(current, value))} /></div>
                <IconField id="availability" label="Disponibilités" icon={Clock} value={availability} onChange={setAvailability} placeholder="Par exemple mardi après-midi" />
                <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
                  <p className="text-[15px] font-medium text-rose-950">Qui reçoit le signalement</p>
                  <p className="mt-1 text-sm leading-6 text-stone-700">{referent ? `${referent.name} le reçoit. Aucune cellule ne le voit, sauf si cette personne décide ensuite de le lui confier. Vous suivez les étapes dans tous les cas.` : "Aucune personne n'est encore désignée. Le signalement reste visible uniquement pour vous, avec ses étapes, jusqu'à cette désignation."}</p>
                </div>
                </div>
              </div>
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
                  <p className="text-sm text-stone-700">{referent ? `Reçu par ${referent.name}. Une cellule ne le verra que si cette personne l'y autorise.` : "Visible uniquement par vous tant qu'une personne n'est pas désignée."}</p>
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
          {!iAmReferent && myCells.length > 0 ? <CellRoster cells={myCells} /> : null}
          <CaseWorkspace
            reports={handledReports}
            selected={handledReports.find((report) => report.id === selectedReportId) ?? null}
            empty={iAmReferent ? "Aucun signalement ne vous est adressé." : "Aucun dossier ne vous a été confié."}
            onSelect={setSelectedReportId}
            viewer="cell"
            canAct
            onDownloadRegister={handledReports.length > 0 ? () => downloadRegisterPdf(handledReports, iAmReferent ? "Personne désignée" : myCells[0]?.name || "Cellule de travail") : undefined}
            actionTitle={actionTitle}
            setActionTitle={setActionTitle}
            actionDetail={actionDetail}
            setActionDetail={setActionDetail}
            actionOwner={actionOwner}
            setActionOwner={setActionOwner}
            actionDue={actionDue}
            setActionDue={setActionDue}
            members={(() => {
              if (!selectedReport) return [];
              const assigned = selectedReport.assigneeId ? [{ id: selectedReport.assigneeId, name: selectedReport.assigneeName || "", email: selectedReport.assigneeEmail || "" }] : [];
              const shared = reportIsDelegated(selectedReport) ? cells.find((cell) => cell.id === selectedReport.cellId)?.members || [] : [];
              return [...assigned, ...shared].filter((member, index, list) => member.id && list.findIndex((item) => item.id === member.id) === index);
            })()}
            delegation={selectedReport && isAssignee(selectedReport, currentUserId, currentUserEmail) ? (
              <DelegationPanel report={selectedReport} cells={cells} people={directory} onDelegate={(cell) => delegateReport(selectedReport, cell)} onRevoke={() => revokeDelegation(selectedReport)} onCreate={(name, mission, memberIds) => createCellForReport(selectedReport, name, mission, memberIds)} />
            ) : null}
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
        <div className="space-y-4">
        <section className="rounded-3xl border border-rose-100 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-rose-950">Personne qui reçoit les signalements</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">Elle seule voit un nouveau signalement, avec la personne qui l'a déposé. Elle peut ensuite le confier à une cellule déjà créée, ou en créer une pour ce dossier. Sans cette autorisation, personne d'autre ne le lit.</p>
          {waitingCount > 0 ? <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">{waitingCount} signalement{waitingCount > 1 ? "s" : ""} attend{waitingCount > 1 ? "ent" : ""} cette désignation. {waitingCount > 1 ? "Ils ne sont visibles" : "Il n'est visible"} que par {waitingCount > 1 ? "leurs auteurs" : "son auteur"}.</p> : null}
          {referent ? <p className="mt-3 text-sm font-medium text-rose-950">Actuellement : {referent.name}</p> : <p className="mt-3 text-sm text-stone-500">Personne n'est désignée.</p>}
          <div className="mt-4">
            <IconField id="referent-search" label="Chercher une personne" icon={Search} value={referentQuery} onChange={setReferentQuery} placeholder="Nom, courriel ou service" />
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {referentPeople.map((person) => (
                <button key={person.id} type="button" onClick={() => chooseReferent(person)} className={`flex min-h-[64px] items-center gap-3 rounded-2xl border p-3 text-left ${referent?.id === person.id ? "border-rose-300 bg-rose-50 ring-2 ring-rose-300" : "border-stone-200 bg-white hover:bg-rose-50/50"}`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white"><UserRound className="h-4 w-4" /></span>
                  <span className="min-w-0"><span className="block truncate text-[14px] font-medium">{person.name}</span><span className="block truncate text-[12px] text-stone-500">{person.service || person.email}</span></span>
                </button>
              ))}
            </div>
          </div>
        </section>
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(320px,460px)_minmax(0,1fr)]">
          <GroupEditor
            editing={Boolean(editingCellId)}
            name={groupName}
            mission={groupMission}
            people={filteredPeople}
            selected={selectedPeople}
            query={memberQuery}
            cells={cells}
            openCounts={Object.fromEntries(cells.map((cell) => [cell.id, store.reports.filter((report) => reportIsDelegated(report) && report.cellId === cell.id && report.status !== "Clos").length]))}
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
        <p className="text-sm leading-6 text-stone-600">Donnez un nom, une mission, puis désignez au moins une personne. Elle ne voit un dossier que lorsque la personne qui reçoit les signalements l'y autorise.</p>
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
        <Input ref={searchRef} value={query} onChange={(event) => { onQuery(event.target.value); setLimit(8); }} className={`${lineInput} border-violet-100 pl-10 focus-visible:border-violet-300 focus-visible:ring-violet-100`} placeholder="Rechercher une personne" aria-label="Rechercher une personne" />
        <FieldGlyph side="left" tone="text-violet-700" label="Rechercher une personne" onClick={() => searchRef.current?.focus()}><Search className="h-4 w-4" /></FieldGlyph>
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
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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

function downloadRapportPdf(report: Signalement, message: ThreadMessage) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  const margin = 46;
  pdf.setFont("times", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(76, 5, 25);
  pdf.text(message.reportTitle || "Rapport", margin, 78);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(87, 83, 78);
  pdf.text(`${report.reference}   ·   ${formatDay(message.at)}   ·   Confidentiel`, margin, 96);
  const lines = pdf.splitTextToSize(message.body || "—", width - margin * 2);
  pdf.setFontSize(11);
  pdf.setTextColor(41, 37, 36);
  pdf.text(lines, margin, 124);
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    paintPageChrome(pdf, page, pages, "DIRM Méditerranée  ·  Rapport RPS");
  }
  pdf.save(`${report.reference}_rapport.pdf`);
}

async function readPieces(list: FileList | null, current: Attachment[]) {
  const incoming = [...(list || [])];
  if (!incoming.length) return current;
  if (current.length + incoming.length > 3) { toast.error("Trois pièces maximum par envoi."); return current; }
  const next = [...current];
  for (const file of incoming) {
    if (file.size > 600_000) { toast.error(`${file.name} dépasse 600 Ko.`); continue; }
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") { toast.error("Déposez une image ou un PDF."); continue; }
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    });
    next.push({ id: `file-${Date.now()}-${next.length}`, name: file.name, mime: file.type, dataUrl });
  }
  return next;
}

function AttachmentViewer({ file, onClose }: { file: Attachment; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex bg-stone-950/70 p-0 sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={file.name} onClick={onClose}>
      <div className="flex h-[100dvh] w-full min-w-0 flex-col bg-white sm:h-[min(94dvh,100%)] sm:w-[min(96vw,1440px)] sm:rounded-2xl sm:shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex min-w-0 items-center gap-2 border-b border-stone-200 px-3 py-3 sm:px-4">
          <FileText className="h-4 w-4 shrink-0 text-sky-700" />
          <p className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</p>
          <button type="button" onClick={() => downloadAttachment(file)} className="h-9 shrink-0 rounded-lg px-2 text-[13px] font-medium text-sky-800 hover:bg-sky-50">Télécharger</button>
          <button type="button" onClick={onClose} aria-label="Fermer la visionneuse" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-stone-100"><X className="h-4 w-4" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-4">
          <DocumentFileViewer name={file.name} dataUrl={file.dataUrl} />
        </div>
      </div>
    </div>
  );
}

function DropZone({ onFiles }: { onFiles: (list: FileList | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); inputRef.current?.click(); } }}
      onDragOver={(event) => { event.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => { event.preventDefault(); setOver(false); onFiles(event.dataTransfer.files); }}
      className={`flex min-h-24 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-3 py-4 text-center ${over ? "border-sky-500 bg-sky-50" : "border-stone-300 bg-stone-50 hover:border-sky-300"}`}
    >
      <p className="text-sm font-medium text-stone-800">Glissez une pièce ici</p>
      <p className="mt-1 text-[13px] leading-5 text-stone-500">ou cliquez pour la choisir · image ou PDF</p>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" multiple className="sr-only" onClick={(event) => event.stopPropagation()} onChange={(event) => { onFiles(event.target.files); event.target.value = ""; }} />
    </div>
  );
}

function CaseThread({ report, viewer, onSend }: { report: Signalement; viewer: "author" | "cell"; onSend: (report: Signalement, draft: MessageDraft, fromCell: boolean) => boolean }) {
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [mode, setMode] = useState<"message" | "rdv" | "rapport">("message");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [meetMode, setMeetMode] = useState("Entretien");
  const [opened, setOpened] = useState<Attachment | null>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const messages = report.messages || [];
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }); }, [messages.length]);
  const pieces = (message: ThreadMessage) => message.attachments?.length ? (
    <div className="mt-2 grid grid-cols-1 gap-2">
      {message.attachments.map((file) => (
        <button key={file.id} type="button" onClick={() => setOpened(file)} className="flex min-w-0 items-center gap-2 rounded-xl bg-stone-50 p-2 text-left text-stone-900">
          {file.mime.startsWith("image/") ? <img src={file.dataUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700"><FileText className="h-5 w-5" /></span>}
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{file.name}</span>
        </button>
      ))}
    </div>
  ) : null;
  const correspondent = viewer === "cell" ? (report.anonymous ? "Personne concernée" : report.authorName || "Personne concernée") : report.cellName;
  const addFiles = async (list: FileList | null) => setFiles(await readPieces(list, files));
  const reset = () => { setBody(""); setFiles([]); setTitle(""); setDate(""); setTime(""); setPlace(""); setMode("message"); };
  const submit = () => {
    const draft: MessageDraft = {
      kind: mode,
      body,
      attachments: files,
      reportTitle: title,
      appointment: mode === "rdv" ? { date, time, mode: meetMode, place: place.trim() } : undefined,
    };
    if (onSend(report, draft, viewer === "cell")) reset();
  };

  return (
    <section className="flex min-h-[70dvh] min-w-0 flex-col overflow-hidden rounded-3xl border border-sky-200 bg-white lg:max-h-[calc(100dvh-7rem)] lg:min-h-[560px]">
      <header className="flex min-w-0 items-center gap-3 border-b border-sky-100 px-3 py-3 sm:px-4">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[12px] font-semibold ${avatarTone(correspondent)}`}>{initials(correspondent)}</span>
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-sky-950">{correspondent}</span>
          <span className="block truncate text-[12px] text-stone-500">{report.reference} · échange confidentiel</span>
        </span>
      </header>
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-sky-50/40 px-3 py-4 sm:px-4">
        {messages.length === 0 ? <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-stone-500">L'échange commence ici.</p> : messages.map((message) => {
          const mine = viewer === "cell" ? message.fromCell : !message.fromCell;
          const label = message.fromCell ? (message.authorName || "Cellule") : report.anonymous && viewer === "cell" ? "Personne concernée" : "Vous";
          if (message.kind === "rdv" && message.appointment) {
            return (
              <article key={message.id} className="w-full rounded-2xl border border-amber-200 bg-white p-3 sm:p-4">
                <p className="text-[12px] font-medium text-amber-800">{label} · {formatDay(message.at)}</p>
                <div className="mt-2 flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white"><CalendarClock className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-stone-900">Rendez-vous · {message.appointment.mode}</p>
                    <p className="mt-1 break-words text-sm text-stone-700">{formatDay(message.appointment.date)} à {message.appointment.time}{message.appointment.place ? ` · ${message.appointment.place}` : ""}</p>
                    {message.body ? <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-stone-600">{message.body}</p> : null}
                    {pieces(message)}
                  </div>
                </div>
              </article>
            );
          }
          if (message.kind === "rapport") {
            return (
              <article key={message.id} className="w-full rounded-2xl border border-violet-200 bg-white p-3 sm:p-4">
                <p className="text-[12px] font-medium text-violet-800">{label} · {formatDay(message.at)}</p>
                <div className="mt-2 flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white"><FilePen className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-[15px] font-semibold text-stone-900">{message.reportTitle || "Rapport"}</p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-stone-700">{message.body}</p>
                    {pieces(message)}
                    <button type="button" onClick={() => downloadRapportPdf(report, message)} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-violet-50 px-3 text-[13px] font-medium text-violet-800"><Download className="h-4 w-4" />Télécharger le rapport</button>
                  </div>
                </div>
              </article>
            );
          }
          return (
            <article key={message.id} className={`w-fit max-w-full rounded-2xl px-3 py-3 sm:max-w-[85%] sm:px-4 ${mine ? "ml-auto bg-sky-700 text-white" : "bg-white text-stone-900 ring-1 ring-sky-100"}`}>
              <p className={`text-[12px] font-medium ${mine ? "text-sky-100" : "text-sky-800"}`}>{label} · {formatDay(message.at)}</p>
              {message.body ? <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-6">{message.body}</p> : null}
              {message.attachments?.length ? (
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {message.attachments.map((file) => (
                    <button key={file.id} type="button" onClick={() => setOpened(file)} className={`flex min-w-0 items-center gap-2 rounded-xl p-2 text-left ${mine ? "bg-white/15" : "bg-sky-50"}`}>
                      {file.mime.startsWith("image/") ? <img src={file.dataUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700"><FileText className="h-5 w-5" /></span>}
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{file.name}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      <footer className="shrink-0 space-y-3 border-t border-sky-100 bg-white p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
          <button type="button" aria-pressed={mode === "rdv"} onClick={() => setMode(mode === "rdv" ? "message" : "rdv")} className={`flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-2 text-[13px] font-medium sm:text-[14px] ${mode === "rdv" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-900"}`}><CalendarClock className="h-4 w-4 shrink-0" /><span className="truncate">Programmer un rendez-vous</span></button>
          <button type="button" aria-pressed={mode === "rapport"} onClick={() => setMode(mode === "rapport" ? "message" : "rapport")} className={`flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-2 text-[13px] font-medium sm:text-[14px] ${mode === "rapport" ? "bg-violet-700 text-white" : "bg-violet-50 text-violet-900"}`}><FilePen className="h-4 w-4 shrink-0" /><span className="truncate">Rédiger un rapport</span></button>
        </div>
        {mode === "rdv" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DateField id={`rdv-date-${report.id}`} label="Jour" value={date} onChange={setDate} />
            <div className="min-w-0 space-y-2">
              <Label htmlFor={`rdv-time-${report.id}`} className="px-1 text-[13px] font-medium text-stone-600">Heure</Label>
              <div className="relative">
                <Input ref={timeRef} id={`rdv-time-${report.id}`} type="time" value={time} onChange={(event) => setTime(event.target.value)} className={`${lineInput} pr-10 [&::-webkit-calendar-picker-indicator]:pointer-events-none [&::-webkit-calendar-picker-indicator]:opacity-0`} />
                <FieldGlyph side="right" tone="text-amber-800" label="Choisir l'heure" onClick={() => openPicker(timeRef.current)}><Clock className="h-4 w-4" /></FieldGlyph>
              </div>
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor={`rdv-mode-${report.id}`} className="px-1 text-[13px] font-medium text-stone-600">Forme</Label>
              <select id={`rdv-mode-${report.id}`} value={meetMode} onChange={(event) => setMeetMode(event.target.value)} className={lineInput}>
                {["Entretien", "Visio", "Appel"].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <IconField id={`rdv-place-${report.id}`} label="Lieu ou lien" icon={MapPin} value={place} onChange={setPlace} placeholder="Bureau, salle ou lien" />
          </div>
        ) : null}
        {mode === "rapport" ? <IconField id={`rapport-title-${report.id}`} label="Titre du rapport" icon={FilePen} value={title} onChange={setTitle} placeholder="Compte rendu d'entretien" /> : null}
        <Textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={mode === "rdv" ? "Précision pour le rendez-vous, facultative" : mode === "rapport" ? "Le rapport, en quelques paragraphes" : "Écrire un message"} className="min-h-[88px] w-full rounded-2xl border border-sky-100 text-base leading-6 shadow-none" />
        <DropZone onFiles={(list) => { void addFiles(list); }} />
        {files.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {files.map((file) => (
              <div key={file.id} className="flex min-w-0 items-center gap-2 rounded-xl bg-sky-50 p-2">
                <button type="button" onClick={() => setOpened(file)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  {file.mime.startsWith("image/") ? <img src={file.dataUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" /> : <FileText className="h-5 w-5 shrink-0 text-sky-700" />}
                  <span className="truncate text-[13px] font-medium">{file.name}</span>
                </button>
                <button type="button" aria-label={`Retirer ${file.name}`} onClick={() => setFiles((current) => current.filter((item) => item.id !== file.id))} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-rose-700 hover:bg-white"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        ) : null}
        <button type="button" onClick={submit} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-700 text-[15px] font-medium text-white sm:w-auto sm:px-5"><Send className="h-4 w-4" />{mode === "rdv" ? "Proposer le rendez-vous" : mode === "rapport" ? "Verser le rapport" : "Envoyer"}</button>
      </footer>
      {opened ? <AttachmentViewer file={opened} onClose={() => setOpened(null)} /> : null}
    </section>
  );
}

function DelegationPanel({
  report, cells, people, onDelegate, onRevoke, onCreate,
}: {
  report: Signalement;
  cells: WorkCell[];
  people: DirectoryPerson[];
  onDelegate: (cell: WorkCell) => void;
  onRevoke: () => void;
  onCreate: (name: string, mission: string, memberIds: string[]) => boolean;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [mission, setMission] = useState("");
  const [query, setQuery] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const shared = reportIsDelegated(report);
  const matches = people.filter((person) => {
    const needle = query.trim().toLowerCase();
    return !needle || `${person.name} ${person.email} ${person.service || ""}`.toLowerCase().includes(needle);
  }).slice(0, 8);
  return (
    <section className="rounded-3xl border border-violet-200 bg-violet-50/70 p-4">
      <h3 className="text-lg font-semibold text-violet-950">Qui peut voir ce dossier</h3>
      {shared ? (
        <>
          <p className="mt-1 text-sm leading-6 text-stone-700">{report.cellName} est autorisée à le lire et à agir. Si vous retirez cette autorisation, la cellule ne le voit plus. La personne qui a signalé continue de suivre les étapes.</p>
          <button type="button" onClick={onRevoke} className="mt-3 h-11 rounded-xl bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-700">Retirer l'autorisation</button>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm leading-6 text-stone-700">Pour l'instant, vous et la personne qui a signalé. Une cellule ne le voit que si vous l'y autorisez.</p>
          {cells.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 gap-2 xl:grid-cols-2">
              {cells.map((cell) => (
                <button key={cell.id} type="button" onClick={() => onDelegate(cell)} className="rounded-2xl border border-violet-200 bg-white p-3 text-left hover:bg-violet-50">
                  <span className="block text-[15px] font-medium text-violet-950">Confier à {cell.name}</span>
                  <span className="mt-1 block text-[13px] leading-5 text-stone-600">{cell.members.map((member) => member.name).join(", ") || "Aucune personne"}</span>
                </button>
              ))}
            </div>
          ) : <p className="mt-3 text-sm leading-6 text-stone-600">Aucune cellule n'existe encore. Vous pouvez en créer une pour ce dossier.</p>}
          <button type="button" onClick={() => setCreating((current) => !current)} className="mt-3 h-11 rounded-xl bg-violet-700 px-4 text-sm font-medium text-white hover:bg-violet-800">{creating ? "Fermer" : "Créer une cellule pour ce dossier"}</button>
          {creating ? (
            <div className="mt-3 space-y-3 rounded-2xl bg-white p-3">
              <IconField id={`delegate-name-${report.id}`} label="Nom de la cellule" icon={Users} value={name} onChange={setName} placeholder="Cellule de suivi" />
              <NotedText id={`delegate-mission-${report.id}`} label="Mission" value={mission} onChange={setMission} placeholder="Suivre ce signalement" minHeight="min-h-[72px]" />
              <IconField id={`delegate-search-${report.id}`} label="Personnes" icon={Search} value={query} onChange={setQuery} placeholder="Nom ou courriel" />
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {matches.map((person) => {
                  const on = memberIds.includes(person.id);
                  return (
                    <button key={person.id} type="button" aria-pressed={on} onClick={() => setMemberIds((current) => on ? current.filter((id) => id !== person.id) : [...current, person.id])} className={`rounded-xl border px-3 py-2 text-left text-sm ${on ? "border-violet-300 bg-violet-50" : "border-stone-200 bg-white"}`}>
                      <span className="block font-medium">{person.name}</span>
                      <span className="block truncate text-[12px] text-stone-500">{person.email}</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={() => { if (!onCreate(name, mission, memberIds)) return; setCreating(false); setName(""); setMission(""); setMemberIds([]); setQuery(""); }} className="h-11 rounded-xl bg-violet-700 px-4 text-sm font-medium text-white hover:bg-violet-800">Créer et autoriser</button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function CaseWorkspace({
  reports, selected, empty, onSelect, viewer, canAct, onDownloadRegister, delegation,
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
  delegation?: ReactNode;
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
  onSendMessage?: (report: Signalement, draft: MessageDraft, fromCell: boolean) => boolean;
}) {
  const [pane, setPane] = useState<"dossier" | "echanges">("dossier");
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
      <section className={`min-w-0 rounded-3xl border border-rose-100 bg-white p-3 ${selected ? "hidden lg:block" : ""}`}>
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-rose-950"><FolderHeart className="h-4 w-4 text-rose-600" />Dossiers</h2>
          {onDownloadRegister ? <button type="button" onClick={onDownloadRegister} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-rose-50 px-2.5 text-[13px] font-medium text-rose-800"><Download className="h-3.5 w-3.5" />Registre</button> : null}
        </div>
        {reports.length === 0 ? <p className="px-2 py-6 text-sm text-stone-500">{empty}</p> : reports.map((report) => (
          <button key={report.id} type="button" onClick={() => onSelect(report.id)} className={`flex w-full min-w-0 flex-col gap-1 rounded-2xl px-3 py-3 text-left ${selected?.id === report.id ? "bg-rose-50" : "hover:bg-rose-50/50"}`}>
            <span className="flex items-center justify-between gap-2"><span className="text-[14px] font-medium">{report.reference}</span><span className={`rounded-lg px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_STYLE[report.status]}`}>{report.status}</span></span>
            <span className="mt-2 flex gap-1" aria-hidden>{STATUSES.map((status, index) => <span key={status} className={`h-1.5 flex-1 rounded-full ${index <= STATUSES.indexOf(report.status) ? "bg-rose-500" : "bg-rose-100"}`} />)}</span>
            <span className="truncate text-[13px] text-stone-600">{report.feelings[0] || "Signalement"} · {report.anonymous && viewer === "cell" ? "Anonyme" : report.authorName || "Vous"}{reportIsDelegated(report) ? ` · ${report.cellName}` : ""}</span>
          </button>
        ))}
      </section>
      {selected ? (
        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <button type="button" onClick={() => onSelect(null)} className="text-[13px] font-medium text-rose-700">Retour aux dossiers</button>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-rose-100/80 p-1 lg:hidden">
            <button type="button" aria-pressed={pane === "dossier"} onClick={() => setPane("dossier")} className={`h-11 rounded-xl text-[14px] font-medium ${pane === "dossier" ? "bg-white text-rose-900 shadow-sm" : "text-stone-600"}`}>Dossier</button>
            <button type="button" aria-pressed={pane === "echanges"} onClick={() => setPane("echanges")} className={`h-11 rounded-xl text-[14px] font-medium ${pane === "echanges" ? "bg-white text-sky-900 shadow-sm" : "text-stone-600"}`}>Échanges</button>
          </div>
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.9fr)]">
        <article className={`min-w-0 space-y-5 rounded-3xl border border-rose-100 bg-white p-4 sm:p-6 ${pane === "echanges" ? "hidden lg:block" : ""}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-rose-950">{selected.reference}</h2>
              <p className="mt-1 break-words text-[13px] text-stone-500">{selected.assigneeName ? `Reçu par ${selected.assigneeName}` : "En attente d'une personne désignée"}{reportIsDelegated(selected) ? ` · ${selected.cellName}` : " · non délégué"} · {formatDay(selected.createdAt)} · {selected.anonymous && viewer === "cell" ? "Anonyme" : selected.authorName || "Identifié"}</p>
            </div>
            <button type="button" onClick={() => downloadSignalementPdf(selected)} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-[14px] font-medium text-white hover:bg-rose-800 sm:w-auto"><Download className="h-4 w-4" />Télécharger la fiche</button>
          </div>
          <p className="text-sm leading-6 text-stone-600">{viewer === "author"
            ? (reportIsDelegated(selected)
              ? `La cellule ${selected.cellName} est autorisée à suivre ce dossier. Vous voyez toujours les étapes.`
              : selected.assigneeName
                ? `Ces étapes ne sont visibles que par vous et par ${selected.assigneeName}.`
                : "Ces étapes ne sont visibles que par vous, tant qu'une personne n'est pas désignée pour recevoir le signalement.")
            : (reportIsDelegated(selected)
              ? `La personne désignée a autorisé ${selected.cellName} à suivre ce dossier.`
              : "Vous seul lisez ce dossier avec la personne qui l'a déposé.")}</p>
          <ProgressRail status={selected.status} onChange={canAct ? onStatus : undefined} />
          {delegation}
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
        </article>
        {onSendMessage ? <div className={pane === "dossier" ? "hidden min-w-0 lg:block" : "min-w-0"}><CaseThread report={selected} viewer={viewer} onSend={onSendMessage} /></div> : null}
          </div>
        </div>
      ) : <section className="hidden rounded-3xl border border-rose-100 bg-white p-8 text-[15px] text-stone-500 lg:block">Choisissez un dossier pour le lire ou le télécharger.</section>}
    </div>
  );
}
