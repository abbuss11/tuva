# TUVA — Plateforme de gestion d'attestations de participation

TUVA permet aux participants d'une formation de **retrouver et télécharger
eux-mêmes** leur attestation de participation, sans créer de compte.
Un administrateur unique gère les formations, les participants et
consulte un tableau de bord.

- **Stack** : Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (Auth + PostgreSQL + Storage)
- **PDF** : génération à la volée avec `pdf-lib` + QR code de vérification
- **Hébergement** : gratuit sur Vercel (Hobby) + Supabase (Free tier)

---

## 1. Fonctionnalités

- **Espace public** (`/`) : recherche d'une attestation par nom complet + code (ex. `TUVA-7KX92A`), puis téléchargement du PDF.
- **Vérification d'authenticité** (`/verify/[code]`) : page publique pointée par le QR code de chaque attestation.
- **Espace admin** (`/admin`, protégé par Supabase Auth) :
  - Tableau de bord (nombre de formations, participants, attestations, téléchargements)
  - CRUD des formations (titre, description, organisateur, formateur, lieu, dates, logo, signature)
  - Ajout de participants un par un ou en masse via **import CSV**
  - Génération automatique du numéro d'attestation et du code de vérification à chaque participant ajouté
  - Recherche globale (participant / formation / numéro d'attestation)
  - Téléchargement du PDF depuis l'admin

---

## 2. Architecture du projet

```
tuva/
├── src/
│   ├── app/
│   │   ├── page.tsx                     # Espace public : recherche d'attestation
│   │   ├── verify/[certificateId]/      # Page publique de vérification (QR code)
│   │   ├── login/                       # Connexion admin
│   │   ├── admin/
│   │   │   ├── layout.tsx               # Layout protégé (sidebar + garde d'auth via middleware)
│   │   │   ├── page.tsx                 # Tableau de bord
│   │   │   ├── trainings/               # Liste, création, édition + gestion des participants
│   │   │   ├── search/                  # Recherche globale admin
│   │   │   └── import/                  # Import CSV autonome
│   │   └── api/
│   │       ├── auth/{login,logout}
│   │       ├── trainings/               # CRUD formations
│   │       ├── participants/            # CRUD participants + /import (CSV)
│   │       ├── certificates/[id]/pdf    # Génération + téléchargement du PDF
│   │       ├── certificates/generate    # Pré-génération et mise en cache du PDF (optionnel)
│   │       ├── search                   # Recherche publique (nom + code)
│   │       ├── verify/[code]            # Vérification publique
│   │       ├── stats                    # Statistiques du dashboard
│   │       └── upload                   # Upload logo/signature vers Supabase Storage
│   ├── components/
│   │   ├── ui/                          # Button, Card, Input, Textarea…
│   │   ├── admin/                       # Sidebar, StatCard, TrainingForm
│   │   └── LogoutButton.tsx
│   ├── lib/
│   │   ├── supabase/{client,server,middleware}.ts
│   │   ├── pdf/generateCertificate.ts   # Génération du PDF (pdf-lib + qrcode)
│   │   ├── auth.ts                      # Garde d'authentification pour les API routes
│   │   └── utils.ts                     # Génération des codes, formatage des dates…
│   ├── types/index.ts
│   └── middleware.ts                    # Rafraîchit la session + protège /admin/*
├── supabase/
│   └── schema.sql                       # Schéma complet à exécuter dans Supabase
└── .env.example
```

### Modèle de données

| Table          | Champs clés                                                                 |
|----------------|------------------------------------------------------------------------------|
| `trainings`    | title, description, organizer, trainer, trainer_signature_url, organizer_logo_url, location, start_date, end_date |
| `participants` | training_id, full_name, phone, email                                        |
| `certificates` | participant_id, certificate_number (`TUVA-XXXXXX`), verification_code, pdf_url, download_count |

Une vue `certificate_details` joint les 3 tables pour simplifier les
lectures (recherche publique, admin, vérification, génération PDF).

### Sécurité

- **Row Level Security** activée sur les 3 tables. Aucune policy n'est
  accordée aux rôles `anon`/`authenticated` : toutes les lectures/écritures
  passent par les API routes Next.js, qui utilisent la clé
  `service_role` (jamais exposée au navigateur).
- Le rôle admin est le seul rôle applicatif ; il se connecte via
  Supabase Auth (email + mot de passe).
- Les buckets Storage `assets` (logos/signatures) et `certificates`
  (PDF) sont publics **en lecture seule** ; l'écriture est réservée au
  `service_role`.

---

## 3. Installation locale

### Prérequis
- Node.js 20+
- Un projet Supabase gratuit (https://supabase.com)

### Étapes

1. **Cloner et installer les dépendances**
   ```bash
   npm install
   ```

2. **Créer le projet Supabase**
   - Allez sur [supabase.com](https://supabase.com) → New project (gratuit).
   - Dans **SQL Editor**, collez et exécutez le contenu de `supabase/schema.sql`.
     Cela crée les tables, la vue, les policies RLS, les buckets de stockage
     et la fonction de comptage des téléchargements.

3. **Créer le compte administrateur**
   - Dans **Authentication → Users → Add user**, créez un utilisateur
     avec un email et un mot de passe (c'est le seul rôle de l'application).

4. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env.local
   ```
   Remplissez avec les valeurs de **Project Settings → API** :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  NEXT_PUBLIC_SITE_URL=https://tuva-tau.vercel.app
   ```
   ⚠️ `SUPABASE_SERVICE_ROLE_KEY` ne doit **jamais** être préfixée par
   `NEXT_PUBLIC_` et ne doit jamais être exposée côté client.

5. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```
  Ouvrez [https://tuva-tau.vercel.app](https://tuva-tau.vercel.app) (espace public)
  et [https://tuva-tau.vercel.app/login](https://tuva-tau.vercel.app/login) (admin).

---

## 4. Guide de déploiement : GitHub, Supabase et Vercel

Le déploiement se fait dans cet ordre : **publier le code sur GitHub**,
**préparer la base Supabase**, puis **connecter le dépôt à Vercel**. Les plans
gratuits de GitHub, Vercel Hobby et Supabase Free suffisent pour démarrer.

### 4.1 Publier le projet sur GitHub

Depuis le dossier du projet :

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/VOTRE_COMPTE/VOTRE_DEPOT.git
git push -u origin main
```

Avant le premier `git add`, vérifiez que `.env.local` n'est pas suivi par Git.
Il ne faut jamais publier `SUPABASE_SERVICE_ROLE_KEY`, un mot de passe ou une
autre clé privée. Le dépôt doit contenir `.env.example`, mais pas les valeurs
réelles de production.

Si le dépôt existe déjà, utilisez simplement :

```bash
git add .
git commit -m "Prepare production deployment"
git push
```

### 4.2 Créer et configurer le projet Supabase

1. Ouvrez [supabase.com](https://supabase.com), connectez-vous, puis cliquez
  sur **New project**. Choisissez une organisation, un nom de projet, une
  région proche de vos utilisateurs et un mot de passe de base de données.
2. Dans **SQL Editor → New query**, collez tout le contenu de
  `supabase/schema.sql`, puis cliquez sur **Run**. Cette étape crée les
  tables, la vue `certificate_details`, les index, les règles RLS, les
  buckets Storage et la fonction de comptage des téléchargements.
3. Dans **Authentication → Users → Add user**, créez le compte administrateur
  utilisé sur `/login`. Désactivez la confirmation email uniquement si votre
  projet de production le justifie.
4. Dans **Project Settings → API**, copiez :
  - **Project URL** vers `NEXT_PUBLIC_SUPABASE_URL` ;
  - **Publishable/anon key** vers `NEXT_PUBLIC_SUPABASE_ANON_KEY` ;
  - **service_role key** vers `SUPABASE_SERVICE_ROLE_KEY`.

La clé `service_role` contourne les règles RLS : elle ne doit être ajoutée ni
dans GitHub, ni dans le navigateur, ni à une variable commençant par
`NEXT_PUBLIC_`. Les buckets `assets` et `certificates` sont créés par le
script SQL ; ne rendez pas leurs fichiers modifiables publiquement.

### 4.3 Importer le dépôt dans Vercel

1. Allez sur [vercel.com](https://vercel.com), connectez-vous avec GitHub,
  puis choisissez **Add New → Project → Import** sur le dépôt TUVA.
2. Conservez les réglages détectés par Vercel : framework **Next.js**, commande
  de build `next build`, et dossier racine du projet.
3. Dans **Environment Variables**, ajoutez ces quatre variables pour
  **Production**, **Preview** et **Development** :

  | Variable | Valeur |
  |----------|--------|
  | `NEXT_PUBLIC_SUPABASE_URL` | Project URL Supabase |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé Publishable/anon Supabase |
  | `SUPABASE_SERVICE_ROLE_KEY` | clé `service_role` Supabase |
  | `NEXT_PUBLIC_SITE_URL` | URL publique sans `/` final, par ex. `https://tuva.vercel.app` |

4. Cliquez sur **Deploy**. Vercel installera les dépendances et lancera le
  build automatiquement.
5. Une fois l'URL Vercel connue, corrigez `NEXT_PUBLIC_SITE_URL` si nécessaire
  et relancez **Redeploy**. Cette valeur est utilisée pour les liens de
  vérification intégrés aux QR codes des PDF.

### 4.4 Domaine personnalisé et mises à jour

Dans Vercel, ouvrez **Project → Settings → Domains**, ajoutez votre domaine
et suivez les enregistrements DNS affichés. Remplacez ensuite
`NEXT_PUBLIC_SITE_URL` par `https://votre-domaine.tld`, sans slash final, puis
redéployez.

Chaque `git push` sur `main` déclenche ensuite un déploiement de production.
Les autres branches créent des déploiements Preview : elles doivent avoir
leurs propres variables d'environnement si elles sont testées.

### 4.5 Vérification après déploiement

Effectuez ce contrôle dans l'ordre :

1. Ouvrez `/` et `/login` sur le domaine public.
2. Connectez-vous avec l'utilisateur créé dans Supabase et vérifiez `/admin`.
3. Créez une formation, téléversez un logo ou une signature, puis ajoutez un
  participant.
4. Téléchargez le PDF et scannez son QR code : le lien doit revenir vers le
  domaine public et `/verify/[code]` doit confirmer l'attestation.
5. Vérifiez dans **Supabase → Storage** que les fichiers sont présents et
  dans **Table Editor** que le compteur de téléchargements évolue.

En cas d'erreur `500`, contrôlez d'abord les quatre variables Vercel et
redéployez après toute modification. En cas d'erreur de connexion admin,
vérifiez que l'utilisateur existe dans **Authentication → Users** et que les
variables Supabase utilisées par le middleware sont bien présentes.

---

## 5. Utilisation

### Ajouter une formation et ses participants
1. Connectez-vous sur `/login`.
2. **Formations → Nouvelle formation** : renseignez les informations,
   uploadez le logo de l'organisateur et la signature du formateur (PNG/JPG).
3. Ouvrez la formation créée, puis **ajoutez les participants** un par un,
   ou importez un fichier CSV avec les colonnes `Nom complet`, `Téléphone`,
   `Email` (les deux derniers sont optionnels).
4. Chaque participant reçoit automatiquement un numéro d'attestation
   unique (`TUVA-XXXXXX`) et un code de vérification.

### Pour un participant
1. Aller sur le site TUVA.
2. Saisir son nom complet et son code d'attestation.
3. Télécharger son PDF.

### Vérifier l'authenticité
Scanner le QR code présent sur le PDF : il ouvre `/verify/[code]` qui
confirme (ou non) l'authenticité du document.

---

## 6. Modèle d'attestation (design)

Le PDF généré (`src/lib/pdf/generateCertificate.ts`) utilise un design
moderne : bandeau supérieur en biais, dégradé de couleur, sceau
« certifié » avec ruban, QR code encadré, typographie **Poppins**
(embarquée via `@pdf-lib/fontkit`, licence SIL Open Font License —
fichiers dans `src/lib/pdf/fonts/`).

**Personnalisation par formation** : chaque formation a un champ
`accent_color` (hexadécimal, ex. `#2557eb`). Il pilote automatiquement
la couleur du bandeau, du sceau, du QR code et des liserés du PDF —
modifiable depuis **Formations → Modifier → Personnalisation de
l'attestation** dans l'admin (6 couleurs prédéfinies + sélecteur
personnalisé). Cela permet à chaque organisateur/formation d'avoir une
identité visuelle propre sans toucher au code.

⚠️ Si votre projet Supabase existait déjà avant cette fonctionnalité,
ré-exécutez `supabase/schema.sql` dans le SQL Editor : il contient un
`alter table ... add column if not exists accent_color ...` qui met à
jour le schéma sans perte de données.

## 7. Interface premium

L'ensemble de l'interface a été rehaussé visuellement (design tokens
Tailwind, dégradés, animations légères) :
- **Pages publiques** (recherche, connexion, vérification) : héros sombre
  avec halo dégradé + grille discrète, titres en dégradé, cartes en
  "surimpression" avec ombre marquée, transitions d'apparition douces.
- **Espace admin** : cartes de statistiques avec icônes en dégradé,
  barre latérale avec indicateur d'onglet actif, cartes de formation
  avec liseré reprenant la couleur d'accent de chaque formation.
- Nouveaux tokens dans `tailwind.config.ts` : palette `ink` (bleu nuit),
  ombres `shadow-glow` / `shadow-elevated`, classes utilitaires
  `.glass-card`, `.bg-aurora`, `.text-gradient`, `.kicker` (définies
  dans `src/app/globals.css`).

Aucun changement de comportement : uniquement du style. Toutes les
fonctionnalités et routes restent identiques.

## 8. Notes techniques

- Les PDF sont **générés à la volée** à chaque téléchargement (pas de
  stockage obligatoire), ce qui garantit qu'un logo/une signature modifiés
  après coup sont immédiatement reflétés. La route
  `/api/certificates/generate` permet, si besoin, de pré-générer et
  mettre en cache une copie dans Supabase Storage.
- Recherche participants par nom optimisée via un index trigram
  (`pg_trgm`) sur `participants.full_name`.
- Le middleware Next.js rafraîchit la session Supabase à chaque requête
  et redirige automatiquement vers `/login` toute tentative d'accès à
  `/admin/*` sans session valide.

---

## 9. Limites connues du MVP

- Un seul rôle (administrateur) : pas de gestion multi-organisation ni
  de rôles intermédiaires.
- L'import CSV attend un encodage UTF-8 standard avec en-têtes
  `Nom complet / Téléphone / Email` (variantes de casse tolérées).
- Pas de renvoi d'attestation par email/SMS dans ce MVP (le participant
  récupère lui-même son PDF via le site).
