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
    <div className="min-h-screen bg-[#f5f7fa]">
      <MotoboyHeader nome={perfil.nome} />
      <main className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-5 sm:py-6">{children}</main>
    </div>
  );
}
