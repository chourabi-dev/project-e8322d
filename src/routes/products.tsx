import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  Rows3,
  Copy,
  Pencil,
  Trash2,
  Star,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { useRequireAuth } from "@/lib/auth";
import {
  currency,
  kitchenCategories,
  menuCategories,
  products as seed,
  restaurants,
} from "@/lib/mock-data";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products · Aveline Restaurant OS" },
      {
        name: "description",
        content:
          "Manage dishes with prices, prep times, allergens, menu category and kitchen routing in a fast table or grid view.",
      },
      { property: "og:title", content: "Products · Aveline Restaurant OS" },
      {
        property: "og:description",
        content: "Search, filter and update your entire menu in seconds.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  useRequireAuth();
  const [items, setItems] = useState(seed);
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState("all");
  const [station, setStation] = useState("all");
  const [view, setView] = useState<"table" | "grid">("table");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (p) =>
        (menu === "all" || p.menuCategory === menu) &&
        (station === "all" || p.kitchenCategory === station) &&
        (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)),
    );
  }, [items, query, menu, station]);

  const toggle = (id: string) =>
    setItems((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        toast.success(`${p.name} ${p.available ? "disabled" : "enabled"}`);
        return { ...p, available: !p.available };
      }),
    );

  const restaurantName = (id: string) => restaurants.find((r) => r.id === id)?.name ?? "—";

  return (
    <AppShell
      title="Products"
      subtitle={`${items.length} items across ${restaurants.length} restaurants`}
      actions={
        <Button className="gap-2" onClick={() => toast("Product form opens here")}>
          <Plus className="size-4" /> Add product
        </Button>
      }
    >
      <div className="panel flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or SKU"
            className="h-10 pl-9"
          />
        </div>
        <Select value={menu} onValueChange={setMenu}>
          <SelectTrigger className="h-10 w-[180px]">
            <SelectValue placeholder="Menu category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All menu categories</SelectItem>
            {menuCategories.map((c) => (
              <SelectItem key={c.id} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={station} onValueChange={setStation}>
          <SelectTrigger className="h-10 w-[190px]">
            <SelectValue placeholder="Kitchen category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All kitchen categories</SelectItem>
            {kitchenCategories.map((c) => (
              <SelectItem key={c.id} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex rounded-lg border border-border p-0.5">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon"
            className="size-9"
            onClick={() => setView("table")}
            aria-label="Table view"
          >
            <Rows3 className="size-4" />
          </Button>
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="size-9"
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="size-4" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">Nothing on the menu matches</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Clear a filter or add a new product to this category.
          </p>
        </div>
      ) : view === "table" ? (
        <div className="panel overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Menu category</TableHead>
                <TableHead>Kitchen category</TableHead>
                <TableHead>Prep</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Available</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface font-display text-xs font-semibold">
                        {p.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-medium">
                          {p.name}
                          {p.featured && <Star className="size-3.5 fill-primary text-primary" />}
                        </p>
                        <p className="text-xs text-muted-foreground">{p.sku}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {restaurantName(p.restaurantId)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.menuCategory}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.kitchenCategory}</Badge>
                  </TableCell>
                  <TableCell className="num text-sm">{p.prepMinutes} min</TableCell>
                  <TableCell className="num text-sm">
                    {p.discountPrice ? (
                      <span className="flex items-center gap-2">
                        {currency(p.discountPrice)}
                        <span className="text-xs text-muted-foreground line-through">
                          {currency(p.price)}
                        </span>
                      </span>
                    ) : (
                      currency(p.price)
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch checked={p.available} onCheckedChange={() => toggle(p.id)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => toast("Edit product")}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => toast.success("Duplicated")}>
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => toast.error("Delete requires confirmation")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <article key={p.id} className="panel lift animate-rise p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-semibold">{p.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {p.sku} · {restaurantName(p.restaurantId)}
                  </p>
                </div>
                {p.featured && <Star className="size-4 fill-primary text-primary" />}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline">{p.menuCategory}</Badge>
                <Badge variant="secondary">{p.kitchenCategory}</Badge>
                <Badge variant="outline" className="gap-1">
                  <Timer className="size-3.5" /> {p.prepMinutes} min
                </Badge>
              </div>
              {p.allergens.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Allergens: {p.allergens.join(", ")}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="num text-lg font-semibold">
                  {currency(p.discountPrice ?? p.price)}
                </span>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={p.available} onCheckedChange={() => toggle(p.id)} /> Available
                </label>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
