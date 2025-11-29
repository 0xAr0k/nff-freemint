import { Hono } from "hono";
import { cors } from "hono/cors";
import { trimTrailingSlash } from "hono/trailing-slash";
import { adminMiddleware } from "../middlewares/admin";
import { ok, unexpectedError } from "../utils/response";
import { dashboardHtml, loginPageHtml } from "../lib/dashboard";
import { getCookie, setCookie } from "hono/cookie";

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
      console.log("1. Getting redis");
      const redis = c.get("redis");

      console.log("2. Getting keys");
      const keys = await redis.keys("*");
      console.log("3. Keys count:", keys.length);

      const submissions: any[] = [];
      const rateLimits: any[] = [];
      const ethAddresses = new Set<string>();

      console.log("4. Fetching values");
      const keyData = await Promise.all(
        keys.map(async (key) => {
          const value = await redis.get(key);
          return { key, value };
        }),
      );

      console.log("5. Processing data");
      for (const { key, value } of keyData) {
        if (!value) continue;

        if (key.startsWith("submission:")) {
          const data = value as any;
          submissions.push(data);
          if (data.ethAddress) ethAddresses.add(data.ethAddress);
        } else if (key.startsWith("eth_used:")) {
          const ethAddress = key.replace("eth_used:", "");
          ethAddresses.add(ethAddress);
        } else if (key.startsWith("rate_limit:")) {
          const ip = key.replace("rate_limit:", "");
          const data = value as any;
          rateLimits.push({
            ip,
            lastSubmission: data.timestamp,
          });
        }
      }

      console.log("6. Sorting");
      submissions.sort((a, b) =>
        (b.timestamp || "").localeCompare(a.timestamp || ""),
      );

      console.log("7. Done, returning", submissions.length, "submissions");
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
