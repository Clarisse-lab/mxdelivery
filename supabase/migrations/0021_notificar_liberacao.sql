-- Quando o pg_cron libera um pedido agendado pra fila (migration 0020),
-- esse gatilho avisa o sistema pra mandar a notificação push de "novo
-- pedido" — sem isso, só quem estivesse com o painel aberto no momento
-- exato saberia que o pedido entrou na fila.
--
-- pg_net manda a chamada em segundo plano (não trava o UPDATE do
-- cron), chamando a rota /api/webhooks/pedido-liberado do próprio
-- sistema com um segredo compartilhado no cabeçalho.
create extension if not exists pg_net;

create or replace function public.notificar_pedido_liberado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pendente' and old.status = 'agendado' then
    perform net.http_post(
      url := 'https://SUBSTITUA-PELO-SEU-DOMINIO/api/webhooks/pedido-liberado',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', 'SUBSTITUA-PELO-MESMO-VALOR-DE-CRON_WEBHOOK_SECRET'
      ),
      body := jsonb_build_object('pedido_id', new.id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notificar_pedido_liberado on pedidos;
create trigger trg_notificar_pedido_liberado
  after update on pedidos
  for each row execute function public.notificar_pedido_liberado();
