import { calcularResumo, formatarMinutos } from "@/lib/utils/resumo";
import type { Pedido } from "@/lib/types/database";

export default function ResumoDia({ pedidos, titulo }: { pedidos: Pedido[]; titulo: string }) {
  const resumo = calcularResumo(pedidos);

  return (
    <section className="premium-panel rounded-[24px] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold-dark">Hoje</p>
          <h2 className="mt-1 text-base font-extrabold tracking-[-0.025em] text-brand-navy-dark">{titulo}</h2>
        </div>
        <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 sm:inline-flex">
          ● Atualização em tempo real
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat valor={resumo.totalHoje} rotulo="Pedidos hoje" tom="navy" />
        <Stat valor={resumo.entreguesHoje} rotulo="Entregues" tom="green" />
        <Stat valor={resumo.emRota} rotulo="Em rota" tom="blue" />
        <Stat valor={resumo.pendentes} rotulo="Pendentes" tom="yellow" />
        <Stat valor={formatarMinutos(resumo.tempoMedioMinutos)} rotulo="Tempo médio" tom="neutral" />
        <Stat valor={resumo.motoboysAtivos} rotulo="Motoboys em rota" tom="neutral" />
        {resumo.problemas > 0 && (
          <Stat valor={resumo.problemas} rotulo="Com problema" tom="red" />
        )}
      </div>

      {resumo.bairrosMaisAtendidos.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="mb-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Bairros com mais entregas
          </p>
          <div className="flex flex-wrap gap-2">
            {resumo.bairrosMaisAtendidos.map((b) => (
              <span
                key={b.bairro}
                className="rounded-full border border-brand-navy/8 bg-brand-navy/[0.035] px-3 py-1.5 text-xs font-semibold text-brand-navy"
              >
                {b.bairro} <strong className="ml-1 text-brand-gold-dark">· {b.quantidade}</strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({
  valor,
  rotulo,
  tom,
}: {
  valor: string | number;
  rotulo: string;
  tom: "green" | "navy" | "blue" | "yellow" | "red" | "neutral";
}) {
  const styles = {
    green: "bg-emerald-50 text-emerald-800 border-emerald-100/80",
    navy: "bg-brand-navy text-white border-brand-navy",
    blue: "bg-blue-50 text-brand-blue border-blue-100",
    yellow: "bg-brand-gold-soft text-brand-navy-dark border-brand-gold/35",
    red: "bg-red-50 text-red-700 border-red-100",
    neutral: "bg-slate-50 text-slate-900 border-slate-100",
  }[tom];

  return (
    <div className={"rounded-2xl border px-4 py-4 " + styles}>
      <p className="text-2xl font-black tracking-[-0.045em]">{valor}</p>
      <p className={"mt-1 text-[11px] font-semibold " + (tom === "navy" ? "text-white/60" : "opacity-60")}>{rotulo}</p>
    </div>
  );
}
