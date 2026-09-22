"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reatribuirMotoboy, cancelarPedido } from "@/app/atendente/pedidos/[id]/actions";
import type { Perfil, StatusPedido } from "@/lib/types/database";

export default function PedidoDetalheAcoes({
  pedidoId,
  statusAtual,
  motoboyAtualId,
  motoboys,
}: {
  pedidoId: string;
  statusAtual: StatusPedido;
  motoboyAtualId: string | null;
  motoboys: Perfil[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selecionado, setSelecionado] = useState(motoboyAtualId ?? "");
  const [erro, setErro] = useState<string | null>(null);

  const podeReatribuir = ["pendente", "em_rota", "problema"].includes(statusAtual);
  const podeCancelar = statusAtual !== "entregue" && statusAtual !== "cancelado";

  function salvarMotoboy() {
    setErro(null);
    startTransition(async () => {
      try {
        await reatribuirMotoboy(pedidoId, selecionado || null);
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao atribuir motoboy.");
      }
    });
  }

  function cancelar() {
    if (!confirm("Cancelar este pedido?")) return;
    setErro(null);
    startTransition(async () => {
      try {
        await cancelarPedido(pedidoId);
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao cancelar pedido.");
      }
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-700">Motoboy</h2>

      {podeReatribuir ? (
        <div className="flex gap-2">
          <select
            value={selecionado}
            onChange={(e) => setSelecionado(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Fila (sem motoboy)</option>
            {motoboys.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
          <button
            onClick={salvarMotoboy}
            disabled={pending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Salvar
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Não é possível alterar o motoboy neste status.
        </p>
      )}

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {podeCancelar && (
        <button
          onClick={cancelar}
          disabled={pending}
          className="text-sm font-medium text-red-600 disabled:opacity-60"
        >
          Cancelar pedido
        </button>
      )}
    </div>
  );
}
