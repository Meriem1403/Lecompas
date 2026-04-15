import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  FileText,
  User,
  MapPin,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  Shield,
  MessageSquare,
  ClipboardList,
  AlertTriangle,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  XCircle as XIcon,
} from 'lucide-react';
import { SSTRemark, FollowUpAction, ActionStatus, RemarkStatus } from '../SSTRegistryView';
import { toast } from 'sonner';

interface SSTRegistryDetailProps {
  remark: SSTRemark;
  currentUserRole: 'admin' | 'chef_service' | 'agent';
  currentUserName: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddFollowUpAction: (remarkId: string, action: FollowUpAction) => void;
  onUpdateFollowUpAction: (remarkId: string, actionId: string, action: FollowUpAction) => void;
  onDeleteFollowUpAction: (remarkId: string, actionId: string) => void;
  onUpdateStatus: (remarkId: string, status: RemarkStatus) => void;
  onAddManagerObservation: (remarkId: string, observation: SSTRemark['managerObservations']) => void;
  onAddCHSCTExam: (remarkId: string, exam: SSTRemark['chsctExam']) => void;
}

export function SSTRegistryDetail({
  remark,
  currentUserRole,
  currentUserName,
  onBack,
  onEdit,
  onDelete,
  onAddFollowUpAction,
  onUpdateFollowUpAction,
  onDeleteFollowUpAction,
  onUpdateStatus,
  onAddManagerObservation,
  onAddCHSCTExam,
}: SSTRegistryDetailProps) {
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionDescription, setActionDescription] = useState('');
  const [actionEntity, setActionEntity] = useState('');
  const [actionDeadline, setActionDeadline] = useState('');
  const [actionStatus, setActionStatus] = useState<ActionStatus>('en_attente');

  const [managerDialogOpen, setManagerDialogOpen] = useState(false);
  const [managerName, setManagerName] = useState('');
  const [managerFunction, setManagerFunction] = useState('');
  const [managerDate, setManagerDate] = useState(new Date().toISOString().split('T')[0]);
  const [managerComment, setManagerComment] = useState('');

  const [chsctDialogOpen, setChsctDialogOpen] = useState(false);
  const [chsctDate, setChsctDate] = useState('');
  const [chsctObservations, setChsctObservations] = useState('');

  const statusConfig = {
    nouvelle: { label: 'Nouvelle', color: 'bg-blue-100 text-blue-700', icon: FileText },
    transmise: { label: 'Transmise', color: 'bg-orange-100 text-orange-700', icon: Send },
    en_cours: { label: 'En cours', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    cloturee: { label: 'Clôturée', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  };

  const actionStatusConfig = {
    en_attente: { label: 'En attente', color: 'bg-gray-100 text-gray-700', icon: Clock },
    en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: PlayCircle },
    realise: { label: 'Réalisé', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    annule: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: XIcon },
  };

  const domainLabels = {
    locaux_travail: 'Locaux de travail',
    machines_outils: 'Machines ou outils',
    epc: 'Équipements de protection collective',
    epi: 'Équipements de protection individuelle',
    situations_risques: 'Situations à risques',
    conditions_travail: 'Conditions de travail',
    formation: 'Formation',
    evenements_dangereux: 'Événements dangereux',
    autre: 'Autre',
  };

  const config = statusConfig[remark.status];
  const StatusIcon = config.icon;

  const handleAddAction = () => {
    if (!actionDescription.trim() || !actionEntity.trim()) {
      toast.error('La description et l\'entité sont obligatoires');
      return;
    }

    const newAction: FollowUpAction = {
      id: `action-${Date.now()}`,
      date: actionDate,
      description: actionDescription,
      entity: actionEntity,
      deadline: actionDeadline || undefined,
      status: actionStatus,
    };

    onAddFollowUpAction(remark.id, newAction);
    toast.success('Action ajoutée');
    
    // Reset form
    setActionDialogOpen(false);
    setActionDate(new Date().toISOString().split('T')[0]);
    setActionDescription('');
    setActionEntity('');
    setActionDeadline('');
    setActionStatus('en_attente');
  };

  const handleAddManagerObservation = () => {
    if (!managerName.trim() || !managerFunction.trim() || !managerComment.trim()) {
      toast.error('Tous les champs sont obligatoires');
      return;
    }

    onAddManagerObservation(remark.id, {
      name: managerName,
      function: managerFunction,
      date: managerDate,
      comment: managerComment,
    });

    toast.success('Observation du responsable ajoutée');
    setManagerDialogOpen(false);
    setManagerName('');
    setManagerFunction('');
    setManagerDate(new Date().toISOString().split('T')[0]);
    setManagerComment('');
  };

  const handleAddCHSCTExam = () => {
    if (!chsctDate || !chsctObservations.trim()) {
      toast.error('La date et les observations sont obligatoires');
      return;
    }

    onAddCHSCTExam(remark.id, {
      date: chsctDate,
      observations: chsctObservations,
    });

    toast.success('Examen CHSCT ajouté');
    setChsctDialogOpen(false);
    setChsctDate('');
    setChsctObservations('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-900">
                Fiche RSST #{remark.ficheNumber}
              </h1>
              <Badge className={`${config.color} border-0`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>
            <p className="text-gray-600">
              Publié le {new Date(remark.submissionDate).toLocaleDateString('fr-FR')} à {remark.submissionTime}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {remark.status !== 'cloturee' && (
            <>
              {remark.status === 'nouvelle' && (
                <Button
                  onClick={() => {
                    onUpdateStatus(remark.id, 'transmise');
                    toast.success('Fiche transmise');
                  }}
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Transmettre
                </Button>
              )}
              {(remark.status === 'transmise' || remark.status === 'en_cours') && (
                <Button
                  onClick={() => {
                    const newStatus = remark.status === 'transmise' ? 'en_cours' : 'cloturee';
                    onUpdateStatus(remark.id, newStatus);
                    toast.success(newStatus === 'en_cours' ? 'Traitement commencé' : 'Fiche clôturée');
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  {remark.status === 'transmise' ? (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Démarrer le traitement
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Clôturer
                    </>
                  )}
                </Button>
              )}
            </>
          )}
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer cette fiche ? Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onDelete();
                    toast.success('Fiche supprimée');
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Information principale */}
      <Card className="border-2 border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <FileText className="h-6 w-6" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Service</p>
              <p className="text-base font-semibold text-gray-900">{remark.service}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Personne chargée du registre</p>
              <p className="text-base font-semibold text-gray-900">{remark.registryKeeperName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="text-base font-semibold text-gray-900">
                {new Date(remark.submissionDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Heure</p>
              <p className="text-base font-semibold text-gray-900">{remark.submissionTime}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Nom et prénom de l'agent</p>
              <p className="text-base font-semibold text-gray-900">
                {remark.isAnonymous ? <span className="italic">Anonyme</span> : remark.agentName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Domaine(s) concerné(s)</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {remark.domains.map((domain) => (
                  <Badge key={domain} variant="outline" className="bg-purple-50">
                    {domainLabels[domain]}
                    {domain === 'autre' && remark.otherDomain && `: ${remark.otherDomain}`}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-gray-500 mb-2">Site</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {remark.geographicSites.map((site) => (
                <Badge key={site} className="bg-indigo-600">
                  <MapPin className="h-3 w-3 mr-1" />
                  {site}
                </Badge>
              ))}
            </div>
            <p className="text-base font-semibold text-gray-900">{remark.sitePrecisions}</p>
            {remark.siteComments && (
              <p className="text-sm text-gray-600 mt-1">{remark.siteComments}</p>
            )}
          </div>

          {remark.transmittedTo && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-gray-500 mb-1">État d'information</p>
                <p className="text-sm text-gray-700">Fiche transmise à : <strong>{remark.transmittedTo}</strong></p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Observation */}
      <Card className="border-2 border-amber-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <MessageSquare className="h-6 w-6" />
            Observations et suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-base text-gray-800 whitespace-pre-line leading-relaxed">
            {remark.observation}
          </p>
        </CardContent>
      </Card>

      {/* Observations du responsable */}
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Shield className="h-6 w-6" />
              Observations du responsable hiérarchique
            </CardTitle>
            {!remark.managerObservations && currentUserRole !== 'agent' && (
              <Dialog open={managerDialogOpen} onOpenChange={setManagerDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ajouter une observation du responsable</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="managerName">Nom *</Label>
                        <Input
                          id="managerName"
                          value={managerName}
                          onChange={(e) => setManagerName(e.target.value)}
                          placeholder="Ex: Dr. Duport"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="managerFunction">Fonction *</Label>
                        <Input
                          id="managerFunction"
                          value={managerFunction}
                          onChange={(e) => setManagerFunction(e.target.value)}
                          placeholder="Ex: Médecin de prévention"
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="managerDate">Date *</Label>
                      <Input
                        id="managerDate"
                        type="date"
                        value={managerDate}
                        onChange={(e) => setManagerDate(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="managerComment">Commentaire *</Label>
                      <Textarea
                        id="managerComment"
                        value={managerComment}
                        onChange={(e) => setManagerComment(e.target.value)}
                        rows={4}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setManagerDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddManagerObservation} className="bg-blue-600 hover:bg-blue-700">
                      Enregistrer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {remark.managerObservations ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{remark.managerObservations.name}</span>
                <span>•</span>
                <span>{remark.managerObservations.function}</span>
                <span>•</span>
                <span>{new Date(remark.managerObservations.date).toLocaleDateString('fr-FR')}</span>
              </div>
              <p className="text-base text-gray-800">{remark.managerObservations.comment}</p>
            </div>
          ) : (
            <p className="text-gray-500 italic">Aucune observation pour le moment</p>
          )}
        </CardContent>
      </Card>

      {/* Suivi des observations */}
      <Card className="border-2 border-green-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <ClipboardList className="h-6 w-6" />
              Suivi des observations
            </CardTitle>
            <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une action
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ajouter une action de suivi</DialogTitle>
                  <DialogDescription>
                    Suites à donner, mesures conservatoires, correctives jusqu'à la clôture de la fiche
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="actionDate">Date *</Label>
                    <Input
                      id="actionDate"
                      type="date"
                      value={actionDate}
                      onChange={(e) => setActionDate(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="actionDescription">Description de l'action conduite et/ou proposées *</Label>
                    <Textarea
                      id="actionDescription"
                      value={actionDescription}
                      onChange={(e) => setActionDescription(e.target.value)}
                      rows={4}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="actionEntity">Entité/agent chargé(e) *</Label>
                      <Input
                        id="actionEntity"
                        value={actionEntity}
                        onChange={(e) => setActionEntity(e.target.value)}
                        placeholder="Ex: CP/CSP"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="actionDeadline">Délais (optionnel)</Label>
                      <Input
                        id="actionDeadline"
                        type="date"
                        value={actionDeadline}
                        onChange={(e) => setActionDeadline(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="actionStatus">État *</Label>
                    <Select value={actionStatus} onValueChange={(value: any) => setActionStatus(value)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en_attente">En attente</SelectItem>
                        <SelectItem value="en_cours">En cours</SelectItem>
                        <SelectItem value="realise">Réalisé</SelectItem>
                        <SelectItem value="annule">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddAction} className="bg-green-600 hover:bg-green-700">
                    Ajouter l'action
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {remark.followUpActions.length === 0 ? (
            <p className="text-gray-500 italic text-center py-8">Aucune action de suivi pour le moment</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Entité/Agent</TableHead>
                    <TableHead className="font-semibold">Délais</TableHead>
                    <TableHead className="font-semibold">État</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {remark.followUpActions.map((action) => {
                    const actionConfig = actionStatusConfig[action.status];
                    const ActionIcon = actionConfig.icon;
                    
                    return (
                      <TableRow key={action.id}>
                        <TableCell className="text-sm">
                          {new Date(action.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-sm max-w-md">{action.description}</TableCell>
                        <TableCell className="text-sm">{action.entity}</TableCell>
                        <TableCell className="text-sm">
                          {action.deadline ? new Date(action.deadline).toLocaleDateString('fr-FR') : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${actionConfig.color} border-0`}>
                            <ActionIcon className="h-3 w-3 mr-1" />
                            {actionConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer l'action</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Voulez-vous vraiment supprimer cette action de suivi ?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    onDeleteFollowUpAction(remark.id, action.id);
                                    toast.success('Action supprimée');
                                  }}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Examen CHSCT */}
      <Card className="border-2 border-indigo-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Shield className="h-6 w-6" />
              Examen du CHSCT
            </CardTitle>
            {!remark.chsctExam && currentUserRole !== 'agent' && (
              <Dialog open={chsctDialogOpen} onOpenChange={setChsctDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un examen CHSCT</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="chsctDate">Date de l'examen *</Label>
                      <Input
                        id="chsctDate"
                        type="date"
                        value={chsctDate}
                        onChange={(e) => setChsctDate(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="chsctObservations">Observations *</Label>
                      <Textarea
                        id="chsctObservations"
                        value={chsctObservations}
                        onChange={(e) => setChsctObservations(e.target.value)}
                        rows={4}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setChsctDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddCHSCTExam} className="bg-indigo-600 hover:bg-indigo-700">
                      Enregistrer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {remark.chsctExam ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                CHSCT du <strong>{new Date(remark.chsctExam.date).toLocaleDateString('fr-FR')}</strong>
              </p>
              <p className="text-base text-gray-800">{remark.chsctExam.observations}</p>
            </div>
          ) : (
            <p className="text-gray-500 italic">Aucun examen CHSCT pour le moment</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
