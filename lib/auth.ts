import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "instrumentos_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getAuthConfig() {
  const username = process.env.AUTH_USERNAME;
  const password = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (!username || !password || password.length < 12 || !secret || secret.length < 32) {
    throw new Error("Configura AUTH_USERNAME, AUTH_PASSWORD (mínimo 12 caracteres) y AUTH_SECRET (mínimo 32 caracteres).");
  }

  return { username, password, secret };
}

function signature(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function verifyCredentials(username: string, password: string): boolean {
  const config = getAuthConfig();
  const usernameHash = createHash("sha256").update(username).digest();
  const expectedUsernameHash = createHash("sha256").update(config.username).digest();
  const passwordHash = createHash("sha256").update(password).digest();
  const expectedPasswordHash = createHash("sha256").update(config.password).digest();

  return (
    timingSafeEqual(usernameHash, expectedUsernameHash) &&
    timingSafeEqual(passwordHash, expectedPasswordHash)
  );
}

export function createSession(username: string): string {
  const config = getAuthConfig();
  const payload = Buffer.from(JSON.stringify({
    username,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  })).toString("base64url");

  return `${payload}.${signature(payload, config.secret)}`;
}

export function verifySession(token: string | undefined): string | null {
  if (!token || token.length > 2048) return null;

  const config = getAuthConfig();
  try {
    const [payload, suppliedSignature, extra] = token.split(".");
    if (!payload || !suppliedSignature || extra) return null;

    const expected = Buffer.from(signature(payload, config.secret));
    const supplied = Buffer.from(suppliedSignature);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;

    const decoded: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("username" in decoded) ||
      !("expiresAt" in decoded) ||
      decoded.username !== config.username ||
      typeof decoded.expiresAt !== "number" ||
      decoded.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return decoded.username;
  } catch {
    return null;
  }
}

export function getAuthUsername(): string {
  return getAuthConfig().username;
}
