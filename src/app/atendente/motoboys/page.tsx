import { redirect } from "next/navigation";
import { getPerfilAtual } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import CriarContaForm from "@/components/atendente/CriarContaForm";
import ContasList from "@/components/atendente/ContasList";
import { criarMotoboy, definirAtivo, excluirConvite } from "./actions";
import type { Perfil, Convite } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function MotoboysPage() {
  const perfil = await getPerfilAtual();
  if (perfil?.papel !== "admin") redirect("/atendente/dashboard");

  const supabase = await createClient();
  const [{ data: motoboys }, { data: convites }] = await Promise.all([
    supabase.from("perfis").select("*").eq("papel", "motoboy").order("nome"),
    supabase
      .from("convites")
      .select("*")
      .eq("papel", "motoboy")
      .eq("usado", false)
      .order("criado_em"),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Motoboys</h1>
      <CriarContaForm titulo="Novo motoboy" rotuloBotao="Cadastrar motoboy" action={criarMotoboy} />
      <ContasList
        contas={(motoboys as Perfil[]) ?? []}
        convitesPendentes={(convites as Convite[]) ?? []}
        definirAtivo={definirAtivo}
        excluirConvite={excluirConvite}
        vazio="Nenhum motoboy cadastrado ainda."
      />
    </div>
  );
}
