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

export async function criarAtendente(
  _estadoAnterior: EstadoFormConta,
  formData: FormData,
): Promise<EstadoFormConta> {
  const resultado = await criarConvite("atendente", formData);
  if (resultado.sucesso) revalidatePath("/atendente/atendentes");
  return resultado;
}

export async function excluirConvite(numero: string) {
  await excluirConviteBase(numero);
  revalidatePath("/atendente/atendentes");
}

export async function definirAtivo(contaId: string, ativo: boolean) {
  await exigirAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("perfis").update({ ativo }).eq("id", contaId);
  if (error) throw new Error(error.message);

  revalidatePath("/atendente/atendentes");
  revalidatePath("/atendente/motoboys");
}

export async function excluirConta(contaId: string) {
  await excluirContaBase(contaId);
  revalidatePath("/atendente/atendentes");
  revalidatePath("/atendente/motoboys");
}
