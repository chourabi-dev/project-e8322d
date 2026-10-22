import { api } from "@/lib/auth";

/** A product (dish) belongs to one restaurant + menu category and can offer extras groups. */
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  photo: string;
  available: boolean;
  menuCategoryId: string;
  menuCategoryName: string;
  extraCategoryIds: string[];
  restaurantId: string;
  restaurantName: string;
};

export type ProductInput = {
  name: string;
  description: string;
  price: number;
  photo: string;
  available: boolean;
  menuCategoryId: string;
  extraCategoryIds: string[];
  restaurantId: string;
};

const PRODUCTS = "/api/products";

function toArray(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["member", "hydra:member", "data", "items", "products"]) {
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

const idOf = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return (str(obj["id"], obj["@id"]).split("/").pop() ?? "") as string;
  }
  const asString = typeof value === "number" ? `${value}` : str(value);
  return asString.split("/").pop() ?? "";
};

/** refs may be an id, an IRI ("/api/menu_categories/3") or a nested object. */
function ref(raw: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = raw[key];
    if (value === undefined || value === null) continue;
    const name =
      typeof value === "object"
        ? str((value as Record<string, unknown>)["name"], (value as Record<string, unknown>)["title"])
        : "";
    const id = idOf(value);
    if (id || name) return { id, name };
  }
  return { id: "", name: "" };
}

function refList(raw: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const value = raw[key];
    if (Array.isArray(value)) return value.map(idOf).filter(Boolean);
  }
  return [];
}

export function normalizeProduct(raw: Record<string, unknown>): Product {
  const menu = ref(raw, ["menuCategory", "menu_category", "menuCategoryId", "category"]);
  const restaurant = ref(raw, ["restaurant", "restaurantId", "restaurant_id"]);
  return {
    id: `${raw["id"] ?? idOf(raw["@id"])}`,
    name: str(raw["name"], raw["title"], "Untitled product"),
    description: str(raw["description"], raw["notes"]),
    price: num(raw["price"], raw["amount"], raw["unitPrice"]),
    photo: str(raw["photo"], raw["image"], raw["imageUrl"], raw["picture"]),
    available: bool(raw["available"] ?? raw["isAvailable"] ?? raw["active"]),
    menuCategoryId: menu.id,
    menuCategoryName: menu.name,
    extraCategoryIds: refList(raw, [
      "extraCategories",
      "extra_categories",
      "extraCategoryIds",
      "extras",
    ]),
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
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

function productPayload(input: ProductInput) {
  const body: Record<string, unknown> = {
    name: input.name,
    description: input.description,
    price: input.price,
    photo: input.photo,
    available: input.available,
    menuCategory: input.menuCategoryId || null,
    extraCategories: input.extraCategoryIds,
  };
  if (input.restaurantId) body["restaurant"] = input.restaurantId;
  return body;
}

export async function fetchProducts(restaurantId?: string): Promise<Product[]> {
  const path = restaurantId
    ? `${PRODUCTS}?restaurant=${encodeURIComponent(restaurantId)}`
    : PRODUCTS;
  const payload = await parse(await api(path));
  return toArray(payload).map(normalizeProduct);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const payload = await parse(
    await api(PRODUCTS, { method: "POST", body: JSON.stringify(productPayload(input)) }),
  );
  return normalizeProduct((payload as Record<string, unknown>) ?? { ...input });
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const payload = await parse(
    await api(`${PRODUCTS}/${id}`, {
      method: "PUT",
      body: JSON.stringify(productPayload(input)),
    }),
  );
  return normalizeProduct((payload as Record<string, unknown>) ?? { id, ...input });
}

export async function deleteProduct(id: string): Promise<void> {
  await parse(await api(`${PRODUCTS}/${id}`, { method: "DELETE" }));
}
