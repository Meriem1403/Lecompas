import { toast } from "sonner";
import { APP_DATA_KEYS } from "@/app/services/appDataApi";
import { useAppDataDocumentStore } from "@/app/hooks/useAppDataDocumentStore";
import { IMPORTED_ASBESTOS_REGISTER, IMPORTED_ASBESTOS_SITES_DTA } from "@/app/seeds/importedSeeds";
import type { AsbestosRegisterRow, AsbestosSiteDtaRow } from "@/app/types/importedRegisters";
import { AsbestosStudio } from "./AsbestosStudio";

interface AsbestosSuiviManagementViewProps {
  accessToken?: string;
}

export function AsbestosSuiviManagementView({ accessToken = "" }: AsbestosSuiviManagementViewProps) {
  const [register, setRegister] = useAppDataDocumentStore<AsbestosRegisterRow[]>(
    APP_DATA_KEYS.asbestosSuiviRegister,
    accessToken,
    { seed: IMPORTED_ASBESTOS_REGISTER },
  );
  const [sites, setSites] = useAppDataDocumentStore<AsbestosSiteDtaRow[]>(
    APP_DATA_KEYS.asbestosSitesDta,
    accessToken,
    { seed: IMPORTED_ASBESTOS_SITES_DTA },
  );

  const siteRows = Array.isArray(sites) ? sites : [];
  const registerRows = Array.isArray(register) ? register : [];

  return (
    <AsbestosStudio
      sites={siteRows}
      register={registerRows}
      onSaveSite={(site) => {
        setSites((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          return list.some((row) => row.id === site.id) ? list.map((row) => (row.id === site.id ? site : row)) : [...list, site];
        });
        toast.success("Site enregistré");
      }}
      onSaveRow={(row) => {
        setRegister((prev) => {
          const list = Array.isArray(prev) ? prev : [];
          return list.some((item) => item.id === row.id) ? list.map((item) => (item.id === row.id ? row : item)) : [row, ...list];
        });
        toast.success("Fiche enregistrée");
      }}
      onDeleteSite={(id) => {
        setSites((prev) => (Array.isArray(prev) ? prev.filter((row) => row.id !== id) : []));
        setRegister((prev) => (Array.isArray(prev) ? prev.filter((row) => row.siteId !== id) : []));
        toast.success("Site supprimé");
      }}
      onDeleteRow={(id) => {
        setRegister((prev) => (Array.isArray(prev) ? prev.filter((row) => row.id !== id) : []));
        toast.success("Fiche supprimée");
      }}
    />
  );
}
