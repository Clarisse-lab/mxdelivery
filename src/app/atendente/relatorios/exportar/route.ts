import ExcelJS from "exceljs";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPerfilAtual } from "@/lib/auth";
import { hojeLocalISO, limitesDoDia, formatarDataLocal } from "@/lib/utils/dataLocal";
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

  const dataISO = request.nextUrl.searchParams.get("data") || hojeLocalISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) {
    return NextResponse.json({ erro: "Data inválida." }, { status: 400 });
  }

  const { inicio, fim } = limitesDoDia(dataISO);
  const supabase = await createClient();

  let query = supabase
    .from("pedidos")
    .select("*")
    .gte("criado_em", inicio.toISOString())
    .lte("criado_em", fim.toISOString())
    .order("criado_em", { ascending: true });

  if (perfilAtual.papel !== "admin") {
    query = query.eq("criado_por", perfilAtual.id);
  }

  const { data: pedidos, error } = await query;
  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

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

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistema de Entregas — Maxi Popular";
  workbook.created = new Date();

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
    const criador = perfilPorId.get(p.criado_por);

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

  const resumo = calcularResumoDoDia(listaPedidos, pagamentosPorPedido);

  const abaResumo = workbook.addWorksheet("Resumo");
  abaResumo.addRow(["Resumo do dia", formatarDataLocal(dataISO)]).font = { bold: true };
  abaResumo.addRow([]);
  const linhas: [string, string | number][] = [
    ["Pedidos no dia", resumo.totalHoje],
    ["Entregues", resumo.entreguesHoje],
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

  abaResumo.getColumn(1).width = 40;
  abaResumo.getColumn(2).width = 20;

  const buffer = await workbook.xlsx.writeBuffer();
  const nomeArquivo = `relatorio-entregas-${dataISO}.xlsx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}

// Diferente de calcularResumo() (usado no painel em tempo real, que
// sempre olha pro dia atual via ehHoje()), aqui os pedidos já vêm
// filtrados pelo dia escolhido na exportação — então tratamos a lista
// inteira como "o dia", sem checar de novo contra a data de hoje.
function calcularResumoDoDia(pedidos: Pedido[], pagamentosPorPedido: Map<string, Pagamento[]>) {
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
    totalHoje: pedidos.length,
    entreguesHoje: entregues.length,
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
