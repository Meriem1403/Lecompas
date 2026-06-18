import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Archive
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
import { DocumentCreateView } from './DocumentCreateView';
import { DocumentDetailView } from './DocumentDetailView';
import { DocumentEditView } from './DocumentEditView';
import { GenerateDUERPDialog } from './GenerateDUERPDialog';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { ListPaginationBar, DEFAULT_LIST_PAGE_SIZE } from '@/app/components/ui/list-pagination-bar';

export interface Document {
  id: string;
  title: string;
  description: string;
  type: 'DUERP' | 'Registre' | 'Procédure' | 'Compte-rendu' | 'Audit' | 'Formation';
  version: string;
  status: 'Brouillon' | 'En validation' | 'Validé' | 'Obsolète';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  validatedBy?: string;
  validatedAt?: string;
  fileUrl?: string;
  fileSize?: number;
  tags?: string[];
}

// Fake data
const FAKE_DOCUMENTS: Document[] = [
  {
    id: '1',
    title: 'Document Unique d\'Évaluation des Risques Professionnels 2026',
    description: 'Version annuelle du DUERP incluant tous les risques identifiés et les mesures de prévention associées',
    type: 'DUERP',
    version: '3.0',
    status: 'Validé',
    createdBy: 'Marie Dupont',
    createdAt: '2026-01-15',
    updatedAt: '2026-01-20',
    validatedBy: 'Jean Martin (Directeur)',
    validatedAt: '2026-01-20',
    fileSize: 2456789,
    tags: ['2026', 'version-annuelle', 'validé']
  },
  {
    id: '2',
    title: 'Registre des accidents du travail 2026',
    description: 'Registre de déclaration et suivi des accidents du travail survenus en 2026',
    type: 'Registre',
    version: '1.0',
    status: 'En validation',
    createdBy: 'Sophie Bernard',
    createdAt: '2026-01-10',
    updatedAt: '2026-01-25',
    fileSize: 1234567,
    tags: ['accidents', '2026', 'en-cours']
  },
  {
    id: '3',
    title: 'Procédure d\'intervention en hauteur',
    description: 'Procédure détaillée pour les interventions en hauteur avec les EPI requis et les autorisations nécessaires',
    type: 'Procédure',
    version: '2.1',
    status: 'Validé',
    createdBy: 'Marc Durand',
    createdAt: '2025-11-20',
    updatedAt: '2026-01-10',
    validatedBy: 'Pierre Leclerc (Responsable Sécurité)',
    validatedAt: '2026-01-10',
    fileSize: 456789,
    tags: ['hauteur', 'sécurité', 'epi']
  },
  {
    id: '4',
    title: 'Compte-rendu CSSCT - Janvier 2026',
    description: 'Compte-rendu de la réunion du Comité Social et de Santé au Travail du mois de janvier 2026',
    type: 'Compte-rendu',
    version: '1.0',
    status: 'Validé',
    createdBy: 'Claire Dubois',
    createdAt: '2026-01-28',
    updatedAt: '2026-01-29',
    validatedBy: 'Jean Martin (Directeur)',
    validatedAt: '2026-01-29',
    fileSize: 234567,
    tags: ['cssct', 'janvier-2026', 'réunion']
  },
  {
    id: '5',
    title: 'Audit sécurité incendie',
    description: 'Rapport d\'audit de sécurité incendie réalisé par organisme externe agréé',
    type: 'Audit',
    version: '1.0',
    status: 'Validé',
    createdBy: 'Cabinet SECURITEST',
    createdAt: '2025-12-10',
    updatedAt: '2025-12-15',
    validatedBy: 'Pierre Leclerc (Responsable Sécurité)',
    validatedAt: '2025-12-15',
    fileSize: 3456789,
    tags: ['incendie', 'audit', 'externe']
  },
  {
    id: '6',
    title: 'Attestation formation gestes et postures',
    description: 'Attestations de formation collective aux gestes et postures - Session novembre 2025',
    type: 'Formation',
    version: '1.0',
    status: 'Validé',
    createdBy: 'Anne Petit',
    createdAt: '2025-11-25',
    updatedAt: '2025-11-25',
    validatedBy: 'Claire Dubois (RH)',
    validatedAt: '2025-11-26',
    fileSize: 567890,
    tags: ['formation', 'gestes-postures', 'tms']
  },
  {
    id: '7',
    title: 'Projet DUERP 2027',
    description: 'Projet de mise à jour du Document Unique pour l\'année 2027',
    type: 'DUERP',
    version: '0.1',
    status: 'Brouillon',
    createdBy: 'Marie Dupont',
    createdAt: '2026-01-28',
    updatedAt: '2026-01-30',
    fileSize: 1890234,
    tags: ['2027', 'brouillon', 'en-cours']
  }
];

interface DocumentsViewProps {
  documents?: Document[];
  risks?: import('@/app/components/admin/RisksManagementView').Risk[];
  actions?: import('@/app/components/ActionsView').Action[];
}

export function DocumentsView({
  documents: propDocuments,
  risks = [],
  actions = [],
}: DocumentsViewProps) {
  const [documents, setDocuments] = useState<Document[]>(propDocuments || FAKE_DOCUMENTS);
  const [isCreating, setIsCreating] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [listPage, setListPage] = useState(1);
  const [generateDUERPOpen, setGenerateDUERPOpen] = useState(false);

  const handleAdd = () => {
    setIsCreating(true);
  };

  const handleSaveCreate = (documentData: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDocument: Document = {
      ...documentData,
      id: `doc-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setDocuments([...documents, newDocument]);
    toast.success('Document créé avec succès ✅');
    setIsCreating(false);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
  };

  const handleView = (document: Document) => {
    setViewingDocument(document);
  };

  const handleBackFromView = () => {
    setViewingDocument(null);
  };

  const handleEditFromView = (document: Document) => {
    setViewingDocument(null);
    setEditingDocument(document);
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
  };

  const handleSaveEdit = (updatedDocument: Document) => {
    setDocuments(documents.map(d => d.id === updatedDocument.id ? { ...updatedDocument, updatedAt: new Date().toISOString().split('T')[0] } : d));
    toast.success('Document modifié avec succès ✅');
    setEditingDocument(null);
  };

  const handleCancelEdit = () => {
    setEditingDocument(null);
  };

  const handleDeleteClick = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      setDocuments(documents.filter(d => d.id !== documentToDelete));
      toast.success('Document supprimé avec succès ✅');
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleDownload = (document: Document) => {
    try {
      // Créer un nouveau PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPos = 20;

      // Header avec dégradé (simulé avec rectangles)
      pdf.setFillColor(147, 51, 234); // Purple
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      // Titre principal
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DUERP Manager', pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text('Sécurité & Prévention', pageWidth / 2, 30, { align: 'center' });

      yPos = 55;

      // Titre du document
      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(document.title, pageWidth - 40);
      pdf.text(titleLines, 20, yPos);
      yPos += titleLines.length * 8 + 10;

      // Badge Type et Statut
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Type badge
      const typeColors: { [key: string]: [number, number, number] } = {
        'DUERP': [147, 51, 234],
        'Registre': [59, 130, 246],
        'Procédure': [34, 197, 94],
        'Compte-rendu': [249, 115, 22],
        'Audit': [239, 68, 68],
        'Formation': [236, 72, 153]
      };
      const typeColor = typeColors[document.type] || [107, 114, 128];
      pdf.setFillColor(typeColor[0], typeColor[1], typeColor[2]);
      pdf.roundedRect(20, yPos, 30, 8, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.text(document.type, 22, yPos + 5.5);

      // Status badge
      const statusColors: { [key: string]: [number, number, number] } = {
        'Validé': [34, 197, 94],
        'En validation': [59, 130, 246],
        'Brouillon': [107, 114, 128],
        'Obsolète': [239, 68, 68]
      };
      const statusColor = statusColors[document.status] || [107, 114, 128];
      pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.roundedRect(55, yPos, 35, 8, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.text(document.status, 57, yPos + 5.5);

      // Version badge
      pdf.setFillColor(139, 92, 246);
      pdf.roundedRect(95, yPos, 25, 8, 2, 2, 'F');
      pdf.text(`v${document.version}`, 97, yPos + 5.5);

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
      const descLines = pdf.splitTextToSize(document.description, pageWidth - 40);
      pdf.text(descLines, 20, yPos);
      yPos += descLines.length * 5 + 15;

      // Informations
      pdf.setFillColor(236, 253, 245);
      pdf.roundedRect(15, yPos, pageWidth - 30, 5, 2, 2, 'F');
      pdf.setTextColor(6, 95, 70);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INFORMATIONS', 20, yPos + 3.5);
      yPos += 12;

      pdf.setTextColor(55, 65, 81);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Créé par:', 20, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(document.createdBy, 50, yPos);
      yPos += 7;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Date de création:', 20, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(new Date(document.createdAt).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }), 50, yPos);
      yPos += 7;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Dernière modification:', 20, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(new Date(document.updatedAt).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }), 55, yPos);
      yPos += 10;

      // Validation si validé
      if (document.validatedBy && document.validatedAt) {
        pdf.setFillColor(220, 252, 231);
        pdf.roundedRect(15, yPos, pageWidth - 30, 5, 2, 2, 'F');
        pdf.setTextColor(21, 128, 61);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('VALIDATION', 20, yPos + 3.5);
        yPos += 12;

        pdf.setTextColor(55, 65, 81);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text('Validé par:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(document.validatedBy, 50, yPos);
        yPos += 7;

        pdf.setFont('helvetica', 'bold');
        pdf.text('Date de validation:', 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(new Date(document.validatedAt).toLocaleDateString('fr-FR'), 55, yPos);
        yPos += 10;
      }

      // Tags
      if (document.tags && document.tags.length > 0) {
        pdf.setFillColor(252, 231, 243);
        pdf.roundedRect(15, yPos, pageWidth - 30, 5, 2, 2, 'F');
        pdf.setTextColor(190, 24, 93);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('ÉTIQUETTES', 20, yPos + 3.5);
        yPos += 12;

        pdf.setTextColor(55, 65, 81);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(document.tags.join(' • '), 20, yPos);
        yPos += 10;
      }

      // Footer
      const footerY = pageHeight - 20;
      pdf.setDrawColor(209, 213, 219);
      pdf.line(20, footerY - 5, pageWidth - 20, footerY - 5);
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Document généré automatiquement par DUERP Manager', pageWidth / 2, footerY, { align: 'center' });
      pdf.text(new Date().toLocaleDateString('fr-FR') + ' - ' + new Date().toLocaleTimeString('fr-FR'), pageWidth / 2, footerY + 4, { align: 'center' });

      // Sauvegarder le PDF
      const filename = `${document.title.replace(/[^a-z0-9]/gi, '_')}_v${document.version}.pdf`;
      pdf.save(filename);

      toast.success('PDF téléchargé avec succès', {
        description: `"${document.title}" a été téléchargé`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erreur lors de la génération du PDF', {
        description: 'Veuillez réessayer'
      });
    }
  };

  const getTypeColor = (type: Document['type']) => {
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

  const getStatusConfig = (status: Document['status']) => {
    switch (status) {
      case 'Validé':
        return { 
          icon: CheckCircle2, 
          gradient: 'from-green-500 to-emerald-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700'
        };
      case 'En validation':
        return { 
          icon: Clock, 
          gradient: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700'
        };
      case 'Brouillon':
        return { 
          icon: Edit, 
          gradient: 'from-gray-500 to-slate-500',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700'
        };
      case 'Obsolète':
        return { 
          icon: AlertCircle, 
          gradient: 'from-red-500 to-rose-500',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700'
        };
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Filtrage
  const filteredDocuments = documents.filter(doc => {
    const typeMatch = filterType === 'all' || doc.type === filterType;
    const statusMatch = filterStatus === 'all' || doc.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const listPageSize = DEFAULT_LIST_PAGE_SIZE;
  const listTotalPages = Math.max(1, Math.ceil(filteredDocuments.length / listPageSize));
  const paginatedDocuments = useMemo(() => {
    const start = (listPage - 1) * listPageSize;
    return filteredDocuments.slice(start, start + listPageSize);
  }, [filteredDocuments, listPage, listPageSize]);

  useEffect(() => {
    setListPage(1);
  }, [filterType, filterStatus]);

  useEffect(() => {
    if (listPage > listTotalPages) setListPage(listTotalPages);
  }, [listPage, listTotalPages]);

  // Si on est en mode création, afficher uniquement la page de création
  if (isCreating) {
    return (
      <DocumentCreateView
        onSave={handleSaveCreate}
        onCancel={handleCancelCreate}
      />
    );
  }

  // Si on est en mode consultation, afficher uniquement la page de détail
  if (viewingDocument) {
    return (
      <DocumentDetailView
        document={viewingDocument}
        onBack={handleBackFromView}
        onEdit={handleEditFromView}
        onDownload={handleDownload}
      />
    );
  }

  // Si on est en mode édition, afficher uniquement la page d'édition
  if (editingDocument) {
    return (
      <DocumentEditView
        document={editingDocument}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Documents SST</h3>
          <p className="text-gray-600">Gérez l'ensemble des documents réglementaires</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button 
            onClick={() => setGenerateDUERPOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
          >
            <FileText className="h-4 w-4 mr-2" />
            Générer DUERP Complet
          </Button>
          <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg" onClick={handleAdd}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouveau document
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-green-100 text-sm font-medium">Validés</p>
                <p className="text-3xl font-bold">{documents.filter(d => d.status === 'Validé').length}</p>
              </div>
              <div className="h-11 w-11 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-blue-100 text-sm font-medium">En validation</p>
                <p className="text-3xl font-bold">{documents.filter(d => d.status === 'En validation').length}</p>
              </div>
              <div className="h-11 w-11 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-gray-500 to-slate-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-gray-100 text-sm font-medium">Brouillons</p>
                <p className="text-3xl font-bold">{documents.filter(d => d.status === 'Brouillon').length}</p>
              </div>
              <div className="h-11 w-11 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                <Edit className="h-6 w-6 text-gray-50" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-purple-100 text-sm font-medium">Total</p>
                <p className="text-3xl font-bold">{documents.length}</p>
              </div>
              <div className="h-11 w-11 shrink-0 rounded-xl bg-white/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-50" />
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
                {['DUERP', 'Registre', 'Procédure', 'Compte-rendu', 'Audit', 'Formation'].map(type => (
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
                <span className="text-sm font-semibold text-gray-700">Statut:</span>
                <Badge 
                  className={`cursor-pointer ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setFilterStatus('all')}
                >
                  Tous
                </Badge>
                {['Validé', 'En validation', 'Brouillon', 'Obsolète'].map(status => (
                  <Badge 
                    key={status}
                    className={`cursor-pointer ${filterStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                    onClick={() => setFilterStatus(status)}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        {paginatedDocuments.map((document) => {
          const statusConfig = getStatusConfig(document.status);
          const StatusIcon = statusConfig.icon;

          return (
            <Card key={document.id} className="border-0 shadow-xl hover:shadow-2xl transition-all bg-white/80 backdrop-blur group">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:space-x-4">
                      <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${getTypeColor(document.type)} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <FileText className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-2">
                          <div>
                            <h4 className="font-bold text-xl text-gray-900 mb-1">{document.title}</h4>
                            <p className="text-sm text-gray-600 mb-3">{document.description}</p>
                          </div>
                        </div>

                        {/* Meta Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-purple-500" />
                            <div>
                              <p className="text-xs text-gray-500">Version</p>
                              <p className="text-sm font-semibold text-gray-800">v{document.version}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="text-xs text-gray-500">Créé par</p>
                              <p className="text-sm font-semibold text-gray-800">{document.createdBy}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            <div>
                              <p className="text-xs text-gray-500">Dernière màj</p>
                              <p className="text-sm font-semibold text-gray-800">
                                {new Date(document.updatedAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>

                          {document.fileSize && (
                            <div className="flex items-center space-x-2">
                              <Download className="h-4 w-4 text-green-500" />
                              <div>
                                <p className="text-xs text-gray-500">Taille</p>
                                <p className="text-sm font-semibold text-gray-800">{formatFileSize(document.fileSize)}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          <Badge className={`bg-gradient-to-r ${getTypeColor(document.type)} text-white border-0 shadow-md`}>
                            {document.type}
                          </Badge>
                          <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {document.status}
                          </Badge>
                          {document.tags?.map((tag, idx) => (
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
                      onClick={() => handleView(document)}
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Consulter
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleEdit(document)}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleDownload(document)}
                      className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Télécharger
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleDeleteClick(document.id)}
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

      <ListPaginationBar
        currentPage={listPage}
        totalPages={listTotalPages}
        totalItems={filteredDocuments.length}
        onPageChange={setListPage}
        itemLabel="document(s)"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generate DUERP Dialog */}
      <GenerateDUERPDialog
        open={generateDUERPOpen}
        onOpenChange={setGenerateDUERPOpen}
        risks={risks}
        actions={actions}
      />
    </div>
  );
}