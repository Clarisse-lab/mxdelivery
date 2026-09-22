"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LogoMaxiPopular from "@/components/LogoMaxiPopular";
import type { Papel } from "@/lib/types/database";

const linksBase = [
  { href: "/atendente/dashboard", label: "Pedidos" },
  { href: "/atendente/pedidos/novo", label: "Novo pedido" },
];

const linksAdmin = [
  { href: "/atendente/atendentes", label: "Atendentes" },
  { href: "/atendente/motoboys", label: "Motoboys" },
];

export default function AtendenteNav({ nome, papel }: { nome: string; papel: Papel }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = papel === "admin" ? [...linksBase, ...linksAdmin] : linksBase;

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b-2 border-brand-gold bg-brand-navy shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <LogoMaxiPopular variante="escuro" />
          <nav className="flex gap-1">
            {links.map((link) => {
              const ativo = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    ativo
                      ? "bg-white/15 text-brand-gold"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/80">
          <span>{nome}</span>
          <button onClick={sair} className="font-medium hover:text-white">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
