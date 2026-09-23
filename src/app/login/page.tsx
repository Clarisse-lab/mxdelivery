"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LogoMaxiPopular from "@/components/LogoMaxiPopular";
import { emailDoNumero, pareceNumero } from "@/lib/numeroLogin";

export default function LoginPage() {
  const router = useRouter();
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const email = pareceNumero(identificador)
      ? emailDoNumero(identificador)
      : identificador.trim();

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setCarregando(false);
      setErro("Número/e-mail ou senha inválidos.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-brand-cream lg:grid lg:grid-cols-[46%_54%]">
      <section className="brand-grid relative isolate flex min-h-[320px] overflow-hidden bg-brand-gold px-6 py-8 sm:px-10 lg:min-h-screen lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <div className="absolute -right-24 top-[-8rem] h-[28rem] w-[28rem] rounded-full border-[72px] border-white/16" />
        <div className="absolute -bottom-40 -left-32 h-[30rem] w-[30rem] rounded-full bg-white/18 blur-2xl" />
        <div className="relative z-10">
          <LogoMaxiPopular tamanho="grande" />
          <div className="mt-5 flex items-center gap-3">
            <span className="h-px w-10 bg-brand-navy/35" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-brand-navy/65">
              MX Delivery
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-auto hidden max-w-lg lg:block">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-brand-red">
            Gestão inteligente
          </p>
          <h1 className="mt-4 max-w-md text-5xl font-black leading-[1.03] tracking-[-0.05em] text-brand-navy-dark">
            Cada entrega, mais cuidado.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-brand-navy/70">
            Um sistema pensado para dar mais agilidade à operação e levar saúde mais perto de cada cliente.
          </p>

          <div className="mt-9 grid max-w-md grid-cols-3 gap-3">
            {[
              ["01", "Mais agilidade"],
              ["02", "Mais controle"],
              ["03", "Mais cuidado"],
            ].map(([numero, rotulo]) => (
              <div key={numero} className="rounded-2xl border border-brand-navy/10 bg-white/35 p-4 backdrop-blur-sm">
                <p className="text-xs font-black text-brand-navy/35">{numero}</p>
                <p className="mt-2 text-sm font-extrabold text-brand-navy-dark">{rotulo}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="w-full max-w-[460px]">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-navy/8 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-navy/55 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Sistema operacional
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-[-0.045em] text-brand-navy-dark sm:text-4xl">
              Bem-vindo de volta.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Entre com seus dados para acessar a central de entregas Maxi Popular.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="premium-panel rounded-[28px] p-6 sm:p-8">
            <div className="space-y-5">
              <div>
                <label htmlFor="identificador" className="mb-2 block text-xs font-bold uppercase tracking-[0.11em] text-brand-navy/65">
                  Número ou e-mail
                </label>
                <input
                  id="identificador"
                  type="text"
                  required
                  autoComplete="username"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  placeholder="ex.: 123"
                  className="premium-input w-full rounded-xl px-4 py-3.5 text-[15px] text-slate-900 placeholder:text-slate-350"
                />
              </div>

              <div>
                <label htmlFor="senha" className="mb-2 block text-xs font-bold uppercase tracking-[0.11em] text-brand-navy/65">
                  Senha
                </label>
                <input
                  id="senha"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="premium-input w-full rounded-xl px-4 py-3.5 text-[15px] text-slate-900 placeholder:text-slate-350"
                />
              </div>
            </div>

            {erro && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy py-3.5 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(11,49,95,.18)] hover:-translate-y-0.5 hover:bg-brand-navy-dark disabled:translate-y-0 disabled:opacity-60"
            >
              {carregando ? "Entrando..." : "Entrar no MX Delivery"}
              {!carregando && <span aria-hidden="true">→</span>}
            </button>

            <div className="mt-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-100" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-350">
                Maxi Popular
              </p>
              <span className="h-px flex-1 bg-slate-100" />
            </div>
            <p className="mt-4 text-center text-xs leading-5 text-slate-400">
              Mais saúde, mais perto de você.
            </p>

            <p className="mt-4 text-center text-sm text-slate-500">
              Primeiro acesso?{" "}
              <Link href="/primeiro-acesso" className="font-bold text-brand-navy underline">
                Criar senha
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
