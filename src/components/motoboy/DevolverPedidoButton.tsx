"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { devolverPedido } from "@/app/motoboy/entregas/[id]/actions";

export default function DevolverPedidoButton({ pedidoId }: { pedidoId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function devolver() {
    const confirmado = confirm(
      "Devolver este pedido pra fila? Ele deixa de ser seu e qualquer entregador vai poder pegar de novo.",
    );
    if (!confirmado) return;

    setErro(null);
    startTransition(async () => {
      try {
        await devolverPedido(pedidoId);
        router.push("/motoboy/entregas");
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível devolver este pedido.");
      }
    });
  }

  return (
    <div className="space-y-2">
      {erro && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{erro}</p>
      )}
      <button
        onClick={devolver}
        disabled={pending}
        className="w-full rounded-xl border border-red-100 bg-white py-3 text-sm font-extrabold text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? "Devolvendo..." : "Devolver pedido pra fila"}
      </button>
    </div>
  );
}
