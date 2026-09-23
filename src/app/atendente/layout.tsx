import { redirect } from "next/navigation";
import { getPerfilAtual } from "@/lib/auth";
import ContaInativa from "@/components/ContaInativa";
import AtendenteNav from "@/components/atendente/AtendenteNav";

export default async function AtendenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await getPerfilAtual();

  if (!perfil) redirect("/login");
  if (!perfil.ativo) return <ContaInativa />;
  if (perfil.papel === "motoboy") redirect("/motoboy/entregas");

  return (
    <div className="min-h-screen bg-[#f6f8fb] lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <AtendenteNav nome={perfil.nome} papel={perfil.papel} />
      <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <div className="mx-auto w-full max-w-[1500px]">{children}</div>
      </main>
    </div>
  );
}
