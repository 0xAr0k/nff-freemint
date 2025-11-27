import z from "zod";

export const submitParamsSchema = z.object({
  username: z.string({
    error: (issue) =>
      issue.input === undefined ? "This field is required" : "not a string",
  }),
  discordId: z.string({
    error: (issue) =>
      issue.input === undefined ? "This field is required" : "not a string",
  }),
  ethAddress: z.string({
    error: (issue) =>
      issue.input === undefined ? "This field is required" : "not a string",
  }),
  curiosity: z.string({
    error: (issue) =>
      issue.input === undefined ? "This field is required" : "not a string",
  }),
  isFollowingX: z.boolean({
    error: (issue) =>
      issue.input === undefined ? "This field is required" : "not a boolean",
  }),
  isDiscordMember: z.boolean({
    error: (issue) =>
      issue.input === undefined ? "This field is required" : "not a boolean",
  }),
});
