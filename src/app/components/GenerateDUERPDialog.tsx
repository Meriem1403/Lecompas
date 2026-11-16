import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { 
  FileText, 
  Download, 
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Building2,
  Shield,
  ClipboardList,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Risk } from '@/app/components/admin/RisksManagementView';
import type { Action } from '@/app/types/action';
import { generateDuerpPdf, type DuerpExportMode } from '@/app/utils/duerpPdfExport';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import type { Document } from '@/app/components/DocumentsView';

interface GenerateDUERPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risks?: Risk[];
  actions?: Action[];
  onTransmit?: (edition: Document) => void;
}

export function GenerateDUERPDialog({
  open,
  onOpenChange,
  risks = [],
  actions = [],
  onTransmit,
}: GenerateDUERPDialogProps) {
  const [entreprise, setEntreprise] = useState('DIRM Méditerranée');
  const [adresse, setAdresse] = useState('Marseille');
  const [responsable, setResponsable] = useState('Correspondant Prévention');
  const [version, setVersion] = useState('4.0');
  const [dateDebut, setDateDebut] = useState('2026-01-01');
  const [dateFin, setDateFin] = useState('2026-12-31');
  const [exportMode, setExportMode] = useState<DuerpExportMode>('synthese');
  const [methodologie, setMethodologie] = useState('Évaluation gravité (G) × fréquence (F) = risque initial. Risque résiduel (GFM) = risque initial × coefficient de maîtrise. Priorisation P1/P2/P3 selon le GFM.');
  const [directorName, setDirectorName] = useState('Directeur Interrégional');
  const [directorEmail, setDirectorEmail] = useState('');

  const buildPdf = () => generateDuerpPdf(
    risks,
    actions,
    { entreprise, adresse, responsable, version, dateDebut, dateFin, methodologie },
    exportMode,
  );

  const handleDownloadNow = () => {
    try {
      if (risks.length === 0) {
        toast.error('Aucun risque disponible pour cette version.');
        return;
      }
      const pdf = buildPdf();
      const filename = `DUERP_${entreprise.replace(/[^a-z0-9]/gi, '_')}_instant_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      toast.success('Version téléchargée. Elle reprend les risques à cet instant.');
    } catch (error) {
      console.error(error);
      toast.error('Impossible de préparer cette version.');
    }
  };

  const handleTransmit = () => {
    try {
      if (risks.length === 0) {
        toast.error('Aucun risque disponible pour cette version.');
        return;
      }
      if (!directorName.trim()) {
        toast.error('Indiquez le directeur qui doit signer.');
        return;
      }
      const pdf = buildPdf();
      const fileDataUrl = pdf.output('datauristring');
      const today = new Date().toISOString().split('T')[0];
      const edition: Document = {
        id: `duerp-instant-${Date.now()}`,
        title: `DUERP ${version}, version à signer`,
        description: `Version arrêtée le ${new Date().toLocaleDateString('fr-FR')}, destinée à la signature de ${directorName.trim()}.`,
        type: 'DUERP',
        version,
        status: 'Envoyé pour signature',
        createdBy: responsable || 'Prévention',
        createdAt: today,
        updatedAt: today,
        fileName: `DUERP_${version}_a_signer.pdf`,
        fileDataUrl,
        fileSize: Math.round((fileDataUrl.length * 3) / 4),
        purpose: 'signature',
        editionKind: 'instantanee',
        editionYear: new Date().getFullYear(),
        snapshotAt: new Date().toISOString(),
        directorName: directorName.trim(),
        directorEmail: directorEmail.trim() || undefined,
        tags: ['signature', version],
      };
      onTransmit?.(edition);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Impossible de transmettre cette version.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <FileText className="h-6 w-6 mr-2 text-violet-700" />
            Version du DUERP à signer
          </DialogTitle>
          <DialogDescription>
            Cette version fige les risques à cet instant. Elle peut être téléchargée tout de suite, ou rangée dans la bibliothèque pour la signature du directeur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informations réglementaires */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 mb-2">Contenu réglementaire inclus</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Inventaire des risques par unité</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Évaluation gravité/probabilité</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Mesures de prévention</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Plan d'action avec échéancier</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Données d'exposition pénibilité</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Traçabilité et historique</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Formulaire */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entreprise">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Entreprise
                </Label>
                <Input
                  id="entreprise"
                  value={entreprise}
                  onChange={(e) => setEntreprise(e.target.value)}
                  placeholder="Nom de l'entreprise"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Version
                </Label>
                <Input
                  id="version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="4.0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Adresse complète"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsable">
                <User className="h-4 w-4 inline mr-1" />
                Responsable de l'établissement
              </Label>
              <Input
                id="responsable"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                placeholder="Nom du responsable"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="directorName">Directeur signataire</Label>
                <Input
                  id="directorName"
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  placeholder="Nom du directeur"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="directorEmail">Adresse du directeur</Label>
                <Input
                  id="directorEmail"
                  type="email"
                  value={directorEmail}
                  onChange={(e) => setDirectorEmail(e.target.value)}
                  placeholder="prenom.nom@developpement-durable.gouv.fr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateDebut">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Période - Début
                </Label>
                <Input
                  id="dateDebut"
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFin">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Période - Fin
                </Label>
                <Input
                  id="dateFin"
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mode d'export</Label>
              <Select value={exportMode} onValueChange={(v) => setExportMode(v as DuerpExportMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="synthese">Synthétique (recommandé — ~1 ligne par risque)</SelectItem>
                  <SelectItem value="complet">Complet (détail situation et mesures)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="methodologie">
                <ClipboardList className="h-4 w-4 inline mr-1" />
                Méthodologie d'évaluation
              </Label>
              <Textarea
                id="methodologie"
                value={methodologie}
                onChange={(e) => setMethodologie(e.target.value)}
                placeholder="Décrire la méthodologie utilisée..."
                rows={3}
              />
            </div>
          </div>

          {/* Avertissement */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Important</p>
                <p>
                  {risks.length} risque(s) à cet instant. Le 31 décembre, le même extrait est préparé automatiquement pour le directeur. L'envoi du courriel dépend du serveur de messagerie du NAS, qui n'est pas branché ici : la version est enregistrée comme transmise pour signature.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg">
            Annuler
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadNow}
            className="rounded-lg border-slate-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger maintenant
          </Button>
          <Button
            onClick={handleTransmit}
            className="rounded-lg bg-indigo-950 text-white hover:bg-indigo-900"
          >
            <Send className="h-4 w-4 mr-2" />
            Transmettre pour signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}