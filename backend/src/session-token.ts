import crypto from "node:crypto";

const SESSION_TOKEN_HEADER = "x-session-token";

function getSigningSecret(): string | undefined {
  const configured =
    process.env.SESSION_TOKEN_SECRET?.trim() ||
    process.env.FOREMAN_API_KEY?.trim();
  if (configured) {
    return configured;
  }
  if (process.env.NODE_ENV !== "production") {
    return "foreman-local-dev-only";
  }
  return undefined;
}

export function isSessionTokenConfigured(): boolean {
  return Boolean(getSigningSecret());
}

export function signSessionToken(sessionId: string): string {
  const secret = getSigningSecret();
  if (!secret) {
    throw new Error("SESSION_TOKEN_SECRET or FOREMAN_API_KEY must be set");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(sessionId)
    .digest("hex");
}

export function verifySessionToken(
  sessionId: string,
  token: string | undefined,
): boolean {
  if (!token || !getSigningSecret()) {
    return false;
  }

  const expected = signSessionToken(sessionId);
  if (token.length !== expected.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(token, "utf8"),
    );
  } catch {
    return false;
  }
}

export { SESSION_TOKEN_HEADER };
