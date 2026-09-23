"use client";

import { usePedidosRealtime } from "@/lib/hooks/usePedidosRealtime";
import KanbanBoard from "./KanbanBoard";
import ResumoDia from "@/components/ResumoDia";
import type { Papel, Pedido, Perfil } from "@/lib/types/database";

export default function DashboardClient({
  pedidosIniciais,
  motoboys,
  perfilId,
  papel,
}: {
  pedidosIniciais: Pedido[];
  motoboys: Perfil[];
  perfilId: string;
  papel: Papel;
}) {
  const pedidos = usePedidosRealtime(pedidosIniciais);
  const pedidosDoResumo = papel === "admin" ? pedidos : pedidos.filter((p) => p.criado_por === perfilId);

  return (
    <div className="space-y-6">
      <ResumoDia
        pedidos={pedidosDoResumo}
        titulo={papel === "admin" ? "Resumo da farmácia hoje" : "Meu resumo de hoje"}
      />
      <KanbanBoard pedidos={pedidos} motoboys={motoboys} />
    </div>
  );
}
