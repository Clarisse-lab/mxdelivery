import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function tempoDesde(dataIso: string): string {
  return formatDistanceToNow(new Date(dataIso), { locale: ptBR, addSuffix: true });
}

export function formatarData(dataIso: string | null): string {
  if (!dataIso) return "—";
  // Fixa o horário de Brasília explicitamente — isso roda tanto no
  // navegador quanto no servidor (que pode estar em UTC), e sem isso a
  // hora exibida ficava 3h à frente do horário real da farmácia.
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dataIso));
}
