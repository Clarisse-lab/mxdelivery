"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MotoboyHeader({ nome }: { nome: string }) {
  const router = useRouter();

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">Farmácia Valadares</p>
        <p className="text-xs text-slate-500">{nome}</p>
      </div>
      <button onClick={sair} className="text-sm font-medium text-slate-500">
        Sair
      </button>
    </header>
  );
}
