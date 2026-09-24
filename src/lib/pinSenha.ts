// O Supabase Auth exige senha com no mínimo 6 caracteres — não dá pra
// baixar esse limite nas configurações do projeto. Pra deixar a
// experiência de atendente/motoboy num PIN de 4 números mesmo assim,
// completamos por baixo dos panos com um prefixo fixo antes de
// mandar pro Supabase. A pessoa nunca vê nem digita esse prefixo —
// só os 4 números dela, que continuam sendo o que garante que cada
// conta tem uma senha diferente.
const PREFIXO = "pin-";

export const PIN_REGEX = /^[0-9]{4}$/;

export function ehPin(valor: string): boolean {
  return PIN_REGEX.test(valor);
}

export function senhaRealDoPin(pin: string): string {
  return PREFIXO + pin;
}
