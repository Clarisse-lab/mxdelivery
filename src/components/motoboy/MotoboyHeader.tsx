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
    <header className="sticky top-0 z-40 overflow-hidden border-b border-brand-navy/10 bg-brand-gold shadow-[0_8px_28px_rgba(13,49,94,.09)]">
      <div className="mx-auto max-w-2xl px-4 pb-3 pt-3.5">
        <div className="flex items-center justify-between gap-3">
          <Link href="/motoboy/entregas">
            <LogoMaxiPopular />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-extrabold text-brand-navy-dark">{nome}</p>
              <p className="text-[10px] font-bold text-brand-navy/50">Entregador · <span className="text-emerald-700">● Online</span></p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy text-[11px] font-black text-white">
              {iniciais || "MX"}
            </div>
            <button
              onClick={sair}
              className="rounded-full border border-brand-navy/15 bg-white/65 px-3 py-1.5 text-[11px] font-bold text-brand-navy"
            >
              Sair
            </button>
          </div>
        </div>

        <nav className="mt-3 flex rounded-xl bg-brand-navy/8 p-1">
          {links.map((link) => {
            const ativo = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  "flex-1 rounded-lg px-3 py-2 text-center text-xs font-extrabold " +
                  (ativo ? "bg-brand-navy text-white shadow-sm" : "text-brand-navy/65")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
