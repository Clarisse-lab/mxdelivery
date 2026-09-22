import { redirect } from "next/navigation";
import { getPerfilAtual } from "@/lib/auth";
import ContaInativa from "@/components/ContaInativa";
import MotoboyHeader from "@/components/motoboy/MotoboyHeader";

export default async function MotoboyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await getPerfilAtual();

  if (!perfil) redirect("/login");
  if (!perfil.ativo) return <ContaInativa />;
  if (perfil.papel !== "motoboy") redirect("/atendente/dashboard");

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
      <MotoboyHeader nome={perfil.nome} />
      <main className="flex-1 px-4 py-4">{children}</main>
    </div>
  );
}
