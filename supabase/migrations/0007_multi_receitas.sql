-- Um pedido pode ter mais de uma receita, cada uma com seu próprio tipo
-- (ex.: 1 controle especial branca + 1 azul no mesmo pedido). Isso deixa
-- de caber numa coluna só (qtd_receitas/tipo_receita) e passa a ser uma
-- tabela filha de pedidos.

create table receitas (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  tipo_receita text not null check (tipo_receita in (
    'comum', 'controle_especial_branca', 'controle_especial_azul', 'antimicrobiano'
  )),
  quantidade int not null default 1 check (quantidade > 0)
);

create index idx_receitas_pedido on receitas(pedido_id);

alter table pedidos drop column qtd_receitas;
alter table pedidos drop column tipo_receita;

alter table receitas enable row level security;

create policy "receitas_select_staff"
  on receitas for select
  using (public.is_staff());

create policy "receitas_insert_staff"
  on receitas for insert
  with check (public.is_staff());

create policy "receitas_update_staff"
  on receitas for update
  using (public.is_staff());

create policy "receitas_delete_staff"
  on receitas for delete
  using (public.is_staff());

-- Motoboy só lê as receitas dos pedidos que ele já pode ver (o dele ou
-- os que ainda estão na fila) — mesma regra da tabela pedidos.
create policy "receitas_select_motoboy"
  on receitas for select
  using (
    exists (
      select 1 from pedidos p
      where p.id = receitas.pedido_id
        and (p.motoboy_id = auth.uid() or (p.status = 'pendente' and p.motoboy_id is null))
    )
  );

alter publication supabase_realtime add table receitas;
