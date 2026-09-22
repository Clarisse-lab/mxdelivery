import { redirect } from "next/navigation";
import { getPerfilAtual } from "@/lib/auth";
import ContaInativa from "@/components/ContaInativa";

export default async function Home() {
  const perfil = await getPerfilAtual();

  if (!perfil) {
    return (
      <ContaInativa
        titulo="Perfil não encontrado"
        mensagem="Sua conta existe no login, mas não tem um perfil cadastrado. Fale com o atendente da farmácia."
      />
    );
  }

  if (!perfil.ativo) {
    return <ContaInativa />;
  }

  redirect(perfil.papel === "atendente" ? "/atendente/dashboard" : "/motoboy/entregas");
}
