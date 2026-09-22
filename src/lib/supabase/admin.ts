import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente com a service role key — só pode ser usado em código que roda no
// servidor (Server Actions / Route Handlers), nunca importado por um
// componente cliente. É usado apenas para criar contas de motoboy
// (auth.admin.createUser), já que isso exige privilégio de admin.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
