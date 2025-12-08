import { Hono } from "hono";
import { isRoverHolder } from "../lib/rover-holder";
import { validator } from "hono/validator";
import { addressQuerySchema, submitGiftSchema } from "../params/gift";
import { schema } from "../utils/validation";
import { forbidden, notFound, ok } from "../utils/response";
import { apiKeyMiddleware } from "../middlewares/api-key";

const app = new Hono();

app
  .get(
    "/eligible",
    validator("query", schema(addressQuerySchema)),
    async (c) => {
      const db = c.get("db");
      const { address } = c.req.valid("query");
      const isEligible = isRoverHolder(address);

      if (!isEligible)
        return notFound(c, {
          error: "Not eligible, cannot find user on the list",
        });

      const alreadySubmitted = await db
        .collection("gift_submissions")
        .findOne({ giverAddress: address.toLowerCase() });

      if (alreadySubmitted) return forbidden(c, { error: "Already submitted" });

      return ok(c, {
        success: true,
        isEligible: true,
      });
    }
  )
  .post(
    "/submit",
    apiKeyMiddleware(),
    validator("json", schema(submitGiftSchema)),
    async (c) => {
      const db = c.get("db");
      const { giverAddress, recipientAddress, recipientXUsername } =
        c.req.valid("json");
      const isEligible = isRoverHolder(giverAddress);
      if (!isEligible) return forbidden(c, { error: "Not eligible" });

      const alreadySubmitted = await db.collection("").findOne({
        giverAddress: giverAddress.toLowerCase(),
      });
      if (alreadySubmitted) return forbidden(c, { error: "Already submitted" });

      await db.collection("gift_submissions").insertOne({
        giverAddress: giverAddress.toLowerCase(),
        recipientAddress: recipientAddress.toLowerCase(),
        recipientXUsername,
        createdAt: new Date(),
      });
      return ok(c, {
        success: true,
      });
    }
  );

export default app;
