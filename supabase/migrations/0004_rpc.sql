-- Regra de ouro (trava de finalização), aplicada no banco via trigger —
-- roda para QUALQUER update em pedidos (RPC de motoboy ou update direto do
-- atendente), então não dá pra "forçar" a entrega via API pulando o
-- checklist.
create or replace function public.checar_regra_finalizacao()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'entregue' and old.status is distinct from 'entregue' then
    if new.pagamento_confirmado is not true then
      raise exception 'não é possível finalizar: pagamento não confirmado';
    end if;
    if new.precisa_receita and new.receita_coletada is not true then
      raise exception 'não é possível finalizar: receita controlada não recolhida';
    end if;
    if new.troco_para is not null and new.troco_entregue is not true then
      raise exception 'não é possível finalizar: troco não entregue';
    end if;
  end if;

  if new.status = 'cancelado' and old.status = 'entregue' then
    raise exception 'não é possível cancelar um pedido já entregue';
  end if;

  return new;
end;
$$;

create trigger trg_checar_regra_finalizacao
  before update on pedidos
  for each row execute function public.checar_regra_finalizacao();

-- Motoboy "pega" um pedido da fila compartilhada. O update com
-- "where status = 'pendente' and motoboy_id is null" é atômico: se dois
-- motoboys clicarem ao mesmo tempo, o Postgres serializa as duas
-- transações e a segunda não encontra mais linha para atualizar.
create or replace function public.pegar_pedido(p_pedido_id uuid)
returns pedidos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_papel text;
  v_ativo boolean;
  v_pedido pedidos;
begin
  select papel, ativo into v_papel, v_ativo from perfis where id = auth.uid();

  if v_papel is distinct from 'motoboy' or v_ativo is not true then
    raise exception 'apenas motoboys ativos podem pegar pedidos da fila';
  end if;

  update pedidos
  set motoboy_id = auth.uid(),
      atribuido_em = now()
  where id = p_pedido_id
    and status = 'pendente'
    and motoboy_id is null
  returning * into v_pedido;

  if v_pedido.id is null then
    raise exception 'este pedido já foi pego por outro motoboy';
  end if;

  return v_pedido;
end;
$$;

-- Motoboy inicia a rota do pedido que já é dele.
create or replace function public.iniciar_rota(p_pedido_id uuid)
returns pedidos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido pedidos;
begin
  update pedidos
  set status = 'em_rota',
      iniciado_em = now()
  where id = p_pedido_id
    and motoboy_id = auth.uid()
    and status = 'pendente'
  returning * into v_pedido;

  if v_pedido.id is null then
    raise exception 'pedido inválido para iniciar rota';
  end if;

  return v_pedido;
end;
$$;

-- Motoboy finaliza a entrega. A trigger acima é o backstop; aqui a gente
-- só devolve uma mensagem de erro amigável antes de chegar nela.
create or replace function public.finalizar_entrega(
  p_pedido_id uuid,
  p_receita_coletada boolean,
  p_troco_entregue boolean,
  p_pagamento_confirmado boolean
)
returns pedidos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido pedidos;
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

  if v_pedido.troco_para is not null and p_troco_entregue is not true then
    raise exception 'confirme a entrega do troco';
  end if;

  update pedidos
  set status = 'entregue',
      entregue_em = now(),
      receita_coletada = p_receita_coletada,
      troco_entregue = p_troco_entregue,
      pagamento_confirmado = p_pagamento_confirmado
  where id = p_pedido_id
  returning * into v_pedido;

  return v_pedido;
end;
$$;

-- Motoboy marca que não conseguiu entregar.
create or replace function public.marcar_problema(p_pedido_id uuid, p_motivo text)
returns pedidos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido pedidos;
begin
  if p_motivo is null or length(trim(p_motivo)) = 0 then
    raise exception 'descreva o motivo do problema';
  end if;

  update pedidos
  set status = 'problema',
      motivo_problema = p_motivo
  where id = p_pedido_id
    and motoboy_id = auth.uid()
    and status in ('pendente', 'em_rota')
  returning * into v_pedido;

  if v_pedido.id is null then
    raise exception 'pedido inválido';
  end if;

  return v_pedido;
end;
$$;

grant execute on function public.pegar_pedido(uuid) to authenticated;
grant execute on function public.iniciar_rota(uuid) to authenticated;
grant execute on function public.finalizar_entrega(uuid, boolean, boolean, boolean) to authenticated;
grant execute on function public.marcar_problema(uuid, text) to authenticated;
