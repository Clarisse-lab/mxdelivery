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
    <header className="border-b-2 border-brand-navy bg-brand-gold shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <LogoMaxiPopular variante="claro" />
          <nav className="flex gap-1">
            {links.map((link) => {
              const ativo = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    ativo
                      ? "bg-brand-navy text-white"
                      : "text-brand-navy/80 hover:bg-black/10 hover:text-brand-navy"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-brand-navy/80">
          <span>{nome}</span>
          <button onClick={sair} className="font-medium hover:text-brand-navy">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
