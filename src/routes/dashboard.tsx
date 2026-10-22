import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
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
  RefreshCw,
  TriangleAlert,
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
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/lib/auth";
import { fetchDashboard, type Dashboard } from "@/lib/dashboard-api";
import { currency } from "@/lib/mock-data";

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

function EmptyChart({ message = "No data yet" }: { message?: string }) {
  return (
    <div className="grid h-full place-items-center text-sm text-muted-foreground">{message}</div>
  );
}

const chartColor = (i: number) => `var(--color-chart-${(i % 5) + 1})`;

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-[132px] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-[380px] rounded-2xl xl:col-span-2" />
        <Skeleton className="h-[380px] rounded-2xl" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-[340px] rounded-2xl" />
        <Skeleton className="h-[340px] rounded-2xl" />
      </div>
    </>
  );
}

function DashboardPage() {
  const session = useRequireAuth();

  // Single API call that feeds every stat card and chart on this page.
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    enabled: Boolean(session),
    refetchInterval: 30_000,
  });
  const data = dashboardQuery.data;

  const quickActions = [
    { label: "Add Restaurant", icon: Store, to: "/restaurants" as const },
    { label: "Add Product", icon: UtensilsCrossed, to: "/products" as const },
    { label: "View Kitchen", icon: MonitorPlay, to: "/kitchen" as const },
    { label: "Menu Management", icon: BookOpenText, to: "/categories" as const },
  ];

  return (
    <AppShell
      title="Service overview"
      subtitle={`${new Date().toLocaleDateString("en-US", { weekday: "long" })} · all restaurants · live data`}
      actions={
        <>
          {/**<Button variant="outline" className="gap-2">
            <CalendarRange className="size-4" /> Today
          </Button>
          
          <Button className="gap-2">
            <Plus className="size-4" /> New order
          </Button>
           */}
        </>
      }
    >
      {dashboardQuery.isPending ? (
        <DashboardSkeleton />
      ) : dashboardQuery.isError || !data ? (
        <div className="panel flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid size-11 place-items-center rounded-full bg-destructive/12 text-destructive">
            <TriangleAlert className="size-5" />
          </span>
          <div>
            <p className="font-medium">Couldn't load the dashboard</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {dashboardQuery.error instanceof Error
                ? dashboardQuery.error.message
                : "Something went wrong."}
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => dashboardQuery.refetch()}
            disabled={dashboardQuery.isFetching}
          >
            <RefreshCw className="size-4" /> Retry
          </Button>
        </div>
      ) : (
        <DashboardContent data={data} quickActions={quickActions} />
      )}
    </AppShell>
  );
}

function DashboardContent({
  data,
  quickActions,
}: {
  data: Dashboard;
  quickActions: {
    label: string;
    icon: LucideIcon;
    to: "/restaurants" | "/products" | "/kitchen" | "/categories";
  }[];
}) {
  const { stats, deltas, revenueEvolution, ordersByRestaurant, ordersByHour, topProducts } = data;
  const peak = ordersByHour.reduce<(typeof ordersByHour)[number] | null>(
    (best, h) => (!best || h.orders > best.orders ? h : best),
    null,
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Restaurants"
          value={String(stats.totalRestaurants)}
          delta={deltas.totalRestaurants}
          icon={Store}
        />
        <StatCard
          label="Total Products"
          value={String(stats.totalProducts)}
          delta={deltas.totalProducts}
          icon={UtensilsCrossed}
          tone="info"
        />
        <StatCard
          label="Orders Today"
          value={String(stats.ordersToday)}
          delta={deltas.ordersToday}
          icon={ReceiptText}
          tone="success"
        />
        <StatCard
          label="Orders In Progress"
          value={String(stats.ordersInProgress)}
          delta={deltas.ordersInProgress}
          icon={Timer}
          tone="warning"
        />
        <StatCard
          label="Completed Orders"
          value={String(stats.completedOrders)}
          delta={deltas.completedOrders}
          icon={CircleCheckBig}
          tone="success"
        />
        <StatCard
          label="Revenue Today"
          value={currency(stats.revenueToday)}
          delta={deltas.revenueToday}
          icon={Wallet}
        />
        <StatCard
          label="Revenue This Month"
          value={currency(stats.revenueThisMonth)}
          delta={deltas.revenueThisMonth}
          icon={Wallet}
          tone="info"
        />
        <StatCard
          label="Avg. Ticket This Month"
          value={currency(stats.avgTicket)}
          delta={deltas.avgTicket}
          icon={ReceiptText}
          tone="warning"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Revenue evolution"
          description="Last 7 days across all restaurants"
          className="xl:col-span-2"
        >
          <div className="h-[280px]">
            {revenueEvolution.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueEvolution}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
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
            )}
          </div>
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

        {
          /**
           * <SectionCard title="Orders by restaurant" description="Today">
          <div className="h-[280px]">
            {ordersByRestaurant.length === 0 ? (
              <EmptyChart />
            ) : (
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
                      <Cell key={i} fill={chartColor(i)} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="mt-2 flex flex-col gap-2">
            {ordersByRestaurant.map((r, i) => (
              <li key={r.name} className="flex items-center gap-2 text-sm">
                <span className="size-2.5 rounded-full" style={{ background: chartColor(i) }} />
                <span className="flex-1 text-muted-foreground">{r.name}</span>
                <span className="num font-medium">{r.value}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
           */
        }
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {
          /**
           * <SectionCard
          title="Orders by hour"
          description={peak ? `Peak service ${peak.hour}` : "Today"}
        >
          <div className="h-[240px]">
            {ordersByHour.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByHour}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={1}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip {...tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
                  <Bar dataKey="orders" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
           */
        }

        {
          /**
           * <SectionCard title="Most sold products" description="Last 7 days">
          <div className="h-[240px]">
            {topProducts.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid stroke="var(--color-border)" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
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
                  <Bar
                    dataKey="sold"
                    fill="var(--color-chart-1)"
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
           */
        }
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/**
           * <SectionCard title="Recent activity" className="xl:col-span-2">
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
        
           */}

       
      </div>
    </>
  );
}
