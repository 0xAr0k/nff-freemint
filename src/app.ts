import { Hono } from "hono";
import { badRequest, notFound, unexpectedError, ok } from "./utils/response";
import { cors } from "hono/cors";
import { trimTrailingSlash } from "hono/trailing-slash";
import { HTTPResponseError } from "hono/types";
import { logger } from "./logger";
import adminRoute from "./routes/admin";
import formRoute from "./routes/form";
import { env, EnvBindings } from "./env";
import { Redis } from "@upstash/redis";

declare module "hono" {
  interface ContextVariableMap {
    env: EnvBindings;
    redis: Redis;
  }
}

const app = new Hono();

app
  .use(cors())
  .use(trimTrailingSlash())
  .use("*", async (c, next) => {
    c.set("env", env);
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL.trim(),
      token: env.UPSTASH_REDIS_REST_TOKEN.trim(),
    });
    if (!redis) return unexpectedError(c);
    c.set("redis", redis);
    await next();
  })
  .get("/", (c) => ok(c, { message: "ok" }))
  .route("/admin", adminRoute)
  .route("/form", formRoute)
  .get("*", (c) =>
    notFound(c, { message: `Path ${c.req.method} ${c.req.path} not found` }),
  )
  .onError((err, c) => {
    const httpResponse = err as HTTPResponseError;
    if (!httpResponse.getResponse) {
      logger.error(err);

      return unexpectedError(c);
    }

    const response = httpResponse.getResponse();

    switch (response.status) {
      case 400:
        return badRequest(c, {
          message: httpResponse.message,
        });
      case 404:
        return notFound(c);
      default:
        logger.error(err);

        return unexpectedError(c);
    }
  });

export default app;
