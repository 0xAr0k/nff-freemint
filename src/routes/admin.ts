import { Hono } from "hono";
import { cors } from "hono/cors";
import { trimTrailingSlash } from "hono/trailing-slash";
import { adminMiddleware } from "../middlewares/admin";
import { ok, unexpectedError } from "../utils/response";
import { dashboardHtml, loginPageHtml } from "../lib/dashboard";
import { getCookie, setCookie } from "hono/cookie";
import { logger } from "../logger";

const app = new Hono();

app
  .use(cors())
  .use(trimTrailingSlash())
  .get("/", async (c) => {
    const session = getCookie(c, "admin_session");
    if (session) return c.redirect("/admin/dashboard");
    return c.html(loginPageHtml());
  })
  .post("/login", async (c) => {
    const body = await c.req.parseBody();
    const password = (body as any).password;
    const adminSecret = c.get("env").ADMIN_SECRET;

    if (!password) return c.html(loginPageHtml("Password required"));

    if (password !== adminSecret) {
      return c.html(loginPageHtml("Invalid password"));
    }
    const sessionData = btoa(JSON.stringify({ auth: true }));

    setCookie(c, "admin_session", sessionData, {
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12, // 12h
    });

    return c.redirect("/admin/dashboard");
  })
  .get("/logout", async (c) => {
    setCookie(c, "admin_session", "", {
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0, // Expire immediately
    });
    return c.redirect("/admin");
  })
  .get("/records", adminMiddleware(), async (c) => {
    try {
      const redis = c.get("redis");

      // Get 100 most recent submissions
      const keys = await redis.zrange("submission:zset", -100, -1, {
        rev: true, // newest first
      });

      const submissions: any[] = [];
      const ethAddresses = new Set<string>();

      for (const key of keys) {
        const data = await redis.get(key as string);
        if (!data) continue;

        const parsed = typeof data === "string" ? JSON.parse(data) : data;

        submissions.push(parsed);

        if (parsed.ethAddress) {
          ethAddresses.add(parsed.ethAddress);
        }
      }

      return ok(c, {
        submissions,
        stats: {
          totalSubmissions: await redis.zcard("submission:zset"),
          uniqueEthAddresses: ethAddresses.size,
        },
      });
    } catch (error) {
      console.error("Records error:", error);
      return unexpectedError(c);
    }
  })
  .get("/dashboard", adminMiddleware(), async (c) => {
    return c.html(dashboardHtml);
  });
export default app;
