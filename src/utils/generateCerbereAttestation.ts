interface AttestationData {
  id: string;
  agentConcerne: string;
  applications: string[];
  profils: string[];
  reglePortee: string;
  restrictions: string;
  valideePar: string;
  dateValidation: string;
}

export function generateCerbereAttestation(data: AttestationData) {
  try {
    // Import dynamique pour éviter les problèmes de chargement
    import('jspdf').then((jsPDFModule) => {
      // @ts-ignore - jsPDF version 4 a une structure différente
      const jsPDF = jsPDFModule.default || jsPDFModule;
      // @ts-ignore
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const footerReserved = 32;
      const usableBottom = pageHeight - footerReserved;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      const ensureSpace = (neededHeight: number) => {
        if (y + neededHeight <= usableBottom) return;
        doc.addPage();
        y = 20;
      };

      const drawFooter = () => {
        let footerY = pageHeight - 30;
        doc.setLineWidth(0.3);
        doc.line(margin, footerY, pageWidth - margin, footerY);
        footerY += 5;
        doc.setFontSize(8);
        doc.text('Direction Interrégionale de la Mer Méditerranée', pageWidth / 2, footerY, {
          align: 'center',
        });
        footerY += 4;
        doc.text('16 Quai de Rive Neuve, 13007 Marseille', pageWidth / 2, footerY, {
          align: 'center',
        });
        footerY += 4;
        doc.text('Tél : +33 4 91 32 85 00', pageWidth / 2, footerY, { align: 'center' });
        footerY += 4;
        doc.setFontSize(7);
        doc.text(
          `Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
          pageWidth / 2,
          footerY,
          { align: 'center' },
        );
      };

      const writeParagraph = (text: string, size = 11, lineHeight = 5.5) => {
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(text, contentWidth);
        ensureSpace(lines.length * lineHeight + 2);
        doc.text(lines, margin, y);
        y += lines.length * lineHeight + 2;
      };

      const writeSectionTitle = (title: string) => {
        ensureSpace(8);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(title, margin, y);
        doc.setFont(undefined, 'normal');
        y += 7;
      };

      const writeBullets = (items: string[]) => {
        items.forEach((item) => {
          const bulletText = `• ${item}`;
          const lines = doc.splitTextToSize(bulletText, contentWidth - 4);
          ensureSpace(lines.length * 5.5 + 1);
          doc.setFontSize(11);
          doc.text(lines, margin + 2, y);
          y += lines.length * 5.5 + 1;
        });
      };

      // En-tête officiel
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('RÉPUBLIQUE FRANÇAISE', pageWidth / 2, y, { align: 'center' });
      y += 8;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text('Ministère de la Transition écologique', pageWidth / 2, y, { align: 'center' });
      y += 6;
      doc.text('Direction Interrégionale de la Mer Méditerranée', pageWidth / 2, y, { align: 'center' });
      y += 10;
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;

      doc.setFont(undefined, 'bold');
      doc.setFontSize(17);
      doc.text("ATTESTATION D'HABILITATION CERBÈRE", pageWidth / 2, y, { align: 'center' });
      y += 10;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`Référence : ${data.id.toUpperCase()}`, margin, y);
      y += 10;

      writeParagraph(
        "La Direction Interrégionale de la Mer Méditerranée atteste que l'agent ci-dessous dispose des habilitations mentionnées dans le présent document pour l'accès aux applications du système Cerbère.",
      );
      y += 2;

      writeSectionTitle('1. Identification de l’agent');
      writeParagraph(`Agent concerné : ${data.agentConcerne}`);
      y += 2;

      writeSectionTitle('2. Applications autorisées');
      writeBullets(data.applications);
      y += 2;

      writeSectionTitle('3. Profils attribués');
      writeBullets(data.profils);
      y += 2;

      writeSectionTitle('4. Portée et restrictions');
      writeParagraph(`Règle de portée : ${data.reglePortee}`);
      if (data.restrictions && data.restrictions !== 'Aucune') {
        writeParagraph(`Restrictions : ${data.restrictions}`);
      } else {
        writeParagraph('Restrictions : Aucune');
      }
      y += 2;

      writeSectionTitle('5. Validation');
      writeParagraph(`Validée par : ${data.valideePar}`);
      writeParagraph(
        `Date de validation : ${new Date(data.dateValidation).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`,
      );
      y += 2;

      // Bloc réglementaire d'avertissement
      const warningTitle = 'IMPORTANT';
      const warningBody =
        'Les accès Cerbère sont personnels et confidentiels. Toute utilisation frauduleuse ou non conforme au règlement intérieur peut entraîner des sanctions disciplinaires.';
      const warningLines = doc.splitTextToSize(warningBody, contentWidth - 10);
      const warningHeight = 10 + warningLines.length * 5 + 4;
      ensureSpace(warningHeight + 4);
      doc.setDrawColor(200, 100, 100);
      doc.setFillColor(255, 240, 240);
      doc.rect(margin, y, contentWidth, warningHeight, 'FD');
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.text(warningTitle, margin + 5, y + 6);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      doc.text(warningLines, margin + 5, y + 12);

      // Footer sur chaque page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i += 1) {
        doc.setPage(i);
        drawFooter();
      }

      // Télécharger le PDF
      const fileName = `Attestation_Cerbere_${data.agentConcerne.replace(/\s+/g, '_')}_${
        data.id
      }.pdf`;
      doc.save(fileName);
    }).catch((error) => {
      console.error('Erreur lors du chargement de jsPDF:', error);
      alert('Impossible de générer l\'attestation PDF. La bibliothèque PDF n\'est pas disponible.');
    });
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    alert('Impossible de générer l\'attestation PDF');
  }
}
