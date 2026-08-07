import { api } from "@/lib/auth";

export type CategoryKind = "menu" | "kitchen";

export type Category = {
  id: string;
  kind: CategoryKind;
  name: string;
  /** menu only */
  products: number;
  visible: boolean;
  /** kitchen only */
  station: string;
  screens: number;
  restaurantId: string;
  restaurantName: string;
};

export type CategoryInput = {
  kind: CategoryKind;
  name: string;
  visible: boolean;
  station: string;
  screens: number;
  restaurantId: string;
};


const ENDPOINT: Record<CategoryKind, string> = {
  menu: "/api/menu_categories",
  kitchen: "/api/kitchen_categories",
};

/** API responses may be a plain array, a Hydra collection, or { data: [...] }. */
function toArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["member", "hydra:member", "data", "items", "categories"]) {
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

export function normalizeCategory(
  raw: Record<string, unknown>,
  kind: CategoryKind,
  index = 0,
): Category {
  const r = raw;
  return {
    id: `${r["id"]}`,
    kind,
    name: str(r["name"], r["title"], "Untitled category"),
    products: num(r["products"], r["productsCount"], r["product_count"]),
    visible: bool(r["visible"] ?? r["isVisible"] ?? r["active"], true),
    station: str(r["station"], r["stationName"], r["screenName"]),
    screens: num(r["screens"], r["screensCount"]) || 1,
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

function payloadFor(input: CategoryInput, restaurantId?: string) {
  const base: Record<string, unknown> = { name: input.name };
  if (restaurantId) base["restaurant"] = restaurantId;
  if (input.kind === "menu") {
    base["visible"] = input.visible;
  } else {
    base["station"] = input.station;
    base["screens"] = input.screens;
  }
  return base;
}

function withRestaurant(path: string, restaurantId?: string) {
  return restaurantId ? `${path}?restaurant=${encodeURIComponent(restaurantId)}` : path;
}

export async function fetchCategories(
  kind: CategoryKind,
  restaurantId?: string,
): Promise<Category[]> {
  const payload = await parse(await api(withRestaurant(ENDPOINT[kind], restaurantId)));
  return toArray(payload).map((raw, i) => normalizeCategory(raw, kind, i));
}

export async function createCategory(
  input: CategoryInput,
  restaurantId?: string,
): Promise<Category> {
  const payload = await parse(
    await api(ENDPOINT[input.kind], {
      method: "POST",
      body: JSON.stringify(payloadFor(input, restaurantId)),
    }),
  );
  return normalizeCategory((payload as Record<string, unknown>) ?? { ...input }, input.kind);
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
  restaurantId?: string,
): Promise<Category> {

  console.log("UPDATING ...");
  console.log(id);
  
  
  const payload = await parse(
    await api(`${ENDPOINT[input.kind]}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payloadFor(input, restaurantId)),
    }),
  );
  return normalizeCategory(
    (payload as Record<string, unknown>) ?? { id, ...input },
    input.kind,
  );
}

export async function deleteCategory(kind: CategoryKind, id: string): Promise<void> {
  await parse(await api(`${ENDPOINT[kind]}/${id}`, { method: "DELETE" }));
}
