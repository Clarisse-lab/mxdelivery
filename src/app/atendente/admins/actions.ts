"use server";

import { createClient } from "@/lib/supabase/server";
import { exigirAdmin } from "@/lib/authGuards";
import {
  criarConvite,
  excluirConvite as excluirConviteBase,
  excluirContaBase,
} from "@/lib/convites";
import { revalidatePath } from "next/cache";
import type { EstadoFormConta } from "@/components/atendente/CriarContaForm";

export async function criarAdmin(
  _estadoAnterior: EstadoFormConta,
  formData: FormData,
): Promise<EstadoFormConta> {
  const resultado = await criarConvite("admin", formData);
  if (resultado.sucesso) revalidatePath("/atendente/admins");
  return resultado;
}

export async function excluirConvite(numero: string) {
  await excluirConviteBase(numero);
  revalidatePath("/atendente/admins");
}

export async function definirAtivo(contaId: string, ativo: boolean) {
  await exigirAdmin();

  // Desativar a própria conta de admin travaria o acesso a essa tela —
  // sem outro admin ativo, ninguém mais consegue reverter.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!ativo && user?.id === contaId) {
    throw new Error("Você não pode desativar sua própria conta.");
  }

  const { error } = await supabase.from("perfis").update({ ativo }).eq("id", contaId);
  if (error) throw new Error(error.message);

  revalidatePath("/atendente/admins");
}

export async function excluirConta(contaId: string) {
  await excluirContaBase(contaId);
  revalidatePath("/atendente/admins");
}
