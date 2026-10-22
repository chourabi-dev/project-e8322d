import { api } from "@/lib/auth";

/** Extras are add-ons (drinks, sauces...) grouped in categories, each holding items. */
export type ExtraCategory = {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  restaurantId: string;
  restaurantName: string;
};

export type ExtraCategoryInput = {
  name: string;
  description: string;
  visible: boolean;
  restaurantId: string;
};

export type Extra = {
  id: string;
  name: string;
  description: string;
  price: number;
  photo: string;
  available: boolean;
  extraCategoryId: string;
  restaurantId: string;
};

export type ExtraInput = {
  name: string;
  description: string;
  price: number;
  photo: string;
  available: boolean;
  extraCategoryId: string;
  restaurantId: string;
};

const CATEGORIES = "/api/extra_categories";
const EXTRAS = "/api/extras";

function toArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["member", "hydra:member", "data", "items", "extras", "categories"]) {
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
const bool = (value: unknown, fallback = true) =>
  typeof value === "boolean" ? value : typeof value === "number" ? value !== 0 : fallback;

/** refs may be an id, an IRI ("/api/extras/3") or a nested object. */
function ref(raw: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = raw[key];
    if (value === undefined || value === null) continue;
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      return {
        id: (str(obj["id"], obj["@id"]).split("/").pop() ?? "") as string,
        name: str(obj["name"], obj["title"]),
      };
    }
    const asString = typeof value === "number" ? `${value}` : str(value);
    if (asString) return { id: asString.split("/").pop() ?? "", name: "" };
  }
  return { id: "", name: "" };
}

export function normalizeExtraCategory(raw: Record<string, unknown>): ExtraCategory {
  const restaurant = ref(raw, ["restaurant", "restaurantId", "restaurant_id"]);
  return {
    id: `${raw["id"] ?? ref(raw, ["@id"]).id}`,
    name: str(raw["name"], raw["title"], "Untitled group"),
    description: str(raw["description"], raw["notes"]),
    visible: bool(raw["visible"] ?? raw["isVisible"] ?? raw["active"]),
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
  };
}

export function normalizeExtra(raw: Record<string, unknown>): Extra {
  const category = ref(raw, [
    "extraCategory",
    "extra_category",
    "extraCategoryId",
    "extra_category_id",
    "category",
  ]);
  const restaurant = ref(raw, ["restaurant", "restaurantId", "restaurant_id"]);
  return {
    id: `${raw["id"] ?? ref(raw, ["@id"]).id}`,
    name: str(raw["name"], raw["title"], "Untitled extra"),
    description: str(raw["description"], raw["notes"]),
    price: num(raw["price"], raw["amount"], raw["unitPrice"]),
    photo: str(raw["photo"], raw["image"], raw["imageUrl"], raw["picture"]),
    available: bool(raw["available"] ?? raw["isAvailable"] ?? raw["active"]),
    extraCategoryId: category.id,
    restaurantId: restaurant.id,
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

function withRestaurant(path: string, restaurantId?: string) {
  return restaurantId ? `${path}?restaurant=${encodeURIComponent(restaurantId)}` : path;
}

/* ---------- extra categories ---------- */

export async function fetchExtraCategories(restaurantId?: string): Promise<ExtraCategory[]> {
  const payload = await parse(await api(withRestaurant(CATEGORIES, restaurantId)));
  return toArray(payload).map(normalizeExtraCategory);
}

function categoryPayload(input: ExtraCategoryInput) {
  const body: Record<string, unknown> = {
    name: input.name,
    description: input.description,
    visible: input.visible,
  };
  if (input.restaurantId) body["restaurant"] = input.restaurantId;
  return body;
}

export async function createExtraCategory(input: ExtraCategoryInput): Promise<ExtraCategory> {
  const payload = await parse(
    await api(CATEGORIES, { method: "POST", body: JSON.stringify(categoryPayload(input)) }),
  );
  return normalizeExtraCategory((payload as Record<string, unknown>) ?? { ...input });
}

export async function updateExtraCategory(
  id: string,
  input: ExtraCategoryInput,
): Promise<ExtraCategory> {
  const payload = await parse(
    await api(`${CATEGORIES}/${id}`, {
      method: "PUT",
      body: JSON.stringify(categoryPayload(input)),
    }),
  );
  return normalizeExtraCategory((payload as Record<string, unknown>) ?? { id, ...input });
}

export async function deleteExtraCategory(id: string): Promise<void> {
  await parse(await api(`${CATEGORIES}/${id}`, { method: "DELETE" }));
}

/* ---------- extras (sub categories / items) ---------- */

export async function fetchExtras(
  restaurantId?: string,
  extraCategoryId?: string,
): Promise<Extra[]> {
  const params = new URLSearchParams();
  if (restaurantId) params.set("restaurant", restaurantId);
  if (extraCategoryId) params.set("extraCategory", extraCategoryId);
  const query = params.toString();
  const payload = await parse(await api(query ? `${EXTRAS}?${query}` : EXTRAS));
  return toArray(payload).map(normalizeExtra);
}

function extraPayload(input: ExtraInput) {
  const body: Record<string, unknown> = {
    name: input.name,
    description: input.description,
    price: input.price,
    photo: input.photo,
    available: input.available,
    extraCategory: input.extraCategoryId || null,
  };
  if (input.restaurantId) body["restaurant"] = input.restaurantId;
  return body;
}

export async function createExtra(input: ExtraInput): Promise<Extra> {
  const payload = await parse(
    await api(EXTRAS, { method: "POST", body: JSON.stringify(extraPayload(input)) }),
  );
  return normalizeExtra((payload as Record<string, unknown>) ?? { ...input });
}

export async function updateExtra(id: string, input: ExtraInput): Promise<Extra> {
  const payload = await parse(
    await api(`${EXTRAS}/${id}`, { method: "PUT", body: JSON.stringify(extraPayload(input)) }),
  );
  return normalizeExtra((payload as Record<string, unknown>) ?? { id, ...input });
}

export async function deleteExtra(id: string): Promise<void> {
  await parse(await api(`${EXTRAS}/${id}`, { method: "DELETE" }));
}
