import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /auth/callback
 * Redirects any legacy or external callback requests to /auth/confirm
 * preserving all query parameters (code, token_hash, type, error, etc.)
 */
export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const confirmUrl = new URL("/auth/confirm", requestUrl.origin);

  requestUrl.searchParams.forEach((val, key) => {
    confirmUrl.searchParams.set(key, val);
  });

  return NextResponse.redirect(confirmUrl);
}
