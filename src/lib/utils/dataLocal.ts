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
