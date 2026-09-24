"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { TIPOS_RECEITA, type NovaReceita, type TipoReceita } from "@/lib/types/database";

export type EstadoFormEditarPedido = { erro?: string };

const TIPOS_RECEITA_VALIDOS: readonly string[] = TIPOS_RECEITA;

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

  if (!clienteNome || !endereco || !bairro) {
    return { erro: "Preencha cliente, endereço e bairro." };
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

  revalidatePath(`/atendente/pedidos/${pedidoId}`);
  revalidatePath("/atendente/dashboard");
  redirect(`/atendente/pedidos/${pedidoId}`);
}
