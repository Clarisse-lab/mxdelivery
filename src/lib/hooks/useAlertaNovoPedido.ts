"use client";

import { useEffect, useRef } from "react";
import { tocarBeep } from "@/lib/utils/beep";
import { notificar } from "@/lib/utils/notificacoes";
import type { Pedido } from "@/lib/types/database";

// Dispara bipe + notificação quando um pedido novo aparece na lista
// (ex.: fila de entregas disponíveis) — ignora os que já estavam lá
// na primeira renderização, só avisa sobre os que chegaram depois.
export function useAlertaNovoPedido(pedidos: Pedido[]) {
  const idsAnterioresRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const idsAtuais = new Set(pedidos.map((p) => p.id));

    if (idsAnterioresRef.current === null) {
      idsAnterioresRef.current = idsAtuais;
      return;
    }

    const novos = pedidos.filter((p) => !idsAnterioresRef.current!.has(p.id));
    if (novos.length > 0) {
      tocarBeep();
      for (const pedido of novos) {
        notificar("Novo pedido na fila", `#${pedido.numero} · ${pedido.bairro ?? "bairro não informado"}`);
      }
    }

    idsAnterioresRef.current = idsAtuais;
  }, [pedidos]);
}
