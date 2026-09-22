-- Um pedido pode ser pago com mais de uma forma (ex.: R$30 no cartão +
-- R$40 em dinheiro). Isso deixa de caber nas colunas únicas de pedidos
-- e passa a ser uma tabela filha, no mesmo espírito de "receitas".

create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  forma_pagamento text not null check (forma_pagamento in ('dinheiro', 'cartao', 'pix')),
  valor numeric(10,2) not null check (valor > 0),

  cartao_tipo text check (cartao_tipo in ('credito', 'debito')),
  parcelas int check (parcelas > 0),

  troco_para numeric(10,2),

  pix_pago boolean,
  comprovante_pix_path text
);

create index idx_pagamentos_pedido on pagamentos(pedido_id);

alter table pagamentos enable row level security;

create policy "pagamentos_select_staff" on pagamentos for select using (public.is_staff());
create policy "pagamentos_insert_staff" on pagamentos for insert with check (public.is_staff());
create policy "pagamentos_update_staff" on pagamentos for update using (public.is_staff());
create policy "pagamentos_delete_staff" on pagamentos for delete using (public.is_staff());

-- Motoboy só lê pagamentos dos pedidos que ele já pode ver (o dele ou os
-- que ainda estão na fila) — mesma regra da tabela receitas.
create policy "pagamentos_select_motoboy"
  on pagamentos for select
  using (
    exists (
      select 1 from pedidos p
      where p.id = pagamentos.pedido_id
        and (p.motoboy_id = auth.uid() or (p.status = 'pendente' and p.motoboy_id is null))
    )
  );

alter publication supabase_realtime add table pagamentos;

-- As colunas antigas (uma forma de pagamento só) saem de pedidos.
alter table pedidos drop column forma_pagamento;
alter table pedidos drop column troco_para;
alter table pedidos drop column cartao_tipo;
alter table pedidos drop column parcelas;
alter table pedidos drop column pix_pago;
alter table pedidos drop column comprovante_pix_path;

-- Observação livre do motoboy na finalização (nota da entrega, além do
-- motivo_problema que já existe pra quando a entrega falha).
alter table pedidos add column observacao_motoboy text;

-- Regra de ouro atualizada: "precisa de troco" agora vem de existir uma
-- linha de pagamento em dinheiro com troco_para preenchido.
create or replace function public.checar_regra_finalizacao()
returns trigger
language plpgsql
as $$
declare
  v_precisa_troco boolean;
begin
  if new.status = 'entregue' and old.status is distinct from 'entregue' then
    if new.pagamento_confirmado is not true then
      raise exception 'não é possível finalizar: pagamento não confirmado';
    end if;

    if new.precisa_receita and new.receita_coletada is not true then
      raise exception 'não é possível finalizar: receita controlada não recolhida';
    end if;

    select exists (
      select 1 from pagamentos
      where pedido_id = new.id and forma_pagamento = 'dinheiro' and troco_para is not null
    ) into v_precisa_troco;

    if v_precisa_troco and new.troco_entregue is not true then
      raise exception 'não é possível finalizar: troco não entregue';
    end if;
  end if;

  if new.status = 'cancelado' and old.status = 'entregue' then
    raise exception 'não é possível cancelar um pedido já entregue';
  end if;

  return new;
end;
$$;

-- finalizar_entrega ganha o parâmetro opcional p_observacao e passa a
-- checar troco/pagamento contra a tabela pagamentos.
create or replace function public.finalizar_entrega(
  p_pedido_id uuid,
  p_receita_coletada boolean,
  p_troco_entregue boolean,
  p_pagamento_confirmado boolean,
  p_observacao text default null
)
returns pedidos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido pedidos;
  v_precisa_troco boolean;
begin
  select * into v_pedido from pedidos
  where id = p_pedido_id and motoboy_id = auth.uid() and status = 'em_rota';

  if v_pedido.id is null then
    raise exception 'pedido inválido para finalizar';
  end if;

  if p_pagamento_confirmado is not true then
    raise exception 'confirme o recebimento do pagamento';
  end if;

  if v_pedido.precisa_receita and p_receita_coletada is not true then
    raise exception 'confirme o recolhimento da receita controlada';
  end if;

  select exists (
    select 1 from pagamentos
    where pedido_id = p_pedido_id and forma_pagamento = 'dinheiro' and troco_para is not null
  ) into v_precisa_troco;

  if v_precisa_troco and p_troco_entregue is not true then
    raise exception 'confirme a entrega do troco';
  end if;

  update pedidos
  set status = 'entregue',
      entregue_em = now(),
      receita_coletada = p_receita_coletada,
      troco_entregue = p_troco_entregue,
      pagamento_confirmado = p_pagamento_confirmado,
      observacao_motoboy = p_observacao
  where id = p_pedido_id
  returning * into v_pedido;

  return v_pedido;
end;
$$;
