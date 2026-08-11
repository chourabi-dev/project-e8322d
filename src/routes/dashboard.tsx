import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Store,
  UtensilsCrossed,
  ReceiptText,
  Timer,
  CircleCheckBig,
  Wallet,
  CalendarRange,
  Plus,
  MonitorPlay,
  BookOpenText,
  ArrowUpRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/AppShell";
import { StatCard, SectionCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireAuth } from "@/lib/auth";
import {
  activity,
  currency,
  ordersByHour,
  ordersByRestaurant,
  revenueEvolution,
  topProducts,
} from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Dalu | Web master" },
      {
        name: "description",
        content:
          "Live overview of orders, revenue, kitchen load and product performance across all your restaurants.",
      },
      { property: "og:title", content: "Dashboard · Dalu | Web master" },
      {
        property: "og:description",
        content: "Orders, revenue and kitchen performance across every location, in real time.",
      },
    ],
  }),
  component: DashboardPage,
});

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    color: "var(--color-popover-foreground)",
    fontSize: "12px",
  },
  labelStyle: { color: "var(--color-muted-foreground)" },
} as const;

function ActivityList({ items }: { items: { label: string; meta: string; time: string }[] }) {
  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0 last:pb-0"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{item.label}</p>
            <p className="truncate text-xs text-muted-foreground">{item.meta}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
        </li>
      ))}
    </ul>
  );
}

function DashboardPage() {
  useRequireAuth();

  const quickActions = [
    { label: "Add Restaurant", icon: Store, to: "/restaurants" as const },
    { label: "Add Product", icon: UtensilsCrossed, to: "/products" as const },
    { label: "View Kitchen", icon: MonitorPlay, to: "/kitchen" as const },
    { label: "Menu Management", icon: BookOpenText, to: "/categories" as const },
  ];

  return (
    <AppShell
      title="Service overview"
      subtitle="Thursday · all restaurants · live data"
      actions={
        <>
          <Button variant="outline" className="gap-2">
            <CalendarRange className="size-4" /> Today
          </Button>
          <Button className="gap-2">
            <Plus className="size-4" /> New order
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Restaurants" value="4" delta="+1" icon={Store} />
        <StatCard label="Total Products" value="196" delta="+12" icon={UtensilsCrossed} tone="info" />
        <StatCard label="Orders Today" value="401" delta="+8.4%" icon={ReceiptText} tone="success" />
        <StatCard label="Orders In Progress" value="17" icon={Timer} tone="warning" />
        <StatCard label="Completed Orders" value="371" delta="+6.1%" icon={CircleCheckBig} tone="success" />
        <StatCard label="Revenue Today" value={currency(15740)} delta="+11.2%" icon={Wallet} />
        <StatCard label="Revenue This Month" value={currency(384210)} delta="+4.8%" icon={Wallet} tone="info" />
        <StatCard label="Avg. Ticket" value={currency(39)} delta="-1.4%" icon={ReceiptText} tone="warning" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Revenue evolution"
          description="Last 7 days across all restaurants"
          className="xl:col-span-2"
        >
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueEvolution}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2.5}
                  fill="url(#rev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Orders by restaurant" description="Today">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ordersByRestaurant}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={96}
                  paddingAngle={3}
                  stroke="none"
                >
                  {ordersByRestaurant.map((_, i) => (
                    <Cell key={i} fill={`var(--color-chart-${i + 1})`} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 flex flex-col gap-2">
            {ordersByRestaurant.map((r, i) => (
              <li key={r.name} className="flex items-center gap-2 text-sm">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: `var(--color-chart-${i + 1})` }}
                />
                <span className="flex-1 text-muted-foreground">{r.name}</span>
                <span className="num font-medium">{r.value}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Orders by hour" description="Peak service 20:00 – 21:00">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByHour}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} interval={1} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
                <Bar dataKey="orders" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Most sold products" description="Last 7 days">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={96}
                />
                <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
                <Bar dataKey="sold" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Recent activity" className="xl:col-span-2">
          <Tabs defaultValue="orders">
            <TabsList>
              <TabsTrigger value="orders">New orders</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="mt-4">
              <ActivityList items={activity.orders} />
            </TabsContent>
            <TabsContent value="products" className="mt-4">
              <ActivityList items={activity.products} />
            </TabsContent>
            <TabsContent value="restaurants" className="mt-4">
              <ActivityList items={activity.restaurants} />
            </TabsContent>
          </Tabs>
        </SectionCard>

        <SectionCard title="Quick actions">
          <div className="grid gap-2">
            {quickActions.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-primary/12 text-primary">
                  <a.icon className="size-4.5" />
                </span>
                {a.label}
                <ArrowUpRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
