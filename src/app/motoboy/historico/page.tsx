import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ResumoDia from "@/components/ResumoDia";
import { STATUS_LABEL, STATUS_BADGE_CLASS, formatarMoeda } from "@/lib/utils/status";
import { formatarData } from "@/lib/utils/tempo";
import type { Pedido } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("*")
    .eq("motoboy_id", user.id)
    .in("status", ["entregue", "problema"])
    .order("criado_em", { ascending: false });

  const lista = (pedidos as Pedido[]) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-base font-bold text-brand-navy">Meu histórico</h1>

      <ResumoDia pedidos={lista} titulo="Meu resumo de hoje" />

      <div className="space-y-3">
        {lista.length === 0 && (
          <p className="text-sm text-slate-500">Nenhuma entrega no histórico ainda.</p>
        )}
        {lista.map((p) => (
          <Link
            key={p.id}
            href={`/motoboy/entregas/${p.id}`}
            className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-slate-900">#{p.numero}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[p.status]}`}
              >
                {STATUS_LABEL[p.status]}
              </span>
            </div>
            <p className="mt-1 text-base font-bold text-blue-900">{p.bairro}</p>
            <p className="text-sm text-slate-600">
              {p.cliente_nome} · {formatarMoeda(p.valor_total)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {p.status === "entregue" ? `Entregue em ${formatarData(p.entregue_em)}` : `Criado em ${formatarData(p.criado_em)}`}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
