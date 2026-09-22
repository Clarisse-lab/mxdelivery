"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function exigirAtendente() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (perfil?.papel !== "atendente") {
    throw new Error("Apenas atendentes podem gerenciar motoboys.");
  }
}

export type EstadoFormMotoboy = { erro?: string; sucesso?: boolean };

export async function criarMotoboy(
  _estadoAnterior: EstadoFormMotoboy,
  formData: FormData,
): Promise<EstadoFormMotoboy> {
  await exigirAtendente();

  const nome = (formData.get("nome") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const telefone = (formData.get("telefone") as string)?.trim();
  const senha = formData.get("senha") as string;

  if (!nome || !email || !senha) {
    return { erro: "Preencha nome, e-mail e senha." };
  }
  if (senha.length < 6) {
    return { erro: "A senha precisa ter pelo menos 6 caracteres." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, telefone: telefone || null, papel: "motoboy" },
  });

  if (error) {
    return { erro: error.message };
  }

  revalidatePath("/atendente/motoboys");
  return { sucesso: true };
}

export async function definirAtivo(motoboyId: string, ativo: boolean) {
  await exigirAtendente();

  const supabase = await createClient();
  const { error } = await supabase.from("perfis").update({ ativo }).eq("id", motoboyId);
  if (error) throw new Error(error.message);

  revalidatePath("/atendente/motoboys");
}
