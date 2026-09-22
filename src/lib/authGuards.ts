import { createClient } from "@/lib/supabase/server";

// Usado nas server actions de gestão de contas (criar/desativar
// atendente ou motoboy) — só admin pode.
export async function exigirAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel, ativo")
    .eq("id", user.id)
    .single();

  if (perfil?.papel !== "admin" || !perfil.ativo) {
    throw new Error("Apenas administradores podem gerenciar contas.");
  }
}
