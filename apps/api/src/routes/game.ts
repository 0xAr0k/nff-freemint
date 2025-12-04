import { Hono } from "hono";
import { cors } from "hono/cors";
import { validator } from "hono/validator";
import { ObjectId } from "mongodb";
import { schema } from "../utils/validation";
import { badRequest, ok, unexpectedError } from "../utils/response";
import {
  generateAIAnswer,
  PROMPT_QUESTION,
  MAX_ANSWER_LENGTH,
} from "../lib/openai";
import { isRoverHolder } from "../lib/rover-holder";
import { Round, RoundResult } from "../core/game";
import { answerSchema, guessSchema, walletSchema } from "../params/game";
import { apiKeyMiddleware } from "../middlewares/api-key";

const NUM_ROUNDS = 3;
const PASS_THRESHOLD = 2;

const app = new Hono();

app
  .use(cors())

  .get("/prompt", (c) =>
    ok(c, { question: PROMPT_QUESTION, maxLength: MAX_ANSWER_LENGTH })
  )

  .get(
    "/status/:ethAddress",
    validator("param", schema(walletSchema)),
    async (c) => {
      const { ethAddress } = c.req.valid("param");
      const normalizedEth = ethAddress.toLowerCase();
      const db = c.get("db");
      const isRover = isRoverHolder(normalizedEth);

      const user = await db
        .collection("submissions")
        .findOne({ ethAddress: normalizedEth });

      if (!user) {
        return ok(c, {
          exists: false,
          hasPlayed: false,
          testStatus: null,
          isRoverHolder: isRover,
        });
      }

      let status = null;
      if (user.testStatus === "passed") {
        status = user.correctAnswers === 3 ? "PERFECT" : "PASS";
      } else if (user.testStatus === "failed") {
        status = "FAIL";
      }

      return ok(c, {
        exists: true,
        hasPlayed: user.hasPlayed || false,
        testStatus: user.testStatus,
        status,
        correctAnswers: user.correctAnswers || 0,
        totalRounds: user.totalRounds || 0,
        roundResults: user.roundResults || [],
        isRoverHolder: isRover,
      });
    }
  )

  .post("/answer", validator("json", schema(answerSchema)), async (c) => {
    const { ethAddress, answer } = await c.req.json();
    const db = c.get("db");
    const normalizedEth = ethAddress.toLowerCase();
    const isRover = isRoverHolder(normalizedEth);
    const user = await db
      .collection("submissions")
      .findOne({ ethAddress: normalizedEth });
    if (!user) {
      return badRequest(c, {
        error: "not_registered",
        message: "Register first",
      });
    }
    const existingAnswer = await db
      .collection("answers")
      .findOne({ ethAddress: normalizedEth });
    if (existingAnswer) {
      return badRequest(c, {
        error: "answer_exists",
        message: "Already submitted an answer",
      });
    }

    await db.collection("answers").insertOne({
      ethAddress: normalizedEth,
      answer: answer.trim(),
      createdAt: new Date(),
    });

    return ok(c, {
      success: true,
      message: "Answer submitted",
      isRoverHolder: isRover,
    });
  })

  .post("/rounds", validator("json", schema(walletSchema)), async (c) => {
    const { ethAddress } = await c.req.json();
    const db = c.get("db");
    const normalizedEth = ethAddress.toLowerCase();
    const isRover = isRoverHolder(normalizedEth);

    const user = await db
      .collection("submissions")
      .findOne({ ethAddress: normalizedEth });
    if (!user) {
      return badRequest(c, {
        error: "not_registered",
        message: "Register first",
      });
    }

    if (user.hasPlayed) {
      return badRequest(c, {
        error: "already_played",
        message: "Already completed the test",
      });
    }

    // Return existing rounds
    if (user.rounds?.length === NUM_ROUNDS) {
      return ok(c, {
        rounds: user.rounds.map((r: Round) => ({
          roundNumber: r.roundNumber,
          answer1: r.answer1,
          answer2: r.answer2,
          hOne: r.humanAnswerIsFirst,
        })),
        totalRounds: NUM_ROUNDS,
        isRoverHolder: isRover,
      });
    }

    // Get human answers
    const availableAnswers = await db
      .collection("answers")
      .find({ ethAddress: { $ne: normalizedEth } })
      .sort({ timesShown: 1 })
      .limit(NUM_ROUNDS * 3)
      .toArray();

    if (availableAnswers.length < NUM_ROUNDS) {
      return badRequest(c, {
        error: "not_enough_answers",
        message: "Not enough answers yet",
      });
    }

    const selectedAnswers = selectAnswers(availableAnswers, NUM_ROUNDS);

    // Generate AI answers
    const aiAnswers = await Promise.all(
      Array(NUM_ROUNDS)
        .fill(0)
        .map(() => generateAIAnswer())
    );

    // Create rounds
    const rounds: Round[] = [];
    const roundsForClient: any[] = [];

    for (let i = 0; i < NUM_ROUNDS; i++) {
      const human = selectedAnswers[i];
      const ai = aiAnswers[i];
      const humanFirst = Math.random() > 0.5;

      rounds.push({
        roundNumber: i + 1,
        answer1: humanFirst ? human.answer : ai,
        answer2: humanFirst ? ai : human.answer,
        humanAnswerId: human._id.toString(),
        humanAnswerIsFirst: humanFirst,
      });

      roundsForClient.push({
        roundNumber: i + 1,
        answer1: humanFirst ? human.answer : ai,
        answer2: humanFirst ? ai : human.answer,
        hOne: humanFirst,
      });
    }

    await db
      .collection("submissions")
      .updateOne({ ethAddress: normalizedEth }, { $set: { rounds } });

    return ok(c, {
      rounds: roundsForClient,
      totalRounds: NUM_ROUNDS,
      isRoverHolder: isRover,
    });
  })

  // Submit guesses
  .post("/guess", validator("json", schema(guessSchema)), async (c) => {
    const { ethAddress, guesses } = await c.req.json();
    const db = c.get("db");
    const normalizedEth = ethAddress.toLowerCase();
    const isRover = isRoverHolder(normalizedEth);

    const user = await db
      .collection("submissions")
      .findOne({ ethAddress: normalizedEth });
    if (!user) return badRequest(c, { error: "not_registered" });
    if (user.hasPlayed) return badRequest(c, { error: "already_played" });
    if (!user.rounds?.length)
      return badRequest(c, {
        error: "no_rounds",
        message: "Start game first",
      });

    let correct = 0;
    const results: RoundResult[] = [];

    for (let i = 0; i < NUM_ROUNDS; i++) {
      const guess = guesses[i];
      const round = user.rounds[i] as Round;
      const isCorrect =
        (guess === 1 && round.humanAnswerIsFirst) ||
        (guess === 2 && !round.humanAnswerIsFirst);

      if (isCorrect) correct++;

      await db
        .collection("answers")
        .updateOne(
          { _id: new ObjectId(round.humanAnswerId) },
          { $inc: { timesShown: 1 } }
        );

      results.push({
        roundNumber: i + 1,
        isCorrect,
        humanAnswerId: round.humanAnswerId,
        selectedAnswer: guess === 1 ? round.answer1 : round.answer2,
      });
    }

    const testStatus = correct >= PASS_THRESHOLD ? "passed" : "failed";
    const status = correct === 3 ? "PERFECT" : correct >= 2 ? "PASS" : "FAIL";

    await db.collection("submissions").updateOne(
      { ethAddress: normalizedEth },
      {
        $set: {
          hasPlayed: true,
          testStatus,
          correctAnswers: correct,
          totalRounds: NUM_ROUNDS,
          roundResults: results,
          completedAt: new Date(),
        },
      }
    );

    return ok(c, {
      correctAnswers: correct,
      totalRounds: NUM_ROUNDS,
      testStatus,
      status,
      roundResults: results,
      isRoverHolder: isRover,
    });
  })

  // Leaderboard
  .get("/leaderboard", async (c) => {
    const db = c.get("db");
    const limit = parseInt(c.req.query("limit") || "25");
    const offset = parseInt(c.req.query("offset") || "0");

    const [entries, total] = await Promise.all([
      db
        .collection("submissions")
        .find({ hasPlayed: true })
        .sort({ completedAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray(),
      db.collection("submissions").countDocuments({ hasPlayed: true }),
    ]);

    const leaderboard = entries.map((u, i) => ({
      rank: total - (offset + i),
      ethAddress: u.ethAddress,
      username: u.usernameOriginal || u.username,
      status:
        u.correctAnswers === 3
          ? "PERFECT"
          : u.correctAnswers >= 2
            ? "PASS"
            : "FAIL",
      correctAnswers: u.correctAnswers || 0,
      completedAt: u.completedAt,
      isRoverHolder: isRoverHolder(u.ethAddress),
    }));

    return ok(c, {
      leaderboard,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  });

function selectAnswers(answers: any[], count: number) {
  const selected: any[] = [];
  const used = new Set<string>();

  const weighted = answers
    .map((a) => ({ ...a, weight: 1 / Math.sqrt((a.timesShown || 0) + 1) }))
    .sort((a, b) => b.weight - a.weight);

  for (const a of weighted) {
    if (selected.length >= count) break;
    if (!used.has(a._id.toString())) {
      selected.push(a);
      used.add(a._id.toString());
    }
  }

  return selected;
}

export default app;
