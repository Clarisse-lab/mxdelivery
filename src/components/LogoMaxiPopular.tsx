import Image from "next/image";

export default function LogoMaxiPopular({
  className,
  tamanho = "normal",
}: {
  className?: string;
  tamanho?: "normal" | "grande";
}) {
  const altura = tamanho === "grande" ? "h-11" : "h-8";

  return (
    <Image
      src="/brand/logo-maxi-popular.png"
      alt="Drogarias Maxi Popular"
      width={694}
      height={286}
      priority
      className={`w-auto ${altura} ${className ?? ""}`}
    />
  );
}
