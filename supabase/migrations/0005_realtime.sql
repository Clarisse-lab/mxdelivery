-- Habilita o Supabase Realtime (postgres_changes) na tabela pedidos, usada
-- pelo dashboard do atendente e pela lista de entregas do motoboy.
alter publication supabase_realtime add table pedidos;
