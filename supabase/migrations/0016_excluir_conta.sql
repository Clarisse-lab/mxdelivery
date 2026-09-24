-- Até aqui, pedidos.criado_por e pedidos.motoboy_id apontavam pra
-- perfis(id) sem "on delete cascade" nem "set null" — de propósito,
-- pra nunca deixar apagar sem querer uma conta que já tem histórico.
-- Só que isso também bloqueia a exclusão de contas de teste (o
-- Supabase Auth recusa apagar o usuário com "Database error deleting
-- user" quando existe pedido referenciando o perfil).
--
-- Agora dá pra excluir a conta de verdade: os pedidos continuam no
-- histórico, só ficam sem essa vinculação (motoboy_id/criado_por
-- voltam a null).
alter table pedidos alter column criado_por drop not null;

alter table pedidos drop constraint pedidos_motoboy_id_fkey;
alter table pedidos add constraint pedidos_motoboy_id_fkey
  foreign key (motoboy_id) references perfis(id) on delete set null;

alter table pedidos drop constraint pedidos_criado_por_fkey;
alter table pedidos add constraint pedidos_criado_por_fkey
  foreign key (criado_por) references perfis(id) on delete set null;
