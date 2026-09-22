"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TIPOS_RECEITA, type NovaReceita, type TipoReceita } from "@/lib/types/database";

export type EstadoFormPedido = { erro?: string };

const TIPOS_VALIDOS: readonly string[] = TIPOS_RECEITA;

function parseReceitas(raw: string | null): NovaReceita[] {
  if (!raw) return [];
  let lista: unknown;
  try {
    lista = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(lista)) return [];

  return lista
    .filter((r): r is { tipo_receita: string; quantidade: number } => {
      if (!r || typeof r !== "object") return false;
      const obj = r as Record<string, unknown>;
      return (
        typeof obj.tipo_receita === "string" &&
        TIPOS_VALIDOS.includes(obj.tipo_receita) &&
        typeof obj.quantidade === "number" &&
        Number.isFinite(obj.quantidade) &&
        obj.quantidade > 0
      );
    })
    .map((r) => ({
      tipo_receita: r.tipo_receita as TipoReceita,
      quantidade: Math.trunc(r.quantidade),
    }));
}

export async function criarPedido(
  _estadoAnterior: EstadoFormPedido,
  formData: FormData,
): Promise<EstadoFormPedido> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const clienteNome = (formData.get("cliente_nome") as string)?.trim();
  const endereco = (formData.get("endereco") as string)?.trim();
  const bairro = (formData.get("bairro") as string)?.trim();
  const valorTotalRaw = formData.get("valor_total") as string;
  const formaPagamento = formData.get("forma_pagamento") as string;

  if (!clienteNome || !endereco || !bairro || !valorTotalRaw || !formaPagamento) {
    return { erro: "Preencha cliente, endereço, bairro, forma de pagamento e valor total." };
  }

  const precisaReceita = formData.get("precisa_receita") === "on";
  const precisaTroco = formData.get("precisa_troco") === "on";
  const trocoParaRaw = formData.get("troco_para") as string;
  const receitas = precisaReceita ? parseReceitas(formData.get("receitas") as string) : [];

  if (precisaReceita && receitas.length === 0) {
    return { erro: "Adicione ao menos uma receita ou desmarque \"Precisa de receita\"." };
  }

  const { data, error } = await supabase
    .from("pedidos")
    .insert({
      cliente_nome: clienteNome,
      endereco,
      bairro,
      referencia: (formData.get("referencia") as string)?.trim() || null,
      forma_pagamento: formaPagamento,
      valor_total: Number(valorTotalRaw),
      troco_para: precisaTroco && trocoParaRaw ? Number(trocoParaRaw) : null,
      precisa_receita: precisaReceita,
      observacoes: (formData.get("observacoes") as string)?.trim() || null,
      criado_por: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { erro: error?.message ?? "Erro ao criar pedido." };
  }

  if (receitas.length > 0) {
    const { error: erroReceitas } = await supabase
      .from("receitas")
      .insert(receitas.map((r) => ({ ...r, pedido_id: data.id })));

    if (erroReceitas) {
      return { erro: erroReceitas.message };
    }
  }

  redirect(`/atendente/pedidos/${data.id}`);
}
