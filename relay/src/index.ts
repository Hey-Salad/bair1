export interface Env {
  UPSTREAM_URL: string;
  UPSTREAM_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Health check
    if (request.method === "GET") {
      return new Response(JSON.stringify({ ok: true, relay: "bair1-relay" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only accept POST
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const body = await request.text();

      // Forward to Vercel API
      const res = await fetch(env.UPSTREAM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.UPSTREAM_API_KEY,
        },
        body,
      });

      const data = await res.text();
      return new Response(data, {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: String(err) }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
