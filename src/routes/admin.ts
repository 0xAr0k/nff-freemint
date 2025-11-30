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
      maxAge: 60 * 60 * 12,
    });

    return c.redirect("/admin/dashboard");
  })
  .get("/logout", async (c) => {
    setCookie(c, "admin_session", "", {
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });
    return c.redirect("/admin");
  })
  .get("/records", adminMiddleware(), async (c) => {
    try {
      const db = c.get("db");

      const page = parseInt(c.req.query("page") || "1");
      const limit = parseInt(c.req.query("limit") || "50");
      const skip = (page - 1) * limit;

      const [submissions, totalSubmissions] = await Promise.all([
        db
          .collection("submissions")
          .find({})
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        db.collection("submissions").countDocuments(),
      ]);

      const totalPages = Math.ceil(totalSubmissions / limit);

      return ok(c, {
        submissions,
        stats: {
          totalSubmissions,
          uniqueEthAddresses: totalSubmissions, // Each eth is unique due to index
        },
        pagination: {
          page,
          limit,
          totalPages,
          hasMore: page < totalPages,
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
