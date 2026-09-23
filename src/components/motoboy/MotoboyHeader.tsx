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
    <header className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-brand-navy bg-brand-gold px-4 py-3 shadow-sm">
      <div>
        <LogoMaxiPopular variante="claro" />
        <p className="text-xs text-brand-navy/70">{nome}</p>
      </div>
      <button onClick={sair} className="text-sm font-medium text-brand-navy/80 hover:text-brand-navy">
        Sair
      </button>
    </header>
  );
}
