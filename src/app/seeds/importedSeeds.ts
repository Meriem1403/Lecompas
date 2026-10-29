import type {
  AsbestosRegisterRow,
  AsbestosSiteDtaRow,
  AccidentSuiviIndicateurs,
} from "@/app/types/importedRegisters";
import asbestosRegister from "@/app/seeds/imported/asbestos-register.json";
import asbestosSitesDta from "@/app/seeds/imported/asbestos-sites-dta.json";
import accidentIndicators from "@/app/seeds/imported/accident-indicators.json";

export const IMPORTED_ASBESTOS_REGISTER =
  asbestosRegister as AsbestosRegisterRow[];

export const IMPORTED_ASBESTOS_SITES_DTA =
  asbestosSitesDta as AsbestosSiteDtaRow[];

export const IMPORTED_ACCIDENT_INDICATORS =
  accidentIndicators as AccidentSuiviIndicateurs;
