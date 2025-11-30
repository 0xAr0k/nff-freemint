import app from "./app";
import { env } from "./env";

const port = env.PORT;

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

type OldSubmission = {
  username: string;
  discordId: string;
  ethAddress: string;
  timestamp: string;
  curiosity?: string;
  isFollowingX?: boolean;
  isDiscordMember?: boolean;
  ipAddress?: string;
};

async function migrate() {
  console.log("Starting SCAN migration...");

  let cursor = "0";
  let total = 0;

  // Clear the ZSET before rebuild
  await redis.del("submission:zset");

  do {
    const [nextCursor, keys] = await redis.scan(cursor, {
      match: "submission:*",
      count: 200,
    });

    // SCAN always returns a string cursor + array of strings
    for (const key of keys as string[]) {
      const raw = await redis.get<string>(key);
      if (!raw) continue;

      let data: OldSubmission;

      try {
        data = JSON.parse(raw);
      } catch {
        console.log(`Skipping invalid JSON: ${key}`);
        continue;
      }

      if (!data.ethAddress || !data.timestamp) {
        console.log(`Skipping malformed submission: ${key}`);
        continue;
      }

      const score = new Date(data.timestamp).getTime();
      if (isNaN(score)) {
        console.log(`Invalid timestamp for ${key}`);
        continue;
      }

      await redis.zadd("submission:zset", {
        score,
        member: key, // keep key as member (not ethAddress)
      });

      total++;
      if (total % 100 === 0) {
        console.log(`Migrated ${total} submissions so far...`);
      }
    }

    cursor = nextCursor;
  } while (cursor !== "0");

  console.log(`Migration complete! Total indexed: ${total}`);
}

migrate().catch(console.error);
export default {
  port,
  fetch: app.fetch,
};
