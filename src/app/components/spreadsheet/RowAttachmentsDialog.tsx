import React, { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Paperclip, Trash2, Download } from "lucide-react";
import type { RegisterAttachment } from "@/app/types/importedRegisters";

interface RowAttachmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  attachments: RegisterAttachment[];
  onChange: (attachments: RegisterAttachment[]) => void;
  readOnly?: boolean;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function RowAttachmentsDialog({
  open,
  onOpenChange,
  title,
  attachments,
  onChange,
  readOnly = false,
}: RowAttachmentsDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const next = [...attachments];
    for (const file of Array.from(files)) {
      const dataUrl = await readFileAsDataUrl(file);
      next.push({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl,
        uploadedAt: new Date().toISOString(),
      });
    }
    onChange(next);
  };

  const download = (att: RegisterAttachment) => {
    const a = document.createElement("a");
    a.href = att.dataUrl;
    a.download = att.fileName;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Paperclip className="h-4 w-4" />
            Pièces jointes — {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          DTA, rapports de contrôle, photos… stockés sur le serveur (app-data).
        </p>
        <ul className="max-h-60 space-y-2 overflow-y-auto">
          {attachments.length === 0 ? (
            <li className="text-sm text-muted-foreground">Aucune PJ.</li>
          ) : (
            attachments.map((att) => (
              <li
                key={att.id}
                className="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-sm"
              >
                <span className="truncate">{att.fileName}</span>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => download(att)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {!readOnly ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-600"
                      onClick={() =>
                        onChange(attachments.filter((a) => a.id !== att.id))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
        {!readOnly ? (
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                void handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              Ajouter des fichiers
            </Button>
          </>
        ) : null}
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
