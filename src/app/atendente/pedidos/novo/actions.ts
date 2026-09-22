"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type EstadoFormPedido = { erro?: string };

export async function criarPedido(
  _estadoAnterior: EstadoFormPedido,
  formData: FormData,
): Promise<EstadoFormPedido> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const clienteNome = (formData.get("cliente_nome") as string)?.trim();
  const endereco = (formData.get("endereco") as string)?.trim();
  const valorTotalRaw = formData.get("valor_total") as string;
  const formaPagamento = formData.get("forma_pagamento") as string;

  if (!clienteNome || !endereco || !valorTotalRaw || !formaPagamento) {
    return { erro: "Preencha cliente, endereço, forma de pagamento e valor total." };
  }

  const precisaReceita = formData.get("precisa_receita") === "on";
  const precisaTroco = formData.get("precisa_troco") === "on";
  const trocoParaRaw = formData.get("troco_para") as string;
  const qtdReceitasRaw = formData.get("qtd_receitas") as string;

  const { data, error } = await supabase
    .from("pedidos")
    .insert({
      cliente_nome: clienteNome,
      endereco,
      bairro: (formData.get("bairro") as string)?.trim() || null,
      referencia: (formData.get("referencia") as string)?.trim() || null,
      forma_pagamento: formaPagamento,
      valor_total: Number(valorTotalRaw),
      troco_para: precisaTroco && trocoParaRaw ? Number(trocoParaRaw) : null,
      precisa_receita: precisaReceita,
      qtd_receitas: precisaReceita && qtdReceitasRaw ? Number(qtdReceitasRaw) : null,
      tipo_receita: precisaReceita ? (formData.get("tipo_receita") as string) : null,
      observacoes: (formData.get("observacoes") as string)?.trim() || null,
      criado_por: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { erro: error?.message ?? "Erro ao criar pedido." };
  }

  redirect(`/atendente/pedidos/${data.id}`);
}
