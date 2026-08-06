import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { RestaurantFormDialog } from "@/components/RestaurantFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRequireAuth } from "@/lib/auth";
import { currency } from "@/lib/mock-data";
import {
  createRestaurant,
  deleteRestaurant,
  fetchRestaurants,
  updateRestaurant,
  type Restaurant,
  type RestaurantInput,
} from "@/lib/restaurants-api";

export const Route = createFileRoute("/restaurants/")({
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
        content:
          "Every location, its own menu, kitchen screens and data — managed in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RestaurantsPage,
});

function RestaurantsPage() {
  useRequireAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Restaurant | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Restaurant | null>(null);

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ["restaurants"],
    queryFn: fetchRestaurants,
  });

  const list = data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["restaurants"] });

  const saveMutation = useMutation({
    mutationFn: (vars: { id?: string | undefined; input: RestaurantInput }) =>
      vars.id ? updateRestaurant(vars.id, vars.input) : createRestaurant(vars.input),
    onSuccess: (_result, vars) => {
      toast.success(vars.id ? "Restaurant updated" : "Restaurant created");
      setFormOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (r: Restaurant) => updateRestaurant(r.id, { active: !r.active }),
    onSuccess: (_result, r) => {
      toast.success(`${r.name} is now ${r.active ? "inactive" : "active"}`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (r: Restaurant) => deleteRestaurant(r.id),
    onSuccess: (_result, r) => {
      toast.success(`${r.name} deleted`);
      setPendingDelete(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) => r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q),
    );
  }, [list, query]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (r: Restaurant) => {
    setEditing(r);
    setFormOpen(true);
  };

  return (
    <AppShell
      title="Restaurants"
      subtitle={
        isLoading
          ? "Loading locations…"
          : `${list.length} locations · ${list.filter((r) => r.active).length} currently active`
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Refresh">
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="size-4" /> Add restaurant
          </Button>
        </div>
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

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="panel space-y-4 p-5">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">Couldn’t load restaurants</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {(error as Error)?.message ?? "The API did not respond."}
          </p>
          <Button variant="outline" className="gap-2" onClick={() => refetch()}>
            <RefreshCw className="size-4" /> Try again
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">
            {query ? `No restaurants match “${query}”` : "No restaurants yet"}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {query
              ? "Try a different name or city, or create a new location."
              : "Create your first location to start building menus and kitchen screens."}
          </p>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="size-4" /> Add restaurant
          </Button>
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
                      <DropdownMenuItem onClick={() => openEdit(r)}>Edit</DropdownMenuItem>
                      {
                        /**
                         * <DropdownMenuItem
                        onClick={() =>
                          saveMutation.mutate({
                            input: {
                              name: `${r.name} (copy)`,
                              tagline: r.tagline,
                              address: r.address,
                              phone: r.phone,
                              email: r.email,
                              description: r.description,
                              hours: r.hours,
                              delivery: r.delivery,
                              pickup: r.pickup,
                              active: false,
                            },
                          })
                        }
                      >
                        Duplicate
                      </DropdownMenuItem>
                         */
                      }
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setPendingDelete(r)}
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
                    <MapPin className="size-4 shrink-0" /> {r.address || "—"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0" /> {r.phone || "—"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="size-4 shrink-0" /> {r.email || "—"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="size-4 shrink-0" /> {r.hours || "—"}
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

                {
                  /**<div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-surface p-3 text-center">
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
                </div> */
                }

                <div className="mt-5 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={r.active}
                      disabled={toggleMutation.isPending}
                      onCheckedChange={() => toggleMutation.mutate(r)}
                    />
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

      <RestaurantFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        restaurant={editing}
        saving={saveMutation.isPending}
        onSubmit={(input) => saveMutation.mutate({ id: editing?.id, input })}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the location and its menu configuration. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete) deleteMutation.mutate(pendingDelete);
              }}
            >
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>

  );
}
