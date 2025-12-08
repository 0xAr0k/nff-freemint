import type { Context } from "hono";
import type { JSONValue } from "hono/utils/types";

// Http errors
export const BAD_REQUEST_ERROR = "bad_request";
export const UNAUTHORIZED_ERROR = "unauthorized";
export const FORBIDDEN_ERROR = "forbidden";
export const NOT_FOUND_ERROR = "not_found";
export const METHOD_NOT_ALLOWED_ERROR = "method_not_allowed";
export const INTERNAL_SERVER_ERROR = "internal_server_error";

type FailedResponse<TError extends string> = {
  error: TError;
  message?: string;
};

export const badRequest = <TContext extends Context, TError extends string>(
  c: TContext,
  err?: Partial<FailedResponse<TError>>
) => {
  const { error = BAD_REQUEST_ERROR as TError, message } = err ?? {};

  return c.json<FailedResponse<TError>>({ error, message }, 400);
};

export const unauthorized = <TContext extends Context, TError extends string>(
  c: TContext,
  err?: Partial<FailedResponse<TError>>
) => {
  const { error = UNAUTHORIZED_ERROR as TError, message } = err ?? {};

  return c.json<FailedResponse<TError>>({ error, message }, 401);
};

export const forbidden = <TContext extends Context, TError extends string>(
  c: TContext,
  err?: Partial<FailedResponse<TError>>
) => {
  const { error = FORBIDDEN_ERROR as TError, message } = err ?? {};

  return c.json<FailedResponse<TError>>({ error, message }, 403);
};

export const notFound = <TContext extends Context, TError extends string>(
  c: TContext,
  err?: Partial<FailedResponse<TError>>
) => {
  const { error = NOT_FOUND_ERROR as TError, message } = err ?? {};

  return c.json<FailedResponse<TError>>({ error, message }, 404);
};

export const methodNotAllowed = <
  TContext extends Context,
  TError extends string,
>(
  c: TContext,
  err?: Partial<FailedResponse<TError>>
) => {
  const { error = METHOD_NOT_ALLOWED_ERROR as TError, message } = err ?? {};

  return c.json<FailedResponse<TError>>({ error, message }, 405);
};

export const unexpectedError = <TContext extends Context>(c: TContext) =>
  c.json<FailedResponse<typeof INTERNAL_SERVER_ERROR>>(
    { error: INTERNAL_SERVER_ERROR, message: "Unexpected error occured" },
    500
  );

export const ok = <TContext extends Context, TPayload>(
  c: TContext,
  payload?: TPayload
) => c.json(payload ?? undefined, 200);

export const created = <TContext extends Context, TPayload extends JSONValue>(
  c: TContext,
  payload?: TPayload
) => c.json(payload ?? undefined, 201);
