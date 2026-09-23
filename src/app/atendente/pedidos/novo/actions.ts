"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  TIPOS_RECEITA,
  type NovaReceita,
  type NovoPagamento,
  type TipoReceita,
  type FormaPagamento,
} from "@/lib/types/database";

export type EstadoFormPedido = { erro?: string };

const TIPOS_RECEITA_VALIDOS: readonly string[] = TIPOS_RECEITA;
const FORMAS_PAGAMENTO_VALIDAS: readonly string[] = ["dinheiro", "cartao", "pix"];

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
        TIPOS_RECEITA_VALIDOS.includes(obj.tipo_receita) &&
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

function parsePagamentos(raw: string | null): NovoPagamento[] {
  if (!raw) return [];
  let lista: unknown;
  try {
    lista = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(lista)) return [];

  return lista
    .filter((p): p is Record<string, unknown> => {
      if (!p || typeof p !== "object") return false;
      const obj = p as Record<string, unknown>;
      return (
        typeof obj.forma_pagamento === "string" &&
        FORMAS_PAGAMENTO_VALIDAS.includes(obj.forma_pagamento) &&
        typeof obj.valor === "number" &&
        Number.isFinite(obj.valor) &&
        obj.valor > 0
      );
    })
    .map((p) => ({
      forma_pagamento: p.forma_pagamento as FormaPagamento,
      valor: Math.round((p.valor as number) * 100) / 100,
      cartao_tipo: p.cartao_tipo === "credito" || p.cartao_tipo === "debito" ? p.cartao_tipo : null,
      parcelas: typeof p.parcelas === "number" && p.parcelas > 0 ? Math.trunc(p.parcelas) : null,
      troco_para:
        typeof p.troco_para === "number" && p.troco_para > 0
          ? Math.round(p.troco_para * 100) / 100
          : null,
      pix_pago: typeof p.pix_pago === "boolean" ? p.pix_pago : null,
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

  if (!clienteNome || !endereco || !bairro || !valorTotalRaw) {
    return { erro: "Preencha cliente, endereço, bairro e valor total." };
  }

  const valorTotal = Number(valorTotalRaw);
  const pagamentos = parsePagamentos(formData.get("pagamentos") as string);

  if (pagamentos.length === 0) {
    return { erro: "Selecione a forma de pagamento." };
  }

  const somaPagamentos = Math.round(pagamentos.reduce((s, p) => s + p.valor, 0) * 100) / 100;
  if (Math.abs(somaPagamentos - valorTotal) > 0.01) {
    return { erro: "A soma das formas de pagamento precisa ser igual ao valor total do pedido." };
  }

  const precisaReceita = formData.get("precisa_receita") === "on";
  const receitas = precisaReceita ? parseReceitas(formData.get("receitas") as string) : [];

  if (precisaReceita && receitas.length === 0) {
    return { erro: "Adicione ao menos uma receita ou desmarque \"Precisa de receita\"." };
  }

  const { data, error } = await supabase
    .from("pedidos")
    .insert({
      cliente_nome: clienteNome,
      cliente_telefone: (formData.get("cliente_telefone") as string)?.trim() || null,
      endereco,
      bairro,
      referencia: (formData.get("referencia") as string)?.trim() || null,
      valor_total: valorTotal,
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

  // Insere uma linha por vez (em vez de um insert em lote) pra garantir a
  // correspondência 1:1 entre cada pagamento e o arquivo de comprovante
  // que veio com o mesmo índice do formulário — um insert em lote não
  // garante a ordem de retorno das linhas.
  for (let i = 0; i < pagamentos.length; i++) {
    const { data: linha, error: erroPagamento } = await supabase
      .from("pagamentos")
      .insert({ ...pagamentos[i], pedido_id: data.id })
      .select("id")
      .single();

    if (erroPagamento || !linha) {
      return { erro: erroPagamento?.message ?? "Erro ao registrar pagamento." };
    }

    if (pagamentos[i].forma_pagamento !== "pix") continue;

    const comprovante = formData.get(`comprovante_pix_${i}`) as File | null;
    if (!comprovante || comprovante.size === 0) continue;

    const extensao = comprovante.name.split(".").pop() ?? "bin";
    const caminho = `${data.id}/${linha.id}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from("comprovantes-pix")
      .upload(caminho, comprovante, { contentType: comprovante.type });

    if (!erroUpload) {
      await supabase.from("pagamentos").update({ comprovante_pix_path: caminho }).eq("id", linha.id);
    }
  }

  redirect(`/atendente/pedidos/${data.id}`);
}
