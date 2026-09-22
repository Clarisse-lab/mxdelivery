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
  if (perfil.papel !== "atendente") redirect("/motoboy/entregas");

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
      <AtendenteNav nome={perfil.nome} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
