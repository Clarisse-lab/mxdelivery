-- Row Level Security.
--
-- perfis: cada usuário lê o próprio perfil; atendente lê/atualiza todos.
-- pedidos: atendente tem acesso total; motoboy só vê a fila (pendente sem
-- motoboy) e as entregas que são dele. Motoboy nunca recebe policy de
-- insert/update direto na tabela pedidos — toda escrita dele passa pelas
-- funções RPC "security definer" da migration 0004, que já validam as
-- regras de negócio (e por serem security definer, ignoram RLS internamente,
-- então a validação de propriedade da linha é feita dentro da própria função).

alter table perfis enable row level security;
alter table pedidos enable row level security;

-- perfis
create policy "perfis_select_self"
  on perfis for select
  using (id = auth.uid());

create policy "perfis_select_atendente"
  on perfis for select
  using (public.is_atendente());

create policy "perfis_update_atendente"
  on perfis for update
  using (public.is_atendente());

-- pedidos — atendente
create policy "pedidos_select_atendente"
  on pedidos for select
  using (public.is_atendente());

create policy "pedidos_insert_atendente"
  on pedidos for insert
  with check (public.is_atendente());

create policy "pedidos_update_atendente"
  on pedidos for update
  using (public.is_atendente());

-- pedidos — motoboy (somente leitura via RLS; escrita via RPC)
create policy "pedidos_select_motoboy"
  on pedidos for select
  using (
    motoboy_id = auth.uid()
    or (status = 'pendente' and motoboy_id is null)
  );
