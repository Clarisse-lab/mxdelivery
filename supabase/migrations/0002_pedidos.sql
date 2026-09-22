-- Pedidos / entregas.
--
-- Modelo de atribuição: fila compartilhada. Um pedido nasce sem motoboy
-- (motoboy_id null, status 'pendente') e qualquer motoboy ativo pode
-- "pegar" (função pegar_pedido, migration 0004). O atendente também pode
-- atribuir ou reatribuir manualmente a qualquer momento (update direto,
-- liberado pela RLS de atendente).

create table pedidos (
  id uuid primary key default gen_random_uuid(),
  numero serial not null,

  cliente_nome text not null,
  endereco text not null,
  bairro text,
  referencia text,

  forma_pagamento text not null check (forma_pagamento in ('dinheiro', 'cartao', 'pix')),
  valor_total numeric(10,2) not null,
  troco_para numeric(10,2),

  precisa_receita boolean not null default false,
  qtd_receitas int,
  tipo_receita text,

  status text not null default 'pendente'
    check (status in ('pendente', 'em_rota', 'entregue', 'problema', 'cancelado')),

  motoboy_id uuid references perfis(id),
  criado_por uuid not null references perfis(id),

  receita_coletada boolean not null default false,
  troco_entregue boolean not null default false,
  pagamento_confirmado boolean not null default false,
  motivo_problema text,

  observacoes text,

  criado_em timestamptz not null default now(),
  atribuido_em timestamptz,
  iniciado_em timestamptz,
  entregue_em timestamptz
);

create index idx_pedidos_status on pedidos(status);
create index idx_pedidos_motoboy on pedidos(motoboy_id);
create index idx_pedidos_fila on pedidos(status) where motoboy_id is null;
