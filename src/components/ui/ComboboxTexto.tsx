"use client";

import { useEffect, useRef, useState } from "react";

// Combobox de texto livre com sugestões: diferente de um <input list> com
// <datalist> nativo, o dropdown sempre reabre ao clicar na setinha ou no
// campo, mesmo quando o valor já bate com uma sugestão (o datalist nativo
// do navegador só reabre depois de apagar o texto).
export default function ComboboxTexto({
  id,
  name,
  opcoes,
  required,
  placeholder,
  className,
  defaultValue = "",
}: {
  id: string;
  name: string;
  opcoes: string[];
  required?: boolean;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
}) {
  const [valor, setValor] = useState(defaultValue);
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const filtradas = valor.trim()
    ? opcoes.filter((o) => o.toLowerCase().includes(valor.trim().toLowerCase()))
    : opcoes;

  function selecionar(opcao: string) {
    setValor(opcao);
    setAberto(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id={id}
        name={name}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
        value={valor}
        onChange={(e) => {
          setValor(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        className={`${className ?? ""} pr-10`}
      />
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        tabIndex={-1}
        aria-label="Mostrar sugestões"
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-600"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M2 5l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {aberto && filtradas.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {filtradas.map((opcao) => (
            <li key={opcao}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selecionar(opcao)}
                className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                {opcao}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
