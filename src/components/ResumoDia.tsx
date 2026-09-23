import { calcularResumo, formatarMinutos } from "@/lib/utils/resumo";
import type { Pedido } from "@/lib/types/database";

export default function ResumoDia({ pedidos, titulo }: { pedidos: Pedido[]; titulo: string }) {
  const resumo = calcularResumo(pedidos);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-brand-navy">{titulo}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat valor={resumo.totalHoje} rotulo="Pedidos hoje" />
        <Stat valor={resumo.entreguesHoje} rotulo="Entregues hoje" destaque="emerald" />
        <Stat valor={resumo.emRota} rotulo="Em rota agora" destaque="navy" />
        <Stat valor={resumo.pendentes} rotulo="Pendentes agora" destaque="gold" />
        <Stat valor={formatarMinutos(resumo.tempoMedioMinutos)} rotulo="Tempo médio de entrega" />
        <Stat valor={resumo.motoboysAtivos} rotulo="Motoboys em rota" />
        {resumo.problemas > 0 && (
          <Stat valor={resumo.problemas} rotulo="Com problema" destaque="red" />
        )}
      </div>

      {resumo.bairrosMaisAtendidos.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Bairros mais atendidos hoje
          </p>
          <div className="flex flex-wrap gap-1.5">
            {resumo.bairrosMaisAtendidos.map((b) => (
              <span
                key={b.bairro}
                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-900"
              >
                {b.bairro} · {b.quantidade}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  valor,
  rotulo,
  destaque,
}: {
  valor: string | number;
  rotulo: string;
  destaque?: "emerald" | "navy" | "gold" | "red";
}) {
  const cor =
    destaque === "emerald"
      ? "text-emerald-700"
      : destaque === "navy"
        ? "text-brand-navy"
        : destaque === "gold"
          ? "text-brand-gold-dark"
          : destaque === "red"
            ? "text-red-600"
            : "text-slate-900";

  return (
    <div>
      <p className={`text-2xl font-bold ${cor}`}>{valor}</p>
      <p className="text-xs text-slate-500">{rotulo}</p>
    </div>
  );
}
