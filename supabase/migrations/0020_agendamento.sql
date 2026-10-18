-- Agendar entrega: o pedido nasce com status 'agendado' (em vez de
-- 'pendente') e só entra na fila compartilhada sozinho quando chegar a
-- hora marcada em agendado_para. Enquanto está 'agendado', a RLS de
-- motoboy já não deixa ele aparecer na fila (ela exige status =
-- 'pendente'), então não precisa de nenhuma regra nova pra escondê-lo.
alter table pedidos add column agendado_para timestamptz;

alter table pedidos drop constraint if exists pedidos_status_check;
alter table pedidos add constraint pedidos_status_check
  check (status in ('agendado', 'pendente', 'em_rota', 'entregue', 'problema', 'cancelado'));

-- pg_cron roda como o dono do banco (ignora RLS) — a cada minuto, libera
-- pra fila qualquer pedido agendado cuja hora já chegou.
create extension if not exists pg_cron;

select cron.schedule(
  'liberar_pedidos_agendados',
  '* * * * *',
  $$
    update public.pedidos
    set status = 'pendente'
    where status = 'agendado' and agendado_para <= now()
  $$
);
