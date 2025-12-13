import z from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.coerce.number().default(8080),
  MONGODB_URI: z.string(),
  ADMIN_SECRET: z.string().min(1),
  API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  FRONTEND_URL: z.string().optional(),
  RPC_URL: z.string().optional(),
  CONTRACT_ADDRESS: z.string().optional(),
});
export const env = envSchema.parse(Bun.env);
export type EnvBindings = z.infer<typeof envSchema>;
