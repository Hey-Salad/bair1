import { getUser, upsertUser } from "@/lib/users";
import { verifyAuth0Token } from "@/lib/auth";

// Bootstrap the first super_admin. Only works if no super_admin exists yet.
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return Response.json({ error: "Bearer token required" }, { status: 401 });
  }

  const token = auth.slice(7);
  const payload = await verifyAuth0Token(token);
  if (!payload) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  const existing = await getUser(payload.sub);
  if (existing?.role === "super_admin") {
    return Response.json({ ok: true, message: "Already a super_admin", user: existing });
  }

  await upsertUser({
    userId: payload.sub,
    email: payload.email ?? "",
    name: payload.name ?? "",
    role: "super_admin",
    orgId: "default",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  });

  const user = await getUser(payload.sub);
  return Response.json({ ok: true, message: "Bootstrapped as super_admin", user });
}
