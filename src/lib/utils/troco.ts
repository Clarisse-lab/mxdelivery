// troco_para é o valor com que o cliente vai pagar (ex.: paga com uma
// nota de R$100). O troco a levar é a diferença pro valor do pedido.
export function calcularTroco(valorTotal: number, trocoPara: number | null): number | null {
  if (trocoPara === null) return null;
  return Math.round((trocoPara - valorTotal) * 100) / 100;
}
