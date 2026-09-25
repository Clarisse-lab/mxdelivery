import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";
import EditarPedidoForm from "@/components/atendente/EditarPedidoForm";
import type { Pedido, Receita, Pagamento } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function EditarPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const perfilAtual = await getPerfilAtual();
  if (!perfilAtual) redirect("/login");

  const [{ data: pedido }, { data: receitas }, { data: pagamentos }] = await Promise.all([
    supabase.from("pedidos").select("*").eq("id", id).single(),
    supabase.from("receitas").select("*").eq("pedido_id", id),
    supabase.from("pagamentos").select("*").eq("pedido_id", id),
  ]);

  if (!pedido) notFound();

  const p = pedido as Pedido;
  const podeEditar = perfilAtual.papel === "admin" || p.criado_por === perfilAtual.id;

  if (!podeEditar) {
    redirect(`/atendente/pedidos/${p.id}`);
  }

  const receitasParaForm = ((receitas as Receita[]) ?? []).map((r) => ({
    tipo_receita: r.tipo_receita,
    quantidade: r.quantidade,
  }));

  const pagamentosParaForm = await Promise.all(
    ((pagamentos as Pagamento[]) ?? []).map(async (pg) => {
      let comprovanteUrl: string | null = null;
      if (pg.comprovante_pix_path) {
        const { data } = await supabase.storage
          .from("comprovantes-pix")
          .createSignedUrl(pg.comprovante_pix_path, 60);
        comprovanteUrl = data?.signedUrl ?? null;
      }
      return {
        id: pg.id,
        forma_pagamento: pg.forma_pagamento,
        valor: pg.valor,
        cartao_tipo: pg.cartao_tipo,
        parcelas: pg.parcelas,
        troco_para: pg.troco_para,
        pix_pago: pg.pix_pago,
        comprovante_pix_path: pg.comprovante_pix_path,
        comprovanteUrl,
      };
    }),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={`/atendente/pedidos/${p.id}`}
        className="inline-flex items-center gap-2 text-sm font-extrabold text-brand-navy/55 hover:text-brand-navy"
      >
        <span aria-hidden="true">←</span>
        Pedido #{p.numero}
      </Link>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-red">
          Editar pedido
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] text-brand-navy-dark">
          Pedido #{p.numero}
        </h1>
      </div>

      <EditarPedidoForm
        pedidoId={p.id}
        valoresIniciais={{
          cliente_nome: p.cliente_nome,
          cliente_telefone: p.cliente_telefone ?? "",
          cep: p.cep ?? "",
          endereco: p.endereco,
          bairro: p.bairro ?? "",
          referencia: p.referencia ?? "",
          observacoes: p.observacoes ?? "",
          valor_total: String(p.valor_total),
        }}
        receitasIniciais={receitasParaForm}
        pagamentosIniciais={pagamentosParaForm}
      />
    </div>
  );
}
