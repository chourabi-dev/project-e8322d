import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  ImageIcon,
  Upload,
  X,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { currency } from "@/lib/mock-data";
import { fetchCategories } from "@/lib/categories-api";
import { fetchExtraCategories } from "@/lib/extras-api";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
  type Product,
  type ProductInput,
} from "@/lib/products-api";

const EMPTY: ProductInput = {
  name: "",
  description: "",
  price: 0,
  photo: "",
  available: true,
  menuCategoryId: "",
  extraCategoryIds: [],
  restaurantId: "",
};

export function ProductDialog({
  open,
  onOpenChange,
  product,
  restaurantId,
  menuCategories,
  extraGroups,
  saving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null | undefined;
  restaurantId: string;
  menuCategories: { id: string; name: string }[];
  extraGroups: { id: string; name: string }[];
  saving?: boolean;
  onSubmit: (input: ProductInput) => void;
}) {
  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editing = Boolean(product);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      product
        ? {
            name: product.name,
            description: product.description,
            price: product.price,
            photo: product.photo,
            available: product.available,
            menuCategoryId: product.menuCategoryId,
            extraCategoryIds: [...product.extraCategoryIds],
            restaurantId,
          }
        : { ...EMPTY, restaurantId },
    );
  }, [open, product, restaurantId]);

  const pickPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Pick an image file.");
    if (file.size > 2 * 1024 * 1024) return setError("Image must be under 2 MB.");
    const reader = new FileReader();
    reader.onload = () => {
      setError(null);
      setForm((p) => ({ ...p, photo: String(reader.result ?? "") }));
    };
    reader.readAsDataURL(file);
  };

  const toggleGroup = (id: string) =>
    setForm((p) => ({
      ...p,
      extraCategoryIds: p.extraCategoryIds.includes(id)
        ? p.extraCategoryIds.filter((g) => g !== id)
        : [...p.extraCategoryIds, id],
    }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return setError("Every product needs a name.");
    if (!form.menuCategoryId) return setError("Pick the menu category for this product.");
    if (!Number.isFinite(form.price) || form.price < 0) return setError("Enter a valid price.");
    setError(null);
    onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      photo: form.photo.trim(),
      restaurantId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
            <DialogDescription>
              Name, price, photo, menu category and the extras groups this dish offers.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={form.name}
                placeholder="Margherita pizza"
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-price">Price (€)</Label>
              <Input
                id="product-price"
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-category">Menu category</Label>
            <Select
              value={form.menuCategoryId}
              onValueChange={(v) => setForm((p) => ({ ...p, menuCategoryId: v }))}
            >
              <SelectTrigger id="product-category">
                <SelectValue placeholder="Select a menu category" />
              </SelectTrigger>
              <SelectContent>
                {menuCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {menuCategories.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No menu categories yet for this restaurant — create one first.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-photo">Photo</Label>
            <div className="flex items-center gap-3">
              {form.photo ? (
                <div className="relative">
                  <img
                    src={form.photo}
                    alt={form.name || "Product preview"}
                    className="size-20 rounded-xl border border-border object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-destructive"
                    onClick={() => {
                      setForm((p) => ({ ...p, photo: "" }));
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="grid size-20 place-items-center rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <ImageIcon className="size-5" />
                </button>
              )}
              <div className="flex flex-col items-start gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="size-4" />
                  {form.photo ? "Replace photo" : "Upload photo"}
                </Button>
                <p className="text-xs text-muted-foreground">PNG or JPG, up to 2 MB</p>
              </div>
            </div>
            <input
              ref={fileRef}
              id="product-photo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-description">Description</Label>
            <Textarea
              id="product-description"
              rows={3}
              value={form.description}
              placeholder="San Marzano tomato, fior di latte, basil"
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Extras groups</Label>
            <p className="text-xs text-muted-foreground">
              Pick which add-on groups customers can choose from for this product.
            </p>
            <div className="grid max-h-44 gap-1 overflow-y-auto rounded-xl border border-border p-2">
              {extraGroups.length === 0 ? (
                <p className="p-2 text-xs text-muted-foreground">
                  No extras groups yet for this restaurant.
                </p>
              ) : (
                extraGroups.map((g) => (
                  <label
                    key={g.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-surface"
                  >
                    <Checkbox
                      checked={form.extraCategoryIds.includes(g.id)}
                      onCheckedChange={() => toggleGroup(g.id)}
                    />
                    {g.name}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-medium">Available</p>
              <p className="text-xs text-muted-foreground">Turn off to hide from the menu</p>
            </div>
            <Switch
              checked={form.available}
              onCheckedChange={(v) => setForm((p) => ({ ...p, available: v }))}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editing ? "Save changes" : "Create product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Full products CRUD for a single restaurant: toolbar (search + category filter +
 * add), grid of cards, edit/delete/availability. Used by the global Products page
 * and by a restaurant's Products tab.
 */
export function ProductsSection({
  restaurantId,
  restaurantName,
  onCountChange,
}: {
  restaurantId: string;
  restaurantName?: string | undefined;
  onCountChange?: ((count: number) => void) | undefined;
}) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const productsQuery = useQuery({
    queryKey: ["products", restaurantId],
    queryFn: () => fetchProducts(restaurantId),
    enabled: Boolean(restaurantId),
  });
  const menuQuery = useQuery({
    queryKey: ["categories", "menu", restaurantId],
    queryFn: () => fetchCategories("menu", restaurantId),
    enabled: Boolean(restaurantId),
  });
  const groupsQuery = useQuery({
    queryKey: ["extra-categories", restaurantId],
    queryFn: () => fetchExtraCategories(restaurantId),
    enabled: Boolean(restaurantId),
  });

  const products = productsQuery.data ?? [];
  const menuCategories = (menuQuery.data ?? []).map((c) => ({ id: c.id, name: c.name }));
  const extraGroups = (groupsQuery.data ?? []).map((g) => ({ id: g.id, name: g.name }));

  useEffect(() => {
    onCountChange?.(products.length);
  }, [products.length, onCountChange]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["products", restaurantId] });

  const saveMutation = useMutation({
    mutationFn: (input: ProductInput) =>
      editing ? updateProduct(editing.id, input) : createProduct(input),
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product created");
      setDialogOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (product: Product) =>
      updateProduct(product.id, {
        name: product.name,
        description: product.description,
        price: product.price,
        photo: product.photo,
        available: !product.available,
        menuCategoryId: product.menuCategoryId,
        extraCategoryIds: product.extraCategoryIds,
        restaurantId: product.restaurantId || restaurantId,
      }),
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success("Product deleted");
      setPendingDelete(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const groupName = (id: string) => extraGroups.find((g) => g.id === id)?.name ?? "Extras";
  const categoryName = (product: Product) =>
    product.menuCategoryName ||
    menuCategories.find((c) => c.id === product.menuCategoryId)?.name ||
    "Uncategorised";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (menu === "all" || p.menuCategoryId === menu) &&
        (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
    );
  }, [products, query, menu]);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="panel flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            className="h-10 pl-9"
          />
        </div>
        <Select value={menu} onValueChange={setMenu}>
          <SelectTrigger className="h-10 w-[190px]" aria-label="Menu category filter">
            <SelectValue placeholder="Menu category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All menu categories</SelectItem>
            {menuCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="gap-2" onClick={openAdd}>
          <Plus className="size-4" /> Add product
        </Button>
      </div>

      {productsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : productsQuery.isError ? (
        <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">Couldn’t load products</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {(productsQuery.error as Error).message}
          </p>
          <Button variant="outline" className="gap-2" onClick={() => productsQuery.refetch()}>
            <RefreshCw className="size-4" /> Try again
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">No products yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add your first dish for {restaurantName ?? "this restaurant"} or clear the filters.
          </p>
          <Button className="mt-2 gap-2" onClick={openAdd}>
            <Plus className="size-4" /> Add product
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <article key={p.id} className="panel lift animate-rise flex flex-col gap-4 p-5">
              <div className="flex items-start gap-3">
                {p.photo ? (
                  <img
                    src={p.photo}
                    alt={p.name}
                    loading="lazy"
                    className="size-16 shrink-0 rounded-xl border border-border object-cover"
                  />
                ) : (
                  <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-surface text-muted-foreground">
                    <ImageIcon className="size-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-semibold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{categoryName(p)}</p>
                  <p className="num mt-1 text-sm font-semibold">{currency(p.price)}</p>
                </div>
              </div>

              {p.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              )}

              {p.extraCategoryIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {p.extraCategoryIds.map((id) => (
                    <Badge key={id} variant="outline">
                      {groupName(id)}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={p.available} onCheckedChange={() => toggleMutation.mutate(p)} />
                  Available
                </label>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Edit product"
                    onClick={() => {
                      setEditing(p);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    aria-label="Delete product"
                    onClick={() => setPendingDelete(p)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ProductDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        product={editing}
        restaurantId={restaurantId}
        menuCategories={menuCategories}
        extraGroups={extraGroups}
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
              This removes the product from the menu. This action can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
