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
      const margin = 20;
      let yPosition = 20;

      // En-tête - République Française
      doc.setFontSize(12);
      doc.text('RÉPUBLIQUE FRANÇAISE', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
      doc.setFontSize(10);
      doc.text('Ministère de la Transition écologique', pageWidth / 2, yPosition, {
        align: 'center',
      });
      yPosition += 6;
      doc.text('Direction Interrégionale de la Mer Méditerranée', pageWidth / 2, yPosition, {
        align: 'center',
      });
      yPosition += 15;

      // Ligne de séparation
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // Titre
      doc.setFontSize(18);
      doc.text('ATTESTATION D\'HABILITATION', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
      doc.setFontSize(14);
      doc.text('Système Cerbère', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Référence
      doc.setFontSize(10);
      doc.text(`Référence: ${data.id.toUpperCase()}`, margin, yPosition);
      yPosition += 10;

      // Ligne de séparation
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // Corps du document
      doc.setFontSize(11);

      // Paragraphe d'introduction
      const introText =
        'La Direction Interrégionale de la Mer Méditerranée atteste que l\'agent suivant dispose des habilitations ci-après pour accéder aux applications du système Cerbère :';
      const introLines = doc.splitTextToSize(introText, pageWidth - 2 * margin);
      doc.text(introLines, margin, yPosition);
      yPosition += introLines.length * 6 + 10;

      // Agent concerné
      doc.text('Agent concerné : ' + data.agentConcerne, margin, yPosition);
      yPosition += 10;

      // Applications
      doc.text('Applications autorisées :', margin, yPosition);
      yPosition += 7;
      data.applications.forEach((app) => {
        doc.text(`- ${app}`, margin + 10, yPosition);
        yPosition += 6;
      });
      yPosition += 5;

      // Profils
      doc.text('Profils attribués :', margin, yPosition);
      yPosition += 7;
      data.profils.forEach((profil) => {
        const profilLines = doc.splitTextToSize(`- ${profil}`, pageWidth - 2 * margin - 10);
        doc.text(profilLines, margin + 10, yPosition);
        yPosition += profilLines.length * 6;
      });
      yPosition += 5;

      // Règle de portée
      doc.text('Règle de portée : ' + data.reglePortee, margin, yPosition);
      yPosition += 10;

      // Restrictions
      if (data.restrictions && data.restrictions !== 'Aucune') {
        doc.text('Restrictions :', margin, yPosition);
        yPosition += 7;
        const restrictionLines = doc.splitTextToSize(data.restrictions, pageWidth - 2 * margin - 10);
        doc.text(restrictionLines, margin + 10, yPosition);
        yPosition += restrictionLines.length * 6 + 5;
      }

      yPosition += 10;

      // Cadre d'avertissement
      doc.setDrawColor(200, 100, 100);
      doc.setFillColor(255, 240, 240);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 25, 'FD');
      yPosition += 7;
      doc.setFontSize(9);
      doc.text('IMPORTANT :', margin + 5, yPosition);
      const warningText =
        'Les accès Cerbère sont personnels et confidentiels. Toute utilisation frauduleuse ou non conforme au règlement intérieur peut entraîner des sanctions disciplinaires.';
      const warningLines = doc.splitTextToSize(warningText, pageWidth - 2 * margin - 10);
      doc.text(warningLines, margin + 5, yPosition + 5);
      yPosition += 30;

      // Validation
      yPosition += 10;
      doc.setFontSize(11);
      doc.text('Validation :', margin, yPosition);
      yPosition += 8;
      doc.text(`Validée par : ${data.valideePar}`, margin + 5, yPosition);
      yPosition += 7;
      doc.text(
        `Date de validation : ${new Date(data.dateValidation).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`,
        margin + 5,
        yPosition
      );

      // Pied de page
      yPosition = doc.internal.pageSize.getHeight() - 30;
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
      doc.setFontSize(8);
      doc.text(
        'Direction Interrégionale de la Mer Méditerranée',
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      yPosition += 4;
      doc.text('16 Quai de Rive Neuve, 13007 Marseille', pageWidth / 2, yPosition, {
        align: 'center',
      });
      yPosition += 4;
      doc.text('Tél : +33 4 91 32 85 00', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 4;
      doc.setFontSize(7);
      doc.text(
        `Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );

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
