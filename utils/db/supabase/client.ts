import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/config/env";

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const createClient = () => createBrowserClient(supabaseUrl, supabaseKey);

export const supabaseClient = createClient();
