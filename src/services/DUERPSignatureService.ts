import { DUERPSignature } from '@/app/components/DUERPSignatureManagement';

export interface SignatureEmailData {
  directorEmail: string;
  directorName: string;
  documentVersion: string;
  organizationName: string;
  changesSummary: {
    newRisks: number;
    updatedRisks: number;
    newMeasures: number;
    updatedMeasures: number;
  };
  signatureLink: string;
  expirationDate: string;
  comments?: string;
}

export class DUERPSignatureService {
  /**
   * Génère un lien de signature unique
   */
  static generateSignatureLink(documentId: string): string {
    const token = this.generateSecureToken();
    const baseUrl = window.location.origin;
    return `${baseUrl}/sign?token=${token}&doc=${documentId}`;
  }

  /**
   * Génère un token sécurisé pour la signature
   */
  private static generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Envoie un email au directeur pour signature
   */
  static async sendSignatureRequest(data: SignatureEmailData): Promise<void> {
    const emailHtml = this.generateSignatureEmail(data);
    
    console.log('Envoi de l\'email de signature:', {
      to: data.directorEmail,
      subject: `Signature DUERP - Version ${data.documentVersion}`,
      html: emailHtml
    });

    // Ici on appellerait le service d'envoi d'email (SMTP configuré dans les paramètres)
    // Pour la démo, on simule l'envoi
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Email de signature envoyé avec succès');
        resolve();
      }, 1000);
    });
  }

  /**
   * Génère le HTML de l'email de demande de signature
   */
  private static generateSignatureEmail(data: SignatureEmailData): string {
    const expirationDate = new Date(data.expirationDate).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signature DUERP</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #8b5cf6;
    }
    .header h1 {
      color: #8b5cf6;
      margin: 0;
      font-size: 24px;
    }
    .content {
      margin-bottom: 30px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .info-box {
      background-color: #f3f4f6;
      border-left: 4px solid #8b5cf6;
      padding: 15px;
      margin: 20px 0;
    }
    .changes-summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 20px 0;
    }
    .change-item {
      background-color: #fef3c7;
      border: 1px solid #fbbf24;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
    }
    .change-number {
      font-size: 24px;
      font-weight: bold;
      color: #d97706;
    }
    .change-label {
      font-size: 12px;
      color: #78716c;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
      font-size: 16px;
    }
    .warning {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    .legal {
      background-color: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
      font-size: 11px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Demande de Signature DUERP</h1>
      <p style="color: #6b7280; margin: 5px 0 0 0;">Document Unique d'Évaluation des Risques Professionnels</p>
    </div>
    
    <div class="content">
      <p class="greeting">Bonjour ${data.directorName},</p>
      
      <p>
        Le <strong>Document Unique d'Évaluation des Risques Professionnels (DUERP)</strong> 
        de <strong>${data.organizationName}</strong> a été mis à jour et nécessite votre signature électronique.
      </p>
      
      <div class="info-box">
        <p style="margin: 0;"><strong>📄 Version :</strong> ${data.documentVersion}</p>
        <p style="margin: 5px 0 0 0;"><strong>📅 Date d'expiration du lien :</strong> ${expirationDate}</p>
      </div>

      <h3 style="color: #8b5cf6; margin-top: 25px;">Résumé des modifications</h3>
      <div class="changes-summary">
        <div class="change-item" style="background-color: #fef2f2; border-color: #fca5a5;">
          <div class="change-number" style="color: #dc2626;">${data.changesSummary.newRisks}</div>
          <div class="change-label">Nouveaux risques</div>
        </div>
        <div class="change-item" style="background-color: #fff7ed; border-color: #fdba74;">
          <div class="change-number" style="color: #ea580c;">${data.changesSummary.updatedRisks}</div>
          <div class="change-label">Risques modifiés</div>
        </div>
        <div class="change-item" style="background-color: #f0fdf4; border-color: #86efac;">
          <div class="change-number" style="color: #16a34a;">${data.changesSummary.newMeasures}</div>
          <div class="change-label">Nouvelles mesures</div>
        </div>
        <div class="change-item" style="background-color: #eff6ff; border-color: #93c5fd;">
          <div class="change-number" style="color: #2563eb;">${data.changesSummary.updatedMeasures}</div>
          <div class="change-label">Mesures modifiées</div>
        </div>
      </div>

      ${data.comments ? `
      <div class="info-box" style="border-left-color: #06b6d4;">
        <p style="margin: 0; font-weight: bold; color: #0e7490;">💬 Commentaires de l'administrateur :</p>
        <p style="margin: 10px 0 0 0;">${data.comments}</p>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.signatureLink}" class="cta-button">
          ✍️ Signer le document
        </a>
      </div>

      <div class="warning">
        <p style="margin: 0; font-weight: bold; color: #991b1b;">⚠️ Important</p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #7f1d1d;">
          <li>Ce lien expire le <strong>${expirationDate}</strong></li>
          <li>Veuillez consulter le document complet avant de signer</li>
          <li>Votre signature aura la même valeur juridique qu'une signature manuscrite</li>
        </ul>
      </div>
    </div>

    <div class="legal">
      <p style="margin: 0 0 10px 0;"><strong>🔒 Sécurité et conformité</strong></p>
      <p style="margin: 0;">
        Cette signature électronique est conforme au règlement européen eIDAS (n° 910/2014) 
        et à l'article 1367 du Code civil français. Votre signature sera horodatée et 
        enregistrée avec votre adresse IP pour garantir son authenticité.
      </p>
    </div>

    <div class="footer">
      <p>${data.organizationName}</p>
      <p>Cet email a été généré automatiquement, merci de ne pas y répondre.</p>
      <p style="margin-top: 10px; color: #9ca3af;">
        Si vous avez des questions, veuillez contacter votre administrateur DUERP.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Envoie une notification à l'admin après signature
   */
  static async sendSignatureConfirmation(
    adminEmail: string,
    directorName: string,
    documentVersion: string,
    signatureData: any
  ): Promise<void> {
    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .success-box { background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="success-box">
    <h2 style="color: #065f46; margin-top: 0;">✅ DUERP signé avec succès</h2>
    <p><strong>${directorName}</strong> a signé le DUERP version <strong>${documentVersion}</strong>.</p>
    <p><strong>Date de signature :</strong> ${new Date(signatureData.signedAt).toLocaleString('fr-FR')}</p>
    <p><strong>Adresse IP :</strong> ${signatureData.ipAddress}</p>
    <p>Le document est maintenant officiellement validé et peut être archivé.</p>
  </div>
</body>
</html>
    `.trim();

    console.log('Envoi notification admin:', { to: adminEmail, html: emailHtml });
  }

  /**
   * Envoie une notification à l'admin en cas de refus
   */
  static async sendRejectionNotification(
    adminEmail: string,
    directorName: string,
    documentVersion: string,
    reason: string
  ): Promise<void> {
    const emailHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .error-box { background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="error-box">
    <h2 style="color: #991b1b; margin-top: 0;">❌ DUERP refusé</h2>
    <p><strong>${directorName}</strong> a refusé de signer le DUERP version <strong>${documentVersion}</strong>.</p>
    <p><strong>Motif du refus :</strong></p>
    <p style="background-color: white; padding: 15px; border-radius: 4px;">${reason}</p>
    <p>Veuillez prendre contact avec le directeur pour comprendre les raisons du refus.</p>
  </div>
</body>
</html>
    `.trim();

    console.log('Envoi notification refus:', { to: adminEmail, html: emailHtml });
  }
}
