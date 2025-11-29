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

      const submissions: any[] = [];
      const rateLimits: any[] = [];
      const ethAddresses = new Set<string>();

      // Only scan for submission keys
      let cursor = "0";
      let iterations = 0;

      do {
        const [nextCursor, keys] = await redis.scan(cursor, {
          match: "submission:*",
          count: 100,
        });
        cursor = String(nextCursor);

        for (const key of keys) {
          const value = await redis.get(key);
          if (!value) continue;
          submissions.push(value as any);
          if ((value as any).ethAddress)
            ethAddresses.add((value as any).ethAddress);
        }

        iterations++;
        if (iterations >= 50) break; // Safety limit
      } while (cursor !== "0");

      // Separate scan for rate limits (if you need them)
      cursor = "0";
      iterations = 0;
      do {
        const [nextCursor, keys] = await redis.scan(cursor, {
          match: "rate_limit:*",
          count: 100,
        });
        cursor = String(nextCursor);

        for (const key of keys) {
          const value = await redis.get(key);
          if (!value) continue;
          rateLimits.push({
            ip: key.replace("rate_limit:", ""),
            lastSubmission: (value as any).timestamp,
          });
        }

        iterations++;
        if (iterations >= 10) break;
      } while (cursor !== "0");

      submissions.sort((a, b) =>
        (b.timestamp || "").localeCompare(a.timestamp || ""),
      );

      return ok(c, {
        submissions,
        rateLimits,
        stats: {
          totalSubmissions: submissions.length,
          uniqueEthAddresses: ethAddresses.size,
          activeRateLimits: rateLimits.length,
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
