import { createClient } from "@/lib/supabase/server";
import { exigirAdmin } from "@/lib/authGuards";
import type { Papel } from "@/lib/types/database";
import type { EstadoFormConta } from "@/components/atendente/CriarContaForm";

// Usado pelas server actions de atendentes/motoboys — não é uma action
// em si (sem "use server"), só lógica compartilhada entre as duas.
export async function criarConvite(papel: Papel, formData: FormData): Promise<EstadoFormConta> {
  await exigirAdmin();

  const nome = (formData.get("nome") as string)?.trim();
  const telefone = (formData.get("telefone") as string)?.trim();
  const numero = (formData.get("numero") as string)?.trim();

  if (!nome || !numero) {
    return { erro: "Preencha nome e número." };
  }
  if (!/^[0-9]+$/.test(numero)) {
    return { erro: "O número deve conter só dígitos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("convites").insert({
    numero,
    nome,
    telefone: telefone || null,
    papel,
  });

  if (error) {
    if (error.code === "23505") {
      return { erro: "Já existe um convite ou conta com esse número." };
    }
    return { erro: error.message };
  }

  return { sucesso: true };
}

export async function excluirConvite(numero: string) {
  await exigirAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("convites")
    .delete()
    .eq("numero", numero)
    .eq("usado", false);
  if (error) throw new Error(error.message);
}
