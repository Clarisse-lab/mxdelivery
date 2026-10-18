import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function tempoDesde(dataIso: string): string {
  return formatDistanceToNow(new Date(dataIso), { locale: ptBR, addSuffix: true });
}

// Formata no horário local do navegador (não UTC) — é o que o
// <input type="datetime-local"> espera, e como quem usa o app está na
// farmácia, o horário local do aparelho já é o de Governador Valadares.
export function paraDatetimeLocal(data: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`;
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
