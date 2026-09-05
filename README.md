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
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
   ⚠️ `SUPABASE_SERVICE_ROLE_KEY` ne doit **jamais** être préfixée par
   `NEXT_PUBLIC_` et ne doit jamais être exposée côté client.

5. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```
   Ouvrez [http://localhost:3000](http://localhost:3000) (espace public)
   et [http://localhost:3000/login](http://localhost:3000/login) (admin).

---

## 4. Déploiement sur Vercel (gratuit)

1. Poussez le projet sur un dépôt GitHub/GitLab.
2. Sur [vercel.com](https://vercel.com), **Add New → Project**, importez le dépôt.
3. Dans **Environment Variables**, ajoutez les 4 variables de `.env.example`
   (avec `NEXT_PUBLIC_SITE_URL` = l'URL Vercel finale, ex.
   `https://tuva.vercel.app` — utilisée pour générer les liens des QR codes).
4. Déployez. Aucune dépendance payante n'est requise (plan Hobby Vercel +
   plan Free Supabase suffisent pour plusieurs milliers d'attestations).
5. Une fois le premier déploiement effectué, si vous n'aviez pas encore
   la bonne URL, mettez à jour `NEXT_PUBLIC_SITE_URL` avec l'URL réelle
   et redéployez, pour que les QR codes pointent au bon endroit.

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
