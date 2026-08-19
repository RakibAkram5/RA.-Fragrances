import { jsonError, jsonOk } from "@/lib/route-helpers";
import { getOutbox } from "@/lib/email/console-email";

/**
 * DEVELOPMENT ONLY — exposes the console email outbox so verification and
 * password-reset links can be inspected locally. Hard-disabled in production
 * and unless explicitly enabled.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return jsonError("Not found.", 404);
  }
  if (process.env.ENABLE_DEV_OUTBOX !== "true") {
    return jsonError("Not found.", 404);
  }
  return jsonOk({ emails: getOutbox().slice(0, 10) });
}
