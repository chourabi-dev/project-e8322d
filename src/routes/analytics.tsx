import { createFileRoute } from "@tanstack/react-router";
import { Wallet, ReceiptText, Timer, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/AppShell";
import { SectionCard, StatCard } from "@/components/StatCard";
import { useRequireAuth } from "@/lib/auth";
import {
  currency,
  ordersByHour,
  prepTimes,
  restaurants,
  revenueEvolution,
  salesByCategory,
  topProducts,
} from "@/lib/mock-data";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · Aveline Restaurant OS" },
      {
        name: "description",
        content:
          "Revenue, peak hours, kitchen performance, preparation times and category sales, compared across restaurants.",
      },
      { property: "og:title", content: "Analytics · Aveline Restaurant OS" },
      { property: "og:description", content: "Compare locations, stations and categories at a glance." },
    ],
  }),
  component: AnalyticsPage,
});

const tt = {
  contentStyle: {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    fontSize: "12px",
  },
} as const;

function AnalyticsPage() {
  useRequireAuth();

  return (
    <AppShell title="Analytics" subtitle="Trailing 7 days · all restaurants">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={currency(101140)} delta="+9.6%" icon={Wallet} />
        <StatCard label="Orders" value="2 140" delta="+7.1%" icon={ReceiptText} tone="info" />
        <StatCard label="Avg. prep time" value="12.9 min" delta="-4.2%" icon={Timer} tone="warning" />
        <StatCard label="Monthly growth" value="+7.4%" delta="+1.2%" icon={TrendingUp} tone="success" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Revenue vs orders" className="xl:col-span-2">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueEvolution}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...tt} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="orders" stroke="var(--color-chart-2)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Sales by category">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={salesByCategory} dataKey="value" nameKey="name" innerRadius={58} outerRadius={94} paddingAngle={3} stroke="none">
                  {salesByCategory.map((_, i) => (
                    <Cell key={i} fill={`var(--color-chart-${(i % 5) + 1})`} />
                  ))}
                </Pie>
                <Tooltip {...tt} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Kitchen performance" description="Target vs actual preparation time (min)">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prepTimes}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="station" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} interval={0} angle={-12} height={48} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...tt} cursor={{ fill: "var(--color-muted)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="target" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="actual" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Peak hours" description="Orders per hour, all restaurants">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByHour}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} interval={1} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip {...tt} cursor={{ fill: "var(--color-muted)" }} />
                <Bar dataKey="orders" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Restaurant comparison" description="Today">
          <ul className="flex flex-col">
            {restaurants.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.ordersToday} orders</p>
                </div>
                <span className="num text-sm font-semibold">{currency(r.revenueToday)}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Top products" description="Units sold, last 7 days">
          <ul className="flex flex-col">
            {topProducts.map((p) => (
              <li key={p.name} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
                <span className="flex-1 text-sm">{p.name}</span>
                <span className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${(p.sold / topProducts[0]!.sold) * 100}%` }}
                  />
                </span>
                <span className="num w-12 text-right text-sm">{p.sold}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}
