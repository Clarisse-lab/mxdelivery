import type { Pedido } from "@/lib/types/database";

// Prazo máximo combinado pra entrega, contado a partir da criação do
// pedido — vale tanto pra quem ainda está pendente (sem motoboy ou
// aguardando saída) quanto pra quem já está em rota.
export const PRAZO_ENTREGA_MINUTOS = 120;

export function minutosDesde(dataIso: string, agora: number = Date.now()): number {
  return (agora - new Date(dataIso).getTime()) / 60000;
}

export function estaAtrasado(
  pedido: Pick<Pedido, "status" | "criado_em">,
  agora: number = Date.now(),
): boolean {
  if (pedido.status !== "pendente" && pedido.status !== "em_rota") return false;
  return minutosDesde(pedido.criado_em, agora) > PRAZO_ENTREGA_MINUTOS;
}
