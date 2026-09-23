"use client";

import { useEffect, useState } from "react";

// Timestamp que se atualiza periodicamente, pra forçar recálculo de
// coisas que dependem do relógio (ex.: se um pedido já passou do
// prazo) mesmo sem nenhum pedido mudar no banco.
export function useAgora(intervaloMs = 30_000): number {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);

  return agora;
}
