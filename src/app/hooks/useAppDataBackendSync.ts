import { useEffect, type MutableRefObject } from "react";
import { isBackendApiEnabled } from "@/app/config/dataBackend";
import { isApiAccessToken } from "@/lib/apiClient";
import {
  fetchAppData,
  saveAppData,
  type AppDataKey,
} from "@/app/services/appDataApi";

export type AppDataSkipRef = MutableRefObject<Record<string, boolean>>;

export async function hydrateAppDataValue<T>({
  key,
  token,
  skipRef,
  setValue,
  getDefault,
  getLocal,
}: {
  key: AppDataKey;
  token: string;
  skipRef: AppDataSkipRef;
  setValue: (value: T) => void;
  getDefault: () => T;
  getLocal: () => T | null;
}): Promise<void> {
  skipRef.current[key] = true;
  try {
    const fromApi = await fetchAppData<T>(key, token);
    if (fromApi !== null && fromApi !== undefined) {
      setValue(fromApi);
      return;
    }
  } catch (error) {
    console.warn(`[Lecompas] chargement app-data ${key}`, error);
    return;
  }

  const initial = getLocal() ?? getDefault();
  setValue(initial);
  skipRef.current[key] = false;
  try {
    await saveAppData(key, initial, token);
    skipRef.current[key] = true;
    const refreshed = await fetchAppData<T>(key, token);
    if (refreshed !== null && refreshed !== undefined) {
      setValue(refreshed);
    }
  } catch (error) {
    console.error(`[Lecompas] sync app-data ${key}`, error);
  }
}

export function useAppDataBackendSync<T>(
  key: AppDataKey,
  value: T,
  accessToken: string,
  skipRef: AppDataSkipRef,
  localSave: (value: T) => void,
): void {
  useEffect(() => {
    if (
      !isBackendApiEnabled() ||
      !accessToken ||
      !isApiAccessToken(accessToken)
    ) {
      localSave(value);
      return;
    }
    if (skipRef.current[key]) {
      skipRef.current[key] = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void saveAppData(key, value, accessToken).catch((error) => {
        console.error(`[Lecompas] enregistrement app-data ${key}`, error);
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [key, value, accessToken, localSave, skipRef]);
}
