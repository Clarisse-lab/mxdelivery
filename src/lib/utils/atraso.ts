import type { Pedido } from "@/lib/types/database";

// Prazo máximo combinado pra entrega, contado a partir da criação do
// pedido — vale tanto pra quem ainda está pendente (sem motoboy ou
// aguardando saída) quanto pra quem já está em rota.
export const PRAZO_ENTREGA_MINUTOS = 120;

export type NivelUrgencia = "normal" | "atencao" | "quase" | "atrasado";

export function minutosDesde(dataIso: string, agora: number = Date.now()): number {
  return (agora - new Date(dataIso).getTime()) / 60000;
}

// Vai subindo de nível conforme o pedido se aproxima do prazo — não é
// só "atrasado ou não", dá pra ver o alerta chegando com antecedência.
export function calcularNivelUrgencia(
  pedido: Pick<Pedido, "status" | "criado_em">,
  agora: number = Date.now(),
): NivelUrgencia {
  if (pedido.status !== "pendente" && pedido.status !== "em_rota") return "normal";

  const minutos = minutosDesde(pedido.criado_em, agora);
  if (minutos > PRAZO_ENTREGA_MINUTOS) return "atrasado";
  if (minutos > PRAZO_ENTREGA_MINUTOS * 0.75) return "quase";
  if (minutos > PRAZO_ENTREGA_MINUTOS * 0.5) return "atencao";
  return "normal";
}

export function estaAtrasado(
  pedido: Pick<Pedido, "status" | "criado_em">,
  agora: number = Date.now(),
): boolean {
  return calcularNivelUrgencia(pedido, agora) === "atrasado";
}

export const URGENCIA_UI: Record<
  NivelUrgencia,
  { bar: string; badge: string; borda: string; label: string; pulsante: boolean } | null
> = {
  normal: null,
  atencao: {
    bar: "bg-yellow-400",
    badge: "bg-yellow-100 text-yellow-800",
    borda: "border-yellow-200 hover:border-yellow-300",
    label: "Atenção",
    pulsante: false,
  },
  quase: {
    bar: "bg-orange-500",
    badge: "bg-orange-100 text-orange-800",
    borda: "border-orange-300 hover:border-orange-400",
    label: "Quase atrasado",
    pulsante: false,
  },
  atrasado: {
    bar: "bg-red-600",
    badge: "bg-red-600 text-white",
    borda: "border-red-300 hover:border-red-400",
    label: "Atrasado",
    pulsante: true,
  },
};
