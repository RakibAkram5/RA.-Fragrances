import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson, requireAdmin } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp, clientUserAgent } from "@/lib/security/request-meta";
import { settingsSchema } from "@/lib/validation/schemas";
import { getSettings, setSetting } from "@/lib/settings";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAdmin();
    return jsonOk({ settings: await getSettings() });
  } catch (err) {
    return mapRouteError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const admin = await requireAdmin();
    const body = await parseJson(req, settingsSchema);

    if (body.storeName !== undefined) await setSetting("storeName", body.storeName);
    if (body.tagline !== undefined) await setSetting("tagline", body.tagline);
    if (body.supportEmail !== undefined) await setSetting("supportEmail", body.supportEmail);
    if (body.supportPhone !== undefined) await setSetting("supportPhone", body.supportPhone);
    if (body.whatsapp !== undefined) await setSetting("whatsapp", body.whatsapp);
    if (body.address !== undefined) await setSetting("address", body.address);
    if (body.storeStatus !== undefined) await setSetting("storeStatus", body.storeStatus);
    if (body.shipping !== undefined) {
      const current = await getSettings();
      await setSetting("shipping", { ...current.shipping, ...body.shipping });
    }
    if (body.social !== undefined) {
      await setSetting("social", body.social);
    }

    await logAudit({
      adminUserId: admin.id,
      action: "SETTINGS_UPDATE",
      entity: "Setting",
      meta: { fields: Object.keys(body) },
      ip: clientIp(req),
      userAgent: clientUserAgent(req),
    });

    return jsonOk({ settings: await getSettings() });
  } catch (err) {
    return mapRouteError(err);
  }
}
