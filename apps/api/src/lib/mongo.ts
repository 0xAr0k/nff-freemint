import { MongoClient, Db } from "mongodb";
import { env } from "../env";
import { logger } from "../logger";

let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  const client = new MongoClient(env.MONGODB_URI, {
    tls: true,
    tlsAllowInvalidCertificates: true,
  });

  await client.connect();
  db = client.db("nff-turing");

  // Submissions indexes - only ethAddress is unique
  await db
    .collection("submissions")
    .createIndex({ ethAddress: 1 }, { unique: true });
  await db.collection("submissions").createIndex({ xHandle: 1 }); // Not unique
  await db.collection("submissions").createIndex({ discordUsername: 1 }); // Not unique
  await db.collection("submissions").createIndex({ timestamp: -1 });
  await db.collection("submissions").createIndex({ hasPlayed: 1 });
  await db.collection("submissions").createIndex({ completedAt: -1 });

  // Answers pool indexes
  await db.collection("answers").createIndex({ ethAddress: 1 });
  await db.collection("answers").createIndex({ timesShown: 1 });
  await db.collection("answers").createIndex({ isSeeded: 1 });

  // Gift submissions indexes
  await db
    .collection("gift_submissions")
    .createIndex({ giverAddress: 1 }, { unique: true });
  await db.collection("gift_submissions").createIndex({ recipientAddress: 1 });
  await db.collection("gift_submissions").createIndex({ timestamp: -1 });

  logger.info("MongoDB connected to nff-turing");
  return db;
}

export function getDB(): Db {
  if (!db) throw new Error("DB not connected");
  return db;
}
