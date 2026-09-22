export type Papel = "atendente" | "motoboy";

export type StatusPedido =
  | "pendente"
  | "em_rota"
  | "entregue"
  | "problema"
  | "cancelado";

export type FormaPagamento = "dinheiro" | "cartao" | "pix";

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

  forma_pagamento: FormaPagamento;
  valor_total: number;
  troco_para: number | null;

  precisa_receita: boolean;
  qtd_receitas: number | null;
  tipo_receita: string | null;

  status: StatusPedido;

  motoboy_id: string | null;
  criado_por: string;

  receita_coletada: boolean;
  troco_entregue: boolean;
  pagamento_confirmado: boolean;
  motivo_problema: string | null;

  observacoes: string | null;

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
