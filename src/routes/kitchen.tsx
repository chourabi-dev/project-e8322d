import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellOff, Clock, Flame, Timer, TriangleAlert, Volume2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/lib/auth";
import { kitchenCategories, orders as seedOrders, type OrderItem } from "@/lib/mock-data";

export const Route = createFileRoute("/kitchen")({
  head: () => ({
    meta: [
      { title: "Kitchen Screens · Dalu | Web master" },
      {
        name: "description",
        content:
          "Live kitchen display system: each station screen receives only the items routed to its kitchen category, updating in real time.",
      },
      { property: "og:title", content: "Kitchen Screens · Dalu | Web master" },
      {
        property: "og:description",
        content: "Paperless tickets that animate in, escalate with time and sync across stations.",
      },
    ],
  }),
  component: KitchenPage,
});

type Ticket = {
  id: string;
  number: number;
  table: string;
  customer?: string;
  placedAt: number;
  status: "Incoming" | "Preparing" | "Ready" | "Completed" | "Cancelled";
  priority: "Normal" | "High" | "Rush";
  instructions?: string;
  items: OrderItem[];
};

const statusStyles: Record<Ticket["status"], string> = {
  Incoming: "bg-info/15 text-info border-info/30",
  Preparing: "bg-warning/15 text-warning border-warning/30",
  Ready: "bg-success/15 text-success border-success/30",
  Completed: "bg-muted text-muted-foreground border-border",
  Cancelled: "bg-destructive/12 text-destructive border-destructive/30",
};

const incomingPool: { table: string; customer?: string; items: OrderItem[] }[] = [
  {
    table: "Table 7",
    customer: "Sofia M.",
    items: [
      { name: "Margherita", qty: 2, kitchenCategory: "Pizza Oven" },
      { name: "Espresso Tonic", qty: 1, kitchenCategory: "Drinks Bar" },
    ],
  },
  {
    table: "Table 2",
    items: [
      { name: "Spaghetti Carbonara", qty: 1, kitchenCategory: "Pasta Station", note: "Extra pecorino" },
    ],
  },
  {
    table: "Delivery",
    customer: "Anis K.",
    items: [
      { name: "Charcoal Ribeye", qty: 1, kitchenCategory: "Grill", note: "Medium rare" },
      { name: "Pistachio Tiramisu", qty: 2, kitchenCategory: "Desserts" },
    ],
  },
  {
    table: "Table 14",
    items: [
      { name: "Burrata & Peach", qty: 2, kitchenCategory: "Cold Kitchen" },
      { name: "Negroni Barrel-Aged", qty: 2, kitchenCategory: "Drinks Bar" },
    ],
  },
];

function toTicket(o: (typeof seedOrders)[number]): Ticket {
  const status: Ticket["status"] =
    o.status === "Pending" || o.status === "Accepted"
      ? "Incoming"
      : o.status === "Preparing"
        ? "Preparing"
        : o.status === "Ready"
          ? "Ready"
          : o.status === "Cancelled"
            ? "Cancelled"
            : "Completed";
  const ticket: Ticket = {
    id: o.id,
    number: o.number,
    table: o.table,
    placedAt: new Date(o.placedAt).getTime(),
    status,
    priority: o.priority,
    items: o.items,
  };
  if (o.customer) ticket.customer = o.customer;
  if (o.instructions) ticket.instructions = o.instructions;
  return ticket;
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
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
  const [station, setStation] = useState(kitchenCategories[0]!.name);
  const [tickets, setTickets] = useState<Ticket[]>(() => seedOrders.map(toTicket));
  const [now, setNow] = useState(() => Date.now());
  const [sound, setSound] = useState(true);
  const chime = useChime(sound);
  const counter = useRef(200);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Simulated live feed — a new ticket lands every ~14 seconds.
  useEffect(() => {
    const t = window.setInterval(() => {
      const base = incomingPool[Math.floor(Math.random() * incomingPool.length)]!;
      counter.current += 1;
      const next: Ticket = {
        id: `live-${counter.current}`,
        number: counter.current,
        table: base.table,
        placedAt: Date.now(),
        status: "Incoming",
        priority: Math.random() > 0.75 ? "Rush" : "Normal",
        items: base.items,
      };
      if (base.customer) next.customer = base.customer;
      setTickets((prev) => [next, ...prev].slice(0, 24));
      chime();
      toast.success(`Order #${next.number} · ${next.table}`, { description: "New ticket in queue" });
    }, 14000);
    return () => window.clearInterval(t);
  }, [chime]);

  const visible = useMemo(() => {
    return tickets
      .map((t) => ({ ...t, items: t.items.filter((i) => i.kitchenCategory === station) }))
      .filter((t) => t.items.length > 0 && t.status !== "Completed" && t.status !== "Cancelled");
  }, [tickets, station]);

  const setStatus = (id: string, status: Ticket["status"]) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const counts = (s: Ticket["status"]) => visible.filter((t) => t.status === s).length;

  return (
    <AppShell
      title="Kitchen display"
      subtitle="Live tickets routed by kitchen category · no printing"
      actions={
        <>
          <Badge variant="outline" className="gap-1.5 py-1.5">
            <span className="size-2 animate-pulse rounded-full bg-success" /> Live
          </Badge>
          <Button variant="outline" className="gap-2" onClick={() => setSound((s) => !s)}>
            {sound ? <Volume2 className="size-4" /> : <BellOff className="size-4" />}
            {sound ? "Sound on" : "Sound off"}
          </Button>
        </>
      }
    >
      <Tabs value={station} onValueChange={setStation}>
        <TabsList className="flex-wrap">
          {kitchenCategories.map((c) => (
            <TabsTrigger key={c.id} value={c.name} className="gap-2">
              <Flame className="size-3.5" />
              {c.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-3 sm:grid-cols-3">
        {(["Incoming", "Preparing", "Ready"] as const).map((s) => (
          <div key={s} className={cn("rounded-xl border px-4 py-3", statusStyles[s])}>
            <p className="text-xs font-medium uppercase tracking-wide">{s}</p>
            <p className="num text-2xl font-semibold">{counts(s)}</p>
          </div>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 px-6 py-20 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-surface text-muted-foreground">
            <Bell className="size-5" />
          </span>
          <p className="font-display text-lg font-semibold">{station} is clear</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            New tickets for this station appear here the moment an order is placed.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((t) => {
            const ageMin = (now - t.placedAt) / 60000;
            const urgent = ageMin > 12;
            const warn = ageMin > 7 && !urgent;
            return (
              <article
                key={t.id}
                className={cn(
                  "panel animate-rise flex flex-col gap-4 p-5",
                  warn && "border-warning/50",
                  urgent && "animate-urgent border-destructive/60",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="num text-3xl font-semibold leading-none">#{t.number}</p>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {t.table}
                      {t.customer ? ` · ${t.customer}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={statusStyles[t.status]}>
                      {t.status}
                    </Badge>
                    {t.priority !== "Normal" && (
                      <Badge variant="destructive" className="gap-1">
                        <TriangleAlert className="size-3" /> {t.priority}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="size-4" />
                    {new Date(t.placedAt).toLocaleTimeString([], {
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
                    <Timer className="size-4" /> {elapsed(t.placedAt, now)}
                  </span>
                </div>

                <ul className="flex flex-col gap-2 rounded-xl bg-surface p-3">
                  {t.items.map((i, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <span className="num shrink-0 rounded-md bg-card px-2 py-0.5 font-semibold">
                        {i.qty}×
                      </span>
                      <span className="min-w-0">
                        <span className="font-medium">{i.name}</span>
                        {i.note && (
                          <span className="block text-xs text-warning">Note: {i.note}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {t.instructions && (
                  <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                    {t.instructions}
                  </p>
                )}

                <div className="mt-auto grid grid-cols-2 gap-2">
                  {t.status === "Incoming" && (
                    <Button className="col-span-2 h-11" onClick={() => setStatus(t.id, "Preparing")}>
                      Start preparing
                    </Button>
                  )}
                  {t.status === "Preparing" && (
                    <>
                      <Button className="h-11" onClick={() => setStatus(t.id, "Ready")}>
                        Ready
                      </Button>
                      <Button
                        variant="outline"
                        className="h-11"
                        onClick={() => toast.warning(`Order #${t.number} delayed by 5 min`)}
                      >
                        Delay
                      </Button>
                    </>
                  )}
                  {t.status === "Ready" && (
                    <Button
                      variant="secondary"
                      className="col-span-2 h-11"
                      onClick={() => {
                        setStatus(t.id, "Completed");
                        toast.success(`Order #${t.number} completed`);
                      }}
                    >
                      Completed
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="col-span-2 h-9 text-destructive"
                    onClick={() => {
                      setStatus(t.id, "Cancelled");
                      toast.error(`Order #${t.number} cancelled`);
                    }}
                  >
                    Cancel order
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
