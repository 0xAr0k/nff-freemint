import z from "zod";

export const nftOwnerQuerySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/i, "Invalid address"),
});
