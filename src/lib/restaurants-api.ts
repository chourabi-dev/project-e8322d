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
  const r = raw;
  const id = str(r["id"], r["uuid"], r["@id"], r["slug"]) || `restaurant-${index}`;
  return {
    id,
    name: str(r["name"], r["title"], "Untitled restaurant"),
    tagline: str(r["tagline"], r["subtitle"], r["city"]),
    address: str(r["address"], r["street"], r["location"]),
    phone: str(r["phone"], r["phoneNumber"], r["telephone"]),
    email: str(r["email"], r["contactEmail"]),
    description: str(r["description"], r["about"]),
    hours: str(r["hours"], r["openingHours"], r["schedule"]),
    delivery: bool(r["delivery"] ?? r["hasDelivery"] ?? r["deliveryEnabled"]),
    pickup: bool(r["pickup"] ?? r["hasPickup"] ?? r["pickupEnabled"]),
    active: bool(r["active"] ?? r["isActive"] ?? r["enabled"], true),
    ordersToday: num(r["ordersToday"], r["orders_today"], r["ordersCount"]),
    revenueToday: num(r["revenueToday"], r["revenue_today"], r["revenue"]),
    products: num(r["products"], r["productsCount"], r["product_count"]),
    accent: str(r["accent"]) || ACCENTS[index % ACCENTS.length] || "chart-1",
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
  const payload = await parse(await api(`/api/restaurants`));
  return toArray(payload).map(normalizeRestaurant);
}

export async function createRestaurant(input: RestaurantInput): Promise<Restaurant> {
  const payload = await parse(
    await api(`/api/restaurants`, { method: "POST", body: JSON.stringify(input) }),
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
