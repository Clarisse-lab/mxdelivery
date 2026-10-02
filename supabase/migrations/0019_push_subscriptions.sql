-- Guarda as inscrições de Web Push de cada atendente/motoboy — é o que
-- permite mandar notificação com som pro celular da pessoa mesmo com o
-- app fechado (diferente do alerta sonoro antigo, que só tocava com a
-- aba aberta). Cada navegador/aparelho em que a pessoa clicar em
-- "Ativar alertas" gera uma linha aqui.
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references perfis(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  criado_em timestamptz not null default now()
);

create index idx_push_subscriptions_perfil on push_subscriptions(perfil_id);

alter table push_subscriptions enable row level security;

-- Cada pessoa só grava/lê/apaga as próprias inscrições. O envio em si
-- roda no servidor com a service role key (ignora RLS), então não
-- precisa de uma policy "staff vê tudo" aqui.
create policy "push_subscriptions_self"
  on push_subscriptions for all
  using (perfil_id = auth.uid())
  with check (perfil_id = auth.uid());
