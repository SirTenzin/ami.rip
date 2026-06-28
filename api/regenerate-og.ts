export const config = { runtime: "edge" };

// Triggered by Vercel Cron (see vercel.json). Pokes a Vercel Deploy Hook to
// rebuild the site, which re-runs scripts/generate-og.tsx with fresh numbers.
export default async function handler(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const hook = process.env.DEPLOY_HOOK_URL;
  if (!hook) {
    return new Response("missing DEPLOY_HOOK_URL", { status: 500 });
  }

  const response = await fetch(hook, { method: "POST" });
  return new Response(`rebuild ${response.ok ? "triggered" : "failed"}`, {
    status: response.ok ? 200 : 502,
  });
}
