export type Papel = "admin" | "atendente" | "motoboy";

export type StatusPedido =
  | "pendente"
  | "em_rota"
  | "entregue"
  | "problema"
  | "cancelado";

export type FormaPagamento = "dinheiro" | "cartao" | "pix";
export type CartaoTipo = "credito" | "debito";

export interface Perfil {
  id: string;
  nome: string;
  telefone: string | null;
  papel: Papel;
  ativo: boolean;
  criado_em: string;
}

export interface Pedido {
  id: string;
  numero: number;

  cliente_nome: string;
  endereco: string;
  bairro: string | null;
  referencia: string | null;

  valor_total: number;

  precisa_receita: boolean;

  status: StatusPedido;

  motoboy_id: string | null;
  criado_por: string;

  receita_coletada: boolean;
  troco_entregue: boolean;
  pagamento_confirmado: boolean;
  motivo_problema: string | null;

  observacoes: string | null;
  observacao_motoboy: string | null;

  criado_em: string;
  atribuido_em: string | null;
  iniciado_em: string | null;
  entregue_em: string | null;
}

export const TIPOS_RECEITA = [
  "comum",
  "controle_especial_branca",
  "controle_especial_azul",
  "antimicrobiano",
] as const;

export type TipoReceita = (typeof TIPOS_RECEITA)[number];

export interface Receita {
  id: string;
  pedido_id: string;
  tipo_receita: TipoReceita;
  quantidade: number;
}

export type NovaReceita = { tipo_receita: TipoReceita; quantidade: number };

export interface Pagamento {
  id: string;
  pedido_id: string;
  forma_pagamento: FormaPagamento;
  valor: number;
  cartao_tipo: CartaoTipo | null;
  parcelas: number | null;
  troco_para: number | null;
  pix_pago: boolean | null;
  comprovante_pix_path: string | null;
}

export type NovoPagamento = {
  forma_pagamento: FormaPagamento;
  valor: number;
  cartao_tipo: CartaoTipo | null;
  parcelas: number | null;
  troco_para: number | null;
  pix_pago: boolean | null;
};
