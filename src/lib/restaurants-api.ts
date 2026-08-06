import { api } from "@/lib/auth";

export type Restaurant = {
  id: string;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  hours: string;
  delivery: boolean;
  pickup: boolean;
  active: boolean;
  ordersToday: number;
  revenueToday: number;
  products: number;
  accent: string;
};

export type RestaurantInput = {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  hours: string;
  delivery: boolean;
  pickup: boolean;
  active: boolean;
};

const ACCENTS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"];

/** API responses may be a plain array, a Hydra collection, or { data: [...] }. */
function toArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["member", "hydra:member", "data", "items", "restaurants"]) {
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
const bool = (value: unknown, fallback = false) =>
  typeof value === "boolean" ? value : typeof value === "number" ? value !== 0 : fallback;

export function normalizeRestaurant(raw: Record<string, unknown>, index = 0): Restaurant {
  const id = str(raw.id, raw.uuid, raw["@id"], raw.slug) || `restaurant-${index}`;
  return {
    id,
    name: str(raw.name, raw.title, "Untitled restaurant"),
    tagline: str(raw.tagline, raw.subtitle, raw.city),
    address: str(raw.address, raw.street, raw.location),
    phone: str(raw.phone, raw.phoneNumber, raw.telephone),
    email: str(raw.email, raw.contactEmail),
    description: str(raw.description, raw.about),
    hours: str(raw.hours, raw.openingHours, raw.schedule),
    delivery: bool(raw.delivery ?? raw.hasDelivery ?? raw.deliveryEnabled),
    pickup: bool(raw.pickup ?? raw.hasPickup ?? raw.pickupEnabled),
    active: bool(raw.active ?? raw.isActive ?? raw.enabled, true),
    ordersToday: num(raw.ordersToday, raw.orders_today, raw.ordersCount),
    revenueToday: num(raw.revenueToday, raw.revenue_today, raw.revenue),
    products: num(raw.products, raw.productsCount, raw.product_count),
    accent: str(raw.accent) || ACCENTS[index % ACCENTS.length],
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

export async function fetchRestaurants(): Promise<Restaurant[]> {
  const payload = await parse(await api("/api/restaurants"));
  return toArray(payload).map(normalizeRestaurant);
}

export async function createRestaurant(input: RestaurantInput): Promise<Restaurant> {
  const payload = await parse(
    await api("/api/restaurants", { method: "POST", body: JSON.stringify(input) }),
  );
  return normalizeRestaurant((payload as Record<string, unknown>) ?? { ...input });
}

export async function updateRestaurant(
  id: string,
  input: Partial<RestaurantInput>,
): Promise<Restaurant> {
  const payload = await parse(
    await api(`/api/restaurants/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  );
  return normalizeRestaurant((payload as Record<string, unknown>) ?? { id, ...input });
}

export async function deleteRestaurant(id: string): Promise<void> {
  await parse(await api(`/api/restaurants/${id}`, { method: "DELETE" }));
}
