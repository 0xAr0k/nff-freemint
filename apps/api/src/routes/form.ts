import { Hono } from "hono";
import { validator } from "hono/validator";
import { rateLimiter } from "hono-rate-limiter";
import { schema } from "../utils/validation";
import { submitParamsSchema } from "../params/submit";
import { badRequest, ok, unexpectedError } from "../utils/response";
import { isAddress, getAddress } from "viem";
import { isRoverHolder } from "../lib/rover-holder";

const app = new Hono();

const getClientIp = (c: any): string => {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    "unknown"
  );
};

// 5 submissions per hour per IP
const submitLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: (c) => getClientIp(c),
  handler: (c) =>
    c.json({ error: "Too many submissions. Try again in 1 hour." }, 429),
});

app.post(
  "/submit",
  submitLimiter,
  validator("json", schema(submitParamsSchema)),
  async (c) => {
    try {
      const db = c.get("db");
      const {
        walletAddress,
        xHandle,
        discordUsername,
        followingX,
        joinedDiscord,
      } = await c.req.json();

      if (!isAddress(walletAddress)) {
        return badRequest(c, { error: "Invalid wallet address" });
      }

      const normalizedEth = getAddress(walletAddress).toLowerCase();
      const normalizedXHandle = xHandle.toLowerCase().replace(/^@/, "");
      const isRover = isRoverHolder(normalizedEth);
      const clientIp = getClientIp(c);

      // Check duplicates
      const existing = await db.collection("submissions").findOne({
        $or: [
          { ethAddress: normalizedEth },
          { xHandle: normalizedXHandle },
          { discordUsername: discordUsername },
        ],
      });

      if (existing) {
        if (existing.ethAddress === normalizedEth) {
          return badRequest(c, {
            error: "This wallet has already been registered",
          });
        }
        if (existing.xHandle === normalizedXHandle) {
          return badRequest(c, {
            error: "This X handle has already been used",
          });
        }
        if (existing.discordUsername === discordUsername) {
          return badRequest(c, {
            error: "This Discord username has already been used",
          });
        }
      }

      const timestamp = new Date().toISOString();

      await db.collection("submissions").insertOne({
        ethAddress: normalizedEth,
        xHandle: normalizedXHandle,
        xHandleOriginal: xHandle,
        discordUsername,
        followingX,
        joinedDiscord,
        ip: clientIp,
        timestamp,
        createdAt: new Date(),

        // Game fields
        hasPlayed: false,
        testStatus: null,
        correctAnswers: 0,
        totalRounds: 0,
        rounds: [],
        roundResults: [],
        completedAt: null,
      });

      return ok(c, {
        success: true,
        message: "Wallet registered successfully",
        isRoverHolder: isRover,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return badRequest(c, { error: "Already registered" });
      }
      console.error("Submit error:", error);
      return unexpectedError(c);
    }
  }
);

export default app;
