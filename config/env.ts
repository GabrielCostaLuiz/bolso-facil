import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

try {
  envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
} catch (err) {
  if (err instanceof z.ZodError) {
    console.error("\n❌ Erro de configuração nas variáveis de ambiente:\n");
    for (const issue of err.issues) {
      console.error(`- ${issue.path.join(".")}: ${issue.message}`);
    }
    console.error(
      "\n💡 Corrija as variáveis no seu .env ou ambiente antes de rodar o projeto.\n"
    );
    process.exit(1); // encerra o processo
  }
  throw err; // se for outro erro, relança
}

const _env = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export const env = envSchema.parse(_env);
