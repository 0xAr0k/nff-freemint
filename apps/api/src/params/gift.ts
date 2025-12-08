import z from "zod";

export const addressQuerySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/i, "Invalid address"),
});

export const submitGiftSchema = z.object({
  giverAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/i, "Invalid giver address"),
  recipientAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/i, "Invalid recipient address"),
  recipientXUsername: z.string().min(1, "Recipient X username required"),
});
