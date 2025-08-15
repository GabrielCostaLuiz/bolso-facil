import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/supabase/get-user";
import type { User } from "@/types/user";
import { createClient } from "./db/supabase/server";
import { AppError } from "./handleError";

export async function CheckUserAndDB(): Promise<{
  db: SupabaseClient<any, "public", any>;
  user: User;
}> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    throw new AppError("Usuário não autenticado", {
      statusCode: 401,
      details: "Usuário não autenticado",
    });
  }
  return { db: supabase, user };
}
