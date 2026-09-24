-- CEP do endereço de entrega, opcional. Ajuda a preencher endereço e
-- bairro mais rápido (busca via ViaCEP no front) e deixa a rota que
-- vai pro Maps mais precisa.
alter table pedidos add column cep text;
