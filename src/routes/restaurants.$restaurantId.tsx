import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Plus,
  Pencil,
  Trash2,
  Tags,
  Flame,
  Loader2,
  RefreshCw,
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
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { StatCard, SectionCard } from "@/components/StatCard";
import { CategoryFormDialog } from "@/components/CategoryFormDialog";
import { ExtrasSection } from "@/components/ExtrasSection";
import { ProductsSection } from "@/components/ProductsSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRequireAuth } from "@/lib/auth";
import { currency, orders, revenueEvolution } from "@/lib/mock-data";
import { fetchRestaurant } from "@/lib/restaurants-api";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  type Category,
  type CategoryInput,
  type CategoryKind,
} from "@/lib/categories-api";

export const Route = createFileRoute("/restaurants/$restaurantId")({
  head: () => ({
    meta: [
      { title: "Restaurant details · Dalu | Web master" },
      {
        name: "description",
        content:
          "Live performance, products, menu and kitchen categories for a single restaurant location.",
      },
      { property: "og:title", content: "Restaurant details · Dalu | Web master" },
      {
        property: "og:description",
        content: "One location: metrics, products, categories and kitchen routing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RestaurantDetail,
});

function RestaurantDetail() {
  useRequireAuth();
  const { restaurantId } = Route.useParams();
  const restaurantQuery = useQuery({
    queryKey: ["restaurant", restaurantId],
    queryFn: () => fetchRestaurant(restaurantId),
  });

  const restaurant = restaurantQuery.data;
  const ownOrders = orders.filter((o) => o.restaurantId === restaurantId);

  if (restaurantQuery.isLoading) {
    return (
      <AppShell title="Restaurant" subtitle="Loading location…">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full rounded-2xl" />
      </AppShell>
    );
  }

  if (restaurantQuery.isError || !restaurant) {
    return (
      <AppShell title="Restaurant" subtitle="We couldn't load this location">
        <div className="panel flex flex-col items-start gap-3 p-6">
          <p className="text-sm text-muted-foreground">
            {(restaurantQuery.error as Error | null)?.message ?? "Restaurant not found."}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => restaurantQuery.refetch()}>
              <RefreshCw className="size-4" /> Try again
            </Button>
            <Button asChild variant="ghost" className="gap-2">
              <Link to="/restaurants">
                <ArrowLeft className="size-4" /> All restaurants
              </Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

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
        {restaurant.address && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" /> {restaurant.address}
          </span>
        )}
        {restaurant.hours && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" /> {restaurant.hours}
          </span>
        )}
        {restaurant.description && (
          <p className="w-full text-sm text-muted-foreground">{restaurant.description}</p>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
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
          <ProductsSection restaurantId={restaurantId} restaurantName={restaurant.name} />
        </TabsContent>

        <TabsContent value="categories" className="mt-5">
          <CategoriesPanel restaurantId={restaurantId} />
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

      </Tabs>
    </AppShell>
  );
}

function CategoriesPanel({ restaurantId }: { restaurantId: string }) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [defaultKind, setDefaultKind] = useState<CategoryKind>("menu");
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const menuQuery = useQuery({
    queryKey: ["categories", "menu", restaurantId],
    queryFn: () => fetchCategories("menu", restaurantId),
  });
  const kitchenQuery = useQuery({
    queryKey: ["categories", "kitchen", restaurantId],
    queryFn: () => fetchCategories("kitchen", restaurantId),
  });

  const invalidate = (kind: CategoryKind) =>
    queryClient.invalidateQueries({ queryKey: ["categories", kind, restaurantId] });

  const saveMutation = useMutation({
    mutationFn: (input: CategoryInput) =>
      editing
        ? updateCategory(editing.id, input, restaurantId)
        : createCategory(input, restaurantId),
    onSuccess: async (_data, input) => {
      await invalidate(input.kind);
      toast.success(editing ? "Category updated" : "Category created");
      setFormOpen(false);
      setEditing(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (category: Category) => deleteCategory(category.kind, category.id),
    onSuccess: async (_data, category) => {
      await invalidate(category.kind);
      toast.success("Category deleted");
      setPendingDelete(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openAdd = (kind: CategoryKind) => {
    setEditing(null);
    setDefaultKind(kind);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
   
    setEditing(category);
    setDefaultKind(category.kind);
    setFormOpen(true);
  };

  const renderList = (
    query: typeof menuQuery,
    kind: CategoryKind,
    subtitle: (c: Category) => string,
  ) => {
    if (query.isLoading) {
      return (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      );
    }
    if (query.isError) {
      return (
        <div className="flex flex-col items-start gap-3 py-6">
          <p className="text-sm text-muted-foreground">
            {(query.error as Error).message}
          </p>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => query.refetch()}>
            <RefreshCw className="size-4" /> Retry
          </Button>
        </div>
      );
    }
    const list = query.data ?? [];
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-start gap-3 py-8">
          <p className="text-sm text-muted-foreground">No categories yet.</p>
          <Button size="sm" className="gap-2" onClick={() => openAdd(kind)}>
            <Plus className="size-4" /> Add category
          </Button>
        </div>
      );
    }
    return (
      <ul className="flex flex-col">
        {list.map((c) => (
          <li
            key={c.id}
            className="group flex items-center gap-3 border-b border-border py-3 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">{subtitle(c)}</p>
            </div>
            {kind === "menu" && !c.visible && <Badge variant="secondary">Hidden</Badge>}
            {kind === "kitchen" && (
              <Badge variant="outline">
                {c.screens} screen{c.screens > 1 ? "s" : ""}
              </Badge>
            )}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${c.name}`}
                onClick={() => openEdit(c)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${c.name}`}
                onClick={() => setPendingDelete(c)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Menu categories shape the customer menu · kitchen categories route tickets to stations.
        </p>
        <Button className="gap-2" onClick={() => openAdd("menu")}>
          <Plus className="size-4" /> Add category
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Menu categories"
          description="What guests see when browsing the menu"
          action={
            <span className="grid size-9 place-items-center rounded-lg bg-info/12 text-info">
              <Tags className="size-4.5" />
            </span>
          }
        >
          {renderList(menuQuery, "menu", (c) => `${c.products} products`)}
        </SectionCard>

        <SectionCard
          title="Kitchen categories"
          description="Used only to route tickets to station screens"
          action={
            <span className="grid size-9 place-items-center rounded-lg bg-primary/12 text-primary">
              <Flame className="size-4.5" />
            </span>
          }
        >
          {renderList(kitchenQuery, "kitchen", (c) => c.station || "Unassigned station")}
        </SectionCard>
      </div>

      <ExtrasSection restaurantId={restaurantId} />

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        category={editing}
        defaultKind={defaultKind}
        lockedRestaurantId={restaurantId}

        saving={saveMutation.isPending}
        onSubmit={(input) => saveMutation.mutate(input)}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the {pendingDelete?.kind} category. Products assigned to it will need a
              new category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete) deleteMutation.mutate(pendingDelete);
              }}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
