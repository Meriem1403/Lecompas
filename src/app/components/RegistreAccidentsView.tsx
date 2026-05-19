import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { RegistreAccidentSupplementFields, type RegistreFormExtended } from './RegistreAccidentSupplementFields';
import type { AccidentDuerpRiskRef } from '@/app/utils/accidentRecord';
import {
  EMPTY_REGISTRE_EXTENDED,
  normalizeRegistreAccident,
} from '@/app/utils/registreAccidentRecord';
import {
  exportRegistreBeninDeclarationPdf,
  exportRegistreBeninListPdf,
} from '@/app/utils/registreAccidentPdfExport';
import { ListPaginationBar, DEFAULT_LIST_PAGE_SIZE } from '@/app/components/ui/list-pagination-bar';

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
  signatureSoignantDate?: string;
  signatureVictimeDate?: string;
  signatureSoignantImage?: string;
  signatureVictimeImage?: string;
  dateInscription: string;
  observations?: string;
  serviceAffectation?: string;
  domaineAffectation?: string;
  lieuAffectation?: string;
  categorieAccident?: string;
  typeAccidentNature?: string;
  typeLegal?: '' | 'travail' | 'trajet' | 'maladie_pro';
  descriptionFaits?: string;
  causes?: string;
  analyseCauses?: string;
  commentaires?: string;
  duerpRiskId?: string;
  duerpRiskNumber?: string;
  duerpRiskLabel?: string;
  duerpRiskFreeText?: string;
}

interface AgentOption {
  id: string;
  firstName: string;
  lastName: string;
  service: string;
  domain: string;
  location: string;
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
    signatureSoignantDate: '2026-01-15',
    signatureVictimeDate: '2026-01-15',
    signatureSoignantImage: '',
    signatureVictimeImage: '',
    dateInscription: '2026-01-15T11:05:00',
    observations: 'Pansement appliqué, pas de soins nécessaires',
    categorieAccident: 'Travail',
    typeAccidentNature: 'Coupure',
    typeLegal: 'travail',
    descriptionFaits: 'Coupure superficielle lors de la découpe',
    causes: 'Lame non sécurisée',
    commentaires: 'Surveillance 15 min',
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
    signatureSoignantDate: '2026-01-20',
    signatureVictimeDate: '2026-01-20',
    signatureSoignantImage: '',
    signatureVictimeImage: '',
    dateInscription: '2026-01-20T14:48:00',
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
    signatureSoignantDate: '2026-01-28',
    signatureVictimeDate: '2026-01-28',
    signatureSoignantImage: '',
    signatureVictimeImage: '',
    dateInscription: '2026-01-28T10:12:00',
    observations: 'Aucun soin nécessaire, surveillance recommandée'
  }
];

interface RegistreAccidentsViewProps {
  risks?: AccidentDuerpRiskRef[];
  agents?: AgentOption[];
  serviceOptions?: string[];
  domainOptions?: string[];
  locationOptions?: string[];
}

export function RegistreAccidentsView({
  risks = [],
  agents = [],
  serviceOptions = [],
  domainOptions = [],
  locationOptions = [],
}: RegistreAccidentsViewProps) {
  const hasSoignantSignature = (acc: AccidentBenin) => Boolean(acc.signatureSoignantImage) || Boolean(acc.signatureSoignantDate) || acc.signatureSoignant;
  const hasVictimeSignature = (acc: AccidentBenin) => Boolean(acc.signatureVictimeImage) || Boolean(acc.signatureVictimeDate) || acc.signatureVictime;
  const isFullySigned = (acc: AccidentBenin) => hasSoignantSignature(acc) && hasVictimeSignature(acc);

  const [accidents, setAccidents] = useState<AccidentBenin[]>(FAKE_ACCIDENTS);
  const [viewingAccident, setViewingAccident] = useState<AccidentBenin | null>(null);
  const [editingAccident, setEditingAccident] = useState<AccidentBenin | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accidentToDelete, setAccidentToDelete] = useState<string | null>(null);
  const [filterAnnee, setFilterAnnee] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSignature, setFilterSignature] = useState<string>('all');
  const [filterSoignant, setFilterSoignant] = useState<string>('all');
  const [listPage, setListPage] = useState(1);

  // Filtrage
  const filteredAccidents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return accidents.filter(acc => {
      if (filterAnnee !== 'all' && acc.annee.toString() !== filterAnnee) return false;
      if (filterSoignant !== 'all' && acc.soignant !== filterSoignant) return false;
      if (filterSignature === 'signed' && !isFullySigned(acc)) return false;
      if (filterSignature === 'partial' && isFullySigned(acc)) return false;

      if (!normalizedSearch) return true;
      const victim = `${acc.prenomVictime} ${acc.nomVictime}`.toLowerCase();
      return (
        victim.includes(normalizedSearch) ||
        acc.lieuAccident.toLowerCase().includes(normalizedSearch) ||
        acc.circonstances.toLowerCase().includes(normalizedSearch) ||
        acc.natureLesions.toLowerCase().includes(normalizedSearch) ||
        (acc.categorieAccident ?? '').toLowerCase().includes(normalizedSearch) ||
        (acc.typeAccidentNature ?? '').toLowerCase().includes(normalizedSearch) ||
        (acc.causes ?? '').toLowerCase().includes(normalizedSearch) ||
        (acc.commentaires ?? '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [accidents, filterAnnee, searchTerm, filterSignature, filterSoignant]);

  const listPageSize = DEFAULT_LIST_PAGE_SIZE;
  const listTotalPages = Math.max(1, Math.ceil(filteredAccidents.length / listPageSize));
  const paginatedAccidents = useMemo(() => {
    const start = (listPage - 1) * listPageSize;
    return filteredAccidents.slice(start, start + listPageSize);
  }, [filteredAccidents, listPage, listPageSize]);

  useEffect(() => {
    setListPage(1);
  }, [filterAnnee, searchTerm, filterSignature, filterSoignant]);

  useEffect(() => {
    if (listPage > listTotalPages) setListPage(listTotalPages);
  }, [listPage, listTotalPages]);

  // Années disponibles
  const availableYears = Array.from(new Set(accidents.map(a => a.annee))).sort((a, b) => b - a);
  const availableSoignants = Array.from(new Set(accidents.map(a => a.soignant))).sort((a, b) => a.localeCompare(b));

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
      if (filteredAccidents.length === 0) {
        toast.error('Aucun accident à exporter.');
        return;
      }
      exportRegistreBeninListPdf(filteredAccidents, {
        hasSoignantSignature,
        hasVictimeSignature,
      });
      toast.success('PDF généré avec succès !');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  if (isCreating) {
    return <CreateAccidentView
      risks={risks}
      onBack={() => setIsCreating(false)}
      agents={agents}
      serviceOptions={serviceOptions}
      domainOptions={domainOptions}
      locationOptions={locationOptions}
      onSave={(accident) => {
      const accidentYear = new Date(accident.dateAccident).getFullYear();
      const newAccident = normalizeRegistreAccident({
        ...accident,
        id: Date.now().toString(),
        numero: Math.max(...accidents.map(a => a.numero), 0) + 1,
        annee: Number.isNaN(accidentYear) ? new Date().getFullYear() : accidentYear,
        dateInscription: new Date().toISOString()
      }, risks);
      setAccidents([...accidents, newAccident]);
      setIsCreating(false);
      toast.success('Accident enregistré avec succès');
    }}
    />;
  }

  if (viewingAccident) {
    return <ViewAccidentDetail accident={viewingAccident} risks={risks} onBack={() => setViewingAccident(null)} />;
  }

  if (editingAccident) {
    return <EditAccidentView 
      risks={risks}
      accident={editingAccident} 
      onBack={() => setEditingAccident(null)}
      agents={agents}
      serviceOptions={serviceOptions}
      domainOptions={domainOptions}
      locationOptions={locationOptions}
      onSave={(updated) => {
        const updatedYear = new Date(updated.dateAccident).getFullYear();
        setAccidents(accidents.map(a => a.id === updated.id ? normalizeRegistreAccident({
          ...updated,
          annee: Number.isNaN(updatedYear) ? a.annee : updatedYear
        }, risks) : a));
        setEditingAccident(null);
        toast.success('Accident modifié avec succès');
      }}
    />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Registre des Accidents du Travail</h3>
          <p className="text-gray-600">Accidents bénins sans arrêt (Article D.4711-3)</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3 lg:w-auto lg:items-center">
          <Button 
            className="w-full sm:w-auto lg:min-w-[170px] bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg" 
            onClick={handleAdd}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouvel accident
          </Button>
          <Button 
            onClick={handleExportPDF}
            variant="outline"
            className="w-full sm:w-auto lg:min-w-[150px] border-red-600 text-red-600 hover:bg-red-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Info réglementaire */}
      <Card className="bg-amber-50 border-amber-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="h-full p-4 bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-red-600 font-medium">Total accidents 2026</p>
              <p className="text-3xl font-bold text-red-700">{accidents.filter(a => a.annee === 2026).length}</p>
            </div>
            <div className="h-11 w-11 shrink-0 rounded-xl bg-red-100/80 flex items-center justify-center">
              <ActivitySquare className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="h-full p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-blue-600 font-medium">Ce mois-ci</p>
              <p className="text-3xl font-bold text-blue-700">
                {accidents.filter(a => {
                  const accDate = new Date(a.dateAccident);
                  const now = new Date();
                  return accDate.getMonth() === now.getMonth() && accDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="h-11 w-11 shrink-0 rounded-xl bg-blue-100/80 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="h-full p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-green-600 font-medium">Signés complets</p>
              <p className="text-3xl font-bold text-green-700">
                {accidents.filter((a) => isFullySigned(a)).length}
              </p>
            </div>
            <div className="h-11 w-11 shrink-0 rounded-xl bg-green-100/80 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="h-full p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-purple-600 font-medium">Délai moyen inscription</p>
              <p className="text-2xl font-bold text-purple-700">24 h maximum</p>
            </div>
            <div className="h-11 w-11 shrink-0 rounded-xl bg-purple-100/80 flex items-center justify-center">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtres:</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher victime, lieu, circonstances..."
            className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus-visible:ring-red-500/30"
          />
        <Select value={filterAnnee} onValueChange={setFilterAnnee}>
          <SelectTrigger className="w-full bg-white border-gray-300 text-gray-900 focus:ring-red-500/30">
            <SelectValue placeholder="Toutes les années" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les années</SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSignature} onValueChange={setFilterSignature}>
          <SelectTrigger className="w-full bg-white border-gray-300 text-gray-900 focus:ring-red-500/30">
            <SelectValue placeholder="Signature" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les signatures</SelectItem>
            <SelectItem value="signed">Signé complet</SelectItem>
            <SelectItem value="partial">Signature incomplète</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSoignant} onValueChange={setFilterSoignant}>
          <SelectTrigger className="w-full bg-white border-gray-300 text-gray-900 focus:ring-red-500/30">
            <SelectValue placeholder="Soignant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les soignants</SelectItem>
            {availableSoignants.map((soignant) => (
              <SelectItem key={soignant} value={soignant}>{soignant}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
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
              Nouvel accident
            </Button>
          </Card>
        ) : (
          paginatedAccidents.map(accident => (
            <Card key={accident.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 mb-3">
                    <Badge className="bg-red-600 text-white">
                      N° {accident.numero}/{accident.annee}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {new Date(accident.dateAccident).toLocaleDateString('fr-FR')} à {accident.heureAccident}
                    </span>
                    {isFullySigned(accident) && (
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
                    <div className="text-sm text-gray-600 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                      <p>
                        <span className="font-medium">Soignant:</span> {accident.soignant}
                      </p>
                      <p className="text-gray-500">
                        Déclaré le {new Date(accident.dateInscription).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-2 lg:ml-4">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleView(accident)}
                    className="w-full sm:w-auto border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleEdit(accident)}
                    className="w-full sm:w-auto border-orange-600 text-orange-600 hover:bg-orange-50"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDelete(accident.id)}
                    className="w-full sm:w-auto border-red-600 text-red-600 hover:bg-red-50"
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

      <ListPaginationBar
        currentPage={listPage}
        totalPages={listTotalPages}
        totalItems={filteredAccidents.length}
        onPageChange={setListPage}
        itemLabel="enregistrement(s)"
      />

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
function CreateAccidentView({
  onBack,
  onSave,
  risks,
  agents,
  serviceOptions,
  domainOptions,
  locationOptions
}: {
  onBack: () => void;
  onSave: (accident: Omit<AccidentBenin, 'id' | 'numero' | 'annee' | 'dateInscription'>) => void;
  risks: AccidentDuerpRiskRef[];
  agents: AgentOption[];
  serviceOptions: string[];
  domainOptions: string[];
  locationOptions: string[];
}) {
  const [formData, setFormData] = useState({
    nomVictime: '',
    prenomVictime: '',
    serviceAffectation: '',
    domaineAffectation: '',
    lieuAffectation: '',
    dateAccident: new Date().toISOString().split('T')[0],
    heureAccident: '',
    lieuAccident: '',
    circonstances: '',
    natureLesions: '',
    siegeLesions: '',
    soignant: '',
    signatureSoignant: false,
    signatureVictime: false,
    signatureSoignantDate: '',
    signatureVictimeDate: '',
    signatureSoignantImage: '',
    signatureVictimeImage: '',
    observations: '',
    ...EMPTY_REGISTRE_EXTENDED,
  });

  const filteredAgents = useMemo(
    () => agents.filter((agent) =>
      (!formData.serviceAffectation || agent.service === formData.serviceAffectation) &&
      (!formData.domaineAffectation || agent.domain === formData.domaineAffectation) &&
      (!formData.lieuAffectation || agent.location === formData.lieuAffectation)
    ),
    [agents, formData.serviceAffectation, formData.domaineAffectation, formData.lieuAffectation]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomVictime || !formData.prenomVictime || !formData.dateAccident || !formData.lieuAccident || !formData.circonstances?.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    onSave(formData);
  };

  const handleVictimeSelection = (fullName: string) => {
    const [prenom, ...restNom] = fullName.split(' ');
    setFormData({
      ...formData,
      prenomVictime: prenom || '',
      nomVictime: restNom.join(' ') || ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Nouvel accident bénin</h3>
          <p className="text-gray-600">Inscription au registre des accidents du travail</p>
        </div>
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
          Retour
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Affectation et victime */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-red-600" />
              Informations sur la victime
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Service</Label>
                <Select
                  value={formData.serviceAffectation || 'all'}
                  onValueChange={(value) => setFormData({ ...formData, serviceAffectation: value === 'all' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Non sélectionné" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Non sélectionné</SelectItem>
                    {serviceOptions.map((service) => (
                      <SelectItem key={service} value={service}>{service}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Domaine</Label>
                <Select
                  value={formData.domaineAffectation || 'all'}
                  onValueChange={(value) => setFormData({ ...formData, domaineAffectation: value === 'all' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Non sélectionné" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Non sélectionné</SelectItem>
                    {domainOptions.map((domain) => (
                      <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lieu</Label>
                <Select
                  value={formData.lieuAffectation || 'all'}
                  onValueChange={(value) => setFormData({ ...formData, lieuAffectation: value === 'all' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Non sélectionné" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Non sélectionné</SelectItem>
                    {locationOptions.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Victime *</Label>
                <Select
                  value={formData.prenomVictime && formData.nomVictime ? `${formData.prenomVictime} ${formData.nomVictime}` : ''}
                  onValueChange={handleVictimeSelection}
                  disabled={filteredAgents.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filteredAgents.length === 0 ? "Aucun agent disponible" : "Sélectionner un agent"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAgents.map((agent) => {
                      const fullName = `${agent.firstName} ${agent.lastName}`;
                      return <SelectItem key={agent.id} value={fullName}>{fullName}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Victime sélectionnée : <span className="font-semibold">{formData.prenomVictime} {formData.nomVictime}</span>
            </p>
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

          <RegistreAccidentSupplementFields
            value={formData as RegistreFormExtended}
            onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
            risks={risks}
            agents={agents}
            filteredAgents={filteredAgents}
          />

          {/* Lésions */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              Lésions
            </h4>
            <div className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SignaturePad
                  label="Signature du soignant"
                  value={formData.signatureSoignantImage || ''}
                  onChange={(signature) =>
                    setFormData({
                      ...formData,
                      signatureSoignantImage: signature,
                      signatureSoignantDate: signature ? (formData.signatureSoignantDate || new Date().toISOString().split('T')[0]) : '',
                      signatureSoignant: Boolean(signature),
                    })
                  }
                />
                <SignaturePad
                  label="Signature de la victime"
                  value={formData.signatureVictimeImage || ''}
                  onChange={(signature) =>
                    setFormData({
                      ...formData,
                      signatureVictimeImage: signature,
                      signatureVictimeDate: signature ? (formData.signatureVictimeDate || new Date().toISOString().split('T')[0]) : '',
                      signatureVictime: Boolean(signature),
                    })
                  }
                />
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
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button type="submit" className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
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
  const hasSoignantSignature = (acc: AccidentBenin) =>
    Boolean(acc.signatureSoignantImage) || Boolean(acc.signatureSoignantDate) || acc.signatureSoignant;
  const hasVictimeSignature = (acc: AccidentBenin) =>
    Boolean(acc.signatureVictimeImage) || Boolean(acc.signatureVictimeDate) || acc.signatureVictime;
  const isFullySigned = (acc: AccidentBenin) =>
    hasSoignantSignature(acc) && hasVictimeSignature(acc);
  const handleExportDeclarationPDF = () => {
    try {
      exportRegistreBeninDeclarationPdf(accident, {
        hasSoignantSignature: hasSoignantSignature(accident),
        hasVictimeSignature: hasVictimeSignature(accident),
      });
      toast.success('Déclaration téléchargée en PDF');
    } catch (error) {
      console.error('Error generating declaration PDF:', error);
      toast.error('Erreur lors du téléchargement de la déclaration');
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Détail de l'accident N° {accident.numero}/{accident.annee}</h3>
          <p className="text-gray-600">
            Déclaré le {new Date(accident.dateInscription).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" onClick={handleExportDeclarationPDF} className="w-full sm:w-auto border-red-600 text-red-600 hover:bg-red-50">
            <Download className="h-4 w-4 mr-2" />
            Télécharger la déclaration
          </Button>
          <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
            Retour
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        {/* Status */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Badge className="bg-red-600 text-white">
            Accident N° {accident.numero}/{accident.annee}
          </Badge>
          {isFullySigned(accident) && (
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

        {(accident.categorieAccident || accident.typeAccidentNature || accident.typeLegal) && (
          <div className="bg-indigo-50 rounded-lg p-4 space-y-2">
            <h4 className="text-lg font-semibold text-indigo-950 mb-2">Catégorisation</h4>
            {accident.categorieAccident && <p><span className="font-medium">Catégorie:</span> {accident.categorieAccident}</p>}
            {accident.typeAccidentNature && <p><span className="font-medium">Type (nature):</span> {accident.typeAccidentNature}</p>}
            {accident.typeLegal && <p><span className="font-medium">Type légal:</span> {accident.typeLegal}</p>}
          </div>
        )}
        {accident.descriptionFaits && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Description des faits</h4>
            <p className="text-gray-900 whitespace-pre-wrap">{accident.descriptionFaits}</p>
          </div>
        )}
        {(accident.causes || accident.analyseCauses) && (
          <div className="bg-amber-50 rounded-lg p-4 space-y-2">
            <h4 className="text-lg font-semibold text-amber-950 mb-2">Causes et analyse</h4>
            {accident.causes && <p className="whitespace-pre-wrap"><span className="font-medium">Causes:</span> {accident.causes}</p>}
            {accident.analyseCauses && <p className="whitespace-pre-wrap"><span className="font-medium">Analyse:</span> {accident.analyseCauses}</p>}
          </div>
        )}
        {((accident.duerpRiskNumber && accident.duerpRiskLabel) || accident.duerpRiskFreeText) && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-blue-950 mb-2">Risque DUERP</h4>
            <p className="text-blue-900 font-medium">
              {accident.duerpRiskNumber && accident.duerpRiskLabel
                ? `${accident.duerpRiskNumber} — ${accident.duerpRiskLabel}`
                : accident.duerpRiskFreeText}
            </p>
          </div>
        )}
        {accident.commentaires && (
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Commentaires</h4>
            <p className="text-gray-900 whitespace-pre-wrap">{accident.commentaires}</p>
          </div>
        )}

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Signature du soignant</p>
                {accident.signatureSoignantImage ? (
                  <img src={accident.signatureSoignantImage} alt="Signature du soignant" className="h-24 w-full rounded border bg-white object-contain" />
                ) : (
                  <p className="text-sm text-gray-500">Aucune signature manuscrite</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Signature de la victime</p>
                {accident.signatureVictimeImage ? (
                  <img src={accident.signatureVictimeImage} alt="Signature de la victime" className="h-24 w-full rounded border bg-white object-contain" />
                ) : (
                  <p className="text-sm text-gray-500">Aucune signature manuscrite</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6 pt-2">
              <div className="flex items-center space-x-2">
                {hasSoignantSignature(accident) ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
                <span className="text-sm">
                  Signature soignant
                  {accident.signatureSoignantDate ? ` (${new Date(accident.signatureSoignantDate).toLocaleDateString('fr-FR')})` : ''}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {hasVictimeSignature(accident) ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                )}
                <span className="text-sm">
                  Signature victime
                  {accident.signatureVictimeDate ? ` (${new Date(accident.signatureVictimeDate).toLocaleDateString('fr-FR')})` : ''}
                </span>
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
            <span className="font-medium">Date et heure de déclaration:</span> {new Date(accident.dateInscription).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </Card>
    </div>
  );
}

// Composant d'édition
function EditAccidentView({
  accident,
  onBack,
  onSave,
  risks,
  agents,
  serviceOptions,
  domainOptions,
  locationOptions
}: {
  accident: AccidentBenin;
  onBack: () => void;
  onSave: (accident: AccidentBenin) => void;
  risks: AccidentDuerpRiskRef[];
  agents: AgentOption[];
  serviceOptions: string[];
  domainOptions: string[];
  locationOptions: string[];
}) {
  const hasSoignantSignature = (acc: AccidentBenin) => Boolean(acc.signatureSoignantImage) || Boolean(acc.signatureSoignantDate) || acc.signatureSoignant;
  const hasVictimeSignature = (acc: AccidentBenin) => Boolean(acc.signatureVictimeImage) || Boolean(acc.signatureVictimeDate) || acc.signatureVictime;

  const [formData, setFormData] = useState({
    ...EMPTY_REGISTRE_EXTENDED,
    ...accident,
    signatureSoignantDate: accident.signatureSoignantDate || '',
    signatureVictimeDate: accident.signatureVictimeDate || '',
    signatureSoignantImage: accident.signatureSoignantImage || '',
    signatureVictimeImage: accident.signatureVictimeImage || '',
    categorieAccident: accident.categorieAccident ?? '',
    typeAccidentNature: accident.typeAccidentNature ?? '',
    typeLegal: accident.typeLegal ?? '',
    descriptionFaits: accident.descriptionFaits ?? '',
    causes: accident.causes ?? '',
    analyseCauses: accident.analyseCauses ?? '',
    commentaires: accident.commentaires ?? '',
    duerpRiskId: accident.duerpRiskId ?? '',
    duerpRiskFreeText: accident.duerpRiskFreeText ?? '',
  });
  const filteredAgents = useMemo(
    () => agents.filter((agent) =>
      (!formData.serviceAffectation || agent.service === formData.serviceAffectation) &&
      (!formData.domaineAffectation || agent.domain === formData.domaineAffectation) &&
      (!formData.lieuAffectation || agent.location === formData.lieuAffectation)
    ),
    [agents, formData.serviceAffectation, formData.domaineAffectation, formData.lieuAffectation]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.circonstances?.trim()) {
      toast.error('Indiquez les circonstances de l\'accident.');
      return;
    }
    onSave(formData);
  };

  const handleVictimeSelection = (fullName: string) => {
    const [prenom, ...restNom] = fullName.split(' ');
    setFormData({
      ...formData,
      prenomVictime: prenom || '',
      nomVictime: restNom.join(' ') || ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Modifier l'accident N° {accident.numero}/{accident.annee}</h3>
          <p className="text-gray-600">
            Déclaré le {new Date(accident.dateInscription).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Service</Label>
                <Select
                  value={formData.serviceAffectation || 'all'}
                  onValueChange={(value) => setFormData({ ...formData, serviceAffectation: value === 'all' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Non sélectionné" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Non sélectionné</SelectItem>
                    {serviceOptions.map((service) => (
                      <SelectItem key={service} value={service}>{service}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Domaine</Label>
                <Select
                  value={formData.domaineAffectation || 'all'}
                  onValueChange={(value) => setFormData({ ...formData, domaineAffectation: value === 'all' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Non sélectionné" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Non sélectionné</SelectItem>
                    {domainOptions.map((domain) => (
                      <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lieu</Label>
                <Select
                  value={formData.lieuAffectation || 'all'}
                  onValueChange={(value) => setFormData({ ...formData, lieuAffectation: value === 'all' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Non sélectionné" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Non sélectionné</SelectItem>
                    {locationOptions.map((location) => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Victime *</Label>
                <Select
                  value={formData.prenomVictime && formData.nomVictime ? `${formData.prenomVictime} ${formData.nomVictime}` : ''}
                  onValueChange={handleVictimeSelection}
                  disabled={filteredAgents.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filteredAgents.length === 0 ? "Aucun agent disponible" : "Sélectionner un agent"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAgents.map((agent) => {
                      const fullName = `${agent.firstName} ${agent.lastName}`;
                      return <SelectItem key={agent.id} value={fullName}>{fullName}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Victime sélectionnée : <span className="font-semibold">{formData.prenomVictime} {formData.nomVictime}</span>
            </p>
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

          <RegistreAccidentSupplementFields
            value={formData as RegistreFormExtended}
            onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
            risks={risks}
            agents={agents}
            filteredAgents={filteredAgents}
          />

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              Lésions
            </h4>
            <div className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SignaturePad
                  label="Signature du soignant"
                  value={formData.signatureSoignantImage || ''}
                  onChange={(signature) =>
                    setFormData({
                      ...formData,
                      signatureSoignantImage: signature,
                      signatureSoignantDate: signature ? (formData.signatureSoignantDate || new Date().toISOString().split('T')[0]) : '',
                      signatureSoignant: Boolean(signature),
                    })
                  }
                />
                <SignaturePad
                  label="Signature de la victime"
                  value={formData.signatureVictimeImage || ''}
                  onChange={(signature) =>
                    setFormData({
                      ...formData,
                      signatureVictimeImage: signature,
                      signatureVictimeDate: signature ? (formData.signatureVictimeDate || new Date().toISOString().split('T')[0]) : '',
                      signatureVictime: Boolean(signature),
                    })
                  }
                />
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

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onBack} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button type="submit" className="w-full sm:w-auto bg-red-600 hover:bg-red-700">
              Enregistrer les modifications
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

function SignaturePad({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  const getPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPosition(event);
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const continueDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPosition(event);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL('image/png'));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (value) {
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = value;
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <canvas
        ref={canvasRef}
        width={420}
        height={140}
        className="w-full rounded border bg-white touch-none"
        onPointerDown={startDrawing}
        onPointerMove={continueDrawing}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange('')}>
          Effacer
        </Button>
      </div>
    </div>
  );
}
