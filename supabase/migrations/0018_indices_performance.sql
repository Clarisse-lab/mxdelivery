-- O dashboard do atendente e o histórico do motoboy passam a filtrar
-- pedidos por data (criado_em/entregue_em) em vez de trazer o histórico
-- inteiro toda vez. Sem índice nessas colunas, o Postgres teria que
-- varrer a tabela inteira pra aplicar esse filtro — o que anula boa
-- parte do ganho conforme a tabela cresce.
create index if not exists idx_pedidos_criado_em on pedidos(criado_em desc);
create index if not exists idx_pedidos_entregue_em on pedidos(entregue_em desc);

-- Usado pela RLS de "atendente só edita o que criou" e pelas telas que
-- checam o dono do pedido — sem índice, cai em sequential scan também.
create index if not exists idx_pedidos_criado_por on pedidos(criado_por);
