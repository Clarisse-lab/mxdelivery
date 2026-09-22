"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ContaInativa({
  titulo = "Conta desativada",
  mensagem = "Sua conta não está mais ativa no sistema. Fale com o administrador para reativar o acesso.",
}: {
  titulo?: string;
  mensagem?: string;
}) {
  const router = useRouter();

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow space-y-3">
        <h1 className="text-lg font-semibold text-slate-900">{titulo}</h1>
        <p className="text-sm text-slate-600">{mensagem}</p>
        <button
          onClick={sair}
          className="w-full rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
