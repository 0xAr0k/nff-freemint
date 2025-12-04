import { MongoClient } from "mongodb";
import { env } from "../src/env";

const answers = [
  {
    id: "1763935323550",
    answer:
      "I am a human because of the things I feel inside. When situations flare and life puts me in the toughest of situations, my level-headed curiosity guides me through.",
  },
  {
    id: "1763935363879",
    answer:
      "My emotions are uniquely me. I am not told how to think or who to be, but yet - I am.",
  },
  {
    id: "1763935918918",
    answer: "I second-guess myself even when I know I'm right.",
  },
  {
    id: "1763936273924",
    answer:
      "I could tell you that I am a human until I am metaphorically blue in the face, but what good would it really do?",
  },
  {
    id: "1763936994064",
    answer: "I feel passionately. I love fully. I am flawed.",
  },
  {
    id: "1763937577682",
    answer: "I was born from a human, therefore I am a human.",
  },
  {
    id: "1763938263216",
    answer:
      "My ability to feel against my skin. The breeze, the sweet summer breeze.",
  },
  {
    id: "1763939630919",
    answer: "I am able to adhere to and regulate my emotions at will.",
  },
  { id: "1763939736848", answer: "My ability to feel, to love and to heal." },
  {
    id: "1763958489829",
    answer:
      "I fail. Constantly and consistently. It sets me back, and sometimes I don't see the light at the end of the tunnel. But I continue forward.",
  },
  {
    id: "1763960289372",
    answer: "I answer to no one. I am my own man, through and through.",
  },
  { id: "1763960550186", answer: "I am alone." },
  {
    id: "1763962504430",
    answer:
      "I often find myself simply staring at the wall looking for answers - it doesn't respond.",
  },
  {
    id: "1763962832152",
    answer:
      "I don't placate others just so that they feel joy. I often find myself an unfiltered mess, but I am happy knowing I have that autonomy.",
  },
  {
    id: "1763963178767",
    answer:
      "I have lived a full life of ups, downs, and everything in between.",
  },
  {
    id: "1763963385117",
    answer:
      "Sometimes I forget the lyrics to a song I have sung a hundred times.",
  },
  { id: "1763993310042", answer: "The ability to paint a masterpiece." },
  {
    id: "1763995699995",
    answer: "My breath is hot, and I can see it when the air is cool.",
  },
  { id: "1764002902120", answer: "I pay bills. Lots of bills." },
  {
    id: "1764004024923",
    answer:
      "I have free agency, free will, and the autonomy to be whoever I want to be at any time for any reason.",
  },
  {
    id: "1764006217726",
    answer:
      "I once heard my mother's voice in a snowstorm. It was surely her. But it couldn't have been.",
  },
  {
    id: "1764007121865",
    answer:
      "I wake up in the morning. Sometimes happy, sometimes sad, but I wake up nonetheless.",
  },
  {
    id: "1764007299408",
    answer:
      "I couldn't prove it to you if I tried. You wouldn't believe me. But I am.",
  },
  { id: "1764008926889", answer: "Feeling the wind on my skin." },
  {
    id: "1764519950366",
    answer:
      "I tend to drift off in thought. Of places, of feelings, of regrets.",
  },
  {
    id: "1764601237944",
    answer:
      "I barely understand the past, and I definitely can't predict the future.",
  },
  {
    id: "1764603079875",
    answer: "I understand complex emotions in a way that no robot could.",
  },
  {
    id: "1764604199893",
    answer: "I have to go to sleep sometimes and recharge.",
  },
  {
    id: "1764610224838",
    answer:
      "I have grown, from my infancy to my adulthood, to become the man I am today.",
  },
  { id: "1764611193604", answer: "I possess the ability to create new life." },
  {
    id: "1764611687978",
    answer: "People look up to me. They don't just use me.",
  },
  {
    id: "1764611889483",
    answer: "I am made of flesh and bone, not wires and processors.",
  },
  { id: "1764612285724", answer: "I use my fingers to type on the keyboard." },
  {
    id: "1764709570646",
    answer:
      "I often stutter when I speak, unsure of the right words to use in the moment.",
  },
  {
    id: "1764710022750",
    answer: "I feel the effects of time, on my body and in my heart.",
  },
  {
    id: "1764712927936",
    answer: "I spend way too much time scrolling on social media.",
  },
  {
    id: "1764713203290",
    answer: "I feel insecure in crowded rooms, and when I am all alone.",
  },
  { id: "1764713628736", answer: "Last week I got the flu. It was awful." },
  {
    id: "1764713967787",
    answer: "Tomorrow was a hard day. Tomorrow will be a better one.",
  },
  {
    id: "1764714243416",
    answer:
      "I went to elementary school, middle school, high school, and some college.",
  },
  {
    id: "1764714461215",
    answer: "I do not know all the answers, and I don't pretend to.",
  },
];

async function seed() {
  const client = new MongoClient(env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db("nff-turing-v2");

    console.log("Connected to MongoDB");

    const docs = answers.map((a) => ({
      ethAddress: `seed-${a.id}`,
      answer: a.answer,
      timesShown: 0,
      trickPoints: 0,
      createdAt: new Date(),
      isSeeded: true,
    }));

    // Clear old seeded answers
    const deleted = await db
      .collection("answers")
      .deleteMany({ isSeeded: true });
    console.log(`Deleted ${deleted.deletedCount} old seeded answers`);

    // Insert new
    const result = await db.collection("answers").insertMany(docs);
    console.log(`Seeded ${result.insertedCount} answers`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seed();
