import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/supabase/get-user";
import type { User } from "@/types/user";
import { createClient } from "./db/supabase/server";

export async function CheckUserAndDB(): Promise<{
  db: SupabaseClient<any, "public", any>;
  user: User | null;
}> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { db: supabase, user: null };
  }
  return { db: supabase, user };
}
