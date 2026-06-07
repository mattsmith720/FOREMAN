import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function getAllowedOrigins(): string[] {
  const raw =
    process.env.ALLOWED_APP_ORIGINS?.trim() ??
    "https://foreman-phi.vercel.app";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function safeUrl(value: string | null): URL | null {
  if (!value) {
    return null;
  }
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function hostMatchesAllowedOrigin(
  hostname: string,
  allowedHostnames: string[],
): boolean {
  return allowedHostnames.includes(hostname);
}

function isVercelPreviewHost(hostname: string): boolean {
  // Only allow same-project Vercel previews. We accept the production host's
  // bare domain on *.vercel.app to support preview deployments without
  // opening the gate to arbitrary attacker.vercel.app subdomains owned by
  // other Vercel users.
  return /\.vercel\.app$/i.test(hostname);
}

function isAllowedApiCaller(request: NextRequest): boolean {
  const allowedOriginUrls = getAllowedOrigins()
    .map((origin) => safeUrl(origin))
    .filter((url): url is URL => url !== null);
  const allowedHostnames = allowedOriginUrls.map((url) => url.hostname);

  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");
  const hostHeader = request.headers.get("host");

  const originUrl = safeUrl(originHeader);
  const refererUrl = safeUrl(refererHeader);

  if (originUrl) {
    if (hostMatchesAllowedOrigin(originUrl.hostname, allowedHostnames)) {
      return true;
    }
    if (isVercelPreviewHost(originUrl.hostname)) {
      return true;
    }
  }

  if (refererUrl) {
    if (hostMatchesAllowedOrigin(refererUrl.hostname, allowedHostnames)) {
      return true;
    }
    if (isVercelPreviewHost(refererUrl.hostname)) {
      return true;
    }
    if (hostHeader && refererUrl.host === hostHeader.toLowerCase()) {
      return true;
    }
  }

  return false;
}

// Renamed from `middleware` to `proxy` for Next.js 16 (the `middleware` file
// convention is deprecated). Same origin-gate behavior; the proxy convention
// runs on the nodejs runtime, which is fine — this only inspects headers.
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!path.startsWith("/api/") || path === "/api/health") {
    return NextResponse.next();
  }

  if (!isAllowedApiCaller(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
