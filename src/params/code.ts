import z from "zod";

export const codeParamsSchema = z.object({
  code: z.string({
    error: (issue) =>
      issue.input === undefined ? "This field is required" : "not a string",
  }),
  uses: z.number({
    error: (issue) =>
      issue.input === undefined ? "This field is required" : "not a number",
  }),
});
