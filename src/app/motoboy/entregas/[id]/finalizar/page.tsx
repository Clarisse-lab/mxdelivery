import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ChecklistFinalizar from "@/components/motoboy/ChecklistFinalizar";
import type { Pedido, Pagamento } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function FinalizarEntregaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pedido } = await supabase.from("pedidos").select("*").eq("id", id).single();
  if (!pedido) notFound();

  const p = pedido as Pedido;

  if (p.motoboy_id !== user.id || p.status !== "em_rota") {
    redirect("/motoboy/entregas/" + p.id);
  }

  const { data: pagamentos } = await supabase
    .from("pagamentos")
    .select("*")
    .eq("pedido_id", id);

  return (
    <div className="space-y-5 pb-28">
      <Link
        href={"/motoboy/entregas/" + p.id}
        className="inline-flex items-center gap-2 text-sm font-extrabold text-brand-navy/55 hover:text-brand-navy"
      >
        <span aria-hidden="true">←</span>
        Pedido #{p.numero}
      </Link>

      <section className="relative overflow-hidden rounded-[26px] bg-brand-gold px-5 py-5 shadow-[0_16px_34px_rgba(218,169,0,.12)]">
        <div className="absolute -right-12 -top-16 h-36 w-36 rounded-full border-[22px] border-white/20" />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-red">
            Conclusão da rota
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.04em] text-brand-navy-dark">
            Finalizar entrega #{p.numero}
          </h1>
          <div className="mt-4 rounded-2xl bg-white/65 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-navy/45">
              Cliente
            </p>
            <p className="mt-1 text-base font-black text-brand-navy-dark">{p.cliente_nome}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-brand-navy/65">{p.endereco}</p>
          </div>
        </div>
      </section>

      <ChecklistFinalizar pedido={p} pagamentos={(pagamentos as Pagamento[]) ?? []} />
    </div>
  );
}
