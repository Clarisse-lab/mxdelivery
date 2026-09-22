import { redirect } from "next/navigation";
import { getPerfilAtual } from "@/lib/auth";
import ContaInativa from "@/components/ContaInativa";

export default async function Home() {
  const perfil = await getPerfilAtual();

  if (!perfil) {
    return (
      <ContaInativa
        titulo="Perfil não encontrado"
        mensagem="Sua conta existe no login, mas não tem um perfil cadastrado. Fale com o administrador do sistema."
      />
    );
  }

  if (!perfil.ativo) {
    return <ContaInativa />;
  }

  redirect(perfil.papel === "motoboy" ? "/motoboy/entregas" : "/atendente/dashboard");
}
