# Sistema de Entregas — Farmácia Valadares

App web (Next.js + Tailwind + Supabase) para substituir o controle manual
de entregas em papel. Três papéis: **admin** (controle total, incluindo
gestão de contas de atendente e motoboy), **atendente** (cadastra
pedidos, acompanha tudo em tempo real) e **motoboy** (pega entregas numa
fila compartilhada, navega até o cliente e finaliza com checklist
obrigatório).

Modelo de atribuição adotado: **fila compartilhada** — o pedido nasce sem
motoboy e qualquer motoboy ativo pode "pegar" (self-claim); o atendente
também pode atribuir/reatribuir manualmente a qualquer momento.

## 1. Criar e configurar o projeto Supabase

Este projeto ainda não está conectado a nenhum Supabase real — o schema
está versionado como migrations SQL em `supabase/migrations/`.

1. Crie um projeto em [supabase.com](https://supabase.com) (ou use um que
   já exista).
2. Abra o **SQL Editor** do projeto e execute os arquivos de
   `supabase/migrations/` **em ordem** (0001 → 0006), colando o conteúdo
   de cada um. Alternativamente, use a Supabase CLI:
   ```bash
   supabase link --project-ref <seu-project-ref>
   supabase db push
   ```
3. Em **Project Settings → API**, copie a `Project URL`, a `anon` /
   `publishable` key e a `service_role` key.
4. Copie `.env.local.example` para `.env.local` e preencha as três
   variáveis.

## 2. Criar o primeiro admin

Não existe cadastro público — atendentes e motoboys são cadastrados por
um admin dentro do sistema (telas **Atendentes** e **Motoboys**), e o
primeiro admin precisa ser criado manualmente uma única vez:

1. No painel do Supabase, vá em **Authentication → Users → Add user** e
   crie o usuário com e-mail/senha (marque "Auto Confirm User").
2. No **SQL Editor**, promova esse usuário a admin (o gatilho
   `handle_new_user` já criou o perfil dele como `motoboy` por padrão):
   ```sql
   update perfis set papel = 'admin', nome = 'Seu nome'
   where id = '<uuid do usuário criado>';
   ```
3. Faça login com esse e-mail/senha em `/login` — você cai no dashboard,
   agora com acesso também às telas **Atendentes** e **Motoboys**.

A partir daí, use essas duas telas para cadastrar atendentes e
motoboys — isso já cria o login de cada um.

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## 4. Estrutura

- `supabase/migrations/` — schema, RLS, funções RPC (`pegar_pedido`,
  `iniciar_rota`, `finalizar_entrega`, `marcar_problema`) e a trigger que
  garante a "regra de ouro" (não finaliza entrega com receita/troco
  pendente) direto no banco — não dá pra pular essa checagem só chamando
  a API.
- `src/app/atendente/` — dashboard (kanban em tempo real), novo pedido,
  detalhe do pedido (reatribuir motoboy / cancelar) — acessível a admin e
  atendente. As telas **Atendentes** e **Motoboys** (gestão de contas)
  ficam no mesmo grupo de rotas mas são restritas a admin.
- `src/app/motoboy/` — minhas entregas + fila compartilhada, detalhe do
  pedido (iniciar rota → abre o Google Maps), finalizar entrega
  (checklist).
- `src/lib/supabase/` — clients Supabase (browser, server, admin) e o
  middleware que renova a sessão e protege as rotas.

## 5. Deploy

Funciona tanto na Vercel (zero-config) quanto num VPS via Docker/EasyPanel
— só precisa das mesmas três variáveis de ambiente do passo 1.

## 6. Fora do escopo deste MVP

Notificações via WhatsApp (Edge Function + Evolution API), rota otimizada
multi-parada e funcionamento offline ficam para as fases 2/3 (ver
especificação original).
