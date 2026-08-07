import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Tags, Flame, Pencil, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionCard } from "@/components/StatCard";
import { CategoryFormDialog } from "@/components/CategoryFormDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireAuth } from "@/lib/auth";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  type Category,
  type CategoryInput,
  type CategoryKind,
} from "@/lib/categories-api";
import { fetchRestaurants } from "@/lib/restaurants-api";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories · Aveline Restaurant OS" },
      {
        name: "description",
        content:
          "Two independent systems: menu categories that shape the customer menu, and kitchen categories that route dishes to the right station screen.",
      },
      { property: "og:title", content: "Categories · Aveline Restaurant OS" },
      {
        property: "og:description",
        content: "Menu categories for guests, kitchen categories for stations.",
      },
    ],
  }),
  component: CategoriesPage,
});

const ALL = "all";

function CategoriesPage() {
  useRequireAuth();
  const queryClient = useQueryClient();

  const [restaurantFilter, setRestaurantFilter] = useState<string>(ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [defaultKind, setDefaultKind] = useState<CategoryKind>("menu");
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const scope = restaurantFilter === ALL ? undefined : restaurantFilter;

  const restaurantsQuery = useQuery({ queryKey: ["restaurants"], queryFn: fetchRestaurants });
  const restaurants = restaurantsQuery.data ?? [];
  const restaurantName = (id: string) =>
    restaurants.find((r) => r.id === id)?.name ?? "";

  const menuQuery = useQuery({
    queryKey: ["categories", "menu", scope ?? ALL],
    queryFn: () => fetchCategories("menu", scope),
  });
  const kitchenQuery = useQuery({
    queryKey: ["categories", "kitchen", scope ?? ALL],
    queryFn: () => fetchCategories("kitchen", scope),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const saveMutation = useMutation({
    mutationFn: (input: CategoryInput) =>
      editing ? updateCategory(editing.id, input) : createCategory(input),
    onSuccess: async () => {
      await invalidate();
      toast.success(editing ? "Category updated" : "Category created");
      setFormOpen(false);
      setEditing(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (category: Category) => deleteCategory(category.kind, category.id),
    onSuccess: async () => {
      await invalidate();
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
          <p className="text-sm text-muted-foreground">{(query.error as Error).message}</p>
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
        {list.map((c) => {
          const place = c.restaurantName || restaurantName(c.restaurantId);
          return (
            <li
              key={`${c.kind}-${c.id}`}
              className="group flex items-center gap-3 border-b border-border py-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {subtitle(c)}
                  {place ? ` · ${place}` : ""}
                </p>
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
          );
        })}
      </ul>
    );
  };

  return (
    <AppShell
      title="Categories"
      subtitle="Menu categories drive the customer menu · kitchen categories drive station routing"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Select value={restaurantFilter} onValueChange={setRestaurantFilter}>
            <SelectTrigger className="w-48" aria-label="Filter by restaurant">
              <SelectValue placeholder="All restaurants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All restaurants</SelectItem>
              {restaurants.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="gap-2" onClick={() => openAdd("menu")}>
            <Plus className="size-4" /> Add category
          </Button>
        </div>
      }
    >
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

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        category={editing}
        defaultKind={defaultKind}
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
    </AppShell>
  );
}
