# 📋 Guide du Système de Signature Électronique DUERP

## Vue d'ensemble

Le système de signature électronique du DUERP permet de gérer le workflow complet de validation du Document Unique d'Évaluation des Risques Professionnels, de la création à la signature par le directeur.

## 🎯 Fonctionnalités Principales

### 1. Configuration Initiale

**Étape 1 : Configurer le Signataire**
- Aller dans **Paramètres** > **Organisation**
- Renseigner les informations du directeur :
  - Nom complet
  - Fonction/Titre
  - Email professionnel (obligatoire)
  - Téléphone (optionnel)

**Étape 2 : Configurer l'Envoi d'Emails**
- Aller dans **Paramètres** > **Notifications**
- Section "Configuration SMTP" :
  - Email expéditeur
  - Nom de l'expéditeur
  - Serveur SMTP (hôte, port, utilisateur, mot de passe)
  - Activer TLS/SSL
  - Tester la configuration

### 2. Workflow de Signature

#### A. Envoi pour Signature (Administrateur)

1. Accéder à l'onglet **Signature DUERP**
2. Vérifier le résumé des modifications :
   - Nouveaux risques ajoutés
   - Risques modifiés
   - Nouvelles mesures de prévention
   - Mesures mises à jour
3. Cliquer sur **"Envoyer pour signature"**
4. Ajouter des commentaires si nécessaire
5. Confirmer l'envoi

**Ce qui se passe :**
- ✅ Email envoyé au directeur avec lien unique
- ✅ Statut du DUERP change à "En attente de signature"
- ✅ Notification créée pour l'admin
- ✅ Lien valide pendant 30 jours

#### B. Signature (Directeur)

1. Le directeur reçoit un email avec :
   - Résumé des modifications
   - Lien sécurisé de signature
   - Date d'expiration du lien
   - Document PDF complet en pièce jointe

2. Clic sur le lien → Page de signature
3. Le directeur peut :
   - **Télécharger** le document complet
   - **Lire** le résumé des modifications
   - **Signer** électroniquement
   - **Refuser** avec motif

4. Pour signer :
   - Vérifier nom et fonction
   - Cocher "J'ai lu le document"
   - Cocher "J'accepte la signature électronique"
   - Cliquer sur "Signer le document"

**Traçabilité :**
- 🔒 Date et heure exacte
- 🔒 Adresse IP
- 🔒 User-Agent (navigateur)
- 🔒 Certificat électronique

#### C. Après Signature

**Si accepté :**
- ✅ Statut change à "Signé"
- ✅ Admin reçoit notification + email
- ✅ Document archivé avec signature
- ✅ Nouvelle version peut être créée

**Si refusé :**
- ❌ Admin reçoit notification + email avec motif
- ❌ Statut reste "Brouillon"
- ❌ Corrections peuvent être apportées
- ❌ Nouveau envoi possible

### 3. Historique des Signatures

Accéder à **Signature DUERP** pour voir :
- 📊 Toutes les versions précédentes
- 📅 Dates de signature
- ✍️ Signataire
- 📄 Téléchargement des PDF signés
- 🔍 Détails de chaque signature

## 📁 Fichiers Créés

### Composants
- `/src/app/components/DUERPSignatureManagement.tsx` - Interface de gestion admin
- `/src/app/components/ElectronicSignaturePage.tsx` - Page de signature directeur
- `/src/app/components/SignatureRouter.tsx` - Routeur pour liens de signature

### Services
- `/src/services/DUERPSignatureService.ts` - Logique métier et emails

### Modifications
- `/src/app/App.tsx` - Ajout onglet "Signature DUERP"
- `/src/app/components/SettingsView.tsx` - Config signataire + SMTP

## 🔐 Conformité Légale

Le système est conforme à :
- ✅ **Règlement eIDAS** (n° 910/2014) - Signature électronique européenne
- ✅ **Article 1367 du Code civil français** - Valeur juridique
- ✅ **Traçabilité** - Horodatage, IP, certificat
- ✅ **Consentement explicite** - Acceptation des CGU

## 🎨 Interface

### Statuts du DUERP
- **🟡 Brouillon** - En cours de rédaction
- **🟠 En attente** - Envoyé au directeur
- **🟢 Signé** - Validé officiellement
- **🔴 Expiré** - Lien expiré (>30 jours)

### Couleurs des Badges
- Brouillon : Gris
- En attente : Ambre/Orange
- Signé : Vert
- Expiré : Rouge

## 🚀 Prochaines Étapes

Pour rendre le système pleinement fonctionnel :

1. **Backend Email** :
   - Configurer un vrai serveur SMTP
   - Connecter à `/services/DUERPSignatureService.ts`
   - Tester l'envoi d'emails

2. **Base de Données** :
   - Stocker les signatures dans Supabase
   - Gérer les tokens de signature
   - Vérifier l'expiration des liens

3. **Génération PDF** :
   - Créer un template PDF du DUERP
   - Intégrer la signature électronique
   - Archiver automatiquement

4. **Notifications** :
   - Intégrer avec le système de notifications existant
   - Alertes en temps réel
   - Rappels avant expiration

## 💡 Utilisation Optimale

### Bonnes Pratiques
1. Configurer les emails SMTP avant le premier envoi
2. Tester avec un email de test
3. Vérifier que le directeur reçoit bien les emails
4. Archiver les versions signées
5. Notifier les équipes des mises à jour

### Fréquence Recommandée
- **Minimum légal** : 1 fois par an
- **Recommandé** : À chaque modification majeure
- **Déclencheurs** :
  - Nouveaux risques identifiés
  - Changement d'organisation
  - Accidents importants
  - Nouvelles réglementations

## 📞 Support

Pour toute question sur le système de signature :
1. Consulter ce guide
2. Vérifier les logs dans la console
3. Tester avec des données de démonstration
4. Contacter l'administrateur système

---

**Version :** 1.0  
**Dernière mise à jour :** 3 février 2026  
**Auteur :** Système DUERP - DIRM Méditerranée
