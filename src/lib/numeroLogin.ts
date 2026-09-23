// O Supabase Auth exige e-mail; login por número usa um e-mail interno
// sintetizado a partir do número, nunca exposto na interface.
export const DOMINIO_LOGIN_NUMERO = "login.maxipopular.internal";

export function emailDoNumero(numero: string): string {
  return `${numero.trim()}@${DOMINIO_LOGIN_NUMERO}`;
}

export function pareceNumero(entrada: string): boolean {
  return /^[0-9]+$/.test(entrada.trim());
}
