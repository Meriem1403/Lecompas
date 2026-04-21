import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { 
  Archive, 
  Download, 
  Eye,
  Calendar,
  User,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Filter,
  RotateCcw,
  Trash2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { DocumentDetailView } from './DocumentDetailView';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

export interface ArchivedDocument {
  id: string;
  title: string;
  description: string;
  type: 'DUERP' | 'Registre' | 'Procédure' | 'Compte-rendu' | 'Audit' | 'Formation';
  version: string;
  archivedBy: string;
  archivedAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  validatedBy?: string;
  validatedAt?: string;
  archiveReason: string;
  fileSize?: number;
  tags?: string[];
  retentionEndDate: string; // Date de fin de conservation (40 ans)
}

// Fake archived documents
const FAKE_ARCHIVES: ArchivedDocument[] = [
  {
    id: 'arch-1',
    title: 'Document Unique d\'Évaluation des Risques Professionnels 2025',
    description: 'Version annuelle du DUERP pour l\'année 2025 - Remplacée par version 2026',
    type: 'DUERP',
    version: '2.0',
    archivedBy: 'Marie Dupont',
    archivedAt: '2026-01-20',
    createdBy: 'Sophie Bernard',
    createdAt: '2025-01-10',
    updatedAt: '2025-12-15',
    validatedBy: 'Jean Martin (Directeur)',
    validatedAt: '2025-01-15',
    archiveReason: 'Nouvelle version annuelle 2026 créée',
    fileSize: 2345678,
    tags: ['2025', 'version-annuelle', 'archivé'],
    retentionEndDate: '2066-01-20'
  },
  {
    id: 'arch-2',
    title: 'Document Unique d\'Évaluation des Risques Professionnels 2024',
    description: 'Version annuelle du DUERP pour l\'année 2024',
    type: 'DUERP',
    version: '1.0',
    archivedBy: 'Sophie Bernard',
    archivedAt: '2025-01-10',
    createdBy: 'Marc Durand',
    createdAt: '2024-01-15',
    updatedAt: '2024-12-20',
    validatedBy: 'Jean Martin (Directeur)',
    validatedAt: '2024-01-20',
    archiveReason: 'Nouvelle version annuelle 2025 créée',
    fileSize: 2123456,
    tags: ['2024', 'version-annuelle', 'archivé'],
    retentionEndDate: '2065-01-10'
  },
  {
    id: 'arch-3',
    title: 'Procédure d\'intervention en hauteur',
    description: 'Version 1.0 de la procédure - Remplacée par nouvelle version avec EPI supplémentaires',
    type: 'Procédure',
    version: '1.0',
    archivedBy: 'Pierre Leclerc',
    archivedAt: '2025-11-20',
    createdBy: 'Marc Durand',
    createdAt: '2024-06-10',
    updatedAt: '2024-09-05',
    validatedBy: 'Pierre Leclerc (Responsable Sécurité)',
    validatedAt: '2024-06-15',
    archiveReason: 'Mise à jour de la procédure avec nouvelles exigences EPI',
    fileSize: 345678,
    tags: ['hauteur', 'v1', 'obsolète'],
    retentionEndDate: '2065-11-20'
  },
  {
    id: 'arch-4',
    title: 'Registre des accidents du travail 2025',
    description: 'Registre complet des accidents survenus en 2025',
    type: 'Registre',
    version: '1.0',
    archivedBy: 'Claire Dubois',
    archivedAt: '2026-01-05',
    createdBy: 'Sophie Bernard',
    createdAt: '2025-01-02',
    updatedAt: '2025-12-31',
    validatedBy: 'Jean Martin (Directeur)',
    validatedAt: '2026-01-05',
    archiveReason: 'Fin de l\'année 2025 - Nouveau registre 2026 ouvert',
    fileSize: 1567890,
    tags: ['2025', 'accidents', 'clôturé'],
    retentionEndDate: '2066-01-05'
  },
  {
    id: 'arch-5',
    title: 'Audit sécurité incendie 2024',
    description: 'Rapport d\'audit de sécurité incendie - Contrôle périodique 2024',
    type: 'Audit',
    version: '1.0',
    archivedBy: 'Pierre Leclerc',
    archivedAt: '2025-12-10',
    createdBy: 'Cabinet SECURITEST',
    createdAt: '2024-12-05',
    updatedAt: '2024-12-08',
    validatedBy: 'Pierre Leclerc (Responsable Sécurité)',
    validatedAt: '2024-12-10',
    archiveReason: 'Nouvel audit 2025 réalisé',
    fileSize: 3234567,
    tags: ['2024', 'incendie', 'audit-externe'],
    retentionEndDate: '2065-12-10'
  }
];

interface ArchivesViewProps {
  archives?: ArchivedDocument[];
}

export function ArchivesView({ archives: propArchives }: ArchivesViewProps) {
  const [archives, setArchives] = useState<ArchivedDocument[]>(propArchives || FAKE_ARCHIVES);
  const [viewingArchive, setViewingArchive] = useState<ArchivedDocument | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [archiveToDelete, setArchiveToDelete] = useState<string | null>(null);
  const [archiveToRestore, setArchiveToRestore] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  const handleView = (archive: ArchivedDocument) => {
    setViewingArchive(archive);
  };

  const handleBackFromView = () => {
    setViewingArchive(null);
  };

  const handleDownload = (archive: ArchivedDocument) => {
    try {
      // Créer un nouveau PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPos = 20;

      // Header avec dégradé
      pdf.setFillColor(220, 38, 38); // Red pour archive
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      // Titre principal
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DUERP Manager - ARCHIVES', pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text('Document archivé - Conservation 40 ans', pageWidth / 2, 30, { align: 'center' });

      yPos = 55;

      // Bannière d'avertissement ARCHIVE
      pdf.setFillColor(254, 226, 226);
      pdf.rect(10, yPos, pageWidth - 20, 20, 'F');
      pdf.setTextColor(185, 28, 28);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('⚠ DOCUMENT ARCHIVÉ', pageWidth / 2, yPos + 8, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Archivé le ${new Date(archive.archivedAt).toLocaleDateString('fr-FR')} par ${archive.archivedBy}`, pageWidth / 2, yPos + 15, { align: 'center' });
      
      yPos += 30;

      // Titre du document
      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(archive.title, pageWidth - 40);
      pdf.text(titleLines, 20, yPos);
      yPos += titleLines.length * 8 + 10;

      // Badge Type et Version
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const typeColors: { [key: string]: [number, number, number] } = {
        'DUERP': [147, 51, 234],
        'Registre': [59, 130, 246],
        'Procédure': [34, 197, 94],
        'Compte-rendu': [249, 115, 22],
        'Audit': [239, 68, 68],
        'Formation': [236, 72, 153]
      };
      const typeColor = typeColors[archive.type] || [107, 114, 128];
      pdf.setFillColor(typeColor[0], typeColor[1], typeColor[2]);
      pdf.roundedRect(20, yPos, 30, 8, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.text(archive.type, 22, yPos + 5.5);

      // Version badge
      pdf.setFillColor(139, 92, 246);
      pdf.roundedRect(55, yPos, 25, 8, 2, 2, 'F');
      pdf.text(`v${archive.version}`, 57, yPos + 5.5);

      yPos += 18;

      // Section Description
      pdf.setFillColor(219, 234, 254);
      pdf.roundedRect(15, yPos, pageWidth - 30, 5, 2, 2, 'F');
      pdf.setTextColor(30, 58, 138);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DESCRIPTION', 20, yPos + 3.5);
      yPos += 10;

      pdf.setTextColor(55, 65, 81);
      pdf.setFont('helvetica', 'normal');
      const descLines = pdf.splitTextToSize(archive.description, pageWidth - 40);
      pdf.text(descLines, 20, yPos);
      yPos += descLines.length * 5 + 15;

      // Section Archive
      pdf.setFillColor(254, 202, 202);
      pdf.roundedRect(15, yPos, pageWidth - 30, 5, 2, 2, 'F');
      pdf.setTextColor(153, 27, 27);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INFORMATIONS D\'ARCHIVAGE', 20, yPos + 3.5);
      yPos += 12;

      pdf.setTextColor(55, 65, 81);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Archivé par:', 20, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(archive.archivedBy, 50, yPos);
      yPos += 7;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Date d\'archivage:', 20, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(new Date(archive.archivedAt).toLocaleDateString('fr-FR'), 55, yPos);
      yPos += 7;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Raison:', 20, yPos);
      pdf.setFont('helvetica', 'normal');
      const reasonLines = pdf.splitTextToSize(archive.archiveReason, pageWidth - 55);
      pdf.text(reasonLines, 50, yPos);
      yPos += reasonLines.length * 5 + 7;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Conservation jusqu\'au:', 20, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(220, 38, 38);
      pdf.text(new Date(archive.retentionEndDate).toLocaleDateString('fr-FR') + ' (40 ans)', 65, yPos);
      yPos += 10;

      // Informations document original
      pdf.setTextColor(55, 65, 81);
      pdf.setFillColor(236, 253, 245);
      pdf.roundedRect(15, yPos, pageWidth - 30, 5, 2, 2, 'F');
      pdf.setTextColor(6, 95, 70);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INFORMATIONS DU DOCUMENT ORIGINAL', 20, yPos + 3.5);
      yPos += 12;

      pdf.setTextColor(55, 65, 81);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Créé par:', 20, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(archive.createdBy, 50, yPos);
      yPos += 7;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Date de création:', 20, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(new Date(archive.createdAt).toLocaleDateString('fr-FR'), 55, yPos);
      yPos += 7;

      if (archive.validatedBy && archive.validatedAt) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Validé par:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(archive.validatedBy, 50, yPos);
        yPos += 7;

        pdf.setFont('helvetica', 'bold');
        pdf.text('Date de validation:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(new Date(archive.validatedAt).toLocaleDateString('fr-FR'), 60, yPos);
        yPos += 10;
      }

      // Footer
      const footerY = pageHeight - 20;
      pdf.setDrawColor(209, 213, 219);
      pdf.line(20, footerY - 5, pageWidth - 20, footerY - 5);
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Document archivé généré automatiquement par DUERP Manager', pageWidth / 2, footerY, { align: 'center' });
      pdf.text('Conservation réglementaire: 40 ans selon l\'article R.4121-4 du Code du travail', pageWidth / 2, footerY + 4, { align: 'center' });

      // Sauvegarder le PDF
      const filename = `ARCHIVE_${archive.title.replace(/[^a-z0-9]/gi, '_')}_v${archive.version}.pdf`;
      pdf.save(filename);

      toast.success('Archive téléchargée avec succès', {
        description: `"${archive.title}" a été téléchargée`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erreur lors de la génération du PDF', {
        description: 'Veuillez réessayer'
      });
    }
  };

  const handleDeleteClick = (archiveId: string) => {
    setArchiveToDelete(archiveId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (archiveToDelete) {
      setArchives(archives.filter(a => a.id !== archiveToDelete));
      toast.success('Archive supprimée', {
        description: 'L\'archive a été définitivement supprimée'
      });
      setDeleteDialogOpen(false);
      setArchiveToDelete(null);
    }
  };

  const handleRestoreClick = (archiveId: string) => {
    setArchiveToRestore(archiveId);
    setRestoreDialogOpen(true);
  };

  const handleRestoreConfirm = () => {
    if (archiveToRestore) {
      const archive = archives.find(a => a.id === archiveToRestore);
      if (archive) {
        toast.success('Archive restaurée', {
          description: `"${archive.title}" a été restauré dans les documents actifs`
        });
      }
      setRestoreDialogOpen(false);
      setArchiveToRestore(null);
    }
  };

  const getTypeColor = (type: ArchivedDocument['type']) => {
    switch (type) {
      case 'DUERP':
        return 'from-purple-500 to-indigo-500';
      case 'Registre':
        return 'from-blue-500 to-cyan-500';
      case 'Procédure':
        return 'from-green-500 to-emerald-500';
      case 'Compte-rendu':
        return 'from-orange-500 to-amber-500';
      case 'Audit':
        return 'from-red-500 to-rose-500';
      case 'Formation':
        return 'from-pink-500 to-fuchsia-500';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Calcul du temps restant avant fin de conservation
  const getRetentionStatus = (retentionEndDate: string) => {
    const now = new Date();
    const end = new Date(retentionEndDate);
    const yearsLeft = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365));
    
    if (yearsLeft > 20) {
      return { color: 'text-green-600', text: `${yearsLeft} ans restants` };
    } else if (yearsLeft > 10) {
      return { color: 'text-yellow-600', text: `${yearsLeft} ans restants` };
    } else {
      return { color: 'text-red-600', text: `${yearsLeft} ans restants` };
    }
  };

  // Filtrage
  const years = Array.from(new Set(archives.map(a => new Date(a.archivedAt).getFullYear()))).sort((a, b) => b - a);
  
  const filteredArchives = archives.filter(archive => {
    const typeMatch = filterType === 'all' || archive.type === filterType;
    const yearMatch = filterYear === 'all' || new Date(archive.archivedAt).getFullYear().toString() === filterYear;
    return typeMatch && yearMatch;
  });

  // Si on est en mode consultation
  if (viewingArchive) {
    // Convertir l'archive en format Document pour DocumentDetailView
    const docForView = {
      ...viewingArchive,
      status: 'Validé' as const
    };
    
    return (
      <DocumentDetailView
        document={docForView}
        onBack={handleBackFromView}
        onEdit={() => {}} // Pas d'édition pour les archives
        onDownload={() => handleDownload(viewingArchive)}
        isArchive={true}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Archives DUERP</h3>
          <p className="text-gray-600">Conservation réglementaire de 40 ans selon l'article R.4121-4 du Code du travail</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-red-100 text-sm font-medium">Total Archives</p>
                <p className="text-3xl font-bold">{archives.length}</p>
              </div>
              <div className="h-11 w-11 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                <Archive className="h-6 w-6 text-red-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-purple-100 text-sm font-medium">DUERP Archivés</p>
                <p className="text-3xl font-bold">{archives.filter(a => a.type === 'DUERP').length}</p>
              </div>
              <div className="h-11 w-11 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-blue-100 text-sm font-medium">Cette année</p>
                <p className="text-3xl font-bold">
                  {archives.filter(a => new Date(a.archivedAt).getFullYear() === new Date().getFullYear()).length}
                </p>
              </div>
              <div className="h-11 w-11 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-amber-100 text-sm font-medium">Conservation</p>
                <p className="text-xl font-bold">40 ans</p>
              </div>
              <div className="h-11 w-11 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-50" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-semibold">Filtres</span>
            </div>
            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max pb-1">
                <span className="text-sm font-semibold text-gray-700">Type:</span>
                <Badge 
                  className={`cursor-pointer ${filterType === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setFilterType('all')}
                >
                  Tous
                </Badge>
                {['DUERP', 'Registre', 'Procédure', 'Audit'].map(type => (
                  <Badge 
                    key={type}
                    className={`cursor-pointer ${filterType === type ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setFilterType(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max pb-1">
                <span className="text-sm font-semibold text-gray-700">Année:</span>
                <Badge 
                  className={`cursor-pointer ${filterYear === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setFilterYear('all')}
                >
                  Toutes
                </Badge>
                {years.map(year => (
                  <Badge 
                    key={year}
                    className={`cursor-pointer ${filterYear === year.toString() ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setFilterYear(year.toString())}
                  >
                    {year}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archives List */}
      <div className="space-y-4">
        {filteredArchives.map((archive) => {
          const retentionStatus = getRetentionStatus(archive.retentionEndDate);

          return (
            <Card key={archive.id} className="border-0 shadow-xl hover:shadow-2xl transition-all bg-white/80 backdrop-blur group border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:space-x-4">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <Archive className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-2">
                          <div>
                            <h4 className="font-bold text-xl text-gray-900 mb-1">{archive.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{archive.description}</p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                              <p className="text-xs text-red-700">
                                <AlertCircle className="h-3 w-3 inline mr-1" />
                                <strong>Raison d'archivage:</strong> {archive.archiveReason}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Meta Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-5 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-purple-500" />
                            <div>
                              <p className="text-xs text-gray-500">Version</p>
                              <p className="text-sm font-semibold text-gray-800">v{archive.version}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="text-xs text-gray-500">Archivé par</p>
                              <p className="text-sm font-semibold text-gray-800">{archive.archivedBy}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            <div>
                              <p className="text-xs text-gray-500">Date d'archivage</p>
                              <p className="text-sm font-semibold text-gray-800">
                                {new Date(archive.archivedAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <div>
                              <p className="text-xs text-gray-500">Fin de conservation</p>
                              <p className={`text-sm font-semibold ${retentionStatus.color}`}>
                                {retentionStatus.text}
                              </p>
                            </div>
                          </div>

                          {archive.fileSize && (
                            <div className="flex items-center space-x-2">
                              <Download className="h-4 w-4 text-green-500" />
                              <div>
                                <p className="text-xs text-gray-500">Taille</p>
                                <p className="text-sm font-semibold text-gray-800">{formatFileSize(archive.fileSize)}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          <Badge className={`bg-gradient-to-r ${getTypeColor(archive.type)} text-white border-0 shadow-md`}>
                            {archive.type}
                          </Badge>
                          <Badge className="bg-red-100 text-red-700 border-0">
                            <Archive className="h-3 w-3 mr-1" />
                            Archivé
                          </Badge>
                          {archive.tags?.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="bg-gray-50 text-gray-600">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 xl:ml-4">
                    <Button 
                      size="sm" 
                      onClick={() => handleView(archive)}
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Consulter
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleDownload(archive)}
                      className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Télécharger
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleRestoreClick(archive.id)}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Restaurer
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleDeleteClick(archive.id)}
                      className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression définitive</AlertDialogTitle>
            <AlertDialogDescription>
              ⚠️ <strong>Attention :</strong> Vous êtes sur le point de supprimer définitivement une archive. 
              Cette action est irréversible et peut être contraire aux obligations légales de conservation (40 ans).
              Êtes-vous certain de vouloir continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer l'archive</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous restaurer cette archive dans les documents actifs ? 
              L'archive sera déplacée vers l'onglet "Documents DUERP" et ne sera plus dans les archives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestoreConfirm}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              Restaurer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
