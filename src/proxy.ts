import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Além do _next, exclui qualquer arquivo estático (com extensão no
  // último trecho do caminho) — favicon, manifest, ícones, imagens em
  // public/, etc. — pra não redirecionar pro /login quem não está
  // logado só por pedir uma imagem numa página pública.
  matcher: [
    "/((?!_next/static|_next/image|.*\\.[^/]+$).*)",
  ],
};
