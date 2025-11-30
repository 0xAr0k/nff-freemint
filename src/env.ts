import z from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  UPSTASH_REDIS_REST_URL: z.string().url().trim(),
  UPSTASH_REDIS_REST_TOKEN: z.string().trim(),
  MONGODB_URI: z.string(),
  ADMIN_SECRET: z.string().min(1),
  API_KEY: z.string().min(1),
});

export const env = envSchema.parse(Bun.env);

export type EnvBindings = z.infer<typeof envSchema>;
