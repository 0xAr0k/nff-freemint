import { Hono } from "hono";
import { cors } from "hono/cors";
import { trimTrailingSlash } from "hono/trailing-slash";
import { Db } from "mongodb";
import { env, EnvBindings } from "./env";
import { connectDB } from "./lib/mongo";
import adminRoute from "./routes/admin";
import formRoute from "./routes/form";
import gameRoute from "./routes/game";
import { ok, notFound, badRequest, unexpectedError } from "./utils/response";
import { HTTPResponseError } from "hono/types";
import { logger } from "./logger";

declare module "hono" {
  interface ContextVariableMap {
    env: EnvBindings;
    db: Db;
  }
}

const db = await connectDB();

const app = new Hono();
app
  .use(cors())
  .use(trimTrailingSlash())
  .use("*", async (c, next) => {
    c.set("env", env);
    c.set("db", db);
    await next();
  })
  .get("/", (c) => ok(c, { message: "ok" }))
  .route("/admin", adminRoute)
  .route("/form", formRoute)
  .route("/game", gameRoute)
  .get("*", (c) =>
    notFound(c, { message: `Path ${c.req.method} ${c.req.path} not found` })
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
        return badRequest(c, { message: httpResponse.message });
      case 404:
        return notFound(c);
      default:
        logger.error(err);
        return unexpectedError(c);
    }
  });

export default app;
