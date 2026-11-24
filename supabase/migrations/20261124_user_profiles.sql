-- Tabela de perfis e verificação documental (CNH Digital + Reconhecimento Facial)
create table if not exists public.user_profiles (
  user_id text primary key,
  full_name text not null,
  email text not null,
  whatsapp text default '',
  cpf text default '',
  rg text default '',
  cnh_number text default '',
  birth_date text default '',
  cnh_file_name text,
  cnh_image_data_url text,
  selfie_image_data_url text,
  face_verified boolean not null default false,
  face_match_score integer,
  updated_at timestamptz not null default now()
);
