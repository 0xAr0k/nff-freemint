import { Hono } from "hono";
import { cors } from "hono/cors";
import { trimTrailingSlash } from "hono/trailing-slash";
import { apiKeyMiddleware } from "../middlewares/api-key";
import { validator } from "hono/validator";
import { schema } from "../utils/validation";
import { submitParamsSchema } from "../params/submit";
import { badRequest, ok, unexpectedError } from "../utils/response";
import { isAddress, getAddress } from "viem";

const app = new Hono();

app
  .use(cors())
  .use(trimTrailingSlash())
  .post(
    "/submit",
    validator("json", schema(submitParamsSchema)),
    apiKeyMiddleware(),
    async (c) => {
      try {
        const db = c.get("db");

        const {
          username,
          discordId,
          ethAddress,
          curiosity,
          isFollowingX,
          isDiscordMember,
          ipAddress,
        } = await c.req.json();

        if (!isAddress(ethAddress)) {
          return badRequest(c, { error: "Invalid ETH address" });
        }
        const normalizedEth = getAddress(ethAddress).toLowerCase();
        const normalizedUsername = username.toLowerCase();

        // Check duplicates in one query
        const existing = await db.collection("submissions").findOne({
          $or: [
            { ethAddress: normalizedEth },
            { username: normalizedUsername },
            { discordId: discordId },
          ],
        });

        if (existing) {
          if (existing.ethAddress === normalizedEth) {
            return badRequest(c, {
              error: "eth_already_submitted",
              message: "This ETH address has already submitted an application",
            });
          }
          if (existing.username === normalizedUsername) {
            return badRequest(c, {
              error: "username_already_submitted",
              message: "This username has already submitted an application",
            });
          }
          if (existing.discordId === discordId) {
            return badRequest(c, {
              error: "discord_already_submitted",
              message:
                "This Discord account has already submitted an application",
            });
          }
        }

        const timestamp = new Date().toISOString();

        await db.collection("submissions").insertOne({
          username: normalizedUsername,
          usernameOriginal: username,
          discordId,
          ethAddress: normalizedEth,
          curiosity,
          isFollowingX,
          isDiscordMember,
          ip: ipAddress || "unknown",
          timestamp,
          createdAt: new Date(),
        });

        return ok(c, {
          success: true,
          message: "Application submitted successfully",
        });
      } catch (error: any) {
        if (error.code === 11000) {
          return badRequest(c, {
            error: "duplicate",
            message: "Already submitted",
          });
        }
        console.error("Submit error:", error);
        return unexpectedError(c);
      }
    },
  );

export default app;
