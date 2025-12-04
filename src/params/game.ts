import z from "zod";
import { MAX_ANSWER_LENGTH } from "../lib/openai";

export const walletSchema = z.object({
  ethAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export const answerSchema = z.object({
  ethAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  answer: z.string().min(1).max(MAX_ANSWER_LENGTH),
});

export const guessSchema = z.object({
  ethAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  guesses: z.array(z.union([z.literal(1), z.literal(2)])).length(3),
});
