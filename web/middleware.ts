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

function isAllowedApiCaller(request: NextRequest): boolean {
  const allowedOrigins = getAllowedOrigins();
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (origin && allowedOrigins.includes(origin)) {
    return true;
  }

  if (referer && allowedOrigins.some((allowed) => referer.startsWith(allowed))) {
    return true;
  }

  if (host && referer?.includes(host)) {
    return true;
  }

  if (origin?.endsWith(".vercel.app") || referer?.includes(".vercel.app")) {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
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
