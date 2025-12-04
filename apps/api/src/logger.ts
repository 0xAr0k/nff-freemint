import { env } from "./env";
import { createPinoLogger } from "./lib/pino";

export const logger = createPinoLogger({
  name: Bun.env.npm_package_name ?? "unknown",
  version: Bun.env.npm_package_version ?? "0.0.0",
  environment: env.NODE_ENV,
  level: env.NODE_ENV === "production" ? "info" : "debug",
});
