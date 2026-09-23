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
      {erro && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{erro}</p>
      )}
      <button
        onClick={pegar}
        disabled={pending}
        className="w-full rounded-xl bg-brand-gold py-3.5 text-base font-black text-brand-navy-dark shadow-[0_10px_24px_rgba(218,169,0,.18)] hover:bg-[#ffd84d] disabled:opacity-60"
      >
        {pending ? "Pegando..." : "Pegar entrega"}
      </button>
    </div>
  );
}
