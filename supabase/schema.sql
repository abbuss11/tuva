-- ============================================================
-- TUVA — Schéma Supabase (PostgreSQL)
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- Extension pour génération d'UUID
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. TABLE trainings (formations)
-- ------------------------------------------------------------
create table if not exists public.trainings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  organizer text not null,
  trainer text not null,
  trainer_signature_url text,
  organizer_logo_url text,
  location text,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. TABLE participants
-- ------------------------------------------------------------
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create extension if not exists pg_trgm;

create index if not exists idx_participants_training_id on public.participants(training_id);
create index if not exists idx_participants_full_name on public.participants using gin (full_name gin_trgm_ops);

-- ------------------------------------------------------------
-- 3. TABLE certificates (attestations)
-- ------------------------------------------------------------
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  certificate_number text not null unique, -- ex: TUVA-7KX92A
  verification_code text not null unique,  -- utilisé pour /verify/[code]
  pdf_url text,
  download_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_certificates_participant_id on public.certificates(participant_id);
create index if not exists idx_certificates_number on public.certificates(certificate_number);
create index if not exists idx_certificates_verification_code on public.certificates(verification_code);

-- ------------------------------------------------------------
-- 4. Trigger updated_at pour trainings
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_trainings_updated_at on public.trainings;
create trigger trg_trainings_updated_at
before update on public.trainings
for each row execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- 5. Vue pratique : détails complets d'une attestation
-- ------------------------------------------------------------
create or replace view public.certificate_details as
select
  c.id as certificate_id,
  c.certificate_number,
  c.verification_code,
  c.pdf_url,
  c.download_count,
  c.created_at as issued_at,
  p.id as participant_id,
  p.full_name,
  p.phone,
  p.email,
  t.id as training_id,
  t.title as training_title,
  t.description as training_description,
  t.organizer,
  t.trainer,
  t.trainer_signature_url,
  t.organizer_logo_url,
  t.location,
  t.start_date,
  t.end_date
from public.certificates c
join public.participants p on p.id = c.participant_id
join public.trainings t on t.id = p.training_id;

-- ------------------------------------------------------------
-- 6. Row Level Security
-- ------------------------------------------------------------
-- Les tables sont manipulées uniquement via le service_role côté
-- serveur (API Routes Next.js). Le rôle "anon" côté client n'a
-- aucun accès direct : toute lecture publique (recherche,
-- vérification) passe par les API routes qui utilisent la clé
-- service_role. Cela évite d'exposer des emails/téléphones.

alter table public.trainings enable row level security;
alter table public.participants enable row level security;
alter table public.certificates enable row level security;

-- Aucune policy pour "anon"/"authenticated" => accès bloqué par
-- défaut pour ces rôles ; seule la clé service_role (utilisée
-- uniquement côté serveur) contourne RLS.

-- ------------------------------------------------------------
-- 7. Storage buckets (logos, signatures, PDF générés)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', true)
on conflict (id) do nothing;

-- Lecture publique des fichiers (logos, signatures, PDFs) :
create policy if not exists "Public read assets"
on storage.objects for select
using (bucket_id = 'assets');

create policy if not exists "Public read certificates"
on storage.objects for select
using (bucket_id = 'certificates');

-- Écriture réservée au service_role (API routes serveur) :
-- aucune policy insert/update/delete pour anon/authenticated,
-- donc uniquement service_role (qui bypass RLS) peut écrire.

-- ------------------------------------------------------------
-- 8. Compteur de téléchargements (fonction atomique)
-- ------------------------------------------------------------
create or replace function public.increment_download_count(cert_id uuid)
returns void as $$
begin
  update public.certificates
  set download_count = download_count + 1
  where id = cert_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Fin du schéma. Créez ensuite un utilisateur administrateur via
-- Supabase Auth (Authentication > Users > Add user) avec un
-- email + mot de passe. Ce compte servira pour /login.
-- ============================================================
