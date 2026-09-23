"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LogoMaxiPopular from "@/components/LogoMaxiPopular";
import type { Papel } from "@/lib/types/database";

type IconName = "dashboard" | "plus" | "users" | "bike";

const linksBase: { href: string; label: string; icon: IconName }[] = [
  { href: "/atendente/dashboard", label: "Pedidos", icon: "dashboard" },
  { href: "/atendente/pedidos/novo", label: "Novo pedido", icon: "plus" },
];

const linksAdmin: { href: string; label: string; icon: IconName }[] = [
  { href: "/atendente/atendentes", label: "Atendentes", icon: "users" },
  { href: "/atendente/motoboys", label: "Motoboys", icon: "bike" },
];

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    plus: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    bike: (
      <>
        <circle cx="6" cy="17" r="3" />
        <circle cx="18" cy="17" r="3" />
        <path d="M6 17l4-7h4l4 7M10 10 8 6h4M14 10h4l2-3" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      {paths[name]}
    </svg>
  );
}

export default function AtendenteNav({ nome, papel }: { nome: string; papel: Papel }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = papel === "admin" ? [...linksBase, ...linksAdmin] : linksBase;
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <aside className="brand-grid hidden h-screen flex-col overflow-hidden bg-brand-navy-dark text-white lg:sticky lg:top-0 lg:flex">
        <div className="border-b border-white/10 px-6 pb-6 pt-7">
          <div className="rounded-2xl bg-brand-gold px-4 py-5 shadow-[0_18px_45px_rgba(0,0,0,.18)]">
            <LogoMaxiPopular />
          </div>
          <div className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-brand-gold">
              MX Delivery
            </p>
            <p className="mt-1 text-sm text-white/55">Gestão de entregas</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
            Operação
          </p>
          {links.map((link) => {
            const ativo =
              pathname === link.href ||
              (link.href !== "/atendente/dashboard" && pathname.startsWith(link.href));
            const classe = ativo
              ? "bg-brand-gold text-brand-navy-dark shadow-[0_10px_25px_rgba(255,201,40,.15)]"
              : "text-white/70 hover:bg-white/7 hover:text-white";
            return (
              <Link
                key={link.href}
                href={link.href}
                className={"group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold " + classe}
              >
                <Icon name={link.icon} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="m-4 rounded-2xl border border-white/10 bg-white/[0.055] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold text-xs font-black text-brand-navy-dark">
              {iniciais || "MX"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{nome}</p>
              <p className="text-[11px] capitalize text-white/45">{papel}</p>
            </div>
          </div>
          <button
            onClick={sair}
            className="mt-4 w-full rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/65 hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            Sair do sistema
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-brand-navy/10 bg-brand-gold px-4 py-3 shadow-sm lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <LogoMaxiPopular />
          <button
            onClick={sair}
            className="rounded-full border border-brand-navy/15 bg-white/70 px-3 py-1.5 text-xs font-bold text-brand-navy"
          >
            Sair
          </button>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
          {links.map((link) => {
            const ativo = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold " +
                  (ativo ? "bg-brand-navy text-white" : "bg-white/55 text-brand-navy")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
