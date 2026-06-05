const SESSION_TOKEN_HEADER = "x-session-token";

let activeToken: string | null = null;

export function setSessionToken(token: string): void {
  activeToken = token;
}

export function clearSessionToken(): void {
  activeToken = null;
}

export function getSessionAuthHeaders(): Record<string, string> {
  if (!activeToken) {
    return {};
  }
  return { [SESSION_TOKEN_HEADER]: activeToken };
}
