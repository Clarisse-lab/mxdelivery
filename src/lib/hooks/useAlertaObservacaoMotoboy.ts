"use client";

import { useEffect, useRef } from "react";
import { tocarBeep } from "@/lib/utils/beep";
import { notificar } from "@/lib/utils/notificacoes";
import type { Pedido } from "@/lib/types/database";

// Dispara bipe + notificação quando o motoboy registra uma observação
// ao finalizar uma entrega (ex.: trocou a forma de pagamento) — só avisa
// sobre observações que surgiram depois da primeira renderização, e uma
// única vez por pedido (compara o texto já visto, não só a presença).
export function useAlertaObservacaoMotoboy(pedidos: Pedido[]) {
  const vistasRef = useRef<Map<string, string> | null>(null);

  useEffect(() => {
    const atuais = new Map(pedidos.map((p) => [p.id, p.observacao_motoboy ?? ""]));

    if (vistasRef.current === null) {
      vistasRef.current = atuais;
      return;
    }

    for (const pedido of pedidos) {
      const observacao = pedido.observacao_motoboy?.trim();
      if (!observacao) continue;
      if (vistasRef.current.get(pedido.id) === observacao) continue;

      tocarBeep();
      notificar("Observação do motoboy", `#${pedido.numero} · ${observacao}`);
    }

    vistasRef.current = atuais;
  }, [pedidos]);
}
