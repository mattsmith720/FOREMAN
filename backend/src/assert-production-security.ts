import { isApiKeyRequired } from "./config.js";
import { isSessionTokenConfigured } from "./session-token.js";

export function assertProductionSecurity(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (!isApiKeyRequired()) {
    throw new Error(
      "FOREMAN_API_KEY is required in production. Set it on Render before starting the API.",
    );
  }

  if (!isSessionTokenConfigured()) {
    throw new Error(
      "SESSION_TOKEN_SECRET or FOREMAN_API_KEY is required in production for session tokens.",
    );
  }

  const cors = process.env.CORS_ORIGINS?.trim();
  if (!cors || cors === "*") {
    throw new Error(
      "CORS_ORIGINS must list explicit browser origins in production (e.g. https://foreman-phi.vercel.app).",
    );
  }
}
