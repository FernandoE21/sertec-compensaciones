-- Agrega el campo email a la tabla personal (Supabase / Postgres)
-- Ejecutar en el SQL editor de Supabase.

alter table public.personal
  add column if not exists email text;

-- (Opcional) Normaliza a minúsculas de forma manual si ya tienes datos:
-- update public.personal set email = lower(trim(email)) where email is not null;
