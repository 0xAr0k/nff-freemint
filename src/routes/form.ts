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
        const redis = c.get("redis");

        const {
          username,
          discordId,
          ethAddress,
          curiosity,
          isFollowingX,
          isDiscordMember,
        } = await c.req.json();

        // Validate ETH address
        if (!isAddress(ethAddress)) {
          return badRequest(c, { error: "Invalid ETH address" });
        }
        const normalizedEth = getAddress(ethAddress).toLowerCase();

        // Check if username already submitted
        const usernameUsed = await redis.get(
          `username_used:${username.toLowerCase()}`,
        );
        if (usernameUsed) {
          return badRequest(c, {
            error: "username_already_submitted",
            message: "This username has already submitted an application",
          });
        }

        // Check if discordId already submitted
        const discordUsed = await redis.get(`discord_used:${discordId}`);
        if (discordUsed) {
          return badRequest(c, {
            error: "discord_already_submitted",
            message:
              "This Discord account has already submitted an application",
          });
        }

        // Check if ETH already used
        const ethUsed = await redis.get(`eth_used:${normalizedEth}`);
        if (ethUsed) {
          return badRequest(c, {
            error: "eth_already_submitted",
            message: "This ETH address has already submitted an application",
          });
        }

        // Save submission
        const timestamp = new Date().toISOString();
        const submissionKey = `submission:${timestamp}:${normalizedEth}`;

        await redis.set(submissionKey, {
          username,
          discordId,
          ethAddress: normalizedEth,
          curiosity,
          isFollowingX,
          isDiscordMember,
          timestamp,
        });

        // Mark username as used
        await redis.set(`username_used:${username.toLowerCase()}`, {
          timestamp,
          ethAddress: normalizedEth,
        });

        // Mark discordId as used
        await redis.set(`discord_used:${discordId}`, {
          timestamp,
          ethAddress: normalizedEth,
        });

        // Mark ETH as used
        await redis.set(`eth_used:${normalizedEth}`, { timestamp, username });

        return ok(c, {
          success: true,
          message: "Application submitted successfully",
        });
      } catch (error) {
        console.error("Submit error:", error);
        return unexpectedError(c);
      }
    },
  );

export default app;
