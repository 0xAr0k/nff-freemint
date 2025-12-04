import type { Context, Env, Input } from "hono";
import type { z } from "zod/v4";

import { badRequest } from "./response";

export const schema =
  <TSchema extends z.ZodType>(schema: TSchema) =>
  <TValue, TEnv extends Env, TPath extends string, TInput extends Input>(
    value: TValue,
    c: Context<TEnv, TPath, TInput>,
  ) => {
    const result = schema.safeParse(value);

    if (!result.success) {
      const [error] = result.error.issues;

      return badRequest(c, {
        message: error ? error.message : "Invalid request",
      });
    }

    return result.data;
  };
