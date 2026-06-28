import { fetchContributions } from "../src/lib/github/contributions";

export const config = { runtime: "edge" };

// Cached on Vercel's edge network via Cache-Control: the s-maxage counts down to
// UTC midnight, so the CDN revalidates once per calendar day (one GitHub call,
// shared by everyone) and serves stale while it does. ETag enables 304s.
function secondsUntilUtcMidnight(now: Date): number {
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(60, Math.floor((midnight - now.getTime()) / 1000));
}

export default async function handler(request: Request): Promise<Response> {
  const login = process.env.GITHUB_LOGIN || "SirTenzin";
  const token = process.env.PAT;

  if (!token) {
    return new Response(JSON.stringify({ error: "missing PAT" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const now = new Date();
    const data = await fetchContributions(login, token);
    const ttl = secondsUntilUtcMidnight(now);
    const cacheControl = `public, s-maxage=${ttl}, stale-while-revalidate=86400`;
    const etag = `"${now.toISOString().slice(0, 10)}-${data.total}"`;

    if (request.headers.get("if-none-match") === etag) {
      return new Response(null, { status: 304, headers: { etag, "cache-control": cacheControl } });
    }

    return new Response(JSON.stringify(data), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": cacheControl,
        "cdn-cache-control": cacheControl,
        etag,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
