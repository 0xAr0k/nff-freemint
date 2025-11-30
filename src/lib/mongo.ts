import { MongoClient, Db } from "mongodb";
import { env } from "../env";

let db: Db;

export async function connectDB(): Promise<Db> {
  if (db) return db;

  const client = new MongoClient(env.MONGODB_URI);
  await client.connect();
  db = client.db("nff-freemint");

  // Create indexes
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

  console.log("MongoDB connected");
  return db;
}

export function getDB(): Db {
  if (!db) throw new Error("DB not connected");
  return db;
}
