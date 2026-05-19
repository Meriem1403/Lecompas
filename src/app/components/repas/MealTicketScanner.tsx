import React, { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface MealTicketScannerProps {
  onScan: (payload: string) => void;
  scannerId?: string;
}

export function MealTicketScanner({
  onScan,
  scannerId = "meal-ticket-qr-scanner",
}: MealTicketScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const lastScanRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleScan = (decodedText: string) => {
      const now = Date.now();
      if (decodedText === lastScanRef.current && now - lastScanTimeRef.current < 3000) {
        return;
      }
      lastScanRef.current = decodedText;
      lastScanTimeRef.current = now;
      onScan(decodedText);
    };

    scannerRef.current = new Html5QrcodeScanner(
      scannerId,
      { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
      false,
    );
    scannerRef.current.render(handleScan, () => {});

    return () => {
      scannerRef.current?.clear().catch(() => {});
    };
  }, [onScan, scannerId]);

  return <div id={scannerId} className="w-full [&_video]:rounded-xl [&_img]:rounded-xl" />;
}
