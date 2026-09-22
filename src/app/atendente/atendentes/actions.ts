"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exigirAdmin } from "@/lib/authGuards";
import { revalidatePath } from "next/cache";
import type { EstadoFormConta } from "@/components/atendente/CriarContaForm";

export async function criarAtendente(
  _estadoAnterior: EstadoFormConta,
  formData: FormData,
): Promise<EstadoFormConta> {
  await exigirAdmin();

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
    user_metadata: { nome, telefone: telefone || null, papel: "atendente" },
  });

  if (error) {
    return { erro: error.message };
  }

  revalidatePath("/atendente/atendentes");
  return { sucesso: true };
}

export async function definirAtivo(contaId: string, ativo: boolean) {
  await exigirAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("perfis").update({ ativo }).eq("id", contaId);
  if (error) throw new Error(error.message);

  revalidatePath("/atendente/atendentes");
  revalidatePath("/atendente/motoboys");
}
