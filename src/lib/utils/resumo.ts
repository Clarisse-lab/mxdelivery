import type { Pedido, Perfil } from "@/lib/types/database";

export function ehHoje(dataIso: string | null): boolean {
  if (!dataIso) return false;
  return new Date(dataIso).toDateString() === new Date().toDateString();
}

export interface ResumoDia {
  totalHoje: number;
  valorVendidoHoje: number;
  entreguesHoje: number;
  pendentes: number;
  emRota: number;
  problemas: number;
  tempoMedioMinutos: number | null;
  bairrosMaisAtendidos: { bairro: string; quantidade: number }[];
  motoboysAtivos: number;
}

// Calcula os números do "resumo do dia" a partir de uma lista de pedidos
// já filtrada pelo chamador (ex.: só os pedidos de um atendente, ou só
// os de um motoboy, ou todos — pro admin). Tudo derivado dos timestamps
// que já existem em pedidos, sem precisar de tabela nova.
export function calcularResumo(pedidos: Pedido[]): ResumoDia {
  const criadosHoje = pedidos.filter((p) => ehHoje(p.criado_em));
  const vendidosHoje = criadosHoje.filter((p) => p.status !== "cancelado");
  const entreguesHoje = pedidos.filter((p) => p.status === "entregue" && ehHoje(p.entregue_em));

  const tempos = entreguesHoje
    .filter((p): p is Pedido & { iniciado_em: string; entregue_em: string } =>
      Boolean(p.iniciado_em && p.entregue_em),
    )
    .map((p) => (new Date(p.entregue_em).getTime() - new Date(p.iniciado_em).getTime()) / 60000);

  const tempoMedioMinutos =
    tempos.length > 0 ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : null;

  const contagemBairros = new Map<string, number>();
  for (const p of entreguesHoje) {
    if (!p.bairro) continue;
    contagemBairros.set(p.bairro, (contagemBairros.get(p.bairro) ?? 0) + 1);
  }
  const bairrosMaisAtendidos = [...contagemBairros.entries()]
    .map(([bairro, quantidade]) => ({ bairro, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5);

  const motoboysAtivos = new Set(
    pedidos.filter((p) => p.status === "em_rota" && p.motoboy_id).map((p) => p.motoboy_id),
  ).size;

  return {
    totalHoje: criadosHoje.length,
    valorVendidoHoje: vendidosHoje.reduce((soma, p) => soma + p.valor_total, 0),
    entreguesHoje: entreguesHoje.length,
    pendentes: pedidos.filter((p) => p.status === "pendente").length,
    emRota: pedidos.filter((p) => p.status === "em_rota").length,
    problemas: pedidos.filter((p) => p.status === "problema").length,
    tempoMedioMinutos,
    bairrosMaisAtendidos,
    motoboysAtivos,
  };
}

export interface VendaPorAtendente {
  atendenteId: string;
  nome: string;
  total: number;
}

// Quanto cada atendente vendeu hoje (soma do valor_total dos pedidos que
// ele criou, exceto cancelados) — usado só na visão do admin.
export function calcularVendasPorAtendente(
  pedidos: Pedido[],
  atendentes: Perfil[],
): VendaPorAtendente[] {
  const nomePorId = new Map(atendentes.map((a) => [a.id, a.nome]));
  const totalPorId = new Map<string, number>();

  for (const p of pedidos) {
    if (!p.criado_por || p.status === "cancelado" || !ehHoje(p.criado_em)) continue;
    totalPorId.set(p.criado_por, (totalPorId.get(p.criado_por) ?? 0) + p.valor_total);
  }

  return [...totalPorId.entries()]
    .map(([atendenteId, total]) => ({
      atendenteId,
      nome: nomePorId.get(atendenteId) ?? "Atendente removido",
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

export function formatarMinutos(minutos: number | null): string {
  if (minutos === null) return "—";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto > 0 ? `${horas}h${resto}min` : `${horas}h`;
}
