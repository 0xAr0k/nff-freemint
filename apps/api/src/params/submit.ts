import z from "zod";

export const submitParamsSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/i, "Invalid wallet address"),
  xHandle: z.string().min(1, "X handle required"),
  discordUsername: z.string().min(1, "Discord username required"),
  followingX: z.boolean(),
  joinedDiscord: z.boolean(),
});
