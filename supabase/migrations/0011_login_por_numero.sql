-- Login por número: o admin cadastra o número + nome + papel de cada
-- funcionário (um "convite" pendente); a pessoa usa esse número numa
-- tela pública pra criar a própria senha e ativar a conta — sem e-mail
-- envolvido em nada disso. O Supabase Auth continua exigindo um e-mail
-- por baixo dos panos, então sintetizamos um a partir do número
-- (ex.: "123@login.maxipopular.internal"), nunca exposto na interface.

alter table perfis add column numero_login text unique;

create table convites (
  numero text primary key,
  nome text not null,
  telefone text,
  papel text not null check (papel in ('atendente', 'motoboy')),
  usado boolean not null default false,
  criado_em timestamptz not null default now(),
  usado_em timestamptz
);

alter table convites enable row level security;

-- Só admin gerencia convites pela interface normal (RLS). A tela
-- pública de "primeiro acesso" não usa o cliente anon pra ler/gravar
-- aqui — passa por uma Server Action com a service role key, então não
-- precisa (nem deve) existir policy pública nessa tabela.
create policy "convites_admin"
  on convites for all
  using (public.is_admin())
  with check (public.is_admin());

-- handle_new_user passa a gravar também o numero_login, quando vier nos
-- metadados do usuário (fluxo de ativação por convite).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, telefone, papel, numero_login)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', ''),
    new.raw_user_meta_data ->> 'telefone',
    coalesce(new.raw_user_meta_data ->> 'papel', 'motoboy'),
    new.raw_user_meta_data ->> 'numero_login'
  );
  return new;
end;
$$;
