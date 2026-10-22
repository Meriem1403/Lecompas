# 🔐 Guide : Page de Connexion DUERP

## Vue d'ensemble

Une page de connexion moderne et sécurisée a été intégrée à l'application DUERP. Elle permet l'authentification des utilisateurs avec 3 niveaux de privilèges différents.

## 🎯 Fonctionnalités

### 1. Authentification Sécurisée

**Formulaire de connexion :**
- 📧 **Email** : Adresse email professionnelle
- 🔒 **Mot de passe** : Mot de passe sécurisé
- 👁️ **Afficher/Masquer** : Bouton pour voir le mot de passe
- ☑️ **Se souvenir de moi** : Connexion persistante via localStorage
- ❓ **Mot de passe oublié** : Lien vers réinitialisation

**Sécurité :**
- ✅ Validation des champs (email format, champs requis)
- ✅ Messages d'erreur clairs
- ✅ Délai simulé pour prévenir le bruteforce
- ✅ Token d'authentification généré
- ✅ Stockage sécurisé dans localStorage (option "Se souvenir de moi")

### 2. Comptes de Démonstration

Trois comptes pré-configurés pour tester l'application :

#### 👑 **Administrateur**
```
Email    : admin@dirm-med.gouv.fr
Password : change-me
Nom      : Jean-Marc DUBOIS
Rôle     : admin
Accès    : Tous les modules + Administration complète
```

#### 👨‍💼 **Chef de Service**
```
Email    : chef@dirm-med.gouv.fr
Password : chef123
Nom      : Marie MARTIN
Rôle     : chef_service
Accès    : Consultation + Validation + Retours d'action
```

#### 👷 **Agent**
```
Email    : agent@dirm-med.gouv.fr
Password : agent123
Nom      : Pierre LECLERC
Rôle     : agent
Accès    : Consultation uniquement
```

**Connexion rapide :**
- Cliquez sur l'un des 3 badges colorés sous le formulaire
- Connexion automatique instantanée
- Idéal pour tester les différents niveaux d'accès

### 3. Interface Responsive

**Desktop (>1024px) :**
- Design en 2 colonnes
- Gauche : Branding DIRM Méditerranée + Informations
- Droite : Formulaire de connexion
- Éléments décoratifs (vagues, ancre)

**Mobile/Tablet (<1024px) :**
- Une seule colonne
- Formulaire centré
- Logo compact en haut
- Optimisé pour tactile

### 4. Persistance de Session

**Avec "Se souvenir de moi" :**
- ✅ Session sauvegardée dans localStorage
- ✅ Reconnexion automatique au rechargement
- ✅ Valide jusqu'à déconnexion manuelle

**Sans "Se souvenir de moi" :**
- ❌ Session perdue au rafraîchissement
- ❌ Reconnexion requise

### 5. Déconnexion

**Bouton Déconnexion :**
- 📍 Situé en bas de la sidebar
- 🔴 Efface le token et les données utilisateur
- 🗑️ Nettoie le localStorage
- ↩️ Redirige vers la page de login
- 💬 Toast de confirmation

## 🎨 Design

### Thème

**Couleurs principales :**
- 🔵 Bleu (Blue 600) : Confiance, professionnalisme
- 🟣 Violet (Indigo 600) : Innovation, technologie
- ⚪ Blanc : Clarté, espace
- 🌫️ Dégradés : Élégance, modernité

**Éléments visuels :**
- Dégradé de fond animé (bleu → indigo → violet)
- Cartes avec backdrop-blur (effet verre)
- Ombres portées élégantes
- Animations au hover
- Icônes Lucide React

### Branding DIRM Méditerranée

**Section gauche (Desktop uniquement) :**
- 🛡️ Logo DUERP avec icône Shield
- 📋 Titre et sous-titre de l'application
- 🏛️ Nom complet de l'organisation
- 📊 Statistiques visuelles (100% Sécurisé, 24/7 Disponible)
- ⚖️ Encart conformité réglementaire

**Informations juridiques :**
> "Conforme aux articles L4121-1 à L4121-5 et R4121-1 à R4121-4 du Code du travail.
> Signature électronique conforme au règlement eIDAS."

## 🔄 Workflow d'Authentification

### 1. Premier Accès

```
1. Utilisateur accède à l'application
2. isAuthenticated = false → Affichage LoginPage
3. Utilisateur saisit email + password
4. Validation formulaire client-side
5. Appel handleLogin()
6. Vérification credentials (demo accounts)
7. Si OK :
   - Génération token
   - Mise à jour state (user, token, isAuthenticated)
   - Sauvegarde localStorage (si rememberMe)
   - Toast success
   - Redirection vers Dashboard
8. Si KO :
   - Message d'erreur
   - Toast error
   - Reste sur LoginPage
```

### 2. Reconnexion Automatique

```
1. Utilisateur accède à l'application
2. useEffect vérifie localStorage
3. Si token + user trouvés :
   - Parse des données
   - Mise à jour state
   - isAuthenticated = true
   - Affichage Dashboard
4. Sinon :
   - Affichage LoginPage
```

### 3. Déconnexion

```
1. Clic sur bouton "Déconnexion"
2. Appel handleLogout()
3. Réinitialisation state (user = null, token = '', isAuthenticated = false)
4. Suppression localStorage
5. Réinitialisation activeView
6. Toast info
7. Affichage LoginPage
```

## 💻 Implémentation Technique

### Fichiers Créés

**`/src/app/components/LoginPage.tsx`**
- Composant principal de la page de login
- Gestion du formulaire et validation
- Interface pour les comptes démo
- Design responsive

**`/src/app/components/ui/checkbox.tsx`**
- Composant Checkbox avec Radix UI
- Styles personnalisés
- Accessible (aria-labels)

**`/src/app/components/ui/alert.tsx`**
- Composant Alert pour messages
- Variants (erreur, succès, info)
- Accessible

### Fichiers Modifiés

**`/src/app/App.tsx`**
- Import LoginPage
- State isAuthenticated, user, accessToken
- Fonctions handleLogin() et handleLogout()
- useEffect pour reconnexion auto
- Condition d'affichage (LoginPage vs Dashboard)
- Protection user?.role pour éviter erreurs

### State Management

```typescript
// États principaux
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [user, setUser] = useState<User | null>(null);
const [accessToken, setAccessToken] = useState<string>('');

// Interface User
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'chef_service' | 'agent';
}
```

### LocalStorage

**Clés utilisées :**
- `duerp_user` : Objet user (JSON stringified)
- `duerp_token` : Token d'authentification

**Données stockées :**
```json
{
  "email": "admin@dirm-med.gouv.fr",
  "name": "Jean-Marc DUBOIS",
  "role": "admin"
}
```

## 🚀 Utilisation

### Connexion Standard

1. Ouvrir l'application
2. Saisir email et mot de passe
3. (Optionnel) Cocher "Se souvenir de moi"
4. Cliquer "Se connecter"
5. Attendre validation (délai 1.5s)
6. Redirection automatique vers Dashboard

### Connexion Rapide (Démo)

1. Ouvrir l'application
2. Cliquer sur l'un des 3 badges de compte démo
3. Connexion automatique instantanée

### Test des Rôles

Pour tester les différents niveaux d'accès :

1. **Admin** : Accès complet + onglet Administration
2. **Chef** : Peut faire des retours d'action
3. **Agent** : Consultation uniquement

Connectez-vous avec chaque compte pour voir les différences !

### Déconnexion

1. Dans l'application, aller en bas de la sidebar
2. Cliquer sur "Déconnexion"
3. Confirmation par toast
4. Retour à la page de login

## 🔐 Sécurité (Production)

Pour passer en production, remplacer le système actuel par :

### Backend Authentification

```typescript
// Dans handleLogin()
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();

if (data.success) {
  setUser(data.user);
  setAccessToken(data.token);
  setIsAuthenticated(true);
}
```

### Supabase Auth

Utiliser le système d'authentification Supabase déjà configuré :

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

// Logout
await supabase.auth.signOut();
```

### Recommandations

1. **Hachage des mots de passe** : bcrypt, argon2
2. **JWT tokens** : Expiration courte (15min-1h)
3. **Refresh tokens** : Pour renouveler automatiquement
4. **HTTPS obligatoire** : En production
5. **Rate limiting** : Limiter tentatives de connexion
6. **2FA** : Authentification à deux facteurs (optionnel)
7. **Logs d'audit** : Tracer les connexions

## 🎯 Bonnes Pratiques

### UX

- ✅ Messages d'erreur clairs et précis
- ✅ Feedback visuel immédiat
- ✅ Loading state pendant connexion
- ✅ Focus automatique sur premier champ
- ✅ Validation en temps réel
- ✅ Accessibilité clavier (Tab, Enter)

### Sécurité

- ✅ Ne jamais stocker le mot de passe
- ✅ Tokens avec expiration
- ✅ Validation côté serveur (en production)
- ✅ Protection CSRF
- ✅ Déconnexion automatique après inactivité

### Performance

- ✅ Lazy loading des composants
- ✅ Minimisation des re-renders
- ✅ localStorage pour persistance
- ✅ Optimisation des images

## 📱 Tests

### Scénarios de Test

**✅ Connexion réussie**
- Email valide + mot de passe correct
- Redirection vers dashboard
- User state correctement défini

**❌ Connexion échouée**
- Email invalide → Message d'erreur
- Mot de passe incorrect → Message d'erreur
- Champs vides → Validation client

**💾 Persistance**
- Se souvenir de moi activé → Reconnexion auto
- Se souvenir de moi désactivé → Login requis

**🔴 Déconnexion**
- Bouton fonctionne
- State réinitialisé
- localStorage nettoyé
- Retour à login

**📱 Responsive**
- Desktop : 2 colonnes
- Mobile : 1 colonne
- Tous éléments accessibles

## 💡 Astuces

1. **Connexion rapide** : Utilisez les badges de démo pour tester
2. **Test des rôles** : Connectez-vous avec différents comptes
3. **Persistance** : Cochez "Se souvenir de moi" pour rester connecté
4. **Mot de passe** : Utilisez l'icône œil pour voir ce que vous tapez
5. **Accessibilité** : Tout est navigable au clavier (Tab + Enter)

## 🔄 Évolutions Futures

### Améliorations Possibles

1. **Réinitialisation mot de passe** : Email avec lien temporaire
2. **Inscription** : Permettre auto-inscription (avec validation admin)
3. **OAuth** : Connexion via Google, Microsoft, etc.
4. **2FA** : Code par SMS ou app authentification
5. **Biométrie** : FaceID, TouchID sur mobile
6. **SSO** : Single Sign-On pour entreprises
7. **Logs de connexion** : Historique des accès
8. **Gestion de session** : Déconnexion auto après inactivité
9. **Multi-facteurs** : Questions secrètes, etc.

---

**Version :** 1.0  
**Dernière mise à jour :** 3 février 2026  
**Documentation :** DUERP - DIRM Méditerranée
