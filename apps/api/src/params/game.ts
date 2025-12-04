import z from "zod";
import { MAX_ANSWER_LENGTH } from "../lib/openai";

export const walletSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/i, "Invalid wallet address"),
});

export const answerSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/i),
  answer: z
    .string()
    .min(10, "Answer must be at least 10 characters")
    .max(MAX_ANSWER_LENGTH),
});

export const guessSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/i),
  guesses: z.array(z.union([z.literal(1), z.literal(2)])).length(3),
});
