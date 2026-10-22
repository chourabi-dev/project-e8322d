/**
 * Role-based access control (frontend side).
 *
 * Roles:
 *  - Administrator : sees everything, full dashboard stats.
 *  - Kitchen Staff : Dashboard (orders counts only) + Kitchen screens.
 *  - Cashier       : Dashboard (orders counts only) + Orders.
 *
 * ⚠️ This only controls what the UI shows. The backend MUST enforce the same
 * rules (403 on forbidden endpoints, and /api/dashboard should only return
 * order counts for non-admin roles).
 */
export type Role = "Administrator" | "Kitchen Staff" | "Cashier";

/** Route prefixes each role may open. `null` = everything. */
const ROUTE_ACCESS: Record<Role, readonly string[] | null> = {
  Administrator: null,
  "Kitchen Staff": ["/dashboard", "/kitchen"],
  Cashier: ["/dashboard", "/orders"],
};

/** Pages every signed-in user can open, even when no role could be resolved. */
const PUBLIC_FOR_USERS = ["/dashboard"] as const;

const matches = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export function canAccess(role: Role | undefined, pathname: string): boolean {
  if (!role) return PUBLIC_FOR_USERS.some((p) => matches(pathname, p));
  const allowed = ROUTE_ACCESS[role];
  if (allowed === null) return true;
  return allowed.some((p) => matches(pathname, p));
}

/** Administrators see every dashboard stat/chart; other roles only order counts. */
export const canSeeFullDashboard = (role: Role | undefined) => role === "Administrator";

/* ------------------------------------------------------------------ */
/* Resolving the role from the backend                                 */
/* ------------------------------------------------------------------ */

/**
 * Maps a backend role string to a frontend Role. Accepts the display names
 * ("Kitchen Staff") as well as Symfony-style values ("ROLE_KITCHEN_STAFF",
 * "ROLE_KITCHEN", "ROLE_CASHIER", "ROLE_ADMIN"…).
 */
function mapRole(value: unknown): Role | undefined {
  if (typeof value !== "string") return undefined;
  const key = value
    .trim()
    .toUpperCase()
    .replace(/^ROLE[_\s-]*/, "")
    .replace(/[^A-Z0-9]+/g, "_");
  if (["ADMIN", "ADMINISTRATOR", "SUPER_ADMIN"].includes(key)) return "Administrator";
  if (["KITCHEN", "KITCHEN_STAFF", "CHEF"].includes(key)) return "Kitchen Staff";
  if (["CASHIER", "CASHIER_STAFF"].includes(key)) return "Cashier";
  return undefined;
}

const PRIORITY: Role[] = ["Administrator", "Kitchen Staff", "Cashier"];

function pickRole(candidates: unknown[]): Role | undefined {
  const found = new Set<Role>();
  for (const c of candidates) {
    for (const item of Array.isArray(c) ? c : [c]) {
      const role = mapRole(item);
      if (role) found.add(role);
    }
  }
  return PRIORITY.find((r) => found.has(r));
}

/** Reads the JWT payload (no verification — display/routing purposes only). */
function decodeJwt(token: string): Record<string, unknown> {
  try {
    const part = token.split(".")[1];
    if (!part) return {};
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="))
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    const parsed: unknown = JSON.parse(json);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Role carried by the JWT (`role` or `roles` claim). */
export function roleFromToken(token: string | undefined): Role | undefined {
  if (!token) return undefined;
  const payload = decodeJwt(token);
  return pickRole([payload["role"], payload["roles"]]);
}

/**
 * Role from the /api/login_check response: `role`, `roles`, `user.role` or
 * `user.roles`, falling back to the JWT claims.
 */
export function resolveRole(loginResponse: unknown, token?: string): Role | undefined {
  const data =
    loginResponse && typeof loginResponse === "object"
      ? (loginResponse as Record<string, unknown>)
      : {};
  const user =
    data["user"] && typeof data["user"] === "object"
      ? (data["user"] as Record<string, unknown>)
      : {};
  return (
    pickRole([data["role"], data["roles"], user["role"], user["roles"]]) ?? roleFromToken(token)
  );
}
