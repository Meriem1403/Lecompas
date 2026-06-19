import React, { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { FileSignature, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import type { Action } from "@/app/types/action";
import type { PapripactSignatureRecord } from "@/app/utils/papripactStorage";
import { jsPDF } from "jspdf";

interface PapripactSignaturePanelProps {
  year: number;
  actions: Action[];
  signature?: PapripactSignatureRecord;
  onSaveSignature: (record: PapripactSignatureRecord) => void;
  canSign: boolean;
}

export function PapripactSignaturePanel({
  year,
  actions,
  signature,
  onSaveSignature,
  canSign,
}: PapripactSignaturePanelProps) {
  const [signedBy, setSignedBy] = useState(signature?.signedBy ?? "");
  const [comment, setComment] = useState(signature?.comment ?? "");
  const [signatureDataUrl, setSignatureDataUrl] = useState(signature?.signatureDataUrl ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  const papripactActions = actions.filter((action) => action.papripactYear === year);

  const handleImageUpload = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Utilisez une image PNG ou JPEG pour la signature.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSignatureDataUrl(String(reader.result || ""));
      toast.success("Image de signature chargée.");
    };
    reader.readAsDataURL(file);
  };

  const handleSign = () => {
    if (!signedBy.trim()) {
      toast.error("Indiquez le signataire.");
      return;
    }
    onSaveSignature({
      year,
      signedBy: signedBy.trim(),
      signedAt: new Date().toISOString(),
      comment: comment.trim(),
      signatureDataUrl: signatureDataUrl || undefined,
    });
    toast.success(`PAPRIPACT ${year} marqué comme signé.`);
  };

  const downloadSignedPdf = () => {
    const pdf = new jsPDF();
    const margin = 14;
    let y = 20;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(`PAPRIPACT ${year} — DIRM MED`, margin, y);
    y += 10;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Signé par : ${signature?.signedBy || signedBy}`, margin, y);
    y += 6;
    pdf.text(
      `Date : ${new Date(signature?.signedAt || Date.now()).toLocaleDateString("fr-FR")}`,
      margin,
      y,
    );
    y += 10;
    pdf.setFont("helvetica", "bold");
    pdf.text(`Actions retenues (${papripactActions.length})`, margin, y);
    y += 8;
    pdf.setFont("helvetica", "normal");
    papripactActions.forEach((action, index) => {
      const line = `${index + 1}. ${action.title} — ${action.responsable} — ${new Date(action.deadline).toLocaleDateString("fr-FR")}`;
      const lines = pdf.splitTextToSize(line, 180);
      if (y + lines.length * 5 > 280) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(lines, margin, y);
      y += lines.length * 5 + 2;
    });
    if (signatureDataUrl || signature?.signatureDataUrl) {
      try {
        pdf.addImage(signatureDataUrl || signature?.signatureDataUrl || "", "PNG", margin, y + 4, 50, 20);
      } catch {
        // ignore invalid image
      }
    }
    pdf.save(`PAPRIPACT_${year}_signe.pdf`);
  };

  return (
    <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-violet-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-indigo-950">
          <FileSignature className="h-5 w-5" />
          Validation PAPRIPACT {year}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-indigo-600 text-white">
            {papripactActions.length} action(s) retenue(s)
          </Badge>
          {signature ? (
            <Badge className="bg-emerald-600 text-white">
              Signé le {new Date(signature.signedAt).toLocaleDateString("fr-FR")}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-400 text-amber-800">
              En attente de signature annuelle
            </Badge>
          )}
        </div>

        {canSign ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Signataire</Label>
              <Input value={signedBy} onChange={(e) => setSignedBy(e.target.value)} placeholder="Nom et fonction" />
            </div>
            <div>
              <Label>Commentaire (optionnel)</Label>
              <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Validation CSP…" />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)}
              />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Signature dématérialisée
              </Button>
              <Button type="button" onClick={handleSign} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <FileSignature className="h-4 w-4 mr-2" />
                Valider le PAPRIPACT {year}
              </Button>
            </div>
          </div>
        ) : null}

        <Button type="button" variant="outline" onClick={downloadSignedPdf}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger le PAPRIPACT {year} (PDF)
        </Button>
      </CardContent>
    </Card>
  );
}
