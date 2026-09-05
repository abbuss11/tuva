-- Ajoute la couleur d'accent aux projets Supabase déjà existants.
alter table public.trainings
  add column if not exists accent_color text not null default '#2557eb';

-- Force PostgREST à recharger les colonnes de la table.
notify pgrst, 'reload schema';