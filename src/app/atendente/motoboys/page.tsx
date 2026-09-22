import { createClient } from "@/lib/supabase/server";
import CriarMotoboyForm from "@/components/atendente/CriarMotoboyForm";
import MotoboysList from "@/components/atendente/MotoboysList";
import type { Perfil } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function MotoboysPage() {
  const supabase = await createClient();
  const { data: motoboys } = await supabase
    .from("perfis")
    .select("*")
    .eq("papel", "motoboy")
    .order("nome");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">Motoboys</h1>
      <CriarMotoboyForm />
      <MotoboysList motoboys={(motoboys as Perfil[]) ?? []} />
    </div>
  );
}
