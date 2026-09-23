export default function LogoMaxiPopular({
  className,
  tamanho = "normal",
  variante = "claro",
}: {
  className?: string;
  tamanho?: "normal" | "grande";
  variante?: "claro" | "escuro";
}) {
  const grande = tamanho === "grande";
  const azul = variante === "escuro" ? "text-white" : "text-brand-navy";
  const popular = variante === "escuro" ? "text-brand-gold" : "text-brand-red";

  return (
    <div className={"flex items-center " + (grande ? "gap-3" : "gap-2.5") + " " + (className ?? "")}>
      <svg
        viewBox="0 0 44 44"
        className={grande ? "h-11 w-11 shrink-0" : "h-8 w-8 shrink-0"}
        aria-hidden="true"
      >
        <rect x="16" y="2" width="12" height="12" rx="1.6" fill="#ca2633" />
        <rect x="16" y="30" width="12" height="12" rx="1.6" fill="#ca2633" />
        <rect x="2" y="16" width="12" height="12" rx="1.6" fill="#ca2633" />
        <rect x="30" y="16" width="12" height="12" rx="1.6" fill="#ca2633" />
        <rect x="16" y="16" width="12" height="12" rx="1.6" fill="#ffc928" />
      </svg>

      <div className="relative leading-none">
        <span
          className={
            "absolute left-[2px] font-bold uppercase tracking-[0.08em] text-brand-red " +
            (grande ? "-top-3 text-[9px]" : "-top-2.5 text-[7px]")
          }
        >
          Drogarias
        </span>
        <div className={"font-black tracking-[-0.06em] " + azul + " " + (grande ? "text-[34px]" : "text-[24px]")}>
          Maxi
        </div>
        <div
          className={
            "font-extrabold tracking-[-0.035em] " +
            popular +
            " " +
            (grande ? "-mt-0.5 text-[18px]" : "-mt-0.5 text-[13px]")
          }
        >
          Popular
        </div>
      </div>
    </div>
  );
}
