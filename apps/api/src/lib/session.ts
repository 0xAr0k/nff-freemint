import { sign, verify } from "hono/jwt";

export async function createSession(username: string, secret: string) {
  return await sign({ user: username, iat: Date.now() }, secret);
}

export async function validateSession(token: string, secret: string) {
  return await verify(token, secret);
}
