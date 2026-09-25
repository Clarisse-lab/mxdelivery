-- Motoboy devolve um pedido que já pegou pra fila compartilhada (por
-- exemplo, quando quer passar a entrega pra outro entregador). Some as
-- mesmas colunas que pegar_pedido/iniciar_rota preenchem, deixando o
-- pedido como se nunca tivesse sido pego.
create or replace function public.devolver_pedido(p_pedido_id uuid)
returns pedidos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido pedidos;
begin
  update pedidos
  set motoboy_id = null,
      atribuido_em = null,
      iniciado_em = null,
      status = 'pendente'
  where id = p_pedido_id
    and motoboy_id = auth.uid()
    and status in ('pendente', 'em_rota')
  returning * into v_pedido;

  if v_pedido.id is null then
    raise exception 'pedido inválido para devolver à fila';
  end if;

  return v_pedido;
end;
$$;

grant execute on function public.devolver_pedido(uuid) to authenticated;
