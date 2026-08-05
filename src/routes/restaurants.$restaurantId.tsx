import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  ReceiptText,
  Wallet,
  Timer,
  UtensilsCrossed,
  MapPin,
  Clock,
  Settings2,
  MonitorPlay,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/AppShell";
import { StatCard, SectionCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireAuth } from "@/lib/auth";
import {
  currency,
  kitchenCategories,
  menuCategories,
  orders,
  products,
  restaurants,
  revenueEvolution,
} from "@/lib/mock-data";

export const Route = createFileRoute("/restaurants/$restaurantId")({
  loader: ({ params }) => {
    const restaurant = restaurants.find((r) => r.id === params.restaurantId);
    if (!restaurant) throw notFound();
    return { restaurant };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Restaurant unavailable · Aveline" }, { name: "robots", content: "noindex" }] };
    }
    const { restaurant } = loaderData;
    return {
      meta: [
        { title: `${restaurant.name} · Aveline Restaurant OS` },
        { name: "description", content: restaurant.description },
        { property: "og:title", content: `${restaurant.name} · Aveline Restaurant OS` },
        { property: "og:description", content: restaurant.description },
      ],
    };
  },
  component: RestaurantDetail,
});

function RestaurantDetail() {
  useRequireAuth();
  const { restaurant } = Route.useLoaderData();
  const own = products.filter((p) => p.restaurantId === restaurant.id);
  const ownOrders = orders.filter((o) => o.restaurantId === restaurant.id);

  return (
    <AppShell
      title={restaurant.name}
      subtitle={restaurant.tagline}
      actions={
        <>
          <Button asChild variant="ghost" className="gap-2">
            <Link to="/restaurants">
              <ArrowLeft className="size-4" /> All restaurants
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/kitchen">
              <MonitorPlay className="size-4" /> Kitchen screens
            </Link>
          </Button>
          <Button className="gap-2">
            <Settings2 className="size-4" /> Restaurant settings
          </Button>
        </>
      }
    >
      <div className="panel flex flex-wrap items-center gap-4 p-5">
        <Badge variant={restaurant.active ? "default" : "secondary"}>
          {restaurant.active ? "Active" : "Inactive"}
        </Badge>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4" /> {restaurant.address}
        </span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" /> {restaurant.hours}
        </span>
        <p className="w-full text-sm text-muted-foreground">{restaurant.description}</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="kitchen">Kitchen categories</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Orders today" value={String(restaurant.ordersToday)} delta="+6.2%" icon={ReceiptText} />
            <StatCard label="Revenue today" value={currency(restaurant.revenueToday)} delta="+9.1%" icon={Wallet} tone="success" />
            <StatCard label="Avg. prep time" value="12.4 min" delta="-3.0%" icon={Timer} tone="warning" />
            <StatCard label="Products" value={String(restaurant.products)} icon={UtensilsCrossed} tone="info" />
          </div>
          <SectionCard title="Revenue evolution" description="Last 7 days">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueEvolution}>
                  <defs>
                    <linearGradient id="rrev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#rrev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="products" className="mt-5">
          <SectionCard title="Products" description={`${own.length} items assigned to this restaurant`}>
            <ul className="flex flex-col">
              {own.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.menuCategory} → {p.kitchenCategory} · {p.prepMinutes} min
                    </p>
                  </div>
                  <span className="num text-sm">{currency(p.discountPrice ?? p.price)}</span>
                </li>
              ))}
              {own.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No products yet.</p>}
            </ul>
          </SectionCard>
        </TabsContent>

        <TabsContent value="categories" className="mt-5">
          <SectionCard title="Menu categories" description="Drive how products appear on the customer menu">
            <div className="flex flex-wrap gap-2">
              {menuCategories.map((c) => (
                <Badge key={c.id} variant="outline" className="px-3 py-1.5">
                  {c.name} · {c.products}
                </Badge>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="kitchen" className="mt-5">
          <SectionCard title="Kitchen categories" description="Route each product to the right station screen">
            <div className="flex flex-wrap gap-2">
              {kitchenCategories.map((c) => (
                <Badge key={c.id} variant="secondary" className="px-3 py-1.5">
                  {c.name} · {c.station}
                </Badge>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="orders" className="mt-5">
          <SectionCard title="Recent orders" description={`${ownOrders.length} orders in the current service`}>
            <ul className="flex flex-col">
              {ownOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
                  <div>
                    <p className="num text-sm font-semibold">#{o.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.table} · {o.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{o.status}</Badge>
                    <span className="num text-sm">{currency(o.total)}</span>
                  </div>
                </li>
              ))}
              {ownOrders.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No orders in this service.</p>
              )}
            </ul>
          </SectionCard>
        </TabsContent>

        <TabsContent value="stats" className="mt-5">
          <SectionCard title="Statistics" description="Kitchen and sales performance">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { k: "Peak hour", v: "20:00" },
                { k: "Table turn", v: "68 min" },
                { k: "Monthly growth", v: "+7.4%" },
              ].map((s) => (
                <div key={s.k} className="rounded-xl bg-surface p-4">
                  <p className="num text-xl font-semibold">{s.v}</p>
                  <p className="text-xs text-muted-foreground">{s.k}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
