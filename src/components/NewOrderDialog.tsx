import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Minus, Plus, Trash2, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import type { Restaurant } from "@/lib/restaurants-api";
import { fetchProducts, type Product } from "@/lib/products-api";
import { fetchExtras } from "@/lib/extras-api";
import type { NewOrderInput, NewOrderItemInput, OrderType, PaymentMethod } from "@/lib/orders-api";

const money = (n: number) => `€${n.toFixed(2)}`;

const TYPE_OPTIONS: { value: OrderType; label: string }[] = [
  { value: "dine_in", label: "Dine-in" },
  { value: "delivery", label: "Delivery" },
  { value: "pickup", label: "Pickup" },
];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "online", label: "Online" },
];

/** One line being built in the item composer, before it's added to the order. */
type Draft = {
  productId: string;
  quantity: number;
  extraOptionIds: string[];
  note: string;
};

const EMPTY_DRAFT: Draft = { productId: "", quantity: 1, extraOptionIds: [], note: "" };

/** A confirmed order line, kept alongside its product/extra names for display. */
type OrderLine = NewOrderItemInput & {
  key: string;
  name: string;
  unitPrice: number;
  extraNames: string[];
};

export function NewOrderDialog({
  open,
  onOpenChange,
  restaurants,
  saving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurants: Restaurant[];
  saving?: boolean;
  onSubmit: (input: NewOrderInput) => void;
}) {
  const [restaurantId, setRestaurantId] = useState("");
  const [type, setType] = useState<OrderType>("dine_in");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pickupTime, setPickupTime] = useState("asap");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restaurant = restaurants.find((r) => r.id === restaurantId) ?? null;

  useEffect(() => {
    if (!open) return;
    setRestaurantId((prev) => prev || restaurants[0]?.id || "");
    setError(null);
  }, [open, restaurants]);

  // Reset everything whenever the dialog is closed, so the next order starts clean.
  useEffect(() => {
    if (open) return;
    setType("dine_in");
    setPaymentMethod("cash");
    setClientName("");
    setPhone("");
    setDeliveryAddress("");
    setPickupTime("asap");
    setNote("");
    setLines([]);
    setDraft(EMPTY_DRAFT);
    setError(null);
  }, [open]);

  // If the picked fulfillment type stops being available for the newly
  // selected restaurant, fall back to dine-in (always supported).
  useEffect(() => {
    if (!restaurant) return;
    if (type === "delivery" && !restaurant.delivery) setType("dine_in");
    if (type === "pickup" && !restaurant.pickup) setType("dine_in");
  }, [restaurant, type]);

  const productsQuery = useQuery({
    queryKey: ["products", restaurantId],
    queryFn: () => fetchProducts(restaurantId),
    enabled: open && Boolean(restaurantId),
  });

  const extrasQuery = useQuery({
    queryKey: ["extras", restaurantId],
    queryFn: () => fetchExtras(restaurantId),
    enabled: open && Boolean(restaurantId),
  });

  const products = useMemo(
    () => (productsQuery.data ?? []).filter((p) => p.available),
    [productsQuery.data],
  );
  const extras = extrasQuery.data ?? [];

  const selectedProduct: Product | null =
    products.find((p) => p.id === draft.productId) ?? null;

  const availableExtras = useMemo(
    () =>
      selectedProduct
        ? extras.filter((e) => selectedProduct.extraCategoryIds.includes(e.extraCategoryId))
        : [],
    [selectedProduct, extras],
  );

  const draftUnitPrice =
    (selectedProduct?.price ?? 0) +
    availableExtras
      .filter((e) => draft.extraOptionIds.includes(e.id))
      .reduce((sum, e) => sum + e.price, 0);

  const toggleDraftExtra = (id: string) =>
    setDraft((d) => ({
      ...d,
      extraOptionIds: d.extraOptionIds.includes(id)
        ? d.extraOptionIds.filter((x) => x !== id)
        : [...d.extraOptionIds, id],
    }));

  const addLine = () => {
    if (!selectedProduct) return;
    const extraNames = availableExtras
      .filter((e) => draft.extraOptionIds.includes(e.id))
      .map((e) => e.name);
    const trimmedNote = draft.note.trim();
    setLines((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        productId: selectedProduct.id,
        quantity: draft.quantity,
        extraOptionIds: draft.extraOptionIds,
        ...(trimmedNote ? { note: trimmedNote } : {}),
        name: selectedProduct.name,
        unitPrice: draftUnitPrice,
        extraNames,
      },
    ]);
    setDraft(EMPTY_DRAFT);
    setError(null);
  };

  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  const updateLineNote = (key: string, value: string) =>
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const { note: _prevNote, ...rest } = l;
        return value.trim() ? { ...rest, note: value } : (rest as OrderLine);
      }),
    );

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!restaurantId) return setError("Pick a restaurant.");
    if (lines.length === 0) return setError("Add at least one item to the order.");
    if (type === "delivery" && !deliveryAddress.trim()) {
      return setError("A delivery address is required for delivery orders.");
    }
    if ((type === "delivery" || type === "pickup") && !phone.trim()) {
      return setError("A phone number is required so the restaurant can reach the client.");
    }
    setError(null);
    const trimmedPhone = phone.trim();
    const trimmedNote = note.trim();
    const trimmedClientName = clientName.trim();
    onSubmit({
      restaurantId,
      type,
      paymentMethod,
      ...(type === "delivery" ? { deliveryAddress: deliveryAddress.trim() } : {}),
      ...(type === "pickup" ? { pickupTime: pickupTime.trim() || "asap" } : {}),
      ...(trimmedPhone ? { phone: trimmedPhone } : {}),
      ...(trimmedNote ? { note: trimmedNote } : {}),
      ...(trimmedClientName ? { clientName: trimmedClientName } : {}),
      items: lines.map(({ productId, quantity, extraOptionIds, note: lineNote }) => ({
        productId,
        quantity,
        extraOptionIds,
        ...(lineNote ? { note: lineNote } : {}),
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>New order</DialogTitle>
            <DialogDescription>
              Take an order for a client who isn't using the ordering app — a walk-in table or a
              phone order.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="order-restaurant">Restaurant</Label>
              <Select value={restaurantId} onValueChange={setRestaurantId}>
                <SelectTrigger id="order-restaurant">
                  <SelectValue placeholder="Select a restaurant" />
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="order-type">Order type</Label>
              <Select value={type} onValueChange={(v) => setType(v as OrderType)}>
                <SelectTrigger id="order-type">
                  <SelectValue placeholder="Order type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.filter(
                    (t) =>
                      t.value === "dine_in" ||
                      (t.value === "delivery" && restaurant?.delivery) ||
                      (t.value === "pickup" && restaurant?.pickup),
                  ).map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="order-client">Client name (optional)</Label>
              <Input
                id="order-client"
                value={clientName}
                placeholder="Table 5 / Walk-in / Jane Doe"
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="order-phone">
                Phone {type !== "dine_in" ? "" : "(optional)"}
              </Label>
              <Input
                id="order-phone"
                value={phone}
                placeholder="+216 20 000 000"
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {type === "delivery" && (
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="order-address">Delivery address</Label>
                <Input
                  id="order-address"
                  value={deliveryAddress}
                  placeholder="12 Rue de Marseille, Tunis"
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>
            )}

            {type === "pickup" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="order-pickup-time">Pickup time</Label>
                <Input
                  id="order-pickup-time"
                  value={pickupTime}
                  placeholder='"asap" or a time'
                  onChange={(e) => setPickupTime(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="order-payment">Payment method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger id="order-payment">
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="order-note">Order note</Label>
            <Textarea
              id="order-note"
              rows={2}
              value={note}
              placeholder="Any note for the kitchen or the ticket"
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Item composer */}
          <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
            <p className="text-sm font-medium">Add an item</p>
            {!restaurantId ? (
              <p className="text-xs text-muted-foreground">Pick a restaurant first.</p>
            ) : productsQuery.isLoading ? (
              <p className="text-xs text-muted-foreground">Loading products…</p>
            ) : products.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No available products for this restaurant.
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Popover open={productPickerOpen} onOpenChange={setProductPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={productPickerOpen}
                        className="justify-between font-normal"
                      >
                        <span className="truncate">
                          {selectedProduct
                            ? `${selectedProduct.name} · ${money(selectedProduct.price)}`
                            : "Search a product…"}
                        </span>
                        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search products…" />
                        <CommandList>
                          <CommandEmpty>No product found.</CommandEmpty>
                          <CommandGroup>
                            {products.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={`${p.name} ${p.menuCategoryName}`}
                                onSelect={() => {
                                  setDraft({ ...EMPTY_DRAFT, productId: p.id, quantity: 1 });
                                  setProductPickerOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "size-4",
                                    draft.productId === p.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                                <span className="num shrink-0 text-xs text-muted-foreground">
                                  {money(p.price)}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9"
                      disabled={!selectedProduct || draft.quantity <= 1}
                      onClick={() =>
                        setDraft((d) => ({ ...d, quantity: Math.max(1, d.quantity - 1) }))
                      }
                    >
                      <Minus className="size-4" />
                    </Button>
                    <span className="num w-8 text-center text-sm font-semibold">
                      {draft.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9"
                      disabled={!selectedProduct}
                      onClick={() => setDraft((d) => ({ ...d, quantity: d.quantity + 1 }))}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>

                {selectedProduct && availableExtras.length > 0 && (
                  <div className="grid max-h-32 gap-1 overflow-y-auto rounded-lg bg-surface p-2">
                    {availableExtras.map((e) => (
                      <label
                        key={e.id}
                        className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-background"
                      >
                        <span className="flex items-center gap-2">
                          <Checkbox
                            checked={draft.extraOptionIds.includes(e.id)}
                            onCheckedChange={() => toggleDraftExtra(e.id)}
                          />
                          {e.name}
                        </span>
                        {e.price > 0 && (
                          <span className="text-xs text-muted-foreground">+{money(e.price)}</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {selectedProduct && (
                  <Input
                    value={draft.note}
                    placeholder="Note for this item (e.g. no onions)"
                    onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                  />
                )}

                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2 self-start"
                  disabled={!selectedProduct}
                  onClick={addLine}
                >
                  <Plus className="size-4" /> Add to order{" "}
                  {selectedProduct && <span className="num">· {money(draftUnitPrice)}</span>}
                </Button>
              </>
            )}
          </div>

          {/* Current order lines */}
          <div className="flex flex-col gap-2">
            <Label>Items in this order</Label>
            {lines.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                <UtensilsCrossed className="size-5" />
                No items added yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {lines.map((l) => (
                  <div
                    key={l.key}
                    className="flex flex-col gap-2 rounded-xl border border-border px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm">
                          <span className="num font-semibold">{l.quantity}×</span>{" "}
                          <span className="font-medium">{l.name}</span>
                        </p>
                        {l.extraNames.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            + {l.extraNames.join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="num text-sm font-semibold">
                          {money(l.unitPrice * l.quantity)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          aria-label={`Remove ${l.name}`}
                          onClick={() => removeLine(l.key)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <Input
                      value={l.note ?? ""}
                      placeholder="Note for this item (e.g. no onions)"
                      className="h-8 text-xs"
                      onChange={(e) => updateLineNote(l.key, e.target.value)}
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="num font-display text-base font-semibold">{money(total)}</span>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
