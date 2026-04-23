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
  Target,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

interface GenerateDUERPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateDUERPDialog({ open, onOpenChange }: GenerateDUERPDialogProps) {
  const [entreprise, setEntreprise] = useState('Entreprise XYZ');
  const [adresse, setAdresse] = useState('123 Rue de la Sécurité, 75001 Paris');
  const [responsable, setResponsable] = useState('Jean Martin');
  const [version, setVersion] = useState('4.0');
  const [dateDebut, setDateDebut] = useState('2026-01-01');
  const [dateFin, setDateFin] = useState('2026-12-31');
  const [methodologie, setMethodologie] = useState('Méthode d\'analyse des risques basée sur l\'identification des dangers par unité de travail, l\'évaluation de la gravité et de la probabilité, et la hiérarchisation selon la matrice de criticité.');

  const handleGenerate = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = 20;

      // ========================================
      // PAGE DE GARDE
      // ========================================
      
      // Header violet
      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, pageWidth, 60, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DOCUMENT UNIQUE', pageWidth / 2, 25, { align: 'center' });
      pdf.setFontSize(22);
      pdf.text('D\'ÉVALUATION DES RISQUES', pageWidth / 2, 35, { align: 'center' });
      pdf.text('PROFESSIONNELS', pageWidth / 2, 45, { align: 'center' });

      yPos = 80;

      // Informations entreprise
      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(entreprise, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(adresse, pageWidth / 2, yPos, { align: 'center' });
      yPos += 25;

      // Cadre métadonnées
      pdf.setFillColor(243, 244, 246);
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 45, 3, 3, 'F');
      pdf.setDrawColor(209, 213, 219);
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 45, 3, 3, 'S');

      yPos += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Version:', margin + 5, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(version, margin + 25, yPos);

      pdf.setFont('helvetica', 'bold');
      pdf.text('Période:', margin + 80, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${new Date(dateDebut).toLocaleDateString('fr-FR')} - ${new Date(dateFin).toLocaleDateString('fr-FR')}`, margin + 100, yPos);
      yPos += 8;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Responsable:', margin + 5, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(responsable, margin + 30, yPos);
      yPos += 8;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Date d\'édition:', margin + 5, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(new Date().toLocaleDateString('fr-FR'), margin + 35, yPos);

      yPos += 30;

      // Cadre réglementaire
      pdf.setFillColor(254, 242, 242);
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'F');
      pdf.setDrawColor(220, 38, 38);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'S');

      yPos += 8;
      pdf.setTextColor(153, 27, 27);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CADRE RÉGLEMENTAIRE', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 8;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);
      const reglementaire = 'Conformément aux articles L.4121-1 à L.4121-5 et R.4121-1 à R.4121-4 du Code du travail, ce document recense les résultats de l\'évaluation des risques professionnels et établit le programme de prévention des risques.';
      const reglLines = pdf.splitTextToSize(reglementaire, pageWidth - 2 * margin - 10);
      pdf.text(reglLines, pageWidth / 2, yPos, { align: 'center' });

      yPos += 30;

      // Sommaire
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(31, 41, 55);
      pdf.text('SOMMAIRE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const sommaire = [
        '1. Méthodologie d\'évaluation des risques',
        '2. Inventaire des risques professionnels par unité de travail',
        '3. Évaluation et hiérarchisation des risques',
        '4. Mesures de prévention et de protection',
        '5. Plan d\'actions prioritaires',
        '6. Données d\'exposition aux facteurs de risques',
        '7. Traçabilité et mise à jour'
      ];

      sommaire.forEach((item, idx) => {
        pdf.text(`${item}`, margin + 10, yPos);
        pdf.text(`${idx + 2}`, pageWidth - margin - 10, yPos, { align: 'right' });
        yPos += 7;
      });

      // ========================================
      // PAGE 2 : MÉTHODOLOGIE
      // ========================================
      pdf.addPage();
      yPos = 20;

      // En-tête de page
      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, pageWidth, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DUERP - Document Unique d\'Évaluation des Risques Professionnels', pageWidth / 2, 10, { align: 'center' });

      yPos = 30;

      // Titre section
      pdf.setFillColor(147, 51, 234);
      pdf.rect(margin, yPos, 10, 10, 'F');
      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('1. MÉTHODOLOGIE D\'ÉVALUATION DES RISQUES', margin + 15, yPos + 7);

      yPos += 20;

      // Contenu
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);
      
      const methodLines = pdf.splitTextToSize(methodologie, pageWidth - 2 * margin);
      pdf.text(methodLines, margin, yPos);
      yPos += methodLines.length * 6 + 10;

      // Matrice de criticité
      pdf.setFillColor(219, 234, 254);
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 8, 2, 2, 'F');
      pdf.setTextColor(30, 58, 138);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MATRICE DE CRITICITÉ', margin + 5, yPos + 5.5);

      yPos += 15;

      // Tableau matrice
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);

      // Headers
      const cellWidth = 25;
      const cellHeight = 10;
      let xPos = margin + 35;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Gravité →', margin, yPos + 20);
      pdf.text('Probabilité ↓', margin, yPos - 5);

      // Colonnes gravité
      ['Faible (1)', 'Moyen (2)', 'Élevé (3)'].forEach((label, idx) => {
        pdf.setFillColor(243, 244, 246);
        pdf.rect(xPos + idx * cellWidth, yPos, cellWidth, cellHeight, 'F');
        pdf.rect(xPos + idx * cellWidth, yPos, cellWidth, cellHeight, 'S');
        pdf.text(label, xPos + idx * cellWidth + cellWidth / 2, yPos + 7, { align: 'center' });
      });

      yPos += cellHeight;

      // Lignes probabilité avec valeurs
      const probLabels = ['Faible (1)', 'Moyen (2)', 'Élevé (3)'];
      const riskValues = [
        [1, 2, 3],
        [2, 4, 6],
        [3, 6, 9]
      ];
      const riskColors = [
        [[144, 238, 144], [255, 255, 153], [255, 200, 124]],
        [[255, 255, 153], [255, 200, 124], [255, 127, 80]],
        [[255, 200, 124], [255, 127, 80], [255, 99, 71]]
      ];

      probLabels.forEach((label, rowIdx) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin + 32, yPos + 7, { align: 'right' });
        
        riskValues[rowIdx].forEach((val, colIdx) => {
          const color = riskColors[rowIdx][colIdx];
          pdf.setFillColor(color[0], color[1], color[2]);
          pdf.rect(xPos + colIdx * cellWidth, yPos, cellWidth, cellHeight, 'FD');
          pdf.setFont('helvetica', 'bold');
          pdf.text(val.toString(), xPos + colIdx * cellWidth + cellWidth / 2, yPos + 7, { align: 'center' });
        });
        
        yPos += cellHeight;
      });

      yPos += 10;

      // Légende
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Niveaux de risque : 1-2 = Acceptable | 3-4 = Modéré | 6 = Significatif | 9 = Critique', margin, yPos);

      yPos += 15;

      // Unités de travail
      pdf.setFillColor(236, 253, 245);
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 8, 2, 2, 'F');
      pdf.setTextColor(6, 95, 70);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('UNITÉS DE TRAVAIL ÉVALUÉES', margin + 5, yPos + 5.5);

      yPos += 15;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);
      const unites = [
        '• Bureau administratif',
        '• Atelier de production',
        '• Entrepôt et zone de stockage',
        '• Laboratoire',
        '• Zone de circulation et accès'
      ];

      unites.forEach(unite => {
        pdf.text(unite, margin + 5, yPos);
        yPos += 6;
      });

      // ========================================
      // PAGE 3 : INVENTAIRE DES RISQUES
      // ========================================
      pdf.addPage();
      yPos = 20;

      // En-tête
      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, pageWidth, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DUERP - Document Unique d\'Évaluation des Risques Professionnels', pageWidth / 2, 10, { align: 'center' });

      yPos = 30;

      // Titre section
      pdf.setFillColor(59, 130, 246);
      pdf.rect(margin, yPos, 10, 10, 'F');
      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('2. INVENTAIRE DES RISQUES PROFESSIONNELS', margin + 15, yPos + 7);

      yPos += 18;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(75, 85, 99);
      pdf.text('Inventaire exhaustif des dangers identifiés par unité de travail', margin, yPos);

      yPos += 12;

      // Risques fictifs par catégorie
      const risquesParCategorie = [
        {
          categorie: 'RISQUES PHYSIQUES',
          color: [239, 68, 68],
          risques: [
            { id: 'R-001', danger: 'Chutes de plain-pied', unite: 'Entrepôt', description: 'Sols glissants, encombrement des allées' },
            { id: 'R-002', danger: 'Chutes de hauteur', unite: 'Atelier', description: 'Travaux sur échelles et plateformes' },
            { id: 'R-003', danger: 'Bruit excessif', unite: 'Atelier', description: 'Machines bruyantes >85 dB' }
          ]
        },
        {
          categorie: 'RISQUES CHIMIQUES',
          color: [249, 115, 22],
          risques: [
            { id: 'R-004', danger: 'Exposition produits chimiques', unite: 'Laboratoire', description: 'Manipulation solvants et acides' },
            { id: 'R-005', danger: 'Poussières', unite: 'Atelier', description: 'Émissions de poussières lors découpe' }
          ]
        },
        {
          categorie: 'RISQUES ERGONOMIQUES',
          color: [139, 92, 246],
          risques: [
            { id: 'R-006', danger: 'Manutentions manuelles', unite: 'Entrepôt', description: 'Ports de charges lourdes répétitifs' },
            { id: 'R-007', danger: 'Travail sur écran', unite: 'Bureau', description: 'Position assise prolongée, écrans' }
          ]
        }
      ];

      risquesParCategorie.forEach(cat => {
        // Titre catégorie
        pdf.setFillColor(cat.color[0], cat.color[1], cat.color[2]);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(cat.categorie, margin + 3, yPos + 5.5);

        yPos += 10;

        // Risques de la catégorie
        cat.risques.forEach(risque => {
          if (yPos > pageHeight - 40) {
            pdf.addPage();
            yPos = 30;
            // En-tête répété
            pdf.setFillColor(147, 51, 234);
            pdf.rect(0, 0, pageWidth, 15, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text('DUERP - Document Unique d\'Évaluation des Risques Professionnels', pageWidth / 2, 10, { align: 'center' });
            yPos = 30;
          }

          pdf.setFillColor(249, 250, 251);
          pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 2, 2, 'F');
          pdf.setDrawColor(229, 231, 235);
          pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 2, 2, 'S');

          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(31, 41, 55);
          pdf.text(`${risque.id} - ${risque.danger}`, margin + 3, yPos + 5);
          
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(75, 85, 99);
          pdf.text(`Unité: ${risque.unite}`, margin + 3, yPos + 10);
          pdf.text(`Description: ${risque.description}`, margin + 3, yPos + 15);

          yPos += 22;
        });

        yPos += 5;
      });

      // ========================================
      // PAGE 4 : ÉVALUATION DES RISQUES
      // ========================================
      pdf.addPage();
      yPos = 20;

      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, pageWidth, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DUERP - Document Unique d\'Évaluation des Risques Professionnels', pageWidth / 2, 10, { align: 'center' });

      yPos = 30;

      pdf.setFillColor(34, 197, 94);
      pdf.rect(margin, yPos, 10, 10, 'F');
      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('3. ÉVALUATION ET HIÉRARCHISATION DES RISQUES', margin + 15, yPos + 7);

      yPos += 20;

      // Tableau d'évaluation
      const evaluations = [
        { id: 'R-001', danger: 'Chutes plain-pied', gravite: 2, proba: 3, criticite: 6, niveau: 'Significatif' },
        { id: 'R-002', danger: 'Chutes hauteur', gravite: 3, proba: 2, criticite: 6, niveau: 'Significatif' },
        { id: 'R-003', danger: 'Bruit excessif', gravite: 2, proba: 3, criticite: 6, niveau: 'Significatif' },
        { id: 'R-004', danger: 'Produits chimiques', gravite: 3, proba: 2, criticite: 6, niveau: 'Significatif' },
        { id: 'R-005', danger: 'Poussières', gravite: 2, proba: 2, criticite: 4, niveau: 'Modéré' },
        { id: 'R-006', danger: 'Manutentions', gravite: 2, proba: 3, criticite: 6, niveau: 'Significatif' },
        { id: 'R-007', danger: 'Travail écran', gravite: 1, proba: 3, criticite: 3, niveau: 'Modéré' }
      ];

      // En-têtes tableau
      pdf.setFillColor(243, 244, 246);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(31, 41, 55);

      const colWidths = [15, 55, 20, 20, 20, 30];
      let xTable = margin;

      ['ID', 'Danger', 'Gravité', 'Probabilité', 'Criticité', 'Niveau'].forEach((header, idx) => {
        pdf.rect(xTable, yPos, colWidths[idx], 10, 'FD');
        pdf.text(header, xTable + colWidths[idx] / 2, yPos + 6, { align: 'center' });
        xTable += colWidths[idx];
      });

      yPos += 10;

      // Lignes
      pdf.setFont('helvetica', 'normal');
      evaluations.forEach(evaluation => {
        xTable = margin;
        
        pdf.rect(xTable, yPos, colWidths[0], 8, 'S');
        pdf.text(evaluation.id, xTable + colWidths[0] / 2, yPos + 5.5, { align: 'center' });
        xTable += colWidths[0];

        pdf.rect(xTable, yPos, colWidths[1], 8, 'S');
        pdf.text(evaluation.danger, xTable + 2, yPos + 5.5);
        xTable += colWidths[1];

        pdf.rect(xTable, yPos, colWidths[2], 8, 'S');
        pdf.text(evaluation.gravite.toString(), xTable + colWidths[2] / 2, yPos + 5.5, { align: 'center' });
        xTable += colWidths[2];

        pdf.rect(xTable, yPos, colWidths[3], 8, 'S');
        pdf.text(evaluation.proba.toString(), xTable + colWidths[3] / 2, yPos + 5.5, { align: 'center' });
        xTable += colWidths[3];

        // Criticité colorée
        const critColor = evaluation.criticite >= 6 ? [255, 127, 80] : evaluation.criticite >= 3 ? [255, 200, 124] : [144, 238, 144];
        pdf.setFillColor(critColor[0], critColor[1], critColor[2]);
        pdf.rect(xTable, yPos, colWidths[4], 8, 'FD');
        pdf.setFont('helvetica', 'bold');
        pdf.text(evaluation.criticite.toString(), xTable + colWidths[4] / 2, yPos + 5.5, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        xTable += colWidths[4];

        pdf.rect(xTable, yPos, colWidths[5], 8, 'S');
        pdf.setFontSize(7);
        pdf.text(evaluation.niveau, xTable + colWidths[5] / 2, yPos + 5.5, { align: 'center' });
        pdf.setFontSize(8);

        yPos += 8;
      });

      yPos += 15;

      // Statistiques
      pdf.setFillColor(254, 249, 195);
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 25, 2, 2, 'F');
      
      yPos += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(113, 63, 18);
      pdf.text('SYNTHÈSE DE L\'ÉVALUATION', margin + 5, yPos);
      
      yPos += 8;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('• Risques significatifs (criticité ≥ 6) : 5 risques identifiés → Priorité HAUTE', margin + 5, yPos);
      yPos += 6;
      pdf.text('• Risques modérés (criticité 3-4) : 2 risques identifiés → Priorité MOYENNE', margin + 5, yPos);

      // ========================================
      // PAGE 5 : MESURES DE PRÉVENTION
      // ========================================
      pdf.addPage();
      yPos = 20;

      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, pageWidth, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DUERP - Document Unique d\'Évaluation des Risques Professionnels', pageWidth / 2, 10, { align: 'center' });

      yPos = 30;

      pdf.setFillColor(249, 115, 22);
      pdf.rect(margin, yPos, 10, 10, 'F');
      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('4. MESURES DE PRÉVENTION ET DE PROTECTION', margin + 15, yPos + 7);

      yPos += 20;

      const mesures = [
        {
          risque: 'R-001 - Chutes de plain-pied',
          existantes: [
            'Affichage des consignes de rangement',
            'Éclairage suffisant des zones de circulation'
          ],
          planifiees: [
            'Mise en place de bandes antidérapantes',
            'Audit mensuel de l\'état des sols',
            'Formation sécurité circulation'
          ]
        },
        {
          risque: 'R-002 - Chutes de hauteur',
          existantes: [
            'EPI : harnais et longes disponibles',
            'Procédure travail en hauteur validée'
          ],
          planifiees: [
            'Plateforme sécurisée pour accès fréquents',
            'Contrôle annuel des équipements',
            'Habilitation travail en hauteur pour personnel'
          ]
        },
        {
          risque: 'R-004 - Produits chimiques',
          existantes: [
            'Fiches de données de sécurité disponibles',
            'EPI : gants, lunettes, blouses',
            'Armoire ventilée pour stockage'
          ],
          planifiees: [
            'Formation manipulation produits chimiques',
            'Système d\'aspiration localisée',
            'Substitution des produits les plus dangereux'
          ]
        }
      ];

      mesures.forEach(mesure => {
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = 30;
          pdf.setFillColor(147, 51, 234);
          pdf.rect(0, 0, pageWidth, 15, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('DUERP - Document Unique d\'Évaluation des Risques Professionnels', pageWidth / 2, 10, { align: 'center' });
          yPos = 30;
        }

        // Titre risque
        pdf.setFillColor(241, 245, 249);
        pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 7, 2, 2, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(30, 58, 138);
        pdf.text(mesure.risque, margin + 3, yPos + 5);
        yPos += 10;

        // Mesures existantes
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(22, 163, 74);
        pdf.text('✓ Mesures existantes:', margin + 3, yPos);
        yPos += 6;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(55, 65, 81);
        mesure.existantes.forEach(m => {
          pdf.text(`  • ${m}`, margin + 5, yPos);
          yPos += 5;
        });

        yPos += 2;

        // Mesures planifiées
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text('→ Mesures planifiées:', margin + 3, yPos);
        yPos += 6;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(55, 65, 81);
        mesure.planifiees.forEach(m => {
          pdf.text(`  • ${m}`, margin + 5, yPos);
          yPos += 5;
        });

        yPos += 8;
      });

      // ========================================
      // PAGE 6 : PLAN D'ACTIONS
      // ========================================
      pdf.addPage();
      yPos = 20;

      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, pageWidth, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DUERP - Document Unique d\'Évaluation des Risques Professionnels', pageWidth / 2, 10, { align: 'center' });

      yPos = 30;

      pdf.setFillColor(16, 185, 129);
      pdf.rect(margin, yPos, 10, 10, 'F');
      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('5. PLAN D\'ACTIONS PRIORITAIRES', margin + 15, yPos + 7);

      yPos += 18;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(75, 85, 99);
      pdf.text('Programme annuel de prévention avec échéancier et responsables', margin, yPos);

      yPos += 12;

      // Actions prioritaires
      const actions = [
        { id: 'A-001', action: 'Installation bandes antidérapantes', risque: 'R-001', responsable: 'Services Techniques', echeance: '2026-03-31', priorite: 'HAUTE' },
        { id: 'A-002', action: 'Plateforme sécurisée hauteur', risque: 'R-002', responsable: 'Responsable Sécurité', echeance: '2026-06-30', priorite: 'HAUTE' },
        { id: 'A-003', action: 'Formation produits chimiques', risque: 'R-004', responsable: 'RH + HSE', echeance: '2026-04-30', priorite: 'HAUTE' },
        { id: 'A-004', action: 'Système aspiration localisée', risque: 'R-004', responsable: 'Services Techniques', echeance: '2026-09-30', priorite: 'MOYENNE' },
        { id: 'A-005', action: 'Audit ergonomie postes écran', risque: 'R-007', responsable: 'Médecine du Travail', echeance: '2026-05-31', priorite: 'MOYENNE' }
      ];

      // En-têtes
      pdf.setFillColor(243, 244, 246);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(31, 41, 55);

      const colWidthsActions = [12, 50, 15, 40, 20, 18];
      xTable = margin;

      ['ID', 'Action', 'Risque', 'Responsable', 'Échéance', 'Priorité'].forEach((header, idx) => {
        pdf.rect(xTable, yPos, colWidthsActions[idx], 8, 'FD');
        pdf.text(header, xTable + colWidthsActions[idx] / 2, yPos + 5, { align: 'center' });
        xTable += colWidthsActions[idx];
      });

      yPos += 8;

      // Lignes actions
      pdf.setFont('helvetica', 'normal');
      actions.forEach(action => {
        xTable = margin;
        
        pdf.setFontSize(7);
        pdf.rect(xTable, yPos, colWidthsActions[0], 10, 'S');
        pdf.text(action.id, xTable + colWidthsActions[0] / 2, yPos + 6, { align: 'center' });
        xTable += colWidthsActions[0];

        pdf.rect(xTable, yPos, colWidthsActions[1], 10, 'S');
        const actionLines = pdf.splitTextToSize(action.action, colWidthsActions[1] - 2);
        pdf.text(actionLines, xTable + 1, yPos + 4);
        xTable += colWidthsActions[1];

        pdf.rect(xTable, yPos, colWidthsActions[2], 10, 'S');
        pdf.text(action.risque, xTable + colWidthsActions[2] / 2, yPos + 6, { align: 'center' });
        xTable += colWidthsActions[2];

        pdf.rect(xTable, yPos, colWidthsActions[3], 10, 'S');
        pdf.text(action.responsable, xTable + 1, yPos + 6);
        xTable += colWidthsActions[3];

        pdf.rect(xTable, yPos, colWidthsActions[4], 10, 'S');
        pdf.text(new Date(action.echeance).toLocaleDateString('fr-FR'), xTable + colWidthsActions[4] / 2, yPos + 6, { align: 'center' });
        xTable += colWidthsActions[4];

        const prioColor = action.priorite === 'HAUTE' ? [239, 68, 68] : [251, 191, 36];
        pdf.setFillColor(prioColor[0], prioColor[1], prioColor[2]);
        pdf.rect(xTable, yPos, colWidthsActions[5], 10, 'FD');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.text(action.priorite, xTable + colWidthsActions[5] / 2, yPos + 6, { align: 'center' });
        pdf.setTextColor(31, 41, 55);
        pdf.setFont('helvetica', 'normal');

        yPos += 10;
      });

      // ========================================
      // PAGE 7 : DONNÉES D'EXPOSITION
      // ========================================
      pdf.addPage();
      yPos = 20;

      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, pageWidth, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DUERP - Document Unique d\'Évaluation des Risques Professionnels', pageWidth / 2, 10, { align: 'center' });

      yPos = 30;

      pdf.setFillColor(236, 72, 153);
      pdf.rect(margin, yPos, 10, 10, 'F');
      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('6. DONNÉES D\'EXPOSITION AUX FACTEURS DE RISQUES', margin + 15, yPos + 7);

      yPos += 18;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(75, 85, 99);
      pdf.text('Conformément à l\'article R.4121-1-1 - Facteurs de pénibilité et expositions', margin, yPos);

      yPos += 15;

      // Tableau exposition
      const expositions = [
        { facteur: 'Manutentions manuelles charges', effectif: 12, pourcentage: '24%', seuil: 'Au-dessus', mesures: 'Formation gestes/postures prévue' },
        { facteur: 'Postures pénibles', effectif: 8, pourcentage: '16%', seuil: 'Au-dessus', mesures: 'Audit ergonomique en cours' },
        { facteur: 'Vibrations mécaniques', effectif: 3, pourcentage: '6%', seuil: 'En-dessous', mesures: 'Surveillance médicale renforcée' },
        { facteur: 'Bruit (>81 dB)', effectif: 15, pourcentage: '30%', seuil: 'Au-dessus', mesures: 'EPI fournis, mesurage annuel' },
        { facteur: 'Agents chimiques dangereux', effectif: 5, pourcentage: '10%', seuil: 'Au-dessus', mesures: 'Suivi médical, FDS à jour' }
      ];

      pdf.setFillColor(243, 244, 246);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      
      const colExpo = [55, 20, 20, 20, 50];
      xTable = margin;

      ['Facteur de risque', 'Effectif', '%', 'Seuil', 'Mesures'].forEach((h, idx) => {
        pdf.rect(xTable, yPos, colExpo[idx], 8, 'FD');
        pdf.text(h, xTable + colExpo[idx] / 2, yPos + 5, { align: 'center' });
        xTable += colExpo[idx];
      });

      yPos += 8;

      pdf.setFont('helvetica', 'normal');
      expositions.forEach(expo => {
        xTable = margin;

        pdf.rect(xTable, yPos, colExpo[0], 10, 'S');
        pdf.text(expo.facteur, xTable + 1, yPos + 6);
        xTable += colExpo[0];

        pdf.rect(xTable, yPos, colExpo[1], 10, 'S');
        pdf.text(expo.effectif.toString(), xTable + colExpo[1] / 2, yPos + 6, { align: 'center' });
        xTable += colExpo[1];

        pdf.rect(xTable, yPos, colExpo[2], 10, 'S');
        pdf.text(expo.pourcentage, xTable + colExpo[2] / 2, yPos + 6, { align: 'center' });
        xTable += colExpo[2];

        const seuilColor = expo.seuil === 'Au-dessus' ? [254, 226, 226] : [220, 252, 231];
        pdf.setFillColor(seuilColor[0], seuilColor[1], seuilColor[2]);
        pdf.rect(xTable, yPos, colExpo[3], 10, 'FD');
        pdf.text(expo.seuil, xTable + colExpo[3] / 2, yPos + 6, { align: 'center' });
        xTable += colExpo[3];

        pdf.rect(xTable, yPos, colExpo[4], 10, 'S');
        const mesLines = pdf.splitTextToSize(expo.mesures, colExpo[4] - 2);
        pdf.text(mesLines, xTable + 1, yPos + 4);

        yPos += 10;
      });

      yPos += 15;

      pdf.setFillColor(254, 249, 195);
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 2, 2, 'F');
      yPos += 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(113, 63, 18);
      pdf.text('NOTE:', margin + 3, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Les salariés exposés bénéficient d\'un suivi individuel renforcé et d\'une fiche', margin + 18, yPos);
      yPos += 5;
      pdf.text('de prévention des expositions transmise au service de santé au travail.', margin + 3, yPos);

      // ========================================
      // PAGE 8 : TRAÇABILITÉ
      // ========================================
      pdf.addPage();
      yPos = 20;

      pdf.setFillColor(147, 51, 234);
      pdf.rect(0, 0, pageWidth, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DUERP - Document Unique d\'Évaluation des Risques Professionnels', pageWidth / 2, 10, { align: 'center' });

      yPos = 30;

      pdf.setFillColor(99, 102, 241);
      pdf.rect(margin, yPos, 10, 10, 'F');
      pdf.setTextColor(31, 41, 55);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('7. TRAÇABILITÉ ET MISE À JOUR', margin + 15, yPos + 7);

      yPos += 20;

      // Historique versions
      pdf.setFillColor(219, 234, 254);
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 8, 2, 2, 'F');
      pdf.setTextColor(30, 58, 138);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('HISTORIQUE DES VERSIONS', margin + 5, yPos + 5.5);

      yPos += 15;

      const versions = [
        { version: '4.0', date: '2026-01-30', auteur: 'Jean Martin', modifications: 'Mise à jour annuelle 2026 - Ajout 3 nouveaux risques' },
        { version: '3.1', date: '2025-09-15', auteur: 'Sophie Bernard', modifications: 'Modification suite nouvel équipement atelier' },
        { version: '3.0', date: '2025-01-10', auteur: 'Jean Martin', modifications: 'Version annuelle 2025' },
        { version: '2.0', date: '2024-01-15', auteur: 'Marc Durand', modifications: 'Version annuelle 2024' }
      ];

      versions.forEach(ver => {
        pdf.setFillColor(249, 250, 251);
        pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 2, 2, 'F');
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(31, 41, 55);
        pdf.text(`Version ${ver.version}`, margin + 3, yPos + 5);
        
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(75, 85, 99);
        pdf.text(`Date: ${new Date(ver.date).toLocaleDateString('fr-FR')}`, margin + 3, yPos + 10);
        pdf.text(`| Auteur: ${ver.auteur}`, margin + 40, yPos + 10);
        pdf.text(`| ${ver.modifications}`, margin + 80, yPos + 10);

        yPos += 17;
      });

      yPos += 10;

      // Obligations
      pdf.setFillColor(254, 226, 226);
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 8, 2, 2, 'F');
      pdf.setTextColor(153, 27, 27);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OBLIGATIONS DE MISE À JOUR', margin + 5, yPos + 5.5);

      yPos += 15;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);
      const obligations = [
        '• Au minimum une fois par an (entreprises ≥ 11 salariés)',
        '• Lors de toute modification des conditions de travail',
        '• Lors de l\'apparition d\'une nouvelle information sur les risques',
        '• Conservation des versions successives pendant 40 ans (article R.4121-4)'
      ];

      obligations.forEach(obl => {
        pdf.text(obl, margin + 3, yPos);
        yPos += 6;
      });

      yPos += 10;

      // Accessibilité
      pdf.setFillColor(220, 252, 231);
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 8, 2, 2, 'F');
      pdf.setTextColor(21, 128, 61);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ACCESSIBILITÉ DU DOCUMENT', margin + 5, yPos + 5.5);

      yPos += 15;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(55, 65, 81);
      const acces = [
        '• Salariés et anciens salariés',
        '• Représentants du personnel (CSE, CSSCT)',
        '• Médecin du travail et service de santé au travail',
        '• Inspection du travail',
        '• Services de prévention des organismes de sécurité sociale (CARSAT, CRAMIF...)',
        '• Agents des services de prévention des CRAM'
      ];

      acces.forEach(acc => {
        pdf.text(acc, margin + 3, yPos);
        yPos += 6;
      });

      yPos += 15;

      // Signatures
      pdf.setDrawColor(209, 213, 219);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(31, 41, 55);
      pdf.text('VALIDATION', pageWidth / 2, yPos, { align: 'center' });

      yPos += 15;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('Responsable de l\'établissement:', margin, yPos);
      pdf.text('Date:', pageWidth / 2 + 10, yPos);
      yPos += 15;

      pdf.text(`Signature: ${responsable}`, margin, yPos);
      pdf.text(`Le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2 + 10, yPos);

      // Footer sur toutes les pages
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        const footY = pageHeight - 10;
        pdf.setDrawColor(209, 213, 219);
        pdf.line(margin, footY - 5, pageWidth - margin, footY - 5);
        pdf.setTextColor(107, 114, 128);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text(`${entreprise} - DUERP v${version}`, margin, footY);
        pdf.text(`Page ${i}/${totalPages}`, pageWidth - margin, footY, { align: 'right' });
      }

      // Sauvegarder
      const filename = `DUERP_${entreprise.replace(/[^a-z0-9]/gi, '_')}_v${version}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      toast.success('DUERP généré avec succès ! 📄', {
        description: `Le Document Unique complet a été téléchargé`
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error generating DUERP:', error);
      toast.error('Erreur lors de la génération du DUERP', {
        description: 'Veuillez réessayer'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <FileText className="h-6 w-6 mr-2 text-purple-600" />
            Générer le DUERP Complet
          </DialogTitle>
          <DialogDescription>
            Génération automatique du Document Unique d'Évaluation des Risques Professionnels conforme à la réglementation française
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
                  Ce document utilise les données fictives de démonstration. En production, il compilera automatiquement
                  les risques, évaluations et actions réels de votre base de données.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleGenerate}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Générer le DUERP Complet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}