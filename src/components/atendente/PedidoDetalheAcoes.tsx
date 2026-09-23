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
    <section className="premium-panel rounded-[26px] p-5 sm:p-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold-dark">
          Gestão
        </p>
        <h2 className="mt-1 text-lg font-black tracking-[-0.025em] text-brand-navy-dark">
          Responsável pela entrega
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Reatribua o pedido para outro motoboy ou devolva-o para a fila.
        </p>
      </div>

      {podeReatribuir ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label
              htmlFor="motoboy"
              className="mb-2 block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400"
            >
              Motoboy
            </label>
            <select
              id="motoboy"
              value={selecionado}
              onChange={(e) => setSelecionado(e.target.value)}
              className="premium-input w-full rounded-xl px-4 py-3.5 text-[15px] font-semibold text-brand-navy-dark"
            >
              <option value="">Fila (sem motoboy)</option>
              {motoboys.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={salvarMotoboy}
            disabled={pending}
            className="self-end rounded-xl bg-brand-navy px-5 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(11,49,95,.16)] hover:bg-brand-navy-dark disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Salvar responsável"}
          </button>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
          Não é possível alterar o motoboy neste status.
        </p>
      )}

      {erro && (
        <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {erro}
        </p>
      )}

      {podeCancelar && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <button
            onClick={cancelar}
            disabled={pending}
            className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-extrabold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Cancelar pedido
          </button>
        </div>
      )}
    </section>
  );
}
