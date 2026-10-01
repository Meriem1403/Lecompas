import { useEffect, useRef, useState } from "react";
import { isBackendApiEnabled } from "@/app/config/dataBackend";
import { isApiAccessToken } from "@/lib/apiClient";
import {
  fetchAppData,
  saveAppData,
  type AppDataKey,
} from "@/app/services/appDataApi";

interface AppDataStoreOptions<T> {
  seed: T;
  loadLocal?: () => T | null;
  saveLocal?: (value: T) => void;
}

export function useAppDataDocumentStore<T>(
  dataKey: AppDataKey,
  accessToken: string,
  options: AppDataStoreOptions<T>,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const skipRef = useRef(false);
  const loadLocalRef = useRef(options.loadLocal);
  const saveLocalRef = useRef(options.saveLocal);
  loadLocalRef.current = options.loadLocal;
  saveLocalRef.current = options.saveLocal;

  const [value, setValue] = useState<T>(
    () => options.loadLocal?.() ?? options.seed,
  );

  useEffect(() => {
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      return;
    }
    skipRef.current = true;
    void (async () => {
      try {
        const fromApi = await fetchAppData<T>(dataKey, accessToken);
        if (fromApi !== null && fromApi !== undefined) {
          setValue(fromApi);
          return;
        }
        const local = loadLocalRef.current?.();
        const initial = local ?? options.seed;
        setValue(initial);
        skipRef.current = false;
        await saveAppData(dataKey, initial, accessToken);
        skipRef.current = true;
      } catch (error) {
        console.warn(`[Lecompas] chargement ${dataKey}`, error);
      }
    })();
  }, [accessToken, dataKey, options.seed]);

  useEffect(() => {
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      saveLocalRef.current?.(value);
      return;
    }
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void saveAppData(dataKey, value, accessToken).catch((error) => {
        console.error(`[Lecompas] enregistrement ${dataKey}`, error);
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [value, accessToken, dataKey]);

  return [value, setValue];
}
