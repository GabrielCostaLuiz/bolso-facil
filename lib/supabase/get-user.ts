import type { User } from "@/types/user";
import { createClient } from "@/utils/db/supabase/server";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  const user = data.user?.user_metadata as User | undefined;

  if (!user) {
    return null;
  }

  user.sub = data.user?.id ?? "";

  return user;
}
