import { jsonOk, getCurrentUser, mapRouteError } from "@/lib/route-helpers";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return jsonOk({ user: user ?? null });
  } catch (err) {
    return mapRouteError(err);
  }
}
