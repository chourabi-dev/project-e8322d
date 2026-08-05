import { createFileRoute } from "@tanstack/react-router";
import { Plus, Tags, Flame, GripVertical, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useRequireAuth } from "@/lib/auth";
import { kitchenCategories, menuCategories, products } from "@/lib/mock-data";

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

function CategoriesPage() {
  useRequireAuth();

  return (
    <AppShell
      title="Categories"
      subtitle="Menu categories drive the customer menu · kitchen categories drive station routing"
      actions={
        <Button className="gap-2" onClick={() => toast("Category form opens here")}>
          <Plus className="size-4" /> Add category
        </Button>
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
          <ul className="flex flex-col">
            {menuCategories.map((c) => (
              <li
                key={c.id}
                className="group flex items-center gap-3 border-b border-border py-3 last:border-0"
              >
                <GripVertical className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.products} products</p>
                </div>
                <Switch defaultChecked={c.visible} />
              </li>
            ))}
          </ul>
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
          <ul className="flex flex-col">
            {kitchenCategories.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 border-b border-border py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.station}</p>
                </div>
                <Badge variant="outline">
                  {c.screens} screen{c.screens > 1 ? "s" : ""}
                </Badge>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        title="Routing map"
        description="How each product travels from the menu to a kitchen station"
      >
        <ul className="grid gap-3 md:grid-cols-2">
          {products.slice(0, 8).map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-2 rounded-xl bg-surface px-4 py-3 text-sm"
            >
              <span className="font-medium">{p.name}</span>
              <Badge variant="outline" className="ml-auto">
                {p.menuCategory}
              </Badge>
              <ArrowRight className="size-3.5 text-muted-foreground" />
              <Badge variant="secondary">{p.kitchenCategory}</Badge>
            </li>
          ))}
        </ul>
      </SectionCard>
    </AppShell>
  );
}
