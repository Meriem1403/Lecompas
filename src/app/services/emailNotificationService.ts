import { NotificationPreference } from '@/app/components/NotificationSettings';

interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  eventType: string;
  metadata?: any;
}

interface NotificationEvent {
  type: 'new_risk' | 'update_risk' | 'new_accident' | 'update_accident' | 'new_actuality' | 
        'new_action_return' | 'validate_action_return' | 'new_cerbere_request' | 
        'validate_cerbere_request' | 'new_arrivee_depart';
  title: string;
  description: string;
  url?: string;
  metadata: {
    service?: string;
    domaine?: string;
    lieu?: string;
    category?: string;
    role?: string;
    severity?: string;
    [key: string]: any;
  };
}

/**
 * Service de notification par email
 * Gère l'envoi d'emails ciblés selon les préférences utilisateur
 */
export class EmailNotificationService {
  /**
   * Vérifie si un utilisateur doit recevoir une notification selon ses préférences
   */
  private static shouldNotify(
    preference: NotificationPreference,
    event: NotificationEvent
  ): boolean {
    // Vérifier que les emails sont activés
    if (!preference.enableEmail) {
      return false;
    }

    // Vérifier le type d'événement
    const eventTypeMap: Record<string, keyof NotificationPreference> = {
      'new_risk': 'notifyNewRisk',
      'update_risk': 'notifyRiskUpdate',
      'new_accident': 'notifyNewAccident',
      'update_accident': 'notifyAccidentUpdate',
      'new_actuality': 'notifyNewActuality',
      'new_action_return': 'notifyActionReturn',
      'validate_action_return': 'notifyActionReturnValidation',
      'new_cerbere_request': 'notifyCerbereRequest',
      'validate_cerbere_request': 'notifyCerbereValidation',
      'new_arrivee_depart': 'notifyArriveesDeparts'
    };

    const prefKey = eventTypeMap[event.type];
    if (prefKey && !preference[prefKey]) {
      return false;
    }

    // Vérifier les filtres
    const { filters } = preference;
    const { metadata } = event;

    // Si des filtres sont définis, vérifier qu'au moins un correspond
    const hasServiceFilter = filters.services.length > 0;
    const hasDomaineFilter = filters.domaines.length > 0;
    const hasLieuFilter = filters.lieux.length > 0;
    const hasCategoryFilter = filters.categories.length > 0;
    const hasRoleFilter = filters.roles.length > 0;

    let matchesFilters = true;

    if (hasServiceFilter && metadata.service) {
      matchesFilters = matchesFilters && filters.services.includes(metadata.service);
    }

    if (hasDomaineFilter && metadata.domaine) {
      matchesFilters = matchesFilters && filters.domaines.includes(metadata.domaine);
    }

    if (hasLieuFilter && metadata.lieu) {
      matchesFilters = matchesFilters && filters.lieux.includes(metadata.lieu);
    }

    if (hasCategoryFilter && metadata.category) {
      matchesFilters = matchesFilters && filters.categories.includes(metadata.category);
    }

    if (hasRoleFilter && metadata.role) {
      matchesFilters = matchesFilters && filters.roles.includes(metadata.role);
    }

    return matchesFilters;
  }

  /**
   * Génère le contenu HTML de l'email
   */
  private static generateEmailHTML(event: NotificationEvent): string {
    const { title, description, url, metadata } = event;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .badge { display: inline-block; padding: 5px 10px; background: #667eea; color: white; border-radius: 5px; font-size: 12px; margin: 5px 5px 5px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .metadata { background: white; padding: 15px; border-left: 4px solid #667eea; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Nouvelle Notification DUERP</h1>
          </div>
          <div class="content">
            <h2>${title}</h2>
            <p>${description}</p>
            
            ${metadata.service ? `<span class="badge">📋 ${metadata.service}</span>` : ''}
            ${metadata.domaine ? `<span class="badge">🏢 ${metadata.domaine}</span>` : ''}
            ${metadata.lieu ? `<span class="badge">📍 ${metadata.lieu}</span>` : ''}
            ${metadata.category ? `<span class="badge">🏷️ ${metadata.category}</span>` : ''}
            ${metadata.severity ? `<span class="badge">⚠️ ${metadata.severity}</span>` : ''}
            
            <div class="metadata">
              <strong>Détails de l'événement :</strong><br>
              ${Object.entries(metadata)
                .filter(([key]) => !['service', 'domaine', 'lieu', 'category', 'severity'].includes(key))
                .map(([key, value]) => `<div><em>${key}:</em> ${value}</div>`)
                .join('')}
            </div>
            
            ${url ? `<a href="${url}" class="button">Voir dans l'application</a>` : ''}
          </div>
          <div class="footer">
            <p>Direction Interrégionale de la Mer Méditerranée</p>
            <p>Vous recevez cet email car vous êtes abonné aux notifications DUERP.</p>
            <p><small>Pour modifier vos préférences, rendez-vous dans les paramètres de l'application.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Envoie une notification email
   * En production, cela appellerait une API backend (Supabase Edge Function)
   */
  private static async sendEmail(notification: EmailNotification): Promise<void> {
    console.log('📧 Email envoyé:', {
      to: notification.to,
      subject: notification.subject,
      eventType: notification.eventType
    });

    // EN PRODUCTION: Appel à l'API backend
    /*
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/make-server-cfb78916/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: notification.to,
          subject: notification.subject,
          html: notification.body
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`);
      }

      console.log('✅ Email sent successfully to', notification.to);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
    */
  }

  /**
   * Notifie tous les utilisateurs concernés d'un événement
   */
  static async notifyUsers(
    event: NotificationEvent,
    allPreferences: NotificationPreference[]
  ): Promise<void> {
    const emailsToSend: EmailNotification[] = [];

    // Filtrer les utilisateurs qui doivent être notifiés
    for (const pref of allPreferences) {
      // Vérifier la fréquence (pour l'instant on gère seulement immediate)
      if (pref.frequency !== 'immediate') {
        continue; // Les résumés seront gérés par un cron job
      }

      if (this.shouldNotify(pref, event)) {
        const emailBody = this.generateEmailHTML(event);
        
        emailsToSend.push({
          to: pref.email,
          subject: `[DUERP] ${event.title}`,
          body: emailBody,
          eventType: event.type,
          metadata: event.metadata
        });
      }
    }

    // Envoyer tous les emails
    console.log(`📨 Envoi de ${emailsToSend.length} notifications email...`);
    
    for (const email of emailsToSend) {
      try {
        await this.sendEmail(email);
      } catch (error) {
        console.error(`Erreur lors de l'envoi à ${email.to}:`, error);
      }
    }

    console.log(`✅ ${emailsToSend.length} emails envoyés avec succès`);
  }

  /**
   * Crée un événement de notification pour un nouveau risque
   */
  static createNewRiskEvent(risk: any): NotificationEvent {
    return {
      type: 'new_risk',
      title: `Nouveau risque identifié : ${risk.title}`,
      description: `Un nouveau risque a été identifié dans le service ${risk.service}. Niveau de criticité : ${risk.riskLevel}`,
      url: `/risks/${risk.id}`,
      metadata: {
        service: risk.service,
        domaine: risk.unite,
        lieu: risk.site,
        category: risk.category,
        severity: risk.riskLevel,
        responsable: risk.responsable
      }
    };
  }

  /**
   * Crée un événement de notification pour un nouvel accident
   */
  static createNewAccidentEvent(accident: any): NotificationEvent {
    return {
      type: 'new_accident',
      title: `Nouvel accident déclaré : ${accident.title}`,
      description: `Un accident ${accident.severity} a été déclaré le ${new Date(accident.date).toLocaleDateString('fr-FR')}`,
      url: `/accidents/${accident.id}`,
      metadata: {
        service: accident.service,
        lieu: accident.location,
        severity: accident.severity,
        victimName: accident.victimName,
        date: accident.date
      }
    };
  }

  /**
   * Crée un événement de notification pour une nouvelle actualité
   */
  static createNewActualityEvent(actuality: any): NotificationEvent {
    return {
      type: 'new_actuality',
      title: `Nouvelle actualité : ${actuality.titre}`,
      description: actuality.contenu.substring(0, 200) + '...',
      url: `/actualites/${actuality.id}`,
      metadata: {
        type: actuality.type,
        date: actuality.dateCreation,
        auteur: actuality.auteur
      }
    };
  }

  /**
   * Crée un événement de notification pour un nouveau retour d'action
   */
  static createActionReturnEvent(actionReturn: any, risk: any): NotificationEvent {
    return {
      type: 'new_action_return',
      title: `Nouveau retour d'action proposé`,
      description: `${actionReturn.proposedBy} a proposé une nouvelle mesure pour le risque "${risk.title}"`,
      url: `/risks/${risk.id}/action-returns`,
      metadata: {
        service: risk.service,
        domaine: risk.unite,
        lieu: risk.site,
        category: risk.category,
        proposedBy: actionReturn.proposedBy,
        role: 'admin' // Ciblé uniquement pour les admins
      }
    };
  }

  /**
   * Crée un événement de notification pour la validation d'un retour d'action
   */
  static createActionReturnValidationEvent(actionReturn: any, risk: any, approved: boolean): NotificationEvent {
    return {
      type: 'validate_action_return',
      title: `Retour d'action ${approved ? 'validé' : 'refusé'}`,
      description: `Votre proposition de retour d'action pour le risque "${risk.title}" a été ${approved ? 'validée' : 'refusée'} par ${actionReturn.reviewedBy}`,
      url: `/risks/${risk.id}/action-returns`,
      metadata: {
        service: risk.service,
        domaine: risk.unite,
        lieu: risk.site,
        category: risk.category,
        reviewedBy: actionReturn.reviewedBy,
        status: approved ? 'approved' : 'rejected',
        role: 'chef_service' // Ciblé pour les chefs de service
      }
    };
  }

  /**
   * Crée un événement de notification pour une demande Cerbère
   */
  static createCerbereRequestEvent(request: any): NotificationEvent {
    return {
      type: 'new_cerbere_request',
      title: `Nouvelle demande d'habilitation Cerbère`,
      description: `${request.demandeur} a fait une demande d'habilitation pour l'application ${request.application}`,
      url: `/cerbere/requests/${request.id}`,
      metadata: {
        demandeur: request.demandeur,
        application: request.application,
        profil: request.profil,
        role: 'admin' // Ciblé pour les admins
      }
    };
  }

  /**
   * Crée un événement de notification pour une arrivée/départ
   */
  static createArriveesDepartsEvent(entry: any): NotificationEvent {
    const isArrivee = entry.type === 'arrivee';
    return {
      type: 'new_arrivee_depart',
      title: `${isArrivee ? 'Nouvelle arrivée' : 'Nouveau départ'} : ${entry.nom}`,
      description: `${entry.nom} ${isArrivee ? 'rejoint' : 'quitte'} le service ${entry.service} le ${new Date(entry.date).toLocaleDateString('fr-FR')}`,
      url: `/arrivees-departs`,
      metadata: {
        service: entry.service,
        type: entry.type,
        nom: entry.nom,
        poste: entry.poste,
        date: entry.date
      }
    };
  }
}
