-- Atendente continua vendo TODOS os pedidos (dashboard, detalhe de
-- pedido de outro atendente), mas só pode editar (reatribuir motoboy,
-- cancelar) os pedidos que ele mesmo criou. Admin continua com edição
-- irrestrita, igual antes.

drop policy "pedidos_update_staff" on pedidos;

create policy "pedidos_update_admin"
  on pedidos for update
  using (public.is_admin());

create policy "pedidos_update_atendente_proprio"
  on pedidos for update
  using (
    criado_por = auth.uid()
    and exists (select 1 from perfis where id = auth.uid() and papel = 'atendente' and ativo)
  );
