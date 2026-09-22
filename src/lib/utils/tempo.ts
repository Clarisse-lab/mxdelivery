import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function tempoDesde(dataIso: string): string {
  return formatDistanceToNow(new Date(dataIso), { locale: ptBR, addSuffix: true });
}

export function formatarData(dataIso: string | null): string {
  if (!dataIso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dataIso));
}
