import { api } from "@/lib/auth";

/**
 * Dashboard data — ONE call feeds the whole page.
 *
 *   GET /api/dashboard
 *
 * Expected JSON response (every field is optional; missing ones fall back to
 * 0 / empty so the UI never crashes while the backend is being built):
 *
 * {
 *   "stats": {
 *     "totalRestaurants": 4,
 *     "totalProducts": 196,
 *     "ordersToday": 401,
 *     "ordersInProgress": 17,
 *     "completedOrders": 371,
 *     "revenueToday": 15740,
 *     "revenueThisMonth": 384210,
 *     "avgTicket": 39
 *   },
 *   "deltas": {                       // optional — omit a key to hide its badge
 *     "totalRestaurants": "+1",       // string shown as-is ("+1", "+8.4%")…
 *     "ordersToday": 8.4              // …or a number, rendered as signed percent
 *   },
 *   "revenueEvolution":   [{ "day": "Mon", "revenue": 9800, "orders": 212 }],
 *   "ordersByRestaurant": [{ "name": "Centrale", "value": 184 }],
 *   "ordersByHour":       [{ "hour": "12:00", "orders": 58 }],
 *   "topProducts":        [{ "name": "Margherita", "sold": 412 }]
 * }
 */
export const DASHBOARD_ENDPOINT = "/api/dashboard";

export type DashboardStats = {
  totalRestaurants: number;
  totalProducts: number;
  ordersToday: number;
  ordersInProgress: number;
  completedOrders: number;
  revenueToday: number;
  revenueThisMonth: number;
  avgTicket: number;
};

export type DashboardStatKey = keyof DashboardStats;

export type RevenuePoint = { day: string; revenue: number; orders: number };
export type RestaurantOrders = { name: string; value: number };
export type HourlyOrders = { hour: string; orders: number };
export type TopProduct = { name: string; sold: number };

export type Dashboard = {
  stats: DashboardStats;
  /** Pre-formatted delta badges (e.g. "+8.4%"), only for keys the API provided. */
  deltas: Partial<Record<DashboardStatKey, string>>;
  revenueEvolution: RevenuePoint[];
  ordersByRestaurant: RestaurantOrders[];
  ordersByHour: HourlyOrders[];
  topProducts: TopProduct[];
};

const STAT_KEYS: DashboardStatKey[] = [
  "totalRestaurants",
  "totalProducts",
  "ordersToday",
  "ordersInProgress",
  "completedOrders",
  "revenueToday",
  "revenueThisMonth",
  "avgTicket",
];

const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const list = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
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

function formatDelta(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const rounded = Math.round(value * 10) / 10;
    return `${rounded > 0 ? "+" : ""}${rounded}%`;
  }
  return undefined;
}

/** Accepts the payload as-is or wrapped in { data: {...} }. */
function normalizeDashboard(payload: unknown): Dashboard {
  const root = obj(payload);
  const raw = root["data"] && typeof root["data"] === "object" ? obj(root["data"]) : root;

  const rawStats = obj(raw["stats"]);
  const rawDeltas = obj(raw["deltas"]);

  const stats = {} as DashboardStats;
  const deltas: Dashboard["deltas"] = {};
  for (const key of STAT_KEYS) {
    stats[key] = num(rawStats[key]);
    const delta = formatDelta(rawDeltas[key]);
    if (delta) deltas[key] = delta;
  }

  return {
    stats,
    deltas,
    revenueEvolution: list(raw["revenueEvolution"]).map((r) => ({
      day: str(r["day"], r["label"], r["date"]),
      revenue: num(r["revenue"]),
      orders: num(r["orders"]),
    })),
    ordersByRestaurant: list(raw["ordersByRestaurant"]).map((r) => ({
      name: str(r["name"], r["restaurant"]),
      value: num(r["value"], r["orders"]),
    })),
    ordersByHour: list(raw["ordersByHour"]).map((r) => ({
      hour: str(r["hour"], r["label"]),
      orders: num(r["orders"], r["value"]),
    })),
    topProducts: list(raw["topProducts"]).map((r) => ({
      name: str(r["name"], r["product"]),
      sold: num(r["sold"], r["quantity"], r["value"]),
    })),
  };
}

/** The single API call that powers the whole dashboard page. */
export async function fetchDashboard(): Promise<Dashboard> {
  const res = await api(DASHBOARD_ENDPOINT);
  if (!res.ok) throw new Error(`Failed to load dashboard (${res.status})`);
  return normalizeDashboard(await res.json());
}
