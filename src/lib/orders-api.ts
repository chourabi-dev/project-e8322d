import { api } from "@/lib/auth";

/** One extra/topping attached to an order item (e.g. "Coca-cola 34 cl"). */
export type OrderExtra = {
  id: string;
  extraID: string;
  name: string;
  price: number;
};

/** One line of an order: a product, its quantity, its own note and its extras. */
export type OrderItem = {
  id: string;
  productID: string;
  name: string;
  price: number;
  quantity: number;
  note: string;
  extras: OrderExtra[];
};

export type OrderStatus = string;
export type OrderType = "dine_in" | "delivery" | "pickup" | string;
export type PaymentMethod = "cash" | "card" | "online" | string;

export type Order = {
  id: string;
  restaurantId: string;
  orderNumber: string;
  status: OrderStatus;
  kitchenStatus: string;
  type: OrderType;
  note: string;
  paymentMethod: PaymentMethod;
  pickupTime: string | null;
  deliveryAddress: string | null;
  createdAt: string;
  clientEmail: string;
  clientName: string;
  items: OrderItem[];
};

const ORDERS = "/api/orders";

/** API responses may be a plain array, a Hydra collection, or { data: [...] }. */
function toArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["data", "member", "hydra:member", "items", "orders"]) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
    }
  }
  return [];
}

const str = (...values: unknown[]) => {
  for (const v of values) if (typeof v === "string" && v.length > 0) return v;
  return "";
};
const num = (...values: unknown[]) => {
  for (const v of values) {
    const n = typeof v === "string" ? Number(v) : v;
    if (typeof n === "number" && Number.isFinite(n)) return n;
  }
  return 0;
};

function normalizeExtra(raw: Record<string, unknown>): OrderExtra {
  return {
    id: str(`${raw["id"] ?? ""}`),
    extraID: str(raw["extraID"], raw["extraId"], raw["extra_id"]),
    name: str(raw["name"], raw["title"], "Extra"),
    price: num(raw["price"], raw["amount"]),
  };
}

function normalizeItem(raw: Record<string, unknown>): OrderItem {
  const extrasRaw = raw["extras"];
  return {
    id: str(`${raw["id"] ?? ""}`),
    productID: str(raw["productID"], raw["productId"], raw["product_id"]),
    name: str(raw["name"], raw["title"], "Item"),
    price: num(raw["price"], raw["amount"], raw["unitPrice"]),
    quantity: num(raw["quantity"], raw["qty"]) || 1,
    note: str(raw["note"], raw["notes"], raw["instructions"]),
    extras: Array.isArray(extrasRaw)
      ? (extrasRaw as Record<string, unknown>[]).map(normalizeExtra)
      : [],
  };
}

export function normalizeOrder(raw: Record<string, unknown>): Order {
  const itemsRaw = raw["items"];
  return {
    id: str(`${raw["id"] ?? ""}`),
    orderNumber : str(`${raw["orderNumber"] ?? ""}`),
    restaurantId: str(raw["restaurantID"], raw["restaurantId"], raw["restaurant_id"]),
    status: str(raw["status"]) || "pending",
    kitchenStatus: str(raw["kitchenStatus"], raw["kitchen_status"]) || "pending",
    type: str(raw["type"]) || "dine_in",
    note: str(raw["note"], raw["notes"]),
    paymentMethod: str(raw["paymentMethod"], raw["payment_method"]) || "cash",
    pickupTime: (str(raw["pickupTime"]) || null) as string | null,
    deliveryAddress: (str(
      raw["deleveryAddress"],
      raw["deliveryAddress"],
      raw["delivery_address"],
    ) || null) as string | null,
    createdAt: str(raw["createdAt"], raw["created_at"]),
    clientEmail: str(raw["clientEmail"], raw["client_email"]),
    clientName: str(raw["clientName"], raw["client_name"]),
    items: Array.isArray(itemsRaw)
      ? (itemsRaw as Record<string, unknown>[]).map(normalizeItem)
      : [],
  };
}

async function parse(response: Response) {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.message || body.detail || body.error || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json().catch(() => null);
}

export async function fetchOrders(): Promise<Order[]> {
  const payload = await parse(await api(ORDERS));
  return toArray(payload).map(normalizeOrder);
}

/**
 * Marks a cash order as paid and moves it on to the kitchen queue.
 * Only paid orders are ever routed to the kitchen screens, so this is the
 * gate cashiers use once they've physically collected the cash.
 */
export async function markOrderPaidAndSend(id: string): Promise<Order> {
  const payload = await parse(
    await api(`${ORDERS}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "pending", paymentMethod: "cash" }),
    }),
  );
  return normalizeOrder((payload as Record<string, unknown>) ?? { id, status: "pending" });
}

/** Parses the API's "13-08-2026 03:15" (dd-mm-yyyy HH:mm) format into a Date. */
export function parseOrderDate(value: string): Date | null {
  const match = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, dd, mm, yyyy, HH, MM] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(HH), Number(MM));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function orderItemTotal(item: OrderItem): number {
  const extrasTotal = item.extras.reduce((sum, e) => sum + e.price, 0);
  return (item.price + extrasTotal) * item.quantity;
}

export function orderTotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + orderItemTotal(item), 0);
}
