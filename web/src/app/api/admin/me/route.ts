import { requireAuth } from "@/lib/auth";
import { getDevicesForUser, getDevicesForOrg } from "@/lib/devices";
import { canManageDevices } from "@/lib/users";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  const { user } = auth;
  const isAdmin = canManageDevices(user.role);
  const devices = isAdmin
    ? await getDevicesForOrg(user.orgId)
    : await getDevicesForUser(user.userId);

  return Response.json({ user, devices });
}
