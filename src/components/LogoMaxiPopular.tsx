// Marca provisória (cruz + wordmark) nas cores da Maxi Popular, até a
// logo oficial em arquivo ser enviada e trocada aqui.
export default function LogoMaxiPopular({
  className,
  tamanho = "normal",
  variante = "claro",
}: {
  className?: string;
  tamanho?: "normal" | "grande";
  /** "claro": pra fundo branco (Maxi em azul). "escuro": pra fundo azul/escuro (Maxi em branco). */
  variante?: "claro" | "escuro";
}) {
  const textoClasse = tamanho === "grande" ? "text-2xl" : "text-base";
  const iconeTamanho = tamanho === "grande" ? 34 : 24;
  const corMaxi = variante === "escuro" ? "text-white" : "text-brand-navy";
  const corPopular = variante === "escuro" ? "text-brand-gold" : "text-brand-red";

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <svg width={iconeTamanho} height={iconeTamanho} viewBox="0 0 28 28" aria-hidden="true">
        <rect x="11" y="2" width="6" height="24" rx="1.5" fill="var(--brand-red)" />
        <rect x="2" y="11" width="24" height="6" rx="1.5" fill="var(--brand-red)" />
      </svg>
      <span className={`font-extrabold leading-none tracking-tight ${corMaxi} ${textoClasse}`}>
        Maxi <span className={corPopular}>Popular</span>
      </span>
    </div>
  );
}
