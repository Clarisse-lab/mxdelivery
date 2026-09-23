"use client";

import { useEffect, useRef } from "react";
import { useAgora } from "./useAgora";
import { estaAtrasado } from "@/lib/utils/atraso";
import { tocarBeep } from "@/lib/utils/beep";
import { notificar } from "@/lib/utils/notificacoes";
import type { Pedido } from "@/lib/types/database";

// Dispara bipe + notificação do navegador na primeira vez que cada
// pedido cruza o prazo de entrega — só avisa uma vez por pedido
// enquanto a aba estiver aberta.
export function useAlertaAtraso(pedidos: Pedido[]) {
  const agora = useAgora(30_000);
  const avisadosRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const pedido of pedidos) {
      if (!estaAtrasado(pedido, agora)) {
        avisadosRef.current.delete(pedido.id);
        continue;
      }
      if (avisadosRef.current.has(pedido.id)) continue;
      avisadosRef.current.add(pedido.id);

      tocarBeep();
      notificar(
        "Pedido atrasado",
        `#${pedido.numero} · ${pedido.bairro ?? "bairro não informado"} já passou do prazo de 2h`,
      );
    }
  }, [pedidos, agora]);
}
