import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError } from "@/lib/route-helpers";
import { assertSafeRequest } from "@/lib/security/request-meta";
import { SESSION_COOKIE_NAME, destroySessionByToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const token = req.cookies.get(SESSION_COOKIE_NAME())?.value;
    if (token) await destroySessionByToken(token);

    const res = jsonOk({ message: "Signed out." });
    res.cookies.set(SESSION_COOKIE_NAME(), "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    return mapRouteError(err);
  }
}
