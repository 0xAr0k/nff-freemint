import { Context, Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { rateLimiter } from "hono-rate-limiter";
import { Db } from "mongodb";
import { env, EnvBindings } from "./env";
import { connectDB } from "./lib/mongo";
import adminRoute from "./routes/admin";
import formRoute from "./routes/form";
import gameRoute from "./routes/game";
import giftRoute from "./routes/gift";
import { ok, notFound, badRequest, unexpectedError } from "./utils/response";
import { HTTPResponseError } from "hono/types";
import { logger } from "./logger";
import { createPublicClient, http, PublicClient } from "viem";
import { mainnet } from "viem/chains";
import nftRoute from "./routes/nfts";

declare module "hono" {
  interface ContextVariableMap {
    env: EnvBindings;
    db: Db;
    client: PublicClient;
  }
}

const db = await connectDB();

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(env.RPC_URL || "https://eth.llamarpc.com"),
});

const app = new Hono();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  "https://underlog-staging-a2efcw21dcxz.netlify.app",
  "https://therovers.xyz",
  "https://www.therovers.xyz",
  env.FRONTEND_URL?.replace(/\/$/, ""),
].filter(Boolean);

const getClientIp = (c: Context): string => {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    c.req.header("cf-connecting-ip") ||
    "unknown"
  );
};

// CORS middleware
app.use("*", async (c, next) => {
  const origin = c.req.header("origin");

  const isAllowed =
    !origin ||
    allowedOrigins.includes(origin) ||
    origin.endsWith(".up.railway.app") ||
    origin.endsWith(".netlify.app") ||
    origin.endsWith(".vercel.app");

  if (isAllowed) {
    c.header("Access-Control-Allow-Origin", origin || "*");
    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    c.header("Access-Control-Allow-Credentials", "true");
  }

  if (c.req.method === "OPTIONS") {
    return c.body(null, 204);
  }

  await next();
});

app.use(
  "*",
  rateLimiter({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: "draft-6",
    keyGenerator: (c) => getClientIp(c),
    handler: (c) =>
      c.json({ error: "Too many requests. Try again later." }, 429),
  })
);

app
  .use(trimTrailingSlash())
  .use("*", async (c, next) => {
    c.set("env", env);
    c.set("db", db);
    c.set("client", publicClient);
    await next();
  })
  .get("/", (c) => ok(c, { message: "ok" }))
  .route("/admin", adminRoute)
  .route("/form", formRoute)
  .route("/game", gameRoute)
  .route("/gift", giftRoute)
  .route("/nfts", nftRoute)
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
