# 📊 Guide : Gestion Administrative des Risques

## Vue d'ensemble

L'onglet **"Gestion des Risques"** dans la section Administration permet de gérer tous les risques professionnels sous forme de tableau, avec des fonctionnalités CRUD complètes (Create, Read, Update, Delete).

## 🎯 Différences avec la "Carte des Risques"

| Fonctionnalité | Carte des Risques | Gestion des Risques (Admin) |
|----------------|-------------------|------------------------------|
| **Format** | Cartes visuelles | Tableau structuré |
| **Vue globale** | Vue d'ensemble avec graphiques | Liste détaillée avec filtres |
| **Utilisation** | Consultation et analyse | Gestion administrative |
| **Édition** | Modification simplifiée | Formulaire complet |
| **Public** | Tous les utilisateurs | Administrateurs |
| **Données** | ✅ **MÊMES DONNÉES** | ✅ **MÊMES DONNÉES** |

## 🔗 Liaison des Données

**IMPORTANT :** Les deux vues sont **synchronisées** et utilisent exactement les mêmes données (`risks` state dans App.tsx). 

- Créer un risque dans "Gestion des Risques" → Il apparaît dans "Carte des Risques"
- Modifier un risque dans "Carte des Risques" → Il est mis à jour dans "Gestion des Risques"
- Supprimer un risque → Il disparaît des deux vues

## 📁 Accès

**Navigation :** 
```
Sidebar > Administration > Gestion des Risques
```

**Position dans le menu :**
- ✅ Premier élément de la section Administration
- 🔴 Icône rouge (Database)
- 🔢 Affiche le nombre total de risques

## 🎨 Interface

### Vue Liste (Tableau)

Le tableau affiche toutes les colonnes importantes :

| Colonne | Description | Type |
|---------|-------------|------|
| **N° Risque** | Identifiant unique (ex: RISK-2026-001) | Texte |
| **Risque** | Titre + situation dangereuse | Texte |
| **Service** | Service concerné | Texte |
| **Site** | Localisation | Texte |
| **Gravité** | Échelle 1-4 | Badge violet |
| **Fréquence** | Échelle 1-4 | Badge cyan |
| **Priorité** | Calcul automatique (Gravité × Fréquence) | Badge coloré |
| **Statut** | Identifié / En cours / Traité | Badge |
| **Actions** | Voir / Modifier / Supprimer | Boutons |

### Couleurs de Priorité

- 🟢 **Vert** (1-3) : Priorité faible
- 🟡 **Jaune** (4-7) : Priorité moyenne
- 🟠 **Orange** (8-15) : Priorité élevée
- 🔴 **Rouge** (16+) : Priorité critique

### Filtres Disponibles

1. **Recherche textuelle** : Recherche dans numéro, titre, service, situation
2. **Filtre par statut** : Tous / Identifié / En cours / Traité

## ⚙️ Fonctionnalités CRUD

### 1. Créer un Risque ➕

**Bouton :** "Nouveau risque" (en haut à droite)

**Champs obligatoires (*) :**

#### Informations générales
- Numéro de risque * (auto-généré : R-001, R-002...)
- Catégorie * (Chimique, Physique, Biologique, Psychosocial, Ergonomique, Mécanique)
- Service * (Production, Maintenance, etc.)
- Site * (Siège, Site Lyon, etc.)
- Unité (Atelier, Bureau...)
- Responsable * (Nom du responsable)

#### Description
- Risque * (Ex: "Risque de chute de hauteur")
- Situation dangereuse * (Description détaillée)
- Dommage associé * (Conséquences potentielles)

#### Évaluation
- **Gravité (1-4) *** :
  - 1 = Faible
  - 2 = Moyenne
  - 3 = Grave
  - 4 = Très grave
  
- **Fréquence (1-4) *** :
  - 1 = Rare
  - 2 = Occasionnel
  - 3 = Fréquent
  - 4 = Permanent

- Calcul priorité (manuel)
- Priorité finale (ajustée)

#### Mesures
- Moyen de maîtrise (Mesures existantes)

#### Suivi
- Statut * (Identifié / En cours / Traité)
- Échéance (Date)
- Retour d'action
- Observations

**Calcul automatique :**
```
Priorité initiale = Gravité × Fréquence
```

### 2. Consulter un Risque 👁️

**Action :** Cliquer sur l'icône œil dans la colonne Actions

**Affichage :**
- ✅ Toutes les informations du risque
- ✅ Réparties en sections (Général, Description, Évaluation, Mesures, Suivi)
- ✅ Badges de statut et priorité
- ✅ Historique des mesures planifiées
- ✅ Bouton "Modifier" direct

### 3. Modifier un Risque ✏️

**Actions possibles :**
1. Cliquer sur l'icône crayon dans le tableau
2. Ou cliquer sur "Modifier" dans la vue détail

**Modifications :**
- ✅ Tous les champs sont modifiables
- ✅ Les valeurs actuelles sont pré-remplies
- ✅ Validation en temps réel
- ✅ Recalcul automatique de la priorité

**Enregistrement :**
- Toast de confirmation
- Retour automatique à la liste
- Données mises à jour instantanément dans "Carte des Risques"

### 4. Supprimer un Risque 🗑️

**Action :** Cliquer sur l'icône poubelle

**Sécurité :**
- ⚠️ Dialog de confirmation obligatoire
- ⚠️ Message d'avertissement : "Cette action est irréversible"
- ✅ Annulation possible

**Effet :**
- Suppression immédiate de la base de données
- Disparition de "Carte des Risques" également
- Toast de confirmation

## 📊 Cas d'Usage

### 1. Import Initial de Risques

Lorsque vous avez de nombreux risques à créer :

1. Accéder à **Gestion des Risques**
2. Créer chaque risque via le formulaire
3. Vérifier la liste en tableau
4. Consulter la visualisation dans "Carte des Risques"

### 2. Revue Annuelle

Pour mettre à jour tous les risques :

1. Ouvrir **Gestion des Risques**
2. Filtrer par statut ou rechercher
3. Modifier les risques un par un
4. Vérifier les priorités recalculées

### 3. Audit et Contrôle

Pour vérifier la conformité :

1. Vue tableau pour voir tous les champs
2. Tri par priorité ou statut
3. Export possible (fonctionnalité future)
4. Recherche rapide par service/site

### 4. Nettoyage de Base

Pour supprimer des risques obsolètes :

1. Identifier les risques traités depuis longtemps
2. Vérifier les détails
3. Supprimer si nécessaire
4. Archivage automatique (selon paramètres)

## 🔄 Workflow Recommandé

### Création d'un nouveau risque

```
1. Identification terrain → Création dans "Gestion des Risques"
2. Remplir tous les champs obligatoires
3. Évaluer Gravité et Fréquence
4. Définir mesures existantes
5. Planifier actions (dans "Plan d'Actions")
6. Consulter dans "Carte des Risques"
```

### Mise à jour d'un risque existant

```
1. Nouvel incident → Accéder au risque via recherche
2. Modifier le statut et observations
3. Ajuster priorité si nécessaire
4. Mettre à jour mesures
5. Vérifier le tableau de bord
```

## 🎨 Avantages de la Vue Tableau

### vs. Carte des Risques

✅ **Vue d'ensemble complète** : Tous les risques sur un écran
✅ **Tri et filtrage avancés** : Recherche multicritères
✅ **Édition rapide** : Formulaires structurés
✅ **Comparaison facile** : Colonnes alignées
✅ **Export futur** : Prêt pour export Excel/PDF

### Complémentarité

- **Carte des Risques** = Analyse visuelle et prise de décision
- **Gestion des Risques** = Administration et maintenance des données

## 🚀 Fonctionnalités Futures

Possibilités d'évolution :

1. **Export Excel/CSV** : Exporter la liste complète
2. **Import massif** : Importer depuis un fichier
3. **Tri par colonne** : Cliquer sur en-têtes de colonnes
4. **Filtres avancés** : Multi-sélection services/sites
5. **Actions en masse** : Modifier plusieurs risques
6. **Historique des modifications** : Traçabilité complète
7. **Modèles de risques** : Dupliquer des risques similaires
8. **Validation par chef de service** : Workflow d'approbation

## 📝 Bonnes Pratiques

### Numérotation

Utilisez un système cohérent :
- ✅ `RISK-2026-001` : Année + numéro séquentiel
- ✅ `R-PROD-001` : Service + numéro
- ✅ `CHI-001` : Catégorie + numéro

### Descriptions

Soyez précis et détaillé :
- ❌ "Risque chimique"
- ✅ "Risque d'exposition aux vapeurs de solvant lors du nettoyage des pièces"

### Évaluation

Utilisez une méthode cohérente pour toute l'organisation :
- Référez-vous au guide d'évaluation interne
- Consultez le CHSCT si disponible
- Documentez la méthodologie

### Suivi

Maintenez les informations à jour :
- ✅ Mettre à jour le statut régulièrement
- ✅ Documenter les retours d'action
- ✅ Archiver les risques traités définitivement

## 🔐 Permissions

**Accès requis :** Rôle Administrateur

Les agents et chefs de service peuvent :
- ✅ Consulter dans "Carte des Risques"
- ❌ Pas d'accès à "Gestion des Risques" (admin only)

Pour donner accès, modifier le rôle dans **Administration > Utilisateurs**.

## 💡 Astuces

1. **Recherche rapide** : Tapez quelques lettres du numéro ou service
2. **Vue détail** : Double-clic sur une ligne (future fonctionnalité)
3. **Navigation** : Utilisez "Retour" pour revenir rapidement
4. **Synchronisation** : Les modifications sont instantanées partout
5. **Sauvegarde** : Les données sont sauvegardées automatiquement

---

**Version :** 1.0  
**Dernière mise à jour :** 3 février 2026  
**Documentation :** DUERP - DIRM Méditerranée
