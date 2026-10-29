import type {
  AsbestosRegisterRow,
  AsbestosSiteDtaRow,
  AccidentSuiviIndicateurs,
} from "@/app/types/importedRegisters";
import asbestosRegister from "@/app/seeds/imported/asbestos-register.json";
import asbestosSitesDta from "@/app/seeds/imported/asbestos-sites-dta.json";
import accidentIndicators from "@/app/seeds/imported/accident-indicators.json";
import papripactProgram from "@/app/seeds/imported/papripact-program.json";
import type { Action } from "@/app/types/action";
import papripactActions from "@/app/seeds/imported/papripact-actions.json";

export const IMPORTED_ASBESTOS_REGISTER =
  asbestosRegister as AsbestosRegisterRow[];

export const IMPORTED_ASBESTOS_SITES_DTA =
  asbestosSitesDta as AsbestosSiteDtaRow[];

export const IMPORTED_ACCIDENT_INDICATORS =
  accidentIndicators as AccidentSuiviIndicateurs;

export const IMPORTED_PAPRIPACT_ACTIONS = papripactActions as Action[];

export const IMPORTED_PAPRIPACT_PROGRAM = papripactProgram as {
  year: number;
  administration: string;
  referent: string;
  presentedOnF3sct: string;
  actionCount: number;
  importedAt: string;
  sourceFile: string;
};
