"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { definirAtivo } from "@/app/atendente/motoboys/actions";
import type { Perfil } from "@/lib/types/database";

export default function MotoboysList({ motoboys }: { motoboys: Perfil[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function alternar(id: string, ativo: boolean) {
    startTransition(async () => {
      await definirAtivo(id, ativo);
      router.refresh();
    });
  }

  if (motoboys.length === 0) {
    return <p className="text-sm text-slate-500">Nenhum motoboy cadastrado ainda.</p>;
  }

  return (
    <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
      {motoboys.map((m) => (
        <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-900">{m.nome}</p>
            <p className="text-xs text-slate-500">{m.telefone ?? "sem telefone"}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                m.ativo ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
              }`}
            >
              {m.ativo ? "Ativo" : "Inativo"}
            </span>
            <button
              onClick={() => alternar(m.id, !m.ativo)}
              disabled={pending}
              className="text-xs font-medium text-slate-600 underline disabled:opacity-60"
            >
              {m.ativo ? "Desativar" : "Reativar"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
