-- Troca a opção "Antimicrobiano" por "Controle especial (amarela)" na
-- lista de tipos de receita.
update receitas set tipo_receita = 'comum' where tipo_receita = 'antimicrobiano';

alter table receitas drop constraint receitas_tipo_receita_check;

alter table receitas add constraint receitas_tipo_receita_check check (tipo_receita in (
  'comum', 'controle_especial_branca', 'controle_especial_azul', 'controle_especial_amarela'
));
