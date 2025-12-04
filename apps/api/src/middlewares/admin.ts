import { Input } from "hono";
import { createMiddleware } from "hono/factory";
import { unauthorized, unexpectedError } from "../utils/response";
import type { EnvBindings } from "../env";
import { validateSession } from "../lib/session";
import { getCookie } from "hono/cookie";

type AdminSecret = {
  Bindings: {
    ADMIN_SECRET: string;
  };
};

export const adminMiddleware = <
  E extends AdminSecret = { Bindings: EnvBindings },
  P extends string = string,
  I extends Input = Input,
>() => {
  return createMiddleware<E, P, I>(async (c, next) => {
    const session = getCookie(c, "admin_session");
    if (!session) return unauthorized(c);

    try {
      const data = JSON.parse(atob(session));
      if (!data) return unauthorized(c);
      if (data.auth !== true) return unauthorized(c);
    } catch (_) {
      return unexpectedError(c);
    }
    await next();
  });
};
