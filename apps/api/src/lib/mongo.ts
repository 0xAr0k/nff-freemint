import { MongoClient, Db } from "mongodb";
import { env } from "../env";

let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  const client = new MongoClient(env.MONGODB_URI, {
    tls: true,
    tlsAllowInvalidCertificates: true,
  });

  await client.connect();
  db = client.db("nff-turing");

  // Submissions indexes
  await db
    .collection("submissions")
    .createIndex({ ethAddress: 1 }, { unique: true });
  await db
    .collection("submissions")
    .createIndex({ xHandle: 1 }, { unique: true });
  await db
    .collection("submissions")
    .createIndex({ discordUsername: 1 }, { unique: true });
  await db.collection("submissions").createIndex({ timestamp: -1 });
  await db.collection("submissions").createIndex({ hasPlayed: 1 });
  await db.collection("submissions").createIndex({ completedAt: -1 });

  // Answers pool indexes - NO unique constraint
  await db.collection("answers").createIndex({ ethAddress: 1 }); // Removed unique
  await db.collection("answers").createIndex({ timesShown: 1 });
  await db.collection("answers").createIndex({ isSeeded: 1 }); // New - for filtering

  console.log("MongoDB connected to nff-turing-v2");
  return db;
}

export function getDB(): Db {
  if (!db) throw new Error("DB not connected");
  return db;
}
