"use client";

import Link from "next/link";
import { usePedidosRealtime } from "@/lib/hooks/usePedidosRealtime";
import KanbanBoard from "./KanbanBoard";
import ResumoDia from "@/components/ResumoDia";
import AlertaNotificacoes from "@/components/AlertaNotificacoes";
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
      <AlertaNotificacoes mensagem="Ative alertas sonoros pra saber na hora quando um pedido passar de 2h sem ser entregue." />

      <section className="relative overflow-hidden rounded-[28px] bg-brand-gold px-5 py-6 shadow-[0_18px_42px_rgba(205,160,0,.12)] sm:px-7 lg:flex lg:items-end lg:justify-between lg:px-8 lg:py-7">
        <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border-[42px] border-white/20" />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-brand-red">Central operacional</p>
          <h1 className="mt-2 text-2xl font-black tracking-[-0.045em] text-brand-navy-dark sm:text-3xl">
            Visão geral das entregas
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-navy/65">
            Acompanhe pedidos em tempo real, identifique gargalos e mantenha a operação fluindo.
          </p>
        </div>
        <Link
          href="/atendente/pedidos/novo"
          className="relative z-10 mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-navy px-4 py-3 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(11,49,95,.2)] hover:-translate-y-0.5 hover:bg-brand-navy-dark lg:mt-0"
        >
          <span className="text-lg leading-none">+</span>
          Novo pedido
        </Link>
      </section>

      <ResumoDia
        pedidos={pedidosDoResumo}
        titulo={papel === "admin" ? "Resumo da farmácia hoje" : "Meu resumo de hoje"}
      />

      <KanbanBoard pedidos={pedidos} motoboys={motoboys} />
    </div>
  );
}
