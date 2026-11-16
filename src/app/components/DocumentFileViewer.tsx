import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

function objectUrlFromDataUrl(dataUrl: string) {
  const [header, body = ""] = dataUrl.split(",");
  const mime = header.match(/data:([^;,]+)/)?.[1] || "application/octet-stream";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

export function DocumentFileViewer({ name, dataUrl }: { name?: string; dataUrl: string }) {
  const fileName = name || "Pièce jointe";
  const isPdf = dataUrl.startsWith("data:application/pdf") || fileName.toLowerCase().endsWith(".pdf");
  const isImage = dataUrl.startsWith("data:image/");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!isPdf) return;
    const url = objectUrlFromDataUrl(dataUrl);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [dataUrl, isPdf]);

  if (isPdf) {
    return previewUrl ? (
      <iframe
        title={`Visionneuse, ${fileName}`}
        src={previewUrl}
        className="h-[70vh] w-full rounded-xl border border-violet-200 bg-white"
      />
    ) : null;
  }

  if (isImage) {
    return (
      <img
        src={dataUrl}
        alt={fileName}
        className="max-h-[70vh] w-full rounded-xl border border-violet-200 bg-white object-contain"
      />
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
      <p>
        {fileName} ne s'affiche pas dans la visionneuse. Le téléchargement PDF ou Excel reste disponible.
      </p>
    </div>
  );
}
