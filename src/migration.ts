import { Redis } from "@upstash/redis";
import { MongoClient } from "mongodb";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const mongo = new MongoClient(process.env.MONGODB_URI!);

async function migrate() {
  try {
    await mongo.connect();
    const db = mongo.db("nff-freemint");
    const submissions = db.collection("submissions");

    console.log("Connected to MongoDB");

    await submissions.createIndex({ ethAddress: 1 }, { unique: true });
    await submissions.createIndex({ username: 1 }, { unique: true });
    await submissions.createIndex({ discordId: 1 }, { unique: true });
    await submissions.createIndex({ timestamp: -1 });

    console.log("Indexes created");

    let cursor = "0";
    let total = 0;
    let migrated = 0;
    let skipped = 0;

    do {
      const result = await redis.scan(cursor, {
        match: "submission:*",
        count: 100,
      });
      cursor = String(result[0]);
      const keys = result[1] as string[];

      if (keys && keys.length > 0) {
        const values = await redis.mget(...keys);

        for (const value of values) {
          if (!value) continue;
          total++;

          try {
            const data = value as any;

            await submissions.insertOne({
              username: (data.username || "").toLowerCase(),
              usernameOriginal: data.username,
              discordId: data.discordId,
              ethAddress: data.ethAddress,
              curiosity: data.curiosity,
              isFollowingX: data.isFollowingX,
              isDiscordMember: data.isDiscordMember,
              ip: data.ip || "unknown",
              timestamp: data.timestamp,
              createdAt: new Date(data.timestamp),
            });

            migrated++;
            if (migrated % 100 === 0) console.log("Migrated:", migrated);
          } catch (err: any) {
            if (err.code === 11000) {
              skipped++;
            } else {
              console.error("Error:", err.message);
            }
          }
        }
      }
    } while (cursor !== "0");

    console.log(
      "Done! Migrated:",
      migrated,
      "Skipped:",
      skipped,
      "Total:",
      total,
    );
  } finally {
    await mongo.close();
  }
}

migrate();
