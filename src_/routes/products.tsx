import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Store } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ProductsSection } from "@/components/ProductsSection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireAuth } from "@/lib/auth";
import { fetchRestaurants } from "@/lib/restaurants-api";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products · Dalu | Web master" },
      {
        name: "description",
        content:
          "Pick a restaurant, then create and manage dishes with price, photo, menu category and the extras groups customers can add.",
      },
      { property: "og:title", content: "Products · Dalu | Web master" },
      {
        property: "og:description",
        content: "Manage your menu per restaurant: prices, photos, categories and extras.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  useRequireAuth();
  const [restaurantId, setRestaurantId] = useState("");

  const restaurantsQuery = useQuery({ queryKey: ["restaurants"], queryFn: fetchRestaurants });
  const restaurants = restaurantsQuery.data ?? [];
  const selected = restaurants.find((r) => r.id === restaurantId);

  return (
    <AppShell
      title="Products"
      subtitle={selected ? selected.name : "Pick a restaurant to manage its menu"}
    >
      <div className="panel flex flex-wrap items-center gap-3 p-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Store className="size-4" /> Restaurant
        </div>
        <Select value={restaurantId} onValueChange={setRestaurantId}>
          <SelectTrigger className="h-10 w-[240px]" aria-label="Restaurant">
            <SelectValue
              placeholder={restaurantsQuery.isLoading ? "Loading…" : "Select a restaurant"}
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
      </div>

      {restaurantId ? (
        <ProductsSection
          restaurantId={restaurantId}
          restaurantName={selected?.name}
          view="table"
        />
      ) : (
        <div className="panel flex flex-col items-center gap-3 px-6 py-20 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-surface">
            <Store className="size-5 text-muted-foreground" />
          </span>
          <p className="font-display text-lg font-semibold">Select a restaurant</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Products, menu categories and extras are per location — pick a restaurant above to
            see and manage its menu.
          </p>
        </div>
      )}
    </AppShell>
  );
}
