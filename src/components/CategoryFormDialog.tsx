import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Tags, Flame } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Category, CategoryInput, CategoryKind } from "@/lib/categories-api";
import { fetchRestaurants } from "@/lib/restaurants-api";

const EMPTY: CategoryInput = {
  kind: "menu",
  name: "",
  visible: true,
  station: "",
  screens: 1,
  restaurantId: "",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  /** pre-selects the kind when adding from a specific column */
  defaultKind?: CategoryKind;
  /** when set, the category belongs to this restaurant and the picker is hidden */
  lockedRestaurantId?: string;
  saving?: boolean;
  onSubmit: (input: CategoryInput) => void;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  defaultKind = "menu",
  lockedRestaurantId,
  saving = false,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<CategoryInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(category);

  const restaurantsQuery = useQuery({
    queryKey: ["restaurants"],
    queryFn: fetchRestaurants,
    enabled: open && !lockedRestaurantId,
  });
  const restaurants = restaurantsQuery.data ?? [];

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      category
        ? {
            kind: category.kind,
            name: category.name,
            visible: category.visible,
            station: category.station,
            screens: category.screens || 1,
            restaurantId: lockedRestaurantId ?? category.restaurantId,
          }
        : { ...EMPTY, kind: defaultKind, restaurantId: lockedRestaurantId ?? "" },
    );
  }, [open, category, defaultKind, lockedRestaurantId]);

  const set = <K extends keyof CategoryInput>(key: K, value: CategoryInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }
    if (!lockedRestaurantId && !form.restaurantId) {
      setError("Pick the restaurant this category belongs to.");
      return;
    }
    if (form.kind === "kitchen" && !form.station.trim()) {
      setError("Kitchen categories need a station so tickets can be routed.");
      return;
    }
    setError(null);
    onSubmit({
      ...form,
      name: form.name.trim(),
      station: form.station.trim(),
      restaurantId: lockedRestaurantId ?? form.restaurantId,
    });
  };

  const kinds: { value: CategoryKind; label: string; hint: string; icon: typeof Tags }[] = [
    {
      value: "menu",
      label: "Menu category",
      hint: "What guests see on the customer menu",
      icon: Tags,
    },
    {
      value: "kitchen",
      label: "Kitchen category",
      hint: "Routes tickets to a station screen",
      icon: Flame,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "Add category"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update this category."
                : "First, choose which system this category belongs to."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label>Category type</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {kinds.map((k) => {
                const active = form.kind === k.value;
                return (
                  <button
                    key={k.value}
                    type="button"
                    disabled={editing}
                    onClick={() => set("kind", k.value)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors",
                      active
                        ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                        : "border-border hover:bg-surface",
                      editing && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <k.icon className="size-4" /> {k.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{k.hint}</span>
                  </button>
                );
              })}
            </div>
            {editing && (
              <p className="text-xs text-muted-foreground">
                Category type can't be changed after creation.
              </p>
            )}
          </div>

          {!lockedRestaurantId && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="category-restaurant">Restaurant</Label>
              <Select
                value={form.restaurantId}
                onValueChange={(v) => set("restaurantId", v)}
              >
                <SelectTrigger id="category-restaurant">
                  <SelectValue
                    placeholder={
                      restaurantsQuery.isLoading ? "Loading restaurants…" : "Select a restaurant"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Menu and kitchen categories always belong to one restaurant.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={form.kind === "menu" ? "Desserts" : "Pizza Oven"}
              autoFocus
            />
          </div>

          {form.kind === "menu" ? (
            <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
              <div>
                <p className="text-sm font-medium">Visible on menu</p>
                <p className="text-xs text-muted-foreground">
                  Hidden categories stay in the back office only.
                </p>
              </div>
              <Switch
                checked={form.visible}
                onCheckedChange={(v) => set("visible", v)}
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="category-station">Station</Label>
                <Input
                  id="category-station"
                  value={form.station}
                  onChange={(e) => set("station", e.target.value)}
                  placeholder="Hot line"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="category-screens">Screens</Label>
                <Input
                  id="category-screens"
                  type="number"
                  min={1}
                  value={form.screens}
                  onChange={(e) => set("screens", Number(e.target.value) || 1)}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
