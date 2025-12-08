import { Hono } from "hono";
import { cors } from "hono/cors";
import { trimTrailingSlash } from "hono/trailing-slash";
import { adminMiddleware } from "../middlewares/admin";
import { ok, unexpectedError } from "../utils/response";
import { dashboardHtml, loginPageHtml } from "../lib/dashboard";
import { getCookie, setCookie } from "hono/cookie";
import { isRoverHolder } from "../lib/rover-holder";
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
    const password = body.password;
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

      const [submissions, totalSubmissions, totalPlayed, totalPassed] =
        await Promise.all([
          db
            .collection("submissions")
            .find({})
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
          db.collection("submissions").countDocuments(),
          db.collection("submissions").countDocuments({ hasPlayed: true }),
          db.collection("submissions").countDocuments({ testStatus: "passed" }),
        ]);

      // Add isRoverHolder to each submission
      const submissionsWithRover = submissions.map((s) => ({
        ...s,
        isRoverHolder: isRoverHolder(s.ethAddress),
      }));

      const totalPages = Math.ceil(totalSubmissions / limit);

      return ok(c, {
        submissions: submissionsWithRover,
        stats: {
          totalSubmissions,
          totalPlayed,
          totalPassed,
          totalFailed: totalPlayed - totalPassed,
        },
        pagination: {
          page,
          limit,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      logger.error(`Records error: ${error}`);
      return unexpectedError(c);
    }
  })
  .get("/gift-records", adminMiddleware(), async (c) => {
    try {
      const db = c.get("db");

      const page = parseInt(c.req.query("page") || "1");
      const limit = parseInt(c.req.query("limit") || "50");
      const skip = (page - 1) * limit;

      const [submissions, totalSubmissions] = await Promise.all([
        db
          .collection("gift_submissions")
          .find({})
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        db.collection("gift_submissions").countDocuments(),
      ]);

      const totalPages = Math.ceil(totalSubmissions / limit);

      return ok(c, {
        submissions,
        stats: {
          totalSubmissions,
        },
        pagination: {
          page,
          limit,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    } catch (error) {
      logger.error("Gift records error:", error);
      return unexpectedError(c);
    }
  })
  .get("/dashboard", adminMiddleware(), async (c) => {
    return c.html(dashboardHtml);
  });

export default app;
