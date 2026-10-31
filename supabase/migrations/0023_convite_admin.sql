-- A tela "Admins" (nova) convida gente com papel 'admin', mas a
-- restrição da tabela convites só liberava 'atendente'/'motoboy' —
-- nunca precisou de admin até agora, já que o primeiro admin vem do
-- bootstrap manual (ver README).
alter table convites drop constraint convites_papel_check;
alter table convites add constraint convites_papel_check
  check (papel in ('atendente', 'motoboy', 'admin'));
