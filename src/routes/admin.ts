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

      console.log("Starting submission scan...");

      let cursor = "0";
      let iterations = 0;

      do {
        console.log("Scan iteration:", iterations, "Cursor:", cursor);

        const result = await redis.scan(cursor, {
          match: "submission:*",
          count: 100,
        });

        console.log("Raw result:", typeof result, Array.isArray(result));

        const nextCursor = String(result[0]);
        const keys = result[1] as string[];

        console.log("Next cursor:", nextCursor, "Keys found:", keys?.length);

        if (keys && keys.length > 0) {
          console.log("Sample keys:", keys.slice(0, 3));

          for (const key of keys) {
            const value = await redis.get(key);
            if (!value) continue;
            submissions.push(value as any);
            if ((value as any).ethAddress)
              ethAddresses.add((value as any).ethAddress);
          }
        }

        cursor = nextCursor;
        iterations++;

        console.log("Submissions so far:", submissions.length);

        if (iterations >= 20) {
          console.log("Hit max iterations, breaking");
          break;
        }
      } while (cursor !== "0");

      console.log("Done scanning. Total submissions:", submissions.length);

      submissions.sort((a, b) =>
        (b.timestamp || "").localeCompare(a.timestamp || ""),
      );

      console.log("Returning response...");

      return ok(c, {
        submissions: submissions.slice(0, 100), // Limit to 100 for display
        rateLimits: [], // Skip rate limits for now
        stats: {
          totalSubmissions: submissions.length,
          uniqueEthAddresses: ethAddresses.size,
          activeRateLimits: 0,
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
