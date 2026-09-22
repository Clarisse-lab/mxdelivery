"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { pegarPedido } from "@/app/motoboy/entregas/actions";

export default function PegarEntregaButton({ pedidoId }: { pedidoId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function pegar() {
    setErro(null);
    startTransition(async () => {
      try {
        await pegarPedido(pedidoId);
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível pegar este pedido.");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <button
        onClick={pegar}
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 py-3 text-base font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Pegando..." : "Pegar entrega"}
      </button>
    </div>
  );
}
