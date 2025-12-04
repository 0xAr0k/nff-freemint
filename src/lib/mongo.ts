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
  db = client.db("nff-freemint");

  await db
    .collection("submissions")
    .createIndex({ ethAddress: 1 }, { unique: true });
  await db
    .collection("submissions")
    .createIndex({ username: 1 }, { unique: true });
  await db
    .collection("submissions")
    .createIndex({ discordId: 1 }, { unique: true });
  await db.collection("submissions").createIndex({ timestamp: -1 });
  await db
    .collection("submissions")
    .createIndex({ hasPlayed: 1, testStatus: 1 });
  await db.collection("submissions").createIndex({ completedAt: -1 });

  await db.collection("answers").createIndex({ ethAddress: 1 });
  await db.collection("answers").createIndex({ timesShown: 1 });

  console.log("MongoDB connected");
  return db;
}

export function getDB(): Db {
  if (!db) throw new Error("DB not connected");
  return db;
}
