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
    redirect(`/motoboy/entregas/${p.id}`);
  }

  const { data: pagamentos } = await supabase
    .from("pagamentos")
    .select("*")
    .eq("pedido_id", id);

  return (
    <div className="space-y-4 pb-24">
      <Link href={`/motoboy/entregas/${p.id}`} className="text-sm font-medium text-slate-500">
        ← Pedido #{p.numero}
      </Link>

      <h1 className="text-xl font-semibold text-slate-900">Finalizar entrega #{p.numero}</h1>
      <p className="text-sm text-slate-600">{p.cliente_nome} — {p.endereco}</p>

      <ChecklistFinalizar pedido={p} pagamentos={(pagamentos as Pagamento[]) ?? []} />
    </div>
  );
}
