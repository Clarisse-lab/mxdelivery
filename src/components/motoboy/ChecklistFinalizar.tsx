"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  finalizarEntrega,
  marcarProblema,
} from "@/app/motoboy/entregas/[id]/finalizar/actions";
import type { Pedido } from "@/lib/types/database";

export default function ChecklistFinalizar({ pedido }: { pedido: Pedido }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const [receitaColetada, setReceitaColetada] = useState(false);
  const [trocoEntregue, setTrocoEntregue] = useState(false);
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);

  const [mostrarProblema, setMostrarProblema] = useState(false);
  const [motivo, setMotivo] = useState("");

  const precisaReceita = pedido.precisa_receita;
  const precisaTroco = pedido.troco_para !== null;

  const podeFinalizar =
    (!precisaReceita || receitaColetada) &&
    (!precisaTroco || trocoEntregue) &&
    pagamentoConfirmado;

  function finalizar() {
    setErro(null);
    startTransition(async () => {
      try {
        await finalizarEntrega(pedido.id, {
          receitaColetada,
          trocoEntregue,
          pagamentoConfirmado,
        });
        router.push("/motoboy/entregas");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao finalizar entrega.");
      }
    });
  }

  function enviarProblema() {
    if (!motivo.trim()) {
      setErro("Descreva o motivo do problema.");
      return;
    }
    setErro(null);
    startTransition(async () => {
      try {
        await marcarProblema(pedido.id, motivo.trim());
        router.push("/motoboy/entregas");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao registrar problema.");
      }
    });
  }

  if (mostrarProblema) {
    return (
      <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <label htmlFor="motivo" className="text-sm font-semibold text-red-800">
          Por que não conseguiu entregar?
        </label>
        <textarea
          id="motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-red-300 px-3 py-2 text-base outline-none focus:border-red-500"
        />
        {erro && <p className="text-sm text-red-700">{erro}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => setMostrarProblema(false)}
            disabled={pending}
            className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700"
          >
            Voltar
          </button>
          <button
            onClick={enviarProblema}
            disabled={pending}
            className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Confirmar problema
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        {precisaReceita && (
          <ChecklistCheckbox
            label="Recolhi a receita"
            checked={receitaColetada}
            onChange={setReceitaColetada}
          />
        )}
        {precisaTroco && (
          <ChecklistCheckbox
            label="Entreguei o troco"
            checked={trocoEntregue}
            onChange={setTrocoEntregue}
          />
        )}
        <ChecklistCheckbox
          label="Recebi o pagamento"
          checked={pagamentoConfirmado}
          onChange={setPagamentoConfirmado}
        />
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <button
        onClick={finalizar}
        disabled={!podeFinalizar || pending}
        className="w-full rounded-lg bg-emerald-600 py-3 text-base font-semibold text-white disabled:opacity-40"
      >
        {pending ? "Finalizando..." : "Finalizar entrega"}
      </button>

      <button
        onClick={() => setMostrarProblema(true)}
        disabled={pending}
        className="w-full rounded-lg border border-red-300 py-2.5 text-sm font-medium text-red-700"
      >
        Não consegui entregar
      </button>
    </div>
  );
}

function ChecklistCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 py-1 text-base text-slate-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-6 w-6 accent-emerald-600"
      />
      {label}
    </label>
  );
}
