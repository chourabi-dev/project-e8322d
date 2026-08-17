import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  BellOff,
  ChefHat,
  Clock,
  Flame,
  Loader2,
  RefreshCw,
  Store,
  Timer,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import pusher from "../services/pusher";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/lib/auth";
import { fetchRestaurants } from "@/lib/restaurants-api";
import { fetchCategories, type Category } from "@/lib/categories-api";
import {
  fetchOrders,
  isOrderFullyReady,
  isOrderPaid,
  parseOrderDate,
  updateItemsPrepStatus,
  type Order,
  type OrderItem,
} from "@/lib/orders-api";

export const Route = createFileRoute("/kitchen")({
  head: () => ({
    meta: [
      { title: "Kitchen Screens · Dalu | Web master" },
      {
        name: "description",
        content:
          "Live kitchen display system: pick a restaurant and a station, and watch only the tickets routed to it.",
      },
      { property: "og:title", content: "Kitchen Screens · Dalu | Web master" },
      {
        property: "og:description",
        content: "Paperless tickets, filtered per station, synced live over Pusher.",
      },
    ],
  }),
  component: KitchenPage,
});

const RESTAURANT_KEY = "dalu-kitchen-restaurant";
const CATEGORY_KEY = "dalu-kitchen-category";

type TicketStatus = "pending" | "preparing" | "ready";

const statusStyles: Record<TicketStatus, string> = {
  pending: "bg-info/15 text-info border-info/30",
  preparing: "bg-warning/15 text-warning border-warning/30",
  ready: "bg-success/15 text-success border-success/30",
};

const statusLabel: Record<TicketStatus, string> = {
  pending: "Incoming",
  preparing: "Preparing",
  ready: "Ready",
};

function ticketStatus(items: OrderItem[]): TicketStatus {
  if (items.every((i) => i.prepStatus === "ready")) return "ready";
  if (items.some((i) => i.prepStatus !== "pending")) return "preparing";
  return "pending";
}

function elapsed(from: number, now: number) {
  const total = Math.max(0, Math.floor((now - from) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function useChime(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  return useCallback(() => {
    if (!enabled) return;
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctxRef.current = ctxRef.current ?? new Ctor();
      const ctx = ctxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.46);
    } catch {
      /* audio unavailable */
    }
  }, [enabled]);
}

function KitchenPage() {
  useRequireAuth();
  const queryClient = useQueryClient();

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sound, setSound] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const chime = useChime(sound);

  // Restore the station a device was last watching (kiosk-style screens reload a lot).
  useEffect(() => {
    const r = window.localStorage.getItem(RESTAURANT_KEY);
    const c = window.localStorage.getItem(CATEGORY_KEY);
    if (r) setRestaurantId(r);
    if (c) setCategoryId(c);
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const restaurantsQuery = useQuery({ queryKey: ["restaurants"], queryFn: fetchRestaurants });

  const categoriesQuery = useQuery({
    queryKey: ["kitchen-categories", restaurantId],
    queryFn: () => fetchCategories("kitchen", restaurantId ?? undefined),
    enabled: Boolean(restaurantId),
  });

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    enabled: Boolean(restaurantId && categoryId),
    refetchInterval: 20000,
  });

  const invalidateOrders = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
    [queryClient],
  );

  const chooseRestaurant = (id: string) => {
    setRestaurantId(id);
    setCategoryId(null);
    window.localStorage.setItem(RESTAURANT_KEY, id);
    window.localStorage.removeItem(CATEGORY_KEY);
  };

  const chooseCategory = (id: string) => {
    setCategoryId(id);
    window.localStorage.setItem(CATEGORY_KEY, id);
  };

  const changeRestaurant = () => {
    setRestaurantId(null);
    setCategoryId(null);
    window.localStorage.removeItem(RESTAURANT_KEY);
    window.localStorage.removeItem(CATEGORY_KEY);
  };

  const changeStation = () => {
    setCategoryId(null);
    window.localStorage.removeItem(CATEGORY_KEY);
  };

  // One channel for the whole kitchen; any event on it means "something moved, re-check my board".
  useEffect(() => {
    const channel = pusher.subscribe("channel-orders");

    channel.bind_global((eventName: string, data: unknown) => {
      if (eventName.startsWith("pusher:")) return;
      console.log("🔥 KITCHEN EVENT", eventName, data);
      invalidateOrders();
      if (eventName === "new-kitchen-ticket") {
        chime();
        toast.success("New order in", { description: "Check the board for new tickets." });
      }
    });

    return () => {
      channel.unbind_global();
      pusher.unsubscribe("channel-orders");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const station: Category | undefined = categoriesQuery.data?.find((c) => c.id === categoryId);
  const restaurant = restaurantsQuery.data?.find((r) => r.id === restaurantId);

  const tickets = useMemo(() => {
    if (!restaurantId || !categoryId) return [];
    return (ordersQuery.data ?? [])
      .filter((o) => o.restaurantId === restaurantId && isOrderPaid(o))
      .map((order) => ({
        order,
        items: order.items.filter((i) => i.kitchenLine === categoryId),
      }))
      .filter((t) => t.items.length > 0)
      .sort((a, b) => {
        const ta = parseOrderDate(a.order.createdAt)?.getTime() ?? 0;
        const tb = parseOrderDate(b.order.createdAt)?.getTime() ?? 0;
        return ta - tb;
      });
  }, [ordersQuery.data, restaurantId, categoryId]);

  const active = tickets.filter((t) => ticketStatus(t.items) !== "ready");
  const done = tickets.filter((t) => ticketStatus(t.items) === "ready");

  const counts = (s: TicketStatus) => tickets.filter((t) => ticketStatus(t.items) === s).length;

  const prepMutation = useMutation({
    mutationFn: ({
      order,
      itemIds,
      status,
    }: {
      order: Order;
      itemIds: string[];
      status: "preparing" | "ready";
    }) => updateItemsPrepStatus(order.id, itemIds, status),
    onSuccess: (_r, vars) => {
      invalidateOrders();
      if (vars.status === "ready")
        toast.success(`Order #${vars.order.id.slice(-6).toUpperCase()} ready`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Step 1 — pick a restaurant.
  if (!restaurantId) {
    return (
      <AppShell title="Kitchen display" subtitle="Select the restaurant this screen serves">
        {restaurantsQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : restaurantsQuery.isError ? (
          <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="font-display text-lg font-semibold">Couldn’t load restaurants</p>
            <Button variant="outline" className="gap-2" onClick={() => restaurantsQuery.refetch()}>
              <RefreshCw className="size-4" /> Try again
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(restaurantsQuery.data ?? []).map((r) => (
              <button
                key={r.id}
                onClick={() => chooseRestaurant(r.id)}
                className="panel flex items-center gap-3 p-5 text-left transition hover:border-primary/50"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-primary">
                  <Store className="size-5" />
                </span>
                <span>
                  <span className="block font-display font-semibold">{r.name}</span>
                  <span className="block text-xs text-muted-foreground">{r.address || "—"}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </AppShell>
    );
  }

  // Step 2 — pick the station (kitchen category) to watch.
  if (!categoryId) {
    return (
      <AppShell
        title="Kitchen display"
        subtitle={`Select your station · ${restaurant?.name ?? "Restaurant"}`}
        actions={
          <Button variant="outline" className="gap-2" onClick={changeRestaurant}>
            <ArrowLeft className="size-4" /> Change restaurant
          </Button>
        }
      >
        {categoriesQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : categoriesQuery.isError ? (
          <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
            <p className="font-display text-lg font-semibold">Couldn’t load kitchen categories</p>
            <Button variant="outline" className="gap-2" onClick={() => categoriesQuery.refetch()}>
              <RefreshCw className="size-4" /> Try again
            </Button>
          </div>
        ) : (categoriesQuery.data ?? []).length === 0 ? (
          <div className="panel flex flex-col items-center gap-2 px-6 py-16 text-center">
            <p className="font-display text-lg font-semibold">No kitchen categories yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add kitchen categories for {restaurant?.name ?? "this restaurant"} first.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(categoriesQuery.data ?? []).map((c) => (
              <button
                key={c.id}
                onClick={() => chooseCategory(c.id)}
                className="panel flex items-center gap-3 p-5 text-left transition hover:border-primary/50"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface text-primary">
                  <Flame className="size-5" />
                </span>
                <span>
                  <span className="block font-display font-semibold">{c.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {c.station || "Station"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </AppShell>
    );
  }

  // Step 3 — the live board for the chosen station.
  return (
    <AppShell
      title={station?.name ?? "Kitchen display"}
      subtitle={`${restaurant?.name ?? "Restaurant"} · paid orders only`}
      actions={
        <>
          <Badge variant="outline" className="gap-1.5 py-1.5">
            <span className="size-2 animate-pulse rounded-full bg-success" /> Live
          </Badge>
          <Button variant="outline" className="gap-2" onClick={() => setSound((s) => !s)}>
            {sound ? <Volume2 className="size-4" /> : <BellOff className="size-4" />}
            {sound ? "Sound on" : "Sound off"}
          </Button>
          <Button variant="outline" className="gap-2" onClick={changeStation}>
            <ArrowLeft className="size-4" /> Change station
          </Button>
          <Button variant="ghost" className="gap-2" onClick={changeRestaurant}>
            Change restaurant
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {(["pending", "preparing", "ready"] as const).map((s) => (
          <div key={s} className={cn("rounded-xl border px-4 py-3", statusStyles[s])}>
            <p className="text-xs font-medium uppercase tracking-wide">{statusLabel[s]}</p>
            <p className="num text-2xl font-semibold">{counts(s)}</p>
          </div>
        ))}
      </div>

      {ordersQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : ordersQuery.isError ? (
        <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">Couldn’t load orders</p>
          <Button variant="outline" className="gap-2" onClick={() => ordersQuery.refetch()}>
            <RefreshCw className="size-4" /> Try again
          </Button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 px-6 py-20 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-surface text-muted-foreground">
            <Bell className="size-5" />
          </span>
          <p className="font-display text-lg font-semibold">
            {station?.name ?? "This station"} is clear
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Paid orders with items routed here appear the moment they come in.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...active, ...done].map(({ order, items }) => {
            const placedAt = parseOrderDate(order.createdAt)?.getTime() ?? Date.now();
            const ageMin = (now - placedAt) / 60000;
            const urgent = ageMin > 12;
            const warn = ageMin > 7 && !urgent;
            const tStatus = ticketStatus(items);
            const fullyReady = isOrderFullyReady(order);
            const itemIds = items.map((i) => i.id);
            const busy =
              prepMutation.isPending &&
              prepMutation.variables?.order.id === order.id &&
              prepMutation.variables.itemIds[0] === itemIds[0];

            return (
              <article
                key={order.id}
                className={cn(
                  "panel animate-rise flex flex-col gap-4 p-5",
                  tStatus === "ready" && "opacity-70",
                  warn && tStatus !== "ready" && "border-warning/50",
                  urgent && tStatus !== "ready" && "animate-urgent border-destructive/60",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="num text-3xl leading-none font-semibold">
                      #{order.orderNumber.toUpperCase()}
                    </p>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {order.type === "dine_in" ? order.note || "Dine-in" : order.type}
                      {order.clientName ? ` · ${order.clientName}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={statusStyles[tStatus]}>
                      {statusLabel[tStatus]}
                    </Badge>
                    {tStatus === "ready" && (
                      <Badge
                        variant="outline"
                        className={
                          fullyReady
                            ? "bg-success/15 text-success border-success/30"
                            : "bg-muted text-muted-foreground border-border"
                        }
                      >
                        {fullyReady ? "Order fully ready" : "Waiting on other stations"}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="size-4" />
                    {new Date(placedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span
                    className={cn(
                      "num flex items-center gap-1.5 font-semibold",
                      urgent ? "text-destructive" : warn ? "text-warning" : "text-foreground",
                    )}
                  >
                    <Timer className="size-4" /> {elapsed(placedAt, now)}
                  </span>
                </div>

                <ul className="flex flex-col gap-2 rounded-xl bg-surface p-3">
                  {items.map((i) => (
                    <li key={i.id} className="flex items-start gap-3 text-sm">
                      <span className="num shrink-0 rounded-md bg-card px-2 py-0.5 font-semibold">
                        {i.quantity}×
                      </span>
                      <span className="min-w-0">
                        <span className="font-medium">{i.name}</span>
                        {i.extras.length > 0 && (
                          <span className="block text-xs text-muted-foreground">
                            + {i.extras.map((e) => e.name).join(", ")}
                          </span>
                        )}
                        {i.note && (
                          <span className="block text-xs text-warning">Note: {i.note}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {order.note && (
                  <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                    {order.note}
                  </p>
                )}

                <div className="mt-auto">
                  {tStatus === "pending" && (
                    <Button
                      className="h-11 w-full gap-2"
                      disabled={busy}
                      onClick={() => prepMutation.mutate({ order, itemIds, status: "preparing" })}
                    >
                      {busy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ChefHat className="size-4" />
                      )}
                      Start
                    </Button>
                  )}
                  {tStatus === "preparing" && (
                    <Button
                      className="h-11 w-full"
                      disabled={busy}
                      onClick={() => prepMutation.mutate({ order, itemIds, status: "ready" })}
                    >
                      {busy ? <Loader2 className="size-4 animate-spin" /> : "Ready"}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
