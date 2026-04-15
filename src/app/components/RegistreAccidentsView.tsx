import React, { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { 
  PlusCircle, 
  Eye, 
  Edit2, 
  Trash2,
  Download,
  FileText,
  Calendar,
  MapPin,
  User,
  ActivitySquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

interface AccidentBenin {
  id: string;
  numero: number;
  annee: number;
  nomVictime: string;
  prenomVictime: string;
  dateAccident: string;
  heureAccident: string;
  lieuAccident: string;
  circonstances: string;
  natureLesions: string;
  siegeLesions: string;
  soignant: string;
  signatureSoignant: boolean;
  signatureVictime: boolean;
  dateInscription: string;
  observations?: string;
}

// Données fictives
const FAKE_ACCIDENTS: AccidentBenin[] = [
  {
    id: '1',
    numero: 1,
    annee: 2026,
    nomVictime: 'Dupont',
    prenomVictime: 'Marie',
    dateAccident: '2026-01-15',
    heureAccident: '10:30',
    lieuAccident: 'Atelier de production - Zone découpe',
    circonstances: 'Coupure superficielle au doigt en manipulant une lame de découpe',
    natureLesions: 'Coupure superficielle',
    siegeLesions: 'Index main droite',
    soignant: 'Dr. Laurent Mercier',
    signatureSoignant: true,
    signatureVictime: true,
    dateInscription: '2026-01-15',
    observations: 'Pansement appliqué, pas de soins nécessaires'
  },
  {
    id: '2',
    numero: 2,
    annee: 2026,
    nomVictime: 'Martin',
    prenomVictime: 'Jean',
    dateAccident: '2026-01-20',
    heureAccident: '14:15',
    lieuAccident: 'Entrepôt - Allée B',
    circonstances: 'Chute de plain-pied sur sol mouillé, léger choc au genou',
    natureLesions: 'Contusion légère',
    siegeLesions: 'Genou gauche',
    soignant: 'Infirmier Paul Bernard',
    signatureSoignant: true,
    signatureVictime: true,
    dateInscription: '2026-01-20',
    observations: 'Application de glace, surveillance 15 minutes'
  },
  {
    id: '3',
    numero: 3,
    annee: 2026,
    nomVictime: 'Bernard',
    prenomVictime: 'Sophie',
    dateAccident: '2026-01-28',
    heureAccident: '09:45',
    lieuAccident: 'Bureau administratif - 2ème étage',
    circonstances: 'Heurt contre un meuble en se déplaçant, petit hématome',
    natureLesions: 'Hématome superficiel',
    siegeLesions: 'Tibia droit',
    soignant: 'Dr. Laurent Mercier',
    signatureSoignant: true,
    signatureVictime: true,
    dateInscription: '2026-01-28',
    observations: 'Aucun soin nécessaire, surveillance recommandée'
  }
];

export function RegistreAccidentsView() {
  const [accidents, setAccidents] = useState<AccidentBenin[]>(FAKE_ACCIDENTS);
  const [viewingAccident, setViewingAccident] = useState<AccidentBenin | null>(null);
  const [editingAccident, setEditingAccident] = useState<AccidentBenin | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accidentToDelete, setAccidentToDelete] = useState<string | null>(null);
  const [filterAnnee, setFilterAnnee] = useState<string>('all');

  // Filtrage
  const filteredAccidents = accidents.filter(acc => {
    if (filterAnnee !== 'all' && acc.annee.toString() !== filterAnnee) return false;
    return true;
  });

  // Années disponibles
  const availableYears = Array.from(new Set(accidents.map(a => a.annee))).sort((a, b) => b - a);

  const handleAdd = () => {
    setIsCreating(true);
  };

  const handleView = (accident: AccidentBenin) => {
    setViewingAccident(accident);
  };

  const handleEdit = (accident: AccidentBenin) => {
    setEditingAccident(accident);
  };

  const handleDelete = (id: string) => {
    setAccidentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (accidentToDelete) {
      setAccidents(accidents.filter(a => a.id !== accidentToDelete));
      toast.success('Accident supprimé avec succès');
      setDeleteDialogOpen(false);
      setAccidentToDelete(null);
    }
  };

  const handleExportPDF = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = 20;

      // Header
      pdf.setFillColor(220, 38, 38);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REGISTRE DES ACCIDENTS', pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(18);
      pdf.text('DU TRAVAIL', pageWidth / 2, 30, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text('(Accidents bénins sans arrêt)', pageWidth / 2, 40, { align: 'center' });

      yPos = 65;

      // Cadre réglementaire
      pdf.setFillColor(254, 242, 242);
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 3, 3, 'F');
      pdf.setDrawColor(220, 38, 38);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 3, 3, 'S');

      yPos += 8;
      pdf.setTextColor(153, 27, 27);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CADRE RÉGLEMENTAIRE', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 6;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);
      const regl = 'Article D.4711-3 du Code du travail - Registre destiné aux accidents bénins ne donnant lieu ni à arrêt de travail ni à soins pris en charge par la Sécurité sociale. Conservation: 5 ans.';
      const reglLines = pdf.splitTextToSize(regl, pageWidth - 2 * margin - 10);
      pdf.text(reglLines, pageWidth / 2, yPos, { align: 'center' });

      yPos += 25;

      // Informations générales
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(31, 41, 55);
      pdf.text(`Date d'édition: ${new Date().toLocaleDateString('fr-FR')}`, margin, yPos);
      pdf.text(`Total accidents: ${filteredAccidents.length}`, pageWidth - margin, yPos, { align: 'right' });

      yPos += 15;

      // Tableau des accidents
      filteredAccidents.forEach((accident, index) => {
        if (yPos > pageHeight - 60) {
          pdf.addPage();
          yPos = 20;
          // Header répété
          pdf.setFillColor(220, 38, 38);
          pdf.rect(0, 0, pageWidth, 15, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Registre des Accidents du Travail (suite)', pageWidth / 2, 10, { align: 'center' });
          yPos = 30;
        }

        // Cadre accident
        pdf.setFillColor(249, 250, 251);
        pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 55, 2, 2, 'F');
        pdf.setDrawColor(209, 213, 219);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 55, 2, 2, 'S');

        // Numéro et date
        pdf.setFillColor(220, 38, 38);
        pdf.rect(margin, yPos, 25, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`N° ${accident.numero}/${accident.annee}`, margin + 12.5, yPos + 5.5, { align: 'center' });

        pdf.setTextColor(31, 41, 55);
        pdf.setFontSize(8);
        pdf.text(`Date: ${new Date(accident.dateAccident).toLocaleDateString('fr-FR')} à ${accident.heureAccident}`, margin + 30, yPos + 5.5);

        yPos += 12;

        // Victime
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(55, 65, 81);
        pdf.text('Victime:', margin + 3, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${accident.prenomVictime} ${accident.nomVictime}`, margin + 20, yPos);

        pdf.setFont('helvetica', 'bold');
        pdf.text('Lieu:', margin + 90, yPos);
        pdf.setFont('helvetica', 'normal');
        const lieuText = pdf.splitTextToSize(accident.lieuAccident, 80);
        pdf.text(lieuText, margin + 100, yPos);

        yPos += 6;

        // Circonstances
        pdf.setFont('helvetica', 'bold');
        pdf.text('Circonstances:', margin + 3, yPos);
        pdf.setFont('helvetica', 'normal');
        const circLines = pdf.splitTextToSize(accident.circonstances, pageWidth - 2 * margin - 40);
        pdf.text(circLines, margin + 30, yPos);

        yPos += 6 * circLines.length;

        // Lésions
        pdf.setFont('helvetica', 'bold');
        pdf.text('Nature lésions:', margin + 3, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(accident.natureLesions, margin + 30, yPos);

        pdf.setFont('helvetica', 'bold');
        pdf.text('Siège:', margin + 90, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(accident.siegeLesions, margin + 100, yPos);

        yPos += 6;

        // Soignant
        pdf.setFont('helvetica', 'bold');
        pdf.text('Soignant:', margin + 3, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(accident.soignant, margin + 20, yPos);

        // Signatures
        pdf.setFont('helvetica', 'bold');
        pdf.text('Signatures:', margin + 90, yPos);
        pdf.setFont('helvetica', 'normal');
        const sigText = `Soignant: ${accident.signatureSoignant ? '✓' : '✗'} | Victime: ${accident.signatureVictime ? '✓' : '✗'}`;
        pdf.text(sigText, margin + 110, yPos);

        yPos += 60;
      });

      // Footer
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        const footY = pageHeight - 10;
        pdf.setDrawColor(209, 213, 219);
        pdf.line(margin, footY - 5, pageWidth - margin, footY - 5);
        pdf.setTextColor(107, 114, 128);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text('Registre des Accidents du Travail - Conservation 5 ans', margin, footY);
        pdf.text(`Page ${i}/${totalPages}`, pageWidth - margin, footY, { align: 'right' });
      }

      pdf.save(`Registre_Accidents_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF généré avec succès !');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  if (isCreating) {
    return <CreateAccidentView onBack={() => setIsCreating(false)} onSave={(accident) => {
      const newAccident = {
        ...accident,
        id: Date.now().toString(),
        numero: Math.max(...accidents.map(a => a.numero), 0) + 1,
        dateInscription: new Date().toISOString().split('T')[0]
      };
      setAccidents([...accidents, newAccident]);
      setIsCreating(false);
      toast.success('Accident enregistré avec succès');
    }} />;
  }

  if (viewingAccident) {
    return <ViewAccidentDetail accident={viewingAccident} onBack={() => setViewingAccident(null)} />;
  }

  if (editingAccident) {
    return <EditAccidentView 
      accident={editingAccident} 
      onBack={() => setEditingAccident(null)}
      onSave={(updated) => {
        setAccidents(accidents.map(a => a.id === updated.id ? updated : a));
        setEditingAccident(null);
        toast.success('Accident modifié avec succès');
      }}
    />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Registre des Accidents du Travail</h3>
          <p className="text-gray-600">Accidents bénins sans arrêt (Article D.4711-3)</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={handleExportPDF}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
          <Button 
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg" 
            onClick={handleAdd}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouvel Accident
          </Button>
        </div>
      </div>

      {/* Info réglementaire */}
      <Card className="bg-amber-50 border-amber-200 p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-900 mb-1">Informations réglementaires</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Ce registre est facultatif et réservé aux accidents bénins (sans arrêt ni soins remboursés)</li>
              <li>• Inscription dans les 48h ouvrables après l'accident</li>
              <li>• Conservation obligatoire : 5 ans à compter de la fin de l'exercice</li>
              <li>• Peut être tenu sur support papier ou dématérialisé</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Total accidents 2026</p>
              <p className="text-3xl font-bold text-red-700">{accidents.filter(a => a.annee === 2026).length}</p>
            </div>
            <ActivitySquare className="h-10 w-10 text-red-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Ce mois-ci</p>
              <p className="text-3xl font-bold text-blue-700">
                {accidents.filter(a => {
                  const accDate = new Date(a.dateAccident);
                  const now = new Date();
                  return accDate.getMonth() === now.getMonth() && accDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <Calendar className="h-10 w-10 text-blue-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Signés complets</p>
              <p className="text-3xl font-bold text-green-700">
                {accidents.filter(a => a.signatureSoignant && a.signatureVictime).length}
              </p>
            </div>
            <CheckCircle2 className="h-10 w-10 text-green-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Délai moyen inscription</p>
              <p className="text-3xl font-bold text-purple-700">&lt; 24h</p>
            </div>
            <Clock className="h-10 w-10 text-purple-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtres:</span>
        </div>
        <Select value={filterAnnee} onValueChange={setFilterAnnee}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Toutes les années" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les années</SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Liste des accidents */}
      <div className="space-y-4">
        {filteredAccidents.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun accident enregistré</h3>
            <p className="text-gray-600 mb-4">Commencez par enregistrer un accident bénin</p>
            <Button onClick={handleAdd} className="bg-red-600 hover:bg-red-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              Nouvel Accident
            </Button>
          </Card>
        ) : (
          filteredAccidents.map(accident => (
            <Card key={accident.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <Badge className="bg-red-600 text-white">
                      N° {accident.numero}/{accident.annee}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {new Date(accident.dateAccident).toLocaleDateString('fr-FR')} à {accident.heureAccident}
                    </span>
                    {accident.signatureSoignant && accident.signatureVictime && (
                      <Badge variant="outline" className="border-green-600 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Signé
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600 flex items-center mb-1">
                        <User className="h-4 w-4 mr-2" />
                        Victime
                      </p>
                      <p className="font-semibold text-gray-900">{accident.prenomVictime} {accident.nomVictime}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 flex items-center mb-1">
                        <MapPin className="h-4 w-4 mr-2" />
                        Lieu
                      </p>
                      <p className="text-gray-900">{accident.lieuAccident}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-600 mb-1">Circonstances</p>
                    <p className="text-gray-700">{accident.circonstances}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Nature des lésions</p>
                      <p className="text-gray-900">{accident.natureLesions}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Siège des lésions</p>
                      <p className="text-gray-900">{accident.siegeLesions}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Soignant:</span> {accident.soignant}
                      <span className="ml-4 text-gray-500">
                        Inscrit le {new Date(accident.dateInscription).toLocaleDateString('fr-FR')}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleView(accident)}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleEdit(accident)}
                    className="border-orange-600 text-orange-600 hover:bg-orange-50"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDelete(accident.id)}
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet accident du registre ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Composant de création
function CreateAccidentView({ onBack, onSave }: { onBack: () => void; onSave: (accident: Omit<AccidentBenin, 'id' | 'numero' | 'dateInscription'>) => void }) {
  const [formData, setFormData] = useState({
    annee: new Date().getFullYear(),
    nomVictime: '',
    prenomVictime: '',
    dateAccident: new Date().toISOString().split('T')[0],
    heureAccident: '',
    lieuAccident: '',
    circonstances: '',
    natureLesions: '',
    siegeLesions: '',
    soignant: '',
    signatureSoignant: false,
    signatureVictime: false,
    observations: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomVictime || !formData.prenomVictime || !formData.dateAccident || !formData.lieuAccident) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Nouvel Accident Bénin</h3>
          <p className="text-gray-600">Inscription au registre des accidents du travail</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Retour
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Informations victime */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-red-600" />
              Informations sur la victime
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nomVictime}
                  onChange={(e) => setFormData({ ...formData, nomVictime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenomVictime}
                  onChange={(e) => setFormData({ ...formData, prenomVictime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annee">Année</Label>
                <Input
                  id="annee"
                  type="number"
                  value={formData.annee}
                  onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Date et lieu */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-red-600" />
              Date et lieu de l'accident
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateAccident">Date de l'accident *</Label>
                <Input
                  id="dateAccident"
                  type="date"
                  value={formData.dateAccident}
                  onChange={(e) => setFormData({ ...formData, dateAccident: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heureAccident">Heure de l'accident</Label>
                <Input
                  id="heureAccident"
                  type="time"
                  value={formData.heureAccident}
                  onChange={(e) => setFormData({ ...formData, heureAccident: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="lieu">Lieu de l'accident *</Label>
                <Input
                  id="lieu"
                  value={formData.lieuAccident}
                  onChange={(e) => setFormData({ ...formData, lieuAccident: e.target.value })}
                  placeholder="Ex: Atelier, Bureau..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Circonstances */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              Circonstances et lésions
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="circonstances">Circonstances de l'accident *</Label>
                <Textarea
                  id="circonstances"
                  value={formData.circonstances}
                  onChange={(e) => setFormData({ ...formData, circonstances: e.target.value })}
                  placeholder="Décrire ce qui s'est passé..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="natureLesions">Nature des lésions *</Label>
                  <Input
                    id="natureLesions"
                    value={formData.natureLesions}
                    onChange={(e) => setFormData({ ...formData, natureLesions: e.target.value })}
                    placeholder="Ex: Coupure, Contusion..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siegeLesions">Siège des lésions (localisation) *</Label>
                  <Input
                    id="siegeLesions"
                    value={formData.siegeLesions}
                    onChange={(e) => setFormData({ ...formData, siegeLesions: e.target.value })}
                    placeholder="Ex: Main droite, Genou gauche..."
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Soignant et signatures */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-red-600" />
              Soignant et signatures
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="soignant">Nom du soignant / professionnel de santé *</Label>
                <Input
                  id="soignant"
                  value={formData.soignant}
                  onChange={(e) => setFormData({ ...formData, soignant: e.target.value })}
                  placeholder="Ex: Dr. Martin, Infirmier Dupont..."
                  required
                />
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.signatureSoignant}
                    onChange={(e) => setFormData({ ...formData, signatureSoignant: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Signature du soignant</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.signatureVictime}
                    onChange={(e) => setFormData({ ...formData, signatureVictime: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Signature de la victime</span>
                </label>
              </div>
            </div>
          </div>

          {/* Observations */}
          <div>
            <div className="space-y-2">
              <Label htmlFor="observations">Observations (facultatif)</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Remarques complémentaires..."
                rows={2}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onBack}>
              Annuler
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700">
              Enregistrer l'accident
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

// Composant de vue détaillée
function ViewAccidentDetail({ accident, onBack }: { accident: AccidentBenin; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Détail de l'accident N° {accident.numero}/{accident.annee}</h3>
          <p className="text-gray-600">Enregistré le {new Date(accident.dateInscription).toLocaleDateString('fr-FR')}</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Retour
        </Button>
      </div>

      <Card className="p-6 space-y-6">
        {/* Status */}
        <div className="flex items-center space-x-3">
          <Badge className="bg-red-600 text-white">
            Accident N° {accident.numero}/{accident.annee}
          </Badge>
          {accident.signatureSoignant && accident.signatureVictime && (
            <Badge variant="outline" className="border-green-600 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Document signé et complet
            </Badge>
          )}
        </div>

        {/* Victime */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <User className="h-5 w-5 mr-2 text-red-600" />
            Informations victime
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p><span className="font-medium">Nom:</span> {accident.nomVictime}</p>
            <p><span className="font-medium">Prénom:</span> {accident.prenomVictime}</p>
          </div>
        </div>

        {/* Date et lieu */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-red-600" />
            Date et lieu
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p><span className="font-medium">Date:</span> {new Date(accident.dateAccident).toLocaleDateString('fr-FR')}</p>
            <p><span className="font-medium">Heure:</span> {accident.heureAccident}</p>
            <p><span className="font-medium">Lieu:</span> {accident.lieuAccident}</p>
          </div>
        </div>

        {/* Circonstances */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
            Circonstances
          </h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900">{accident.circonstances}</p>
          </div>
        </div>

        {/* Lésions */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <ActivitySquare className="h-5 w-5 mr-2 text-red-600" />
            Lésions
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p><span className="font-medium">Nature:</span> {accident.natureLesions}</p>
            <p><span className="font-medium">Siège (localisation):</span> {accident.siegeLesions}</p>
          </div>
        </div>

        {/* Soignant */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-red-600" />
            Soignant et signatures
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p><span className="font-medium">Soignant:</span> {accident.soignant}</p>
            <div className="flex items-center space-x-6 pt-2">
              <div className="flex items-center space-x-2">
                {accident.signatureSoignant ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
                <span className="text-sm">Signature soignant</span>
              </div>
              <div className="flex items-center space-x-2">
                {accident.signatureVictime ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
                <span className="text-sm">Signature victime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Observations */}
        {accident.observations && (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Observations</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900">{accident.observations}</p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Date d'inscription au registre:</span> {new Date(accident.dateInscription).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </Card>
    </div>
  );
}

// Composant d'édition
function EditAccidentView({ accident, onBack, onSave }: { accident: AccidentBenin; onBack: () => void; onSave: (accident: AccidentBenin) => void }) {
  const [formData, setFormData] = useState(accident);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Modifier l'accident N° {accident.numero}/{accident.annee}</h3>
          <p className="text-gray-600">Mise à jour de l'enregistrement</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Retour
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Similar structure to CreateAccidentView but with pre-filled data */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-red-600" />
              Informations sur la victime
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nomVictime}
                  onChange={(e) => setFormData({ ...formData, nomVictime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  value={formData.prenomVictime}
                  onChange={(e) => setFormData({ ...formData, prenomVictime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annee">Année</Label>
                <Input
                  id="annee"
                  type="number"
                  value={formData.annee}
                  onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-red-600" />
              Date et lieu de l'accident
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateAccident">Date de l'accident *</Label>
                <Input
                  id="dateAccident"
                  type="date"
                  value={formData.dateAccident}
                  onChange={(e) => setFormData({ ...formData, dateAccident: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heureAccident">Heure de l'accident</Label>
                <Input
                  id="heureAccident"
                  type="time"
                  value={formData.heureAccident}
                  onChange={(e) => setFormData({ ...formData, heureAccident: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lieu">Lieu de l'accident *</Label>
                <Input
                  id="lieu"
                  value={formData.lieuAccident}
                  onChange={(e) => setFormData({ ...formData, lieuAccident: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              Circonstances et lésions
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="circonstances">Circonstances de l'accident *</Label>
                <Textarea
                  id="circonstances"
                  value={formData.circonstances}
                  onChange={(e) => setFormData({ ...formData, circonstances: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="natureLesions">Nature des lésions *</Label>
                  <Input
                    id="natureLesions"
                    value={formData.natureLesions}
                    onChange={(e) => setFormData({ ...formData, natureLesions: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siegeLesions">Siège des lésions *</Label>
                  <Input
                    id="siegeLesions"
                    value={formData.siegeLesions}
                    onChange={(e) => setFormData({ ...formData, siegeLesions: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-red-600" />
              Soignant et signatures
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="soignant">Nom du soignant *</Label>
                <Input
                  id="soignant"
                  value={formData.soignant}
                  onChange={(e) => setFormData({ ...formData, soignant: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.signatureSoignant}
                    onChange={(e) => setFormData({ ...formData, signatureSoignant: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Signature du soignant</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.signatureVictime}
                    onChange={(e) => setFormData({ ...formData, signatureVictime: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Signature de la victime</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="space-y-2">
              <Label htmlFor="observations">Observations</Label>
              <Textarea
                id="observations"
                value={formData.observations || ''}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onBack}>
              Annuler
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700">
              Enregistrer les modifications
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
