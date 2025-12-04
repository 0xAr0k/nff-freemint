import { Hono } from "hono";
import { cors } from "hono/cors";
import { trimTrailingSlash } from "hono/trailing-slash";
import { validator } from "hono/validator";
import { schema } from "../utils/validation";
import { submitParamsSchema } from "../params/submit";
import { badRequest, ok, unexpectedError } from "../utils/response";
import { isAddress, getAddress } from "viem";
import { isRoverHolder } from "../lib/rover-holder";
import { MAX_ANSWER_LENGTH } from "../lib/openai";

const app = new Hono();

app
  .use(cors())
  .use(trimTrailingSlash())
  .post("/submit", validator("json", schema(submitParamsSchema)), async (c) => {
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

      // Insert submission
      await db.collection("submissions").insertOne({
        ethAddress: normalizedEth,
        xHandle: normalizedXHandle,
        xHandleOriginal: xHandle,
        discordUsername,
        followingX,
        joinedDiscord,
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
        return badRequest(c, {
          error: "Already registered",
        });
      }
      console.error("Submit error:", error);
      return unexpectedError(c);
    }
  });

export default app;
