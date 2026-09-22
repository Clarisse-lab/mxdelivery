"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Pedido } from "@/lib/types/database";

// Mantém uma lista de pedidos sincronizada com o Postgres via Supabase
// Realtime. As políticas de RLS já filtram quais linhas cada usuário
// recebe (atendente vê tudo, motoboy só a fila + as dele).
export function usePedidosRealtime(pedidosIniciais: Pedido[]) {
  const [pedidosBaseAnterior, setPedidosBaseAnterior] = useState(pedidosIniciais);
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciais);

  // Padrão recomendado pelo React para ajustar estado quando uma prop
  // muda (ex.: router.refresh() trazendo uma nova lista do servidor),
  // sem disparar setState dentro de um efeito.
  if (pedidosIniciais !== pedidosBaseAnterior) {
    setPedidosBaseAnterior(pedidosIniciais);
    setPedidos(pedidosIniciais);
  }

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("pedidos-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pedidos" },
        (payload) => {
          setPedidos((atual) => {
            if (payload.eventType === "DELETE") {
              const antigo = payload.old as Pedido;
              return atual.filter((p) => p.id !== antigo.id);
            }

            const novo = payload.new as Pedido;

            if (payload.eventType === "INSERT") {
              if (atual.some((p) => p.id === novo.id)) return atual;
              return [novo, ...atual];
            }

            // UPDATE: se a linha não é mais visível para este usuário
            // (ex.: outro motoboy pegou o pedido da fila), o Realtime já
            // não entrega o evento — então aqui é seguro sempre fazer
            // merge/adicionar.
            const existe = atual.some((p) => p.id === novo.id);
            if (existe) {
              return atual.map((p) => (p.id === novo.id ? novo : p));
            }
            return [novo, ...atual];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return pedidos;
}
