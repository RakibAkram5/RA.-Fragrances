import { jsonOk, mapRouteError, requireUser } from "@/lib/route-helpers";
import { listCustomerOrders, toOrderDto } from "@/lib/services/order-service";

export async function GET() {
  try {
    const user = await requireUser();
    const result = await listCustomerOrders(user.id, 1, 50);
    return jsonOk({
      orders: result.items.map(toOrderDto),
      total: result.total,
    });
  } catch (err) {
    return mapRouteError(err);
  }
}
