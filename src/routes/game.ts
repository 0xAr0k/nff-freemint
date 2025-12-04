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
import { Answer, Round, RoundResult } from "../core/game";
import { answerSchema, guessSchema, walletSchema } from "../params/game";

const NUM_ROUNDS = 3;
const PASS_THRESHOLD = 2; // 2+ correct = pass

const app = new Hono();

app
  .use(cors())

  // Get prompt question
  .get("/prompt", (c) =>
    ok(c, { question: PROMPT_QUESTION, maxLength: MAX_ANSWER_LENGTH }),
  )

  // Check wallet status
  .get("/status/:ethAddress", async (c) => {
    const ethAddress = c.req.param("ethAddress").toLowerCase();
    const db = c.get("db");

    const user = await db.collection("submissions").findOne({ ethAddress });

    if (!user) {
      return ok(c, { exists: false, hasPlayed: false, testStatus: null });
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
    });
  })

  // Submit answer to pool (optional - adds to answer pool for others)
  .post("/answer", validator("json", schema(answerSchema)), async (c) => {
    const { ethAddress, answer } = await c.req.json();
    const db = c.get("db");
    const normalizedEth = ethAddress.toLowerCase();

    // Check user exists
    const user = await db
      .collection("submissions")
      .findOne({ ethAddress: normalizedEth });
    if (!user) {
      return badRequest(c, { error: "User not found. Please register first." });
    }

    // Check if already submitted an answer
    const existingAnswer = await db
      .collection("answers")
      .findOne({ ethAddress: normalizedEth });
    if (existingAnswer) {
      return badRequest(c, { error: "You have already submitted an answer." });
    }

    // Add to answer pool
    await db.collection("answers").insertOne({
      ethAddress: normalizedEth,
      answer: answer.trim(),
      timesShown: 0,
      trickPoints: 0,
      createdAt: new Date(),
    });

    return ok(c, { success: true, message: "Answer submitted to pool" });
  })

  // Get game rounds
  .post("/rounds", validator("json", schema(walletSchema)), async (c) => {
    const { ethAddress } = await c.req.json();
    const db = c.get("db");
    const normalizedEth = ethAddress.toLowerCase();

    // Check user exists
    const user = await db
      .collection("submissions")
      .findOne({ ethAddress: normalizedEth });
    if (!user) {
      return badRequest(c, { error: "User not found. Please register first." });
    }

    // Check if already played
    if (user.hasPlayed) {
      return badRequest(c, {
        error: "You have already completed the test. One attempt per wallet.",
      });
    }

    // If rounds already exist, return them
    if (user.rounds && user.rounds.length === NUM_ROUNDS) {
      const roundsForClient = user.rounds.map((r: Round) => ({
        roundNumber: r.roundNumber,
        answer1: r.answer1,
        answer2: r.answer2,
        hOne: r.humanAnswerIsFirst,
      }));
      return ok(c, { rounds: roundsForClient, totalRounds: NUM_ROUNDS });
    }

    // Get available human answers (exclude user's own)
    const availableAnswers = await db
      .collection("answers")
      .find({ ethAddress: { $ne: normalizedEth } })
      .sort({ timesShown: 1 }) // Prioritize less-shown answers
      .limit(NUM_ROUNDS * 3) // Get extra for selection
      .toArray();

    if (availableAnswers.length < NUM_ROUNDS) {
      return badRequest(c, {
        error: "Not enough answers in the pool yet. Please try again later.",
      });
    }

    // Select answers with weighted randomization
    const selectedAnswers = selectAnswers(availableAnswers, NUM_ROUNDS);

    // Generate AI answers
    const aiAnswers: string[] = [];
    for (let i = 0; i < NUM_ROUNDS; i++) {
      aiAnswers.push(await generateAIAnswer());
    }

    // Create rounds
    const rounds: Round[] = [];
    const roundsForClient: any[] = [];

    for (let i = 0; i < NUM_ROUNDS; i++) {
      const humanAnswer = selectedAnswers[i];
      const aiAnswer = aiAnswers[i];
      const isHumanFirst = Math.random() > 0.5;

      rounds.push({
        roundNumber: i + 1,
        answer1: isHumanFirst ? humanAnswer.answer : aiAnswer,
        answer2: isHumanFirst ? aiAnswer : humanAnswer.answer,
        humanAnswerId: humanAnswer._id.toString(),
        humanAnswerIsFirst: isHumanFirst,
      });

      roundsForClient.push({
        roundNumber: i + 1,
        answer1: isHumanFirst ? humanAnswer.answer : aiAnswer,
        answer2: isHumanFirst ? aiAnswer : humanAnswer.answer,
        hOne: isHumanFirst,
      });
    }

    // Save rounds to user
    await db
      .collection("submissions")
      .updateOne({ ethAddress: normalizedEth }, { $set: { rounds } });

    return ok(c, { rounds: roundsForClient, totalRounds: NUM_ROUNDS });
  })

  // Submit guesses
  .post("/guess", validator("json", schema(guessSchema)), async (c) => {
    const { ethAddress, guesses } = await c.req.json();
    const db = c.get("db");
    const normalizedEth = ethAddress.toLowerCase();

    const user = await db
      .collection("submissions")
      .findOne({ ethAddress: normalizedEth });
    if (!user) {
      return badRequest(c, { error: "User not found." });
    }

    if (user.hasPlayed) {
      return badRequest(c, { error: "You have already completed the test." });
    }

    if (!user.rounds || user.rounds.length !== NUM_ROUNDS) {
      return badRequest(c, {
        error: "Rounds not initialized. Start the game first.",
      });
    }

    // Process guesses
    let correctCount = 0;
    const roundResults: RoundResult[] = [];

    for (let i = 0; i < NUM_ROUNDS; i++) {
      const guess = guesses[i];
      const round = user.rounds[i] as Round;

      const isCorrect =
        (guess === 1 && round.humanAnswerIsFirst) ||
        (guess === 2 && !round.humanAnswerIsFirst);

      if (isCorrect) correctCount++;

      // Update timesShown for human answer
      await db
        .collection("answers")
        .updateOne(
          { _id: new ObjectId(round.humanAnswerId) },
          { $inc: { timesShown: 1 } },
        );

      roundResults.push({
        roundNumber: i + 1,
        isCorrect,
        humanAnswerId: round.humanAnswerId,
        selectedAnswer: guess === 1 ? round.answer1 : round.answer2,
      });
    }

    // Determine status
    const testStatus = correctCount >= PASS_THRESHOLD ? "passed" : "failed";
    let status: string;
    if (correctCount === 3) status = "PERFECT";
    else if (correctCount >= 2) status = "PASS";
    else status = "FAIL";

    // Update user
    await db.collection("submissions").updateOne(
      { ethAddress: normalizedEth },
      {
        $set: {
          hasPlayed: true,
          testStatus,
          correctAnswers: correctCount,
          totalRounds: NUM_ROUNDS,
          roundResults,
          completedAt: new Date(),
        },
      },
    );

    return ok(c, {
      success: true,
      correctAnswers: correctCount,
      totalRounds: NUM_ROUNDS,
      testStatus,
      status,
      roundResults,
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

    const leaderboard = entries.map((user, index) => {
      let status = "FAIL";
      if (user.testStatus === "passed") {
        status = user.correctAnswers === 3 ? "PERFECT" : "PASS";
      }

      return {
        rank: total - (offset + index),
        ethAddress: user.ethAddress,
        username: user.usernameOriginal || user.username,
        status,
        correctAnswers: user.correctAnswers || 0,
        totalRounds: user.totalRounds || 0,
        completedAt: user.completedAt,
      };
    });

    return ok(c, {
      leaderboard,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  });

// Helper: Select answers with weighted randomization
function selectAnswers(answers: any[], count: number): any[] {
  const selected: any[] = [];
  const used = new Set<string>();

  // Weight by inverse of timesShown (fairness)
  const weighted = answers.map((a) => ({
    ...a,
    weight: 1 / Math.sqrt((a.timesShown || 0) + 1),
  }));

  weighted.sort((a, b) => b.weight - a.weight);

  for (const answer of weighted) {
    if (selected.length >= count) break;
    if (!used.has(answer._id.toString())) {
      selected.push(answer);
      used.add(answer._id.toString());
    }
  }

  return selected;
}

export default app;
