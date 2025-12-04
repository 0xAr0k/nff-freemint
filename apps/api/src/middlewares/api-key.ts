import { Input } from "hono";
import { createMiddleware } from "hono/factory";
import { unauthorized, unexpectedError } from "../utils/response";
import type { EnvBindings } from "../env";

type ApiKey = {
  Bindings: {
    API_KEY: string;
  };
};

export const apiKeyMiddleware = <
  E extends ApiKey = { Bindings: EnvBindings },
  P extends string = string,
  I extends Input = Input,
>() => {
  return createMiddleware<E, P, I>(async (c, next) => {
    try {
      const apiKey = c.req.header("Authorization");
      if (!apiKey) return unauthorized(c);

      const token = apiKey?.replace(/^Bearer\s+/i, "");
      const expectedToken = c.get("env").API_KEY;
      if (token !== expectedToken) return unauthorized(c);

      await next();
    } catch (error) {
      return unexpectedError(c);
    }
  });
};
