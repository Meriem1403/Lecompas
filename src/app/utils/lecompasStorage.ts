import type { Action } from "@/app/types/action";
import type { Risk } from "@/app/components/admin/RisksManagementView";
import type { RiskAwarenessRecord } from "@/app/components/RiskAwarenessView";
import type { SecuritySheetRecord } from "@/app/components/SecuritySheetView";
import type { PapripactSignatureRecord } from "@/app/utils/papripactStorage";

const RISKS_KEY = "lecompas_risks_v1";
const MANUAL_ACTIONS_KEY = "lecompas_manual_actions_v1";
const AWARENESS_KEY = "lecompas_awareness_v1";
const SUPPRESSED_AWARENESS_KEY = "lecompas_suppressed_awareness_v1";
const SECURITY_SHEETS_KEY = "lecompas_security_sheets_v1";
const SAFETY_PROTOCOLS_KEY = "lecompas_safety_protocols_v1";
const DELETED_PROTOCOLS_KEY = "lecompas_deleted_protocols_v1";
const PREVENTION_PLANS_KEY = "lecompas_prevention_plans_v1";
const NOTIFICATIONS_KEY = "lecompas_notifications_v1";
const PAPRIPACT_SIGNATURES_KEY = "lecompas_papripact_signatures_v1";

export interface ProtocolAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  sizeBytes: number;
}

export interface SafetyProtocolRecord {
  id: string;
  title: string;
  operationType: string;
  service: string;
  domain: string;
  location: string;
  entreprise1: string;
  entreprise2: string;
  responsable: string;
  date: string;
  status: "brouillon" | "valide" | "signe";
  risques: string;
  mesures: string;
  urgence: string;
  signatures: string;
  circulation: string;
  documents: string[];
  attachments: ProtocolAttachment[];
}

export interface DeletedProtocolRecord {
  deletedAt: string;
  protocol: SafetyProtocolRecord;
}

export interface AppNotification {
  id: string;
  titre: string;
  contenu: string;
  type: "info" | "alerte" | "urgent";
  dateCreation: string;
  isRead: boolean;
  actionReturnId?: string;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadPersistedRisks(): Risk[] | null {
  return readJson<Risk[]>(RISKS_KEY);
}

export function savePersistedRisks(risks: Risk[]) {
  writeJson(RISKS_KEY, risks);
}

export function loadManualActions(): Action[] | null {
  return readJson<Action[]>(MANUAL_ACTIONS_KEY);
}

export function saveManualActions(actions: Action[]) {
  writeJson(MANUAL_ACTIONS_KEY, actions);
}

export function loadAwarenessRecords(): RiskAwarenessRecord[] | null {
  return readJson<RiskAwarenessRecord[]>(AWARENESS_KEY);
}

export function saveAwarenessRecords(records: RiskAwarenessRecord[]) {
  writeJson(AWARENESS_KEY, records);
}

export function loadSuppressedAwarenessKeys(): string[] {
  return readJson<string[]>(SUPPRESSED_AWARENESS_KEY) ?? [];
}

export function saveSuppressedAwarenessKeys(keys: string[]) {
  writeJson(SUPPRESSED_AWARENESS_KEY, keys);
}

export function buildRiskAwarenessKey(risk: {
  numeroRisque: string;
  title: string;
}) {
  return `${risk.numeroRisque}::${risk.title}`;
}

export function loadSecuritySheets(): SecuritySheetRecord[] | null {
  return readJson<SecuritySheetRecord[]>(SECURITY_SHEETS_KEY);
}

export function saveSecuritySheets(records: SecuritySheetRecord[]) {
  writeJson(SECURITY_SHEETS_KEY, records);
}

export function isPreventionPlanMisclassifiedAsProtocol(
  protocol: SafetyProtocolRecord,
): boolean {
  const title = (protocol.title || "").toLowerCase();
  const operation = (protocol.operationType || "").toLowerCase();
  return (
    title.includes("plan de prévention") ||
    title.includes("plan de prevention") ||
    (title.includes("héliportage") && title.includes("plan")) ||
    (operation.includes("héliportage") && title.includes("plan"))
  );
}

export function sanitizeSafetyProtocols(
  protocols: SafetyProtocolRecord[],
): SafetyProtocolRecord[] {
  return protocols.filter(
    (protocol) => !isPreventionPlanMisclassifiedAsProtocol(protocol),
  );
}

export function loadSafetyProtocols(): SafetyProtocolRecord[] | null {
  const raw = readJson<SafetyProtocolRecord[]>(SAFETY_PROTOCOLS_KEY);
  if (!raw) return null;
  const sanitized = sanitizeSafetyProtocols(raw);
  if (sanitized.length !== raw.length) {
    writeJson(SAFETY_PROTOCOLS_KEY, sanitized);
  }
  return sanitized;
}

export function saveSafetyProtocols(protocols: SafetyProtocolRecord[]) {
  writeJson(SAFETY_PROTOCOLS_KEY, protocols);
}

export function loadDeletedProtocols(): DeletedProtocolRecord[] | null {
  return readJson<DeletedProtocolRecord[]>(DELETED_PROTOCOLS_KEY);
}

export function saveDeletedProtocols(records: DeletedProtocolRecord[]) {
  writeJson(DELETED_PROTOCOLS_KEY, records);
}

export function loadPreventionPlans<T>(): T[] | null {
  return readJson<T[]>(PREVENTION_PLANS_KEY);
}

export function savePreventionPlans<T>(plans: T[]) {
  return writeJson(PREVENTION_PLANS_KEY, plans);
}

export function loadNotifications(): AppNotification[] | null {
  return readJson<AppNotification[]>(NOTIFICATIONS_KEY);
}

export function saveNotifications(notifications: AppNotification[]) {
  writeJson(NOTIFICATIONS_KEY, notifications);
}

export function loadPapripactSignaturesStorage(): PapripactSignatureRecord[] {
  return readJson<PapripactSignatureRecord[]>(PAPRIPACT_SIGNATURES_KEY) ?? [];
}

export function savePapripactSignaturesStorage(records: PapripactSignatureRecord[]) {
  writeJson(PAPRIPACT_SIGNATURES_KEY, records);
}
