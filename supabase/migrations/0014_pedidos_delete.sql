-- Permite excluir pedidos: admin qualquer um, atendente só os que ele
-- criou (mesma regra já usada pra update em 0010). Necessário pro
-- rollback quando a criação de um pedido falha no meio do processo
-- (ex.: erro ao gravar receitas/pagamentos) — sem isso a linha
-- "quebrada" ficava travada no banco e um retry duplicava o pedido.
create policy "pedidos_delete_admin"
  on pedidos for delete
  using (public.is_admin());

create policy "pedidos_delete_atendente_proprio"
  on pedidos for delete
  using (
    criado_por = auth.uid()
    and exists (select 1 from perfis where id = auth.uid() and papel = 'atendente' and ativo)
  );
