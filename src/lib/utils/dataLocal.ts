// A farmácia opera em horário de Brasília (America/Sao_Paulo, UTC-3
// fixo — sem horário de verão desde 2019). O servidor pode rodar em
// qualquer timezone, então nunca usamos Date/toDateString() direto
// pra decidir "qual dia é hoje" no back-end.
const OFFSET_BRASILIA = "-03:00";

export function hojeLocalISO(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return partes; // en-CA formata como YYYY-MM-DD
}

export function limitesDoDia(dataISO: string): { inicio: Date; fim: Date } {
  const inicio = new Date(`${dataISO}T00:00:00${OFFSET_BRASILIA}`);
  const fim = new Date(`${dataISO}T23:59:59.999${OFFSET_BRASILIA}`);
  return { inicio, fim };
}

export function formatarDataLocal(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

// Converte um timestamp (UTC, como vem do banco) pro formato que o
// <input type="datetime-local"> espera, já no horário de Brasília —
// usado pra pré-preencher o campo de agendamento ao editar um pedido.
// Roda no servidor, então não dá pra usar getHours()/getMinutes() (eles
// usariam o fuso do servidor, não o da farmácia).
export function paraDatetimeLocalBrasilia(dataIso: string): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(dataIso));

  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "00";
  const hora = valor("hour") === "24" ? "00" : valor("hour");

  return `${valor("year")}-${valor("month")}-${valor("day")}T${hora}:${valor("minute")}`;
}
