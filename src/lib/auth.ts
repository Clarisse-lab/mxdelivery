import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types/database";

// Memoizado por requisição (React cache()) — o layout de cada área
// (atendente/motoboy) já chama getPerfilAtual(), e quase toda page chama
// de novo pra pegar papel/id. Sem isso, cada carregamento de página fazia
// a verificação de sessão (round-trip até o Supabase Auth) e a consulta
// em "perfis" duas vezes seguidas.
export const getPerfilAtual = cache(async (): Promise<Perfil | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select("*")
    .eq("id", user.id)
    .single();

  return (perfil as Perfil) ?? null;
});
