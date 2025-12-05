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

const submitLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
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

      // Check if wallet already exists
      const existing = await db.collection("submissions").findOne({
        ethAddress: normalizedEth,
      });

      // If wallet exists, return existing data (for redirect to results)
      if (existing) {
        let status = null;
        if (existing.testStatus === "passed") {
          status = existing.correctAnswers === 3 ? "PERFECT" : "PASS";
        } else if (existing.testStatus === "failed") {
          status = "FAIL";
        }

        return ok(c, {
          success: true,
          alreadyRegistered: true,
          message: "Wallet already registered",
          isRoverHolder: isRover,
          hasPlayed: existing.hasPlayed || false,
          testStatus: existing.testStatus,
          status,
          correctAnswers: existing.correctAnswers || 0,
          totalRounds: existing.totalRounds || 0,
          roundResults: existing.roundResults || [],
        });
      }

      const timestamp = new Date().toISOString();

      // Insert new submission - only wallet is unique
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
        alreadyRegistered: false,
        message: "Wallet registered successfully",
        isRoverHolder: isRover,
        hasPlayed: false,
        testStatus: null,
        status: null,
        correctAnswers: 0,
        totalRounds: 0,
        roundResults: [],
      });
    } catch (error: any) {
      if (error.code === 11000) {
        // Duplicate key - shouldn't happen now but handle gracefully
        return badRequest(c, { error: "Already registered" });
      }
      console.error("Submit error:", error);
      return unexpectedError(c);
    }
  }
);

export default app;
