import { jsonOk, mapRouteError } from "@/lib/route-helpers";
import { getSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getSettings();
    return jsonOk({
      storeName: settings.storeName,
      tagline: settings.tagline,
      supportEmail: settings.supportEmail,
      supportPhone: settings.supportPhone,
      whatsapp: settings.whatsapp,
      instagram: settings.instagram,
      facebook: settings.facebook,
      address: settings.address,
      storeStatus: settings.storeStatus,
      currency: settings.currency,
      shipping: settings.shipping,
    });
  } catch (err) {
    return mapRouteError(err);
  }
}
