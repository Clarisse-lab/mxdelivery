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

  const lista = (motoboys as Perfil[]) ?? [];
  const ativos = lista.filter((item) => item.ativo).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-brand-gold px-6 py-6 shadow-[0_18px_42px_rgba(205,160,0,.12)] sm:px-7">
        <div className="absolute -right-14 -top-24 h-56 w-56 rounded-full border-[38px] border-white/20" />
        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-red">
              Gestão de entregas
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.045em] text-brand-navy-dark">
              Motoboys
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-brand-navy/65">
              Organize a equipe de entrega e controle quais profissionais podem receber pedidos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MiniStat valor={lista.length} label="Cadastrados" />
            <MiniStat valor={ativos} label="Ativos" destaque />
          </div>
        </div>
      </section>

      <CriarContaForm
        titulo="Novo motoboy"
        descricao="Cadastre o entregador para que ele possa acessar a fila, iniciar rotas e finalizar pedidos."
        rotuloBotao="Cadastrar motoboy"
        action={criarMotoboy}
      />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4 px-1">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-gold-dark">
              Equipe cadastrada
            </p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.035em] text-brand-navy-dark">
              Profissionais de entrega
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">{lista.length} no total</span>
        </div>

        <ContasList
          contas={lista}
          convitesPendentes={(convites as Convite[]) ?? []}
          definirAtivo={definirAtivo}
          excluirConvite={excluirConvite}
          vazio="Nenhum motoboy cadastrado ainda."
          rotulo="Motoboy"
        />
      </section>
    </div>
  );
}

function MiniStat({
  valor,
  label,
  destaque = false,
}: {
  valor: number;
  label: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={
        "min-w-[104px] rounded-2xl px-4 py-3 " +
        (destaque ? "bg-brand-navy text-white" : "bg-white/60 text-brand-navy-dark")
      }
    >
      <p className="text-xl font-black tracking-[-0.04em]">{valor}</p>
      <p className={"text-[10px] font-semibold " + (destaque ? "text-white/55" : "text-brand-navy/50")}>
        {label}
      </p>
    </div>
  );
}
