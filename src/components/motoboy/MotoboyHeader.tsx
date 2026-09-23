"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LogoMaxiPopular from "@/components/LogoMaxiPopular";

const links = [
  { href: "/motoboy/entregas", label: "Entregas" },
  { href: "/motoboy/historico", label: "Histórico" },
];

export default function MotoboyHeader({ nome }: { nome: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b-2 border-brand-navy bg-brand-gold px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <LogoMaxiPopular variante="claro" />
          <p className="text-xs text-brand-navy/70">{nome}</p>
        </div>
        <button onClick={sair} className="text-sm font-medium text-brand-navy/80 hover:text-brand-navy">
          Sair
        </button>
      </div>
      <nav className="mt-2 flex gap-1">
        {links.map((link) => {
          const ativo = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                ativo ? "bg-brand-navy text-white" : "text-brand-navy/80 hover:bg-black/10"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
