"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { iniciarRota } from "@/app/motoboy/entregas/[id]/actions";
import { linkGoogleMaps } from "@/lib/utils/maps";

export default function IniciarRotaButton({
  pedidoId,
  endereco,
  bairro,
}: {
  pedidoId: string;
  endereco: string;
  bairro: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function iniciar() {
    setErro(null);
    startTransition(async () => {
      try {
        await iniciarRota(pedidoId);
        window.open(linkGoogleMaps(endereco, bairro), "_blank");
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao iniciar rota.");
      }
    });
  }

  return (
    <div className="space-y-2">
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <button
        onClick={iniciar}
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 py-3 text-base font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Iniciando..." : "Iniciar rota"}
      </button>
    </div>
  );
}
