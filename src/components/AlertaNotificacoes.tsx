"use client";

import { useState, useSyncExternalStore } from "react";
import { notificacoesSuportadas, pedirPermissaoNotificacao, permissaoNotificacao } from "@/lib/utils/notificacoes";
import { tocarBeep } from "@/lib/utils/beep";

const CHAVE_DISPENSADO = "mx-alerta-notificacoes-dispensado";

function inscrever() {
  return () => {};
}

function podeOferecer() {
  if (!notificacoesSuportadas()) return false;
  if (permissaoNotificacao() !== "default") return false;
  try {
    if (localStorage.getItem(CHAVE_DISPENSADO) === "1") return false;
  } catch {
    // localStorage indisponível (ex.: navegação privada) — mostra o banner mesmo assim.
  }
  return true;
}

function podeOferecerNoServidor() {
  return false;
}

export default function AlertaNotificacoes({ mensagem }: { mensagem: string }) {
  // Lê Notification.permission/localStorage sem useEffect: no servidor
  // sempre retorna false (evita mismatch de hidratação), e no cliente
  // já chega com o valor real desde a primeira renderização.
  const podeMostrar = useSyncExternalStore(inscrever, podeOferecer, podeOferecerNoServidor);
  const [dispensadoAgora, setDispensadoAgora] = useState(false);

  if (!podeMostrar || dispensadoAgora) return null;

  function dispensar() {
    setDispensadoAgora(true);
    try {
      localStorage.setItem(CHAVE_DISPENSADO, "1");
    } catch {
      // sem problema não persistir — só volta a aparecer na próxima visita.
    }
  }

  async function ativar() {
    await pedirPermissaoNotificacao();
    tocarBeep();
    setDispensadoAgora(true);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-gold/40 bg-brand-gold-soft/60 px-4 py-3">
      <p className="flex-1 text-xs font-bold text-brand-navy-dark">🔔 {mensagem}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={ativar}
          className="rounded-xl bg-brand-navy px-3 py-1.5 text-xs font-extrabold text-white hover:bg-brand-navy-dark"
        >
          Ativar alertas
        </button>
        <button
          type="button"
          onClick={dispensar}
          className="rounded-xl px-3 py-1.5 text-xs font-bold text-brand-navy/55 hover:text-brand-navy"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
