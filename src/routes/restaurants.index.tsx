import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  MapPin,
  Phone,
  Mail,
  Clock,
  Bike,
  ShoppingBag,
  Search,
  MoreHorizontal,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRequireAuth } from "@/lib/auth";
import { currency, restaurants as seed } from "@/lib/mock-data";

export const Route = createFileRoute("/restaurants")({
  head: () => ({
    meta: [
      { title: "Restaurants · Aveline Restaurant OS" },
      {
        name: "description",
        content:
          "Manage unlimited restaurants: hours, delivery and pickup options, contact details and activation state.",
      },
      { property: "og:title", content: "Restaurants · Aveline Restaurant OS" },
      {
        property: "og:description",
        content: "Every location, its own menu, kitchen screens and data — managed in one place.",
      },
    ],
  }),
  component: RestaurantsPage,
});

function RestaurantsPage() {
  useRequireAuth();
  const [query, setQuery] = useState("");
  const [list, setList] = useState(seed);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) => r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q),
    );
  }, [list, query]);

  const toggleActive = (id: string) => {
    setList((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        toast.success(`${r.name} is now ${r.active ? "inactive" : "active"}`);
        return { ...r, active: !r.active };
      }),
    );
  };

  return (
    <AppShell
      title="Restaurants"
      subtitle={`${list.length} locations · ${list.filter((r) => r.active).length} currently active`}
      actions={
        <Button className="gap-2" onClick={() => toast("Restaurant form opens here")}>
          <Plus className="size-4" /> Add restaurant
        </Button>
      }
    >
      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or address"
          className="h-10 pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">No restaurants match “{query}”</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try a different name or city, or create a new location.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <article key={r.id} className="panel lift animate-rise overflow-hidden p-0">
              <div
                className="relative h-28"
                style={{
                  background: `linear-gradient(135deg, color-mix(in oklab, var(--color-${r.accent}) 70%, transparent), color-mix(in oklab, var(--color-${r.accent}) 25%, transparent))`,
                }}
              >
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <Badge variant={r.active ? "default" : "secondary"}>
                    {r.active ? "Active" : "Inactive"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast("Edit restaurant")}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast("Duplicated")}>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast("Kitchen screens")}>
                        Kitchen screens
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => toast.error("Delete requires confirmation")}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <span className="absolute -bottom-6 left-5 grid size-14 place-items-center rounded-2xl border border-border bg-card font-display text-lg font-semibold shadow-soft">
                  {r.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
                </span>
              </div>

              <div className="p-5 pt-9">
                <h2 className="font-display text-lg font-semibold">{r.name}</h2>
                <p className="text-xs text-muted-foreground">{r.tagline}</p>

                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0" /> {r.address}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0" /> {r.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="size-4 shrink-0" /> {r.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="size-4 shrink-0" /> {r.hours}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1.5">
                    <Bike className="size-3.5" /> {r.delivery ? "Delivery" : "No delivery"}
                  </Badge>
                  <Badge variant="outline" className="gap-1.5">
                    <ShoppingBag className="size-3.5" /> {r.pickup ? "Pickup" : "No pickup"}
                  </Badge>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-surface p-3 text-center">
                  <div>
                    <p className="num text-base font-semibold">{r.ordersToday}</p>
                    <p className="text-[11px] text-muted-foreground">Orders</p>
                  </div>
                  <div>
                    <p className="num text-base font-semibold">{currency(r.revenueToday)}</p>
                    <p className="text-[11px] text-muted-foreground">Revenue</p>
                  </div>
                  <div>
                    <p className="num text-base font-semibold">{r.products}</p>
                    <p className="text-[11px] text-muted-foreground">Products</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch checked={r.active} onCheckedChange={() => toggleActive(r.id)} />
                    Accepting orders
                  </label>
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <Link to="/restaurants/$restaurantId" params={{ restaurantId: r.id }}>
                      Manage <ArrowUpRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
