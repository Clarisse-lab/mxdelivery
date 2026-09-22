import { redirect } from "next/navigation";
import { getPerfilAtual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import CriarContaForm from "@/components/atendente/CriarContaForm";
import ContasList from "@/components/atendente/ContasList";
import { criarAtendente, definirAtivo } from "./actions";
import type { Perfil } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function AtendentesPage() {
  const perfil = await getPerfilAtual();
  if (perfil?.papel !== "admin") redirect("/atendente/dashboard");

  const supabase = await createClient();
  const { data: atendentes } = await supabase
    .from("perfis")
    .select("*")
    .eq("papel", "atendente")
    .order("nome");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Atendentes</h1>
      <CriarContaForm
        titulo="Novo atendente"
        rotuloBotao="Cadastrar atendente"
        action={criarAtendente}
      />
      <ContasList
        contas={(atendentes as Perfil[]) ?? []}
        definirAtivo={definirAtivo}
        vazio="Nenhum atendente cadastrado ainda."
      />
    </div>
  );
}
