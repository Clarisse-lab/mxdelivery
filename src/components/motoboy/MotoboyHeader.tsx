"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LogoMaxiPopular from "@/components/LogoMaxiPopular";

export default function MotoboyHeader({ nome }: { nome: string }) {
  const router = useRouter();

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-brand-gold bg-brand-navy px-4 py-3 shadow-sm">
      <div>
        <LogoMaxiPopular variante="escuro" />
        <p className="text-xs text-white/70">{nome}</p>
      </div>
      <button onClick={sair} className="text-sm font-medium text-white/80 hover:text-white">
        Sair
      </button>
    </header>
  );
}
