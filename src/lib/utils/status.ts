import type { StatusPedido, FormaPagamento, TipoReceita, Pedido } from "@/lib/types/database";

export const STATUS_LABEL: Record<StatusPedido, string> = {
  pendente: "Pendente",
  em_rota: "Em rota",
  entregue: "Entregue",
  problema: "Problema",
  cancelado: "Cancelado",
};

export const STATUS_BADGE_CLASS: Record<StatusPedido, string> = {
  pendente: "bg-amber-100 text-amber-800",
  em_rota: "bg-blue-100 text-blue-800",
  entregue: "bg-emerald-100 text-emerald-800",
  problema: "bg-red-100 text-red-800",
  cancelado: "bg-slate-200 text-slate-600",
};

export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  pix: "Pix",
};

export const TIPO_RECEITA_LABEL: Record<TipoReceita, string> = {
  comum: "Comum",
  controle_especial_branca: "Controle especial (branca)",
  controle_especial_azul: "Controle especial (azul)",
  antimicrobiano: "Antimicrobiano",
};

export function descreverFormaPagamento(
  p: Pick<Pedido, "forma_pagamento" | "cartao_tipo" | "parcelas" | "pix_pago">,
): string {
  if (p.forma_pagamento === "cartao") {
    const tipo = p.cartao_tipo === "debito" ? "Débito" : "Crédito";
    return p.parcelas ? `Cartão · ${tipo} · ${p.parcelas}x` : `Cartão · ${tipo}`;
  }
  if (p.forma_pagamento === "pix") {
    return p.pix_pago ? "Pix · Pago" : "Pix · Pendente";
  }
  return "Dinheiro";
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}
