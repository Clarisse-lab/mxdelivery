-- Telefone do cliente, opcional, pra contato em caso de dúvida na
-- entrega (endereço errado, ninguém atende, etc.).
alter table pedidos add column cliente_telefone text;
