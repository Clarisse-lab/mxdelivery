"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-slate-900">Farmácia Valadares</span>
          <nav className="flex gap-1">
            {links.map((link) => {
              const ativo = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    ativo
                      ? "bg-emerald-100 text-emerald-800"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>{nome}</span>
          <button onClick={sair} className="font-medium text-slate-500 hover:text-slate-800">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
