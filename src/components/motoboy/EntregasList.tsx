"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { usePedidosRealtime } from "@/lib/hooks/usePedidosRealtime";
import { pegarPedido } from "@/app/motoboy/entregas/actions";
import type { Pedido } from "@/lib/types/database";
import EntregaCard from "./EntregaCard";

export default function EntregasList({
  pedidosIniciais,
  motoboyId,
}: {
  pedidosIniciais: Pedido[];
  motoboyId: string;
}) {
  const pedidos = usePedidosRealtime(pedidosIniciais);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const minhas = pedidos
    .filter((p) => p.motoboy_id === motoboyId)
    .sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === "em_rota" ? -1 : 1;
    });

  const fila = pedidos
    .filter((p) => p.motoboy_id === null)
    .sort((a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime());

  function pegar(pedidoId: string) {
    setErro(null);
    startTransition(async () => {
      try {
        await pegarPedido(pedidoId);
        router.push(`/motoboy/entregas/${pedidoId}`);
      } catch (e) {
        setErro(
          e instanceof Error
            ? e.message
            : "Não foi possível pegar este pedido.",
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-base font-bold text-brand-navy">Minhas entregas</h1>
        {minhas.length === 0 && (
          <p className="text-sm text-slate-500">Você não tem entregas no momento.</p>
        )}
        <div className="space-y-3">
          {minhas.map((pedido) => (
            <EntregaCard key={pedido.id} pedido={pedido} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-brand-navy">
          Fila disponível{fila.length > 0 && ` (${fila.length})`}
        </h2>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {fila.length === 0 && (
          <p className="text-sm text-slate-500">Nenhum pedido esperando na fila.</p>
        )}
        <div className="space-y-3">
          {fila.map((pedido) => (
            <EntregaCard
              key={pedido.id}
              pedido={pedido}
              acao={
                <button
                  onClick={() => pegar(pedido.id)}
                  disabled={pending}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Pegar entrega
                </button>
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
