"use server";

import { createClient } from "@/lib/supabase/server";

export type ClienteSugestao = {
  cliente_nome: string;
  cliente_telefone: string | null;
  endereco: string;
  bairro: string | null;
  referencia: string | null;
};

// Busca clientes já atendidos antes (a partir do histórico de pedidos)
// pra preencher o formulário de novo pedido automaticamente.
export async function buscarClientes(termo: string): Promise<ClienteSugestao[]> {
  const termoLimpo = termo.trim();
  if (termoLimpo.length < 2) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("pedidos")
    .select("cliente_nome, cliente_telefone, endereco, bairro, referencia")
    .ilike("cliente_nome", `%${termoLimpo}%`)
    .order("criado_em", { ascending: false })
    .limit(30);

  if (!data) return [];

  const vistos = new Set<string>();
  const sugestoes: ClienteSugestao[] = [];

  for (const pedido of data) {
    const chave = `${pedido.cliente_nome.toLowerCase()}|${pedido.cliente_telefone ?? ""}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);

    sugestoes.push({
      cliente_nome: pedido.cliente_nome,
      cliente_telefone: pedido.cliente_telefone,
      endereco: pedido.endereco,
      bairro: pedido.bairro,
      referencia: pedido.referencia,
    });

    if (sugestoes.length >= 6) break;
  }

  return sugestoes;
}
