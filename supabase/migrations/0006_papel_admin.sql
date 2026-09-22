-- Adiciona o papel "admin": controle total do sistema, incluindo a
-- gestão de contas de atendente e motoboy. Atendente continua com o
-- mesmo acesso a pedidos/entregas de sempre, mas deixa de gerenciar
-- contas de outros usuários — isso passa a ser exclusivo do admin.

alter table perfis drop constraint perfis_papel_check;
alter table perfis add constraint perfis_papel_check
  check (papel in ('admin', 'atendente', 'motoboy'));

-- is_atendente() é substituída por duas funções mais específicas:
-- is_staff()  -> admin ou atendente (acesso a pedidos/entregas)
-- is_admin()  -> só admin (gestão de contas em "perfis")

create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from perfis
    where id = auth.uid() and papel in ('admin', 'atendente') and ativo
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from perfis where id = auth.uid() and papel = 'admin' and ativo
  );
$$;

-- perfis: atendente continua LENDO a lista toda (precisa disso pra
-- escolher/mostrar motoboy num pedido), mas só admin pode escrever
-- (criar/desativar contas de atendente e motoboy).
drop policy "perfis_select_atendente" on perfis;
drop policy "perfis_update_atendente" on perfis;

create policy "perfis_select_staff"
  on perfis for select
  using (public.is_staff());

create policy "perfis_update_admin"
  on perfis for update
  using (public.is_admin());

-- pedidos: admin e atendente têm o mesmo acesso de sempre, agora via
-- is_staff() em vez de is_atendente().
drop policy "pedidos_select_atendente" on pedidos;
drop policy "pedidos_insert_atendente" on pedidos;
drop policy "pedidos_update_atendente" on pedidos;

create policy "pedidos_select_staff"
  on pedidos for select
  using (public.is_staff());

create policy "pedidos_insert_staff"
  on pedidos for insert
  with check (public.is_staff());

create policy "pedidos_update_staff"
  on pedidos for update
  using (public.is_staff());

drop function if exists public.is_atendente();
