import ExcelJS from "exceljs";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";
import {
  hojeLocalISO,
  limitesDoDia,
  limitesDoMes,
  diasDoMes,
  formatarDataLocal,
  formatarMesLocal,
  dataLocalISO,
} from "@/lib/utils/dataLocal";
import { formatarMinutos } from "@/lib/utils/resumo";
import {
  STATUS_LABEL,
  FORMA_PAGAMENTO_LABEL,
  TIPO_RECEITA_LABEL,
  descreverPagamento,
  formatarMoeda,
} from "@/lib/utils/status";
import { formatarData } from "@/lib/utils/tempo";
import type { Pedido, Perfil, Receita, Pagamento, FormaPagamento } from "@/lib/types/database";

const CABECALHO = [
  "Pedido",
  "Status",
  "Cliente",
  "Telefone",
  "Endereço",
  "Bairro",
  "Motoboy",
  "Criado por",
  "Valor total",
  "Pagamento(s)",
  "Precisa receita",
  "Receitas",
  "Observações",
  "Observação do motoboy",
  "Motivo do problema",
  "Criado em",
  "Atribuído em",
  "Iniciado em",
  "Entregue em",
];

export async function GET(request: NextRequest) {
  const perfilAtual = await getPerfilAtual();
  if (!perfilAtual) {
    return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
  }
  if (perfilAtual.papel === "motoboy") {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const mesISO = request.nextUrl.searchParams.get("mes");
  if (mesISO) {
    if (!/^\d{4}-\d{2}$/.test(mesISO)) {
      return NextResponse.json({ erro: "Mês inválido." }, { status: 400 });
    }
    return exportarMes(mesISO, perfilAtual.papel, perfilAtual.id);
  }

  const dataISO = request.nextUrl.searchParams.get("data") || hojeLocalISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) {
    return NextResponse.json({ erro: "Data inválida." }, { status: 400 });
  }
  return exportarDia(dataISO, perfilAtual.papel, perfilAtual.id);
}

async function exportarDia(dataISO: string, papel: string, perfilId: string) {
  const { inicio, fim } = limitesDoDia(dataISO);
  const { listaPedidos, relacionados } = await buscarPedidosEDados(inicio, fim, papel, perfilId);

  const workbook = novoWorkbook();
  montarAbaDetalhes(workbook, listaPedidos, relacionados);

  const resumo = calcularResumoDoPeriodo(listaPedidos, relacionados.pagamentosPorPedido);
  montarAbaResumo(workbook, "Resumo do dia", formatarDataLocal(dataISO), resumo);

  return gerarResposta(workbook, `relatorio-entregas-${dataISO}.xlsx`);
}

async function exportarMes(mesISO: string, papel: string, perfilId: string) {
  const { inicio, fim } = limitesDoMes(mesISO);
  const { listaPedidos, relacionados } = await buscarPedidosEDados(inicio, fim, papel, perfilId);

  const workbook = novoWorkbook();
  montarAbaDetalhes(workbook, listaPedidos, relacionados);
  montarAbaPorDia(workbook, mesISO, listaPedidos, relacionados.pagamentosPorPedido);

  const resumo = calcularResumoDoPeriodo(listaPedidos, relacionados.pagamentosPorPedido);
  let vendasPorAtendente;
  let desempenhoMotoboys;
  if (papel === "admin") {
    vendasPorAtendente = calcularVendasPorAtendente(listaPedidos, relacionados.perfilPorId);

    const motoboys = await buscarMotoboys();
    // Só considera dias que já passaram — senão, num mês em andamento,
    // os dias futuros contariam como "inativo" sem nunca terem existido.
    const diasConsiderados = diasDoMes(mesISO).filter((dia) => dia <= hojeLocalISO());
    desempenhoMotoboys = calcularDesempenhoMotoboys(motoboys, listaPedidos, diasConsiderados);
  }
  montarAbaResumo(
    workbook,
    "Resumo do mês",
    formatarMesLocal(mesISO),
    resumo,
    vendasPorAtendente,
    desempenhoMotoboys,
  );

  return gerarResposta(workbook, `relatorio-entregas-${mesISO}.xlsx`);
}

async function buscarMotoboys(): Promise<Perfil[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("perfis").select("*").eq("papel", "motoboy").order("nome");
  return (data as Perfil[]) ?? [];
}

async function buscarPedidosEDados(inicio: Date, fim: Date, papel: string, perfilId: string) {
  const supabase = await createClient();

  let query = supabase
    .from("pedidos")
    .select("*")
    .gte("criado_em", inicio.toISOString())
    .lte("criado_em", fim.toISOString())
    .order("criado_em", { ascending: true });

  if (papel !== "admin") {
    query = query.eq("criado_por", perfilId);
  }

  const { data: pedidos, error } = await query;
  if (error) throw new Error(error.message);

  const listaPedidos = (pedidos as Pedido[]) ?? [];
  const idsPedidos = listaPedidos.map((p) => p.id);

  const [{ data: receitas }, { data: pagamentos }] = await Promise.all([
    idsPedidos.length > 0
      ? supabase.from("receitas").select("*").in("pedido_id", idsPedidos)
      : Promise.resolve({ data: [] as Receita[] }),
    idsPedidos.length > 0
      ? supabase.from("pagamentos").select("*").in("pedido_id", idsPedidos)
      : Promise.resolve({ data: [] as Pagamento[] }),
  ]);

  const idsPerfis = [
    ...new Set(
      listaPedidos.flatMap((p) => [p.motoboy_id, p.criado_por]).filter((id): id is string => Boolean(id)),
    ),
  ];
  const { data: perfis } =
    idsPerfis.length > 0
      ? await supabase.from("perfis").select("*").in("id", idsPerfis)
      : { data: [] as Perfil[] };

  const perfilPorId = new Map((perfis as Perfil[]).map((p) => [p.id, p]));
  const receitasPorPedido = new Map<string, Receita[]>();
  for (const r of (receitas as Receita[]) ?? []) {
    const lista = receitasPorPedido.get(r.pedido_id) ?? [];
    lista.push(r);
    receitasPorPedido.set(r.pedido_id, lista);
  }
  const pagamentosPorPedido = new Map<string, Pagamento[]>();
  for (const pg of (pagamentos as Pagamento[]) ?? []) {
    const lista = pagamentosPorPedido.get(pg.pedido_id) ?? [];
    lista.push(pg);
    pagamentosPorPedido.set(pg.pedido_id, lista);
  }

  return { listaPedidos, relacionados: { perfilPorId, receitasPorPedido, pagamentosPorPedido } };
}

function novoWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema de Entregas — Maxi Popular";
  workbook.created = new Date();
  return workbook;
}

async function gerarResposta(workbook: ExcelJS.Workbook, nomeArquivo: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}

type Relacionados = {
  perfilPorId: Map<string, Perfil>;
  receitasPorPedido: Map<string, Receita[]>;
  pagamentosPorPedido: Map<string, Pagamento[]>;
};

function montarAbaDetalhes(workbook: ExcelJS.Workbook, listaPedidos: Pedido[], relacionados: Relacionados) {
  const { perfilPorId, receitasPorPedido, pagamentosPorPedido } = relacionados;

  const abaDetalhes = workbook.addWorksheet("Detalhes");
  abaDetalhes.addRow(CABECALHO);
  abaDetalhes.getRow(1).font = { bold: true };
  abaDetalhes.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFC928" },
  };
  abaDetalhes.views = [{ state: "frozen", ySplit: 1 }];
  abaDetalhes.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + CABECALHO.length)}1` };

  for (const p of listaPedidos) {
    const pagamentosDoPedido = pagamentosPorPedido.get(p.id) ?? [];
    const receitasDoPedido = receitasPorPedido.get(p.id) ?? [];
    const motoboy = p.motoboy_id ? perfilPorId.get(p.motoboy_id) : undefined;
    const criador = p.criado_por ? perfilPorId.get(p.criado_por) : undefined;

    abaDetalhes.addRow([
      p.numero,
      STATUS_LABEL[p.status],
      p.cliente_nome,
      p.cliente_telefone ?? "",
      p.endereco,
      p.bairro ?? "",
      motoboy?.nome ?? "",
      criador?.nome ?? "",
      p.valor_total,
      pagamentosDoPedido.map((pg) => `${descreverPagamento(pg)} (${formatarMoeda(pg.valor)})`).join(" + "),
      p.precisa_receita ? "Sim" : "Não",
      receitasDoPedido.map((r) => `${r.quantidade}x ${TIPO_RECEITA_LABEL[r.tipo_receita]}`).join(", "),
      p.observacoes ?? "",
      p.observacao_motoboy ?? "",
      p.motivo_problema ?? "",
      formatarData(p.criado_em),
      formatarData(p.atribuido_em),
      formatarData(p.iniciado_em),
      formatarData(p.entregue_em),
    ]);
  }

  abaDetalhes.getColumn(9).numFmt = "R$ #,##0.00";
  abaDetalhes.columns.forEach((coluna, i) => {
    const cabecalho = CABECALHO[i] ?? "";
    coluna.width = Math.max(12, Math.min(32, cabecalho.length + 4));
  });
  abaDetalhes.getColumn(3).width = 24;
  abaDetalhes.getColumn(5).width = 30;
  abaDetalhes.getColumn(10).width = 34;
  abaDetalhes.getColumn(13).width = 30;
}

const CABECALHO_POR_DIA = [
  "Data",
  "Pedidos",
  "Entregues",
  "Em rota",
  "Pendentes",
  "Problemas",
  "Tempo médio de entrega",
  "Valor total",
];

// Uma linha "fechada" por dia do mês (dia 1 até o último), mesmo os
// dias sem nenhum pedido — fica fácil ver o mês inteiro em sequência.
function montarAbaPorDia(
  workbook: ExcelJS.Workbook,
  mesISO: string,
  listaPedidos: Pedido[],
  pagamentosPorPedido: Map<string, Pagamento[]>,
) {
  const aba = workbook.addWorksheet("Por dia");
  aba.addRow(CABECALHO_POR_DIA);
  aba.getRow(1).font = { bold: true };
  aba.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC928" } };
  aba.views = [{ state: "frozen", ySplit: 1 }];

  const pedidosPorDia = new Map<string, Pedido[]>();
  for (const p of listaPedidos) {
    const dia = dataLocalISO(p.criado_em);
    const lista = pedidosPorDia.get(dia) ?? [];
    lista.push(p);
    pedidosPorDia.set(dia, lista);
  }

  for (const dia of diasDoMes(mesISO)) {
    const pedidosDoDia = pedidosPorDia.get(dia) ?? [];
    const resumo = calcularResumoDoPeriodo(pedidosDoDia, pagamentosPorPedido);
    aba.addRow([
      formatarDataLocal(dia),
      resumo.total,
      resumo.entregues,
      resumo.emRota,
      resumo.pendentes,
      resumo.problemas,
      formatarMinutos(resumo.tempoMedioMinutos),
      resumo.valorTotal,
    ]);
  }

  aba.getColumn(8).numFmt = "R$ #,##0.00";
  aba.columns.forEach((coluna, i) => {
    coluna.width = Math.max(12, (CABECALHO_POR_DIA[i] ?? "").length + 4);
  });
}

function montarAbaResumo(
  workbook: ExcelJS.Workbook,
  titulo: string,
  subtitulo: string,
  resumo: ReturnType<typeof calcularResumoDoPeriodo>,
  vendasPorAtendente?: { nome: string; total: number }[],
  desempenhoMotoboys?: DesempenhoMotoboy[],
) {
  const abaResumo = workbook.addWorksheet("Resumo");
  abaResumo.addRow([titulo, subtitulo]).font = { bold: true };
  abaResumo.addRow([]);
  const linhas: [string, string | number][] = [
    ["Pedidos no período", resumo.total],
    ["Entregues", resumo.entregues],
    ["Em rota", resumo.emRota],
    ["Pendentes", resumo.pendentes],
    ["Com problema", resumo.problemas],
    ["Tempo médio de entrega", formatarMinutos(resumo.tempoMedioMinutos)],
    ["Motoboys em rota (no momento da exportação)", resumo.motoboysAtivos],
    ["Valor total dos pedidos", formatarMoeda(resumo.valorTotal)],
  ];
  for (const [rotulo, valor] of linhas) {
    abaResumo.addRow([rotulo, valor]);
  }

  abaResumo.addRow([]);
  abaResumo.addRow(["Formas de pagamento", "Valor"]).font = { bold: true };
  for (const forma of Object.keys(FORMA_PAGAMENTO_LABEL) as FormaPagamento[]) {
    const valor = resumo.porFormaPagamento[forma] ?? 0;
    if (valor > 0) abaResumo.addRow([FORMA_PAGAMENTO_LABEL[forma], formatarMoeda(valor)]);
  }

  if (resumo.bairrosMaisAtendidos.length > 0) {
    abaResumo.addRow([]);
    abaResumo.addRow(["Bairros com mais entregas", "Quantidade"]).font = { bold: true };
    for (const b of resumo.bairrosMaisAtendidos) {
      abaResumo.addRow([b.bairro, b.quantidade]);
    }
  }

  if (vendasPorAtendente && vendasPorAtendente.length > 0) {
    abaResumo.addRow([]);
    abaResumo.addRow(["Vendas por atendente", "Valor"]).font = { bold: true };
    for (const v of vendasPorAtendente) {
      abaResumo.addRow([v.nome, formatarMoeda(v.total)]);
    }
  }

  if (desempenhoMotoboys && desempenhoMotoboys.length > 0) {
    abaResumo.addRow([]);
    abaResumo.addRow(["Desempenho dos motoboys"]).font = { bold: true };
    for (const m of desempenhoMotoboys) {
      abaResumo.addRow([]);
      abaResumo.addRow([m.nome]).font = { bold: true };
      abaResumo.addRow(["Entregas", m.entregas]);
      abaResumo.addRow(["Tempo médio de entrega", formatarMinutos(m.tempoMedioMinutos)]);
      abaResumo.addRow(["Dias ativos", m.diasAtivos]);
      abaResumo.addRow(["Dias inativos", m.diasInativos.length]);
      abaResumo.addRow(["Dias sem entrega", m.diasInativos.join(", ") || "—"]);
      abaResumo.addRow([
        "Bairros atendidos",
        m.bairros.map((b) => `${b.bairro} (${b.quantidade})`).join(", ") || "—",
      ]);
    }
  }

  abaResumo.getColumn(1).width = 40;
  abaResumo.getColumn(2).width = 20;
}

function calcularVendasPorAtendente(listaPedidos: Pedido[], perfilPorId: Map<string, Perfil>) {
  const totalPorId = new Map<string, number>();
  for (const p of listaPedidos) {
    if (!p.criado_por || p.status === "cancelado") continue;
    totalPorId.set(p.criado_por, (totalPorId.get(p.criado_por) ?? 0) + p.valor_total);
  }
  return [...totalPorId.entries()]
    .map(([id, total]) => ({ nome: perfilPorId.get(id)?.nome ?? "Atendente removido", total }))
    .sort((a, b) => b.total - a.total);
}

type DesempenhoMotoboy = {
  nome: string;
  entregas: number;
  tempoMedioMinutos: number | null;
  bairros: { bairro: string; quantidade: number }[];
  diasAtivos: number;
  diasInativos: string[];
};

// "Ativo" num dia = entregou pelo menos 1 pedido naquele dia (dia de
// entregue_em, no horário de Brasília). diasConsiderados já vem sem os
// dias futuros de um mês ainda em andamento.
function calcularDesempenhoMotoboys(
  motoboys: Perfil[],
  listaPedidos: Pedido[],
  diasConsiderados: string[],
): DesempenhoMotoboy[] {
  return motoboys.map((motoboy) => {
    const entregasDoMotoboy = listaPedidos.filter(
      (p) => p.motoboy_id === motoboy.id && p.status === "entregue",
    );

    const tempos = entregasDoMotoboy
      .filter((p): p is Pedido & { iniciado_em: string; entregue_em: string } =>
        Boolean(p.iniciado_em && p.entregue_em),
      )
      .map((p) => (new Date(p.entregue_em).getTime() - new Date(p.iniciado_em).getTime()) / 60000);
    const tempoMedioMinutos =
      tempos.length > 0 ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : null;

    const contagemBairros = new Map<string, number>();
    for (const p of entregasDoMotoboy) {
      if (!p.bairro) continue;
      contagemBairros.set(p.bairro, (contagemBairros.get(p.bairro) ?? 0) + 1);
    }
    const bairros = [...contagemBairros.entries()]
      .map(([bairro, quantidade]) => ({ bairro, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    const diasComEntrega = new Set(
      entregasDoMotoboy.filter((p) => p.entregue_em).map((p) => dataLocalISO(p.entregue_em!)),
    );
    const diasInativos = diasConsiderados.filter((dia) => !diasComEntrega.has(dia));

    return {
      nome: motoboy.nome,
      entregas: entregasDoMotoboy.length,
      tempoMedioMinutos,
      bairros,
      diasAtivos: diasConsiderados.length - diasInativos.length,
      diasInativos: diasInativos.map(formatarDataLocal),
    };
  });
}

// Diferente de calcularResumo() (usado no painel em tempo real, que
// sempre olha pro dia atual via ehHoje()), aqui os pedidos já vêm
// filtrados pelo período escolhido na exportação (um dia, um mês, ou um
// dia dentro do mês na aba "Por dia") — então tratamos a lista inteira
// como "o período", sem checar de novo contra a data de hoje.
function calcularResumoDoPeriodo(pedidos: Pedido[], pagamentosPorPedido: Map<string, Pagamento[]>) {
  const entregues = pedidos.filter((p) => p.status === "entregue");

  const tempos = entregues
    .filter((p): p is Pedido & { iniciado_em: string; entregue_em: string } =>
      Boolean(p.iniciado_em && p.entregue_em),
    )
    .map((p) => (new Date(p.entregue_em).getTime() - new Date(p.iniciado_em).getTime()) / 60000);
  const tempoMedioMinutos =
    tempos.length > 0 ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : null;

  const contagemBairros = new Map<string, number>();
  for (const p of entregues) {
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

  const valorTotal = pedidos
    .filter((p) => p.status !== "cancelado")
    .reduce((soma, p) => soma + p.valor_total, 0);

  const porFormaPagamento: Partial<Record<FormaPagamento, number>> = {};
  for (const p of pedidos) {
    if (p.status === "cancelado") continue;
    for (const pg of pagamentosPorPedido.get(p.id) ?? []) {
      porFormaPagamento[pg.forma_pagamento] = (porFormaPagamento[pg.forma_pagamento] ?? 0) + pg.valor;
    }
  }

  return {
    total: pedidos.length,
    entregues: entregues.length,
    pendentes: pedidos.filter((p) => p.status === "pendente").length,
    emRota: pedidos.filter((p) => p.status === "em_rota").length,
    problemas: pedidos.filter((p) => p.status === "problema").length,
    tempoMedioMinutos,
    bairrosMaisAtendidos,
    motoboysAtivos,
    valorTotal,
    porFormaPagamento,
  };
}
