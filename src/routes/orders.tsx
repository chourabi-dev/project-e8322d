import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/lib/auth";
import { currency, kitchenCategories, orders, restaurants } from "@/lib/mock-data";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders · Aveline Restaurant OS" },
      {
        name: "description",
        content:
          "Filter every order by restaurant, status, kitchen, delivery type and payment state, or jump straight to an order number.",
      },
      { property: "og:title", content: "Orders · Aveline Restaurant OS" },
      { property: "og:description", content: "One table for every ticket across every location." },
    ],
  }),
  component: OrdersPage,
});

const statusTone: Record<string, string> = {
  Pending: "bg-info/15 text-info border-info/30",
  Accepted: "bg-info/15 text-info border-info/30",
  Preparing: "bg-warning/15 text-warning border-warning/30",
  Ready: "bg-success/15 text-success border-success/30",
  Completed: "bg-muted text-muted-foreground border-border",
  Cancelled: "bg-destructive/12 text-destructive border-destructive/30",
};

function OrdersPage() {
  useRequireAuth();
  const [query, setQuery] = useState("");
  const [restaurant, setRestaurant] = useState("all");
  const [status, setStatus] = useState("all");
  const [station, setStation] = useState("all");
  const [type, setType] = useState("all");
  const [payment, setPayment] = useState("all");

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) =>
          (restaurant === "all" || o.restaurantId === restaurant) &&
          (status === "all" || o.status === status) &&
          (type === "all" || o.type === type) &&
          (payment === "all" || o.payment === payment) &&
          (station === "all" || o.items.some((i) => i.kitchenCategory === station)) &&
          (!query.trim() || String(o.number).includes(query.trim())),
      ),
    [query, restaurant, status, station, type, payment],
  );

  return (
    <AppShell title="Orders" subtitle={`${filtered.length} of ${orders.length} orders shown`}>
      <div className="panel flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order number"
            className="h-10 pl-9"
          />
        </div>
        {[
          {
            v: restaurant,
            set: setRestaurant,
            all: "All restaurants",
            opts: restaurants.map((r) => ({ value: r.id, label: r.name })),
          },
          {
            v: status,
            set: setStatus,
            all: "All statuses",
            opts: ["Pending", "Accepted", "Preparing", "Ready", "Completed", "Cancelled"].map((s) => ({
              value: s,
              label: s,
            })),
          },
          {
            v: station,
            set: setStation,
            all: "All kitchens",
            opts: kitchenCategories.map((k) => ({ value: k.name, label: k.name })),
          },
          {
            v: type,
            set: setType,
            all: "All types",
            opts: ["Dine-in", "Delivery", "Pickup"].map((s) => ({ value: s, label: s })),
          },
          {
            v: payment,
            set: setPayment,
            all: "All payments",
            opts: ["Paid", "Unpaid", "Refunded"].map((s) => ({ value: s, label: s })),
          },
        ].map((f, i) => (
          <Select key={i} value={f.v} onValueChange={f.set}>
            <SelectTrigger className="h-10 w-[168px]">
              <SelectValue placeholder={f.all} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{f.all}</SelectItem>
              {f.opts.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => {
            setQuery("");
            setRestaurant("all");
            setStatus("all");
            setStation("all");
            setType("all");
            setPayment("all");
          }}
        >
          <Filter className="size-4" /> Reset
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">No orders match these filters</p>
          <p className="max-w-sm text-sm text-muted-foreground">Reset the filters to see the full service.</p>
        </div>
      ) : (
        <div className="panel overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <p className="num text-sm font-semibold">#{o.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.table} ·{" "}
                      {new Date(o.placedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {restaurants.find((r) => r.id === o.restaurantId)?.name}
                  </TableCell>
                  <TableCell className="max-w-[260px] text-sm text-muted-foreground">
                    {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{o.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={o.payment === "Paid" ? "secondary" : "outline"}>{o.payment}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(statusTone[o.status])}>
                      {o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="num text-right text-sm">{currency(o.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AppShell>
  );
}
