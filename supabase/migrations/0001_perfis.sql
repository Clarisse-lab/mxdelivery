-- Perfis: estende auth.users com papel (atendente | motoboy) e status.

create table perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  papel text not null check (papel in ('atendente', 'motoboy')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Cria automaticamente o perfil ao criar um usuário no Supabase Auth,
-- lendo nome/telefone/papel dos metadados passados em auth.admin.createUser.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, telefone, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', ''),
    new.raw_user_meta_data ->> 'telefone',
    coalesce(new.raw_user_meta_data ->> 'papel', 'motoboy')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper usado nas políticas de RLS (security definer evita recursão de RLS
-- ao consultar a própria tabela perfis).
create or replace function public.is_atendente()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from perfis where id = auth.uid() and papel = 'atendente' and ativo
  );
$$;
