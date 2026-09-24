"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { emailDoNumero } from "@/lib/numeroLogin";

export type EstadoAtivacao = { erro?: string; sucesso?: boolean };

export async function ativarConta(
  _estadoAnterior: EstadoAtivacao,
  formData: FormData,
): Promise<EstadoAtivacao> {
  const numero = (formData.get("numero") as string)?.trim();
  const senha = formData.get("senha") as string;
  const confirmarSenha = formData.get("confirmar_senha") as string;

  if (!numero || !/^[0-9]+$/.test(numero)) {
    return { erro: "Digite o número que o admin cadastrou pra você." };
  }
  if (!senha || !/^[0-9]{4}$/.test(senha)) {
    return { erro: "A senha precisa ter exatamente 4 números." };
  }
  if (senha !== confirmarSenha) {
    return { erro: "As senhas não coincidem." };
  }

  // Client com a service role — o usuário ainda não tem sessão nenhuma
  // nesse ponto, então a checagem do convite e a criação da conta
  // precisam de um cliente que não dependa de RLS/sessão.
  const admin = createAdminClient();

  const { data: convite, error: erroConvite } = await admin
    .from("convites")
    .select("*")
    .eq("numero", numero)
    .eq("usado", false)
    .maybeSingle();

  if (erroConvite || !convite) {
    return { erro: "Número não encontrado ou já ativado. Fale com o administrador." };
  }

  const { error: erroCriar } = await admin.auth.admin.createUser({
    email: emailDoNumero(numero),
    password: senha,
    email_confirm: true,
    user_metadata: {
      nome: convite.nome,
      telefone: convite.telefone,
      papel: convite.papel,
      numero_login: numero,
    },
  });

  if (erroCriar) {
    return { erro: erroCriar.message };
  }

  await admin
    .from("convites")
    .update({ usado: true, usado_em: new Date().toISOString() })
    .eq("numero", numero);

  return { sucesso: true };
}
