-- Cartão: crédito ou débito, e se vai ser parcelado.
alter table pedidos add column cartao_tipo text check (cartao_tipo in ('credito', 'debito'));
alter table pedidos add column parcelas int check (parcelas > 0);

-- Pix: se já foi pago, e o comprovante (guardado no Storage).
alter table pedidos add column pix_pago boolean;
alter table pedidos add column comprovante_pix_path text;

-- Bucket privado pros comprovantes de Pix — só admin/atendente acessam.
insert into storage.buckets (id, name, public)
values ('comprovantes-pix', 'comprovantes-pix', false)
on conflict (id) do nothing;

create policy "comprovantes_pix_staff"
  on storage.objects
  for all
  using (bucket_id = 'comprovantes-pix' and public.is_staff())
  with check (bucket_id = 'comprovantes-pix' and public.is_staff());
