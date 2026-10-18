-- A opção "já foi pago" (antes só existia pro Pix) passa a valer pra
-- qualquer forma de pagamento — dinheiro e cartão também podem ter sido
-- pagos adiantado (ex.: cliente paga na loja antes da entrega). Renomeia
-- a coluna pra refletir isso; o app passa a usá-la pras 3 formas.
alter table pagamentos rename column pix_pago to pago;
