import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

interface MealTicketScannerProps {
  onScan: (payload: string) => void;
  scannerId?: string;
}

type ScannerStatus = "loading" | "ready" | "error";

function isSecureCameraContext(): boolean {
  if (typeof window === "undefined") return false;
  const { protocol, hostname } = window.location;
  if (protocol === "https:") return true;
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  return false;
}

export function MealTicketScanner({
  onScan,
  scannerId = "meal-ticket-qr-scanner",
}: MealTicketScannerProps) {
  const regionId = `${scannerId}-region`;
  const onScanRef = useRef(onScan);
  const lastScanRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);
  const qrInstanceRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<ScannerStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  onScanRef.current = onScan;

  const handleDecoded = useCallback((decodedText: string) => {
    const now = Date.now();
    if (decodedText === lastScanRef.current && now - lastScanTimeRef.current < 2500) {
      return;
    }
    lastScanRef.current = decodedText;
    lastScanTimeRef.current = now;
    onScanRef.current(decodedText);
  }, []);

  const stopScanner = useCallback(async () => {
    try {
      await qrInstanceRef.current?.stop();
    } catch {
      /* déjà arrêté */
    }
    qrInstanceRef.current = null;
  }, []);

  const startScanner = useCallback(async () => {
    await stopScanner();
    setStatus("loading");
    setErrorMessage(null);

    if (!isSecureCameraContext()) {
      setStatus("error");
      setErrorMessage(
        "La caméra nécessite HTTPS (ou localhost). Utilisez la saisie manuelle ou importez une photo du QR.",
      );
      return;
    }

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5Qr = new Html5Qrcode(regionId);
      qrInstanceRef.current = html5Qr;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) {
        setStatus("error");
        setErrorMessage(
          "Aucune caméra détectée. Autorisez l'accès caméra dans les réglages du navigateur.",
        );
        return;
      }

      const backCamera =
        cameras.find((c) => /back|rear|arrière|environment/i.test(c.label)) ?? cameras[0];

      await html5Qr.start(
        backCamera.id,
        {
          fps: 8,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.max(180, Math.floor(edge * 0.72));
            return { width: size, height: size };
          },
          aspectRatio: 1,
        },
        handleDecoded,
        () => {},
      );

      setStatus("ready");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus("error");
      setErrorMessage(
        msg.includes("NotAllowed") || msg.includes("Permission")
          ? "Accès caméra refusé. Autorisez la caméra pour ce site, puis réessayez."
          : `Impossible d'ouvrir la caméra : ${msg}`,
      );
    }
  }, [handleDecoded, regionId, stopScanner]);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  const scanFromFile = async (file: File) => {
    setErrorMessage(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5Qr = new Html5Qrcode(regionId);
      const text = await html5Qr.scanFile(file, false);
      handleDecoded(text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`QR non lisible sur cette image : ${msg}`);
    }
  };

  return (
    <div className="space-y-3">
      <div
        id={regionId}
        className="w-full min-h-[220px] rounded-xl overflow-hidden bg-slate-900/5 border-2 border-dashed border-teal-200"
      />

      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-600 py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Ouverture de la caméra…
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 flex gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">Caméra indisponible</p>
            <p className="mt-1 text-amber-800">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-teal-200"
          onClick={() => startScanner()}
        >
          <Camera className="h-4 w-4 mr-1" />
          Relancer la caméra
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-teal-200"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4 mr-1" />
          Photo du QR
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) scanFromFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {status === "ready" && (
        <p className="text-xs text-slate-500">
          Cadrez le QR dans le carré. Sur iPhone/Android, acceptez l&apos;accès à la caméra si demandé.
        </p>
      )}
    </div>
  );
}
