# Tester l’envoi automatique d’e-mails (Mél / Courrielleur)

Ce guide sert à **vérifier par vous-mêmes** si un envoi SMTP depuis votre environnement (PC, NAS, backend Docker) **fonctionne**, avant de brancher les notifications automatiques de Lecompas.

**Objectif** : un mail de test arrive dans une boîte **Mél** (`@mer.gouv.fr` ou adresse ministère) et s’affiche dans le **Courrielleur** comme un message reçu normal.

Lecompas n’a **pas besoin** du Courrielleur installé pour envoyer : il suffit d’atteindre le **relais SMTP** du ministère (même infrastructure que la messagerie sortante).

---

## État actuel dans Lecompas

| Élément | Comportement |
|--------|----------------|
| **Paramètres → SMTP** (interface admin) | Saisie expéditeur, hôte, port, utilisateur ; bouton « Envoyer un email de test » |
| **Envoi réel aujourd’hui** | **Non** : le test UI affiche un succès simulé (`console.log` + toast). Aucun mail n’est parti tant que le **backend** n’envoie pas via SMTP. |
| **Notifications métier** (`emailNotificationService`) | Même chose : logique et modèles HTML prêts, **pas d’appel SMTP réel** côté serveur pour l’instant. |

Donc : **pour tester si « ça marche » chez vous**, il faut un test **SMTP direct** (outils ci-dessous). Une fois validé, on configure les mêmes paramètres sur le **backend** (variables d’environnement Docker).

---

## Ce qu’il faut préparer (checklist)

Notez ces valeurs (sur votre poste agent, elles sont souvent déjà dans le Courrielleur : *Paramètres du compte → Serveur sortant (SMTP)*, ou documentation interne Mél).

| Paramètre | Exemple / remarque |
|-----------|-------------------|
| **Hôte SMTP** | Souvent du type `smtp…gouv.fr` ou relais régional — **à copier depuis votre client Mél**, pas deviner. |
| **Port** | Fréquent : **587** (STARTTLS) ou **465** (SSL). |
| **Sécurité** | TLS / STARTTLS en général obligatoire. |
| **Utilisateur** | Adresse Mél complète ou compte de service. |
| **Mot de passe** | Mot de passe Mél ou mot de passe applicatif si fourni. |
| **Expéditeur (`From`)** | Doit être une adresse **autorisée** par le relais (souvent la même que l’utilisateur SMTP). |
| **Destinataire de test** | Votre propre `@mer.gouv.fr` (ou collègue volontaire). |

**Réseau** : le test doit être lancé depuis un endroit **autorisé à parler au relais** (poste sur le réseau ministère, VPN, ou serveur NAS si le relais accepte son IP).

---

## Étape 1 — Vérifier la connectivité

Depuis la machine qui enverra (PC ou NAS) :

```bash
# Remplacez HOTE et PORT (ex. 587)
nc -zv HOTE_SMTP 587
```

- **Succès** : `succeeded` / connexion ouverte → le port est joignable.
- **Échec** : timeout ou « Connection refused » → firewall, mauvais hôte/port, ou relais réservé au réseau interne (retester depuis le VPN / réseau bureau).

Sur le NAS (conteneur backend) :

```bash
docker exec -it lecompas-backend sh -c "nc -zv HOTE_SMTP 587"
```

(Si `nc` absent dans l’image Alpine, tester depuis l’hôte NAS avec la même commande.)

---

## Étape 2 — Envoi de test avec `swaks` (recommandé)

[Swaks](https://www.jetmore.org/john/code/swaks/) envoie un vrai mail SMTP et affiche la **réponse du serveur** (indispensable pour diagnostiquer).

Installation (ex. macOS) : `brew install swaks`

```bash
export SMTP_HOST="votre.relais.gouv.fr"
export SMTP_PORT="587"
export SMTP_USER="votre.email@mer.gouv.fr"
export SMTP_PASS="********"
export MAIL_FROM="votre.email@mer.gouv.fr"
export MAIL_TO="votre.email@mer.gouv.fr"

swaks \
  --server "$SMTP_HOST" \
  --port "$SMTP_PORT" \
  --tls \
  --auth LOGIN \
  --auth-user "$SMTP_USER" \
  --auth-password "$SMTP_PASS" \
  --from "$MAIL_FROM" \
  --to "$MAIL_TO" \
  --header "Subject: [Lecompas] Test SMTP $(date +%Y-%m-%d_%H-%M)" \
  --body "Message de test Lecompas. Si vous le lisez dans Mél/Courrielleur, le relais fonctionne depuis cette machine."
```

**Interprétation**

| Résultat swaks / serveur | Signification |
|--------------------------|---------------|
| `250 OK` / fin de transaction OK | **Envoi accepté** par le relais → vérifiez la boîte Mél (et courrier indésirable). |
| `535 Authentication failed` | Mauvais identifiant/mot de passe ou auth non autorisée depuis cette IP. |
| `550 Relay denied` / `553` | Expéditeur ou IP **non autorisés** à relayer (compte ou réseau). |
| `454 TLS not available` | Retester avec/sans `--tls`, ou port **465** + `--tls-on-connect`. |
| Timeout | Réseau ou relais inaccessible depuis cette machine. |

**Critère « ça marche »** : mail reçu dans Mél (Courrielleur), sujet `[Lecompas] Test SMTP …`, sans message d’erreur (NDR) dans les minutes qui suivent.

---

## Étape 3 — Retrouver les paramètres dans le Courrielleur Mél

Sans demander à la DSI, vous pouvez **aligner** le test sur ce que Mél utilise déjà :

1. Ouvrir **Courrielleur Mél** (Thunderbird ministère).
2. **Paramètres / Paramètres du compte** → compte Mél → **Paramètres serveur sortant (SMTP)**.
3. Noter : **nom du serveur**, **port**, **Sécurité de la connexion**, **authentification**.
4. Reprendre **exactement** ces valeurs dans la commande `swaks` (étape 2).

Si l’envoi swaks réussit avec ces paramètres depuis **votre PC**, le relais est utilisable ; il reste à vérifier la **même chose depuis le NAS** (étape 1 + swaks sur le serveur ou conteneur).

---

## Étape 4 — Test depuis le NAS (prod Lecompas)

Quand Lecompas tourne en Docker sur le NAS, c’est **le backend** qui enverra les mails.

1. Vérifier `nc -zv` depuis l’hôte NAS (ou conteneur) vers le relais.
2. Si possible, installer `swaks` sur l’hôte NAS et relancer la commande de l’étape 2 **depuis le NAS** (même identifiants).
3. Si swaks OK depuis le NAS → vous pourrez utiliser les **mêmes variables** dans `docker-compose` / `.env` backend (voir section suivante).

Si swaks OK depuis le PC mais **KO depuis le NAS** : le relais filtre probablement par **adresse IP** → il faudra alors un relais autorisé pour le serveur (information réseau, pas forcément un « projet DSI » lourd).

---

## Étape 5 — Brancher Lecompas (après test SMTP réussi)

Quand l’étape 2 (ou 4) est OK, la configuration cible pour l’API (à implémenter / déployer) ressemble à :

```env
SMTP_HOST=votre.relais.gouv.fr
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre.email@mer.gouv.fr
SMTP_PASS=********
SMTP_FROM="Lecompas DIRM-MED <lecompas-notif@mer.gouv.fr>"
APP_PUBLIC_URL=https://intranet-votre-domaine/...
```

- **Ne pas** laisser le mot de passe SMTP dans le navigateur (paramètres UI) en production : **uniquement** côté serveur / secrets Docker.
- Les notifications (risque, accident, Cerbère, signature DUERP, etc.) appelleront alors cette config pour envoyer **automatiquement** vers les `@mer.gouv.fr` des utilisateurs concernés.

---

## Erreurs fréquentes (dépannage rapide)

| Symptôme | Piste |
|----------|--------|
| Test UI Lecompas « succès » mais aucun mail | Normal tant que l’envoi backend n’est pas codé : utiliser **swaks**. |
| Mail dans **Indésirables** | Marquer comme légitime ; vérifier `From` cohérent avec le domaine autorisé. |
| Délai 5–15 min | Parfois normal sur relais gouvernemental ; pas forcément un échec. |
| « Relay access denied » | Changer `From` pour une adresse autorisée ou tester depuis le bon réseau. |
| Auth OK, pas de réception | Vérifier `To`, quotas boîte, message de **non-remise** (NDR) dans Mél. |

---

## Récapitulatif : ordre des actions

1. Lire les paramètres SMTP sortants dans **Courrielleur Mél** (ou doc Mél interne).
2. **`nc -zv`** vers le relais (PC puis NAS).
3. **`swaks`** avec un mail vers **vous-même**.
4. Confirmer réception dans **Mél / Courrielleur**.
5. Reproduire depuis le **NAS** si Lecompas est hébergé là.
6. Enregistrer les paramètres dans les **secrets backend** et activer l’envoi automatique dans l’application (développement à venir si pas encore mergé).

---

## Liens utiles dans le dépôt

- [DEPLOIEMENT-INTRANET.md](./DEPLOIEMENT-INTRANET.md) — déploiement NAS / Docker  
- [SIGNATURE_DUERP_GUIDE.md](../SIGNATURE_DUERP_GUIDE.md) — mentions SMTP signature DUERP  
- Paramètres UI : module **Administration → Paramètres** (section configuration e-mail)

---

<p align="center"><sub>DIRM Méditerranée — test d’envoi Mél, indépendant du Courrielleur côté application.</sub></p>
