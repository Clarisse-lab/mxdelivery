"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  TIPOS_RECEITA,
  type FormaPagamento,
  type NovaReceita,
  type TipoReceita,
} from "@/lib/types/database";

export type EstadoFormEditarPedido = { erro?: string };

const TIPOS_RECEITA_VALIDOS: readonly string[] = TIPOS_RECEITA;
const FORMAS_PAGAMENTO_VALIDAS: readonly string[] = ["dinheiro", "cartao", "pix"];

type PagamentoEditado = {
  forma_pagamento: FormaPagamento;
  valor: number;
  cartao_tipo: "credito" | "debito" | null;
  parcelas: number | null;
  troco_para: number | null;
  pix_pago: boolean | null;
  comprovante_pix_path: string | null;
};

function parsePagamentos(raw: string | null): PagamentoEditado[] {
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
      comprovante_pix_path: typeof p.comprovante_pix_path === "string" ? p.comprovante_pix_path : null,
    }));
}

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

export async function editarPedido(
  pedidoId: string,
  _estadoAnterior: EstadoFormEditarPedido,
  formData: FormData,
): Promise<EstadoFormEditarPedido> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: perfil }, { data: pedidoAtual }] = await Promise.all([
    supabase.from("perfis").select("papel").eq("id", user.id).single(),
    supabase.from("pedidos").select("criado_por").eq("id", pedidoId).single(),
  ]);

  const podeEditar = perfil?.papel === "admin" || pedidoAtual?.criado_por === user.id;
  if (!podeEditar) {
    return { erro: "Você não tem permissão pra editar este pedido." };
  }

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

  const { error: erroPedido } = await supabase
    .from("pedidos")
    .update({
      cliente_nome: clienteNome,
      cliente_telefone: (formData.get("cliente_telefone") as string)?.trim() || null,
      cep: (formData.get("cep") as string)?.trim() || null,
      endereco,
      bairro,
      referencia: (formData.get("referencia") as string)?.trim() || null,
      valor_total: valorTotal,
      precisa_receita: precisaReceita,
      observacoes: (formData.get("observacoes") as string)?.trim() || null,
    })
    .eq("id", pedidoId);

  if (erroPedido) {
    return { erro: erroPedido.message };
  }

  // Substitui as receitas inteiras (mais simples e seguro do que tentar
  // diferenciar quais linhas mudaram) — mesma lógica de "recriar" usada
  // na criação do pedido.
  const { error: erroLimpar } = await supabase.from("receitas").delete().eq("pedido_id", pedidoId);
  if (erroLimpar) {
    return { erro: erroLimpar.message };
  }

  if (receitas.length > 0) {
    const { error: erroReceitas } = await supabase
      .from("receitas")
      .insert(receitas.map((r) => ({ ...r, pedido_id: pedidoId })));

    if (erroReceitas) {
      return { erro: erroReceitas.message };
    }
  }

  // Pega os comprovantes já existentes antes de recriar os pagamentos —
  // precisa saber quais arquivos do Storage ficam órfãos (linha removida
  // ou com comprovante substituído) pra limpar depois.
  const { data: pagamentosAntigos } = await supabase
    .from("pagamentos")
    .select("comprovante_pix_path")
    .eq("pedido_id", pedidoId);

  const { error: erroLimparPagamentos } = await supabase
    .from("pagamentos")
    .delete()
    .eq("pedido_id", pedidoId);
  if (erroLimparPagamentos) {
    return { erro: erroLimparPagamentos.message };
  }

  const caminhosMantidos = new Set<string>();

  for (let i = 0; i < pagamentos.length; i++) {
    const pg = pagamentos[i];
    const { data: linha, error: erroInsert } = await supabase
      .from("pagamentos")
      .insert({
        forma_pagamento: pg.forma_pagamento,
        valor: pg.valor,
        cartao_tipo: pg.cartao_tipo,
        parcelas: pg.parcelas,
        troco_para: pg.troco_para,
        pix_pago: pg.pix_pago,
        pedido_id: pedidoId,
      })
      .select("id")
      .single();

    if (erroInsert || !linha) {
      return { erro: erroInsert?.message ?? "Erro ao salvar pagamento." };
    }

    if (pg.forma_pagamento !== "pix") continue;

    const novoArquivo = formData.get(`comprovante_pix_${i}`) as File | null;
    let caminhoFinal = pg.comprovante_pix_path;

    if (novoArquivo && novoArquivo.size > 0) {
      const extensao = novoArquivo.name.split(".").pop() ?? "bin";
      const novoCaminho = `${pedidoId}/${linha.id}.${extensao}`;

      const { error: erroUpload } = await supabase.storage
        .from("comprovantes-pix")
        .upload(novoCaminho, novoArquivo, { contentType: novoArquivo.type });

      caminhoFinal = erroUpload ? pg.comprovante_pix_path : novoCaminho;
    }

    if (caminhoFinal) {
      await supabase.from("pagamentos").update({ comprovante_pix_path: caminhoFinal }).eq("id", linha.id);
      caminhosMantidos.add(caminhoFinal);
    }
  }

  const caminhosAntigos = ((pagamentosAntigos as { comprovante_pix_path: string | null }[]) ?? [])
    .map((pg) => pg.comprovante_pix_path)
    .filter((path): path is string => Boolean(path));
  const caminhosParaRemover = caminhosAntigos.filter((path) => !caminhosMantidos.has(path));

  if (caminhosParaRemover.length > 0) {
    await supabase.storage.from("comprovantes-pix").remove(caminhosParaRemover);
  }

  revalidatePath(`/atendente/pedidos/${pedidoId}`);
  revalidatePath("/atendente/dashboard");
  redirect(`/atendente/pedidos/${pedidoId}`);
}
