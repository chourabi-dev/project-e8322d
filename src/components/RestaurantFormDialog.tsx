import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Restaurant, RestaurantInput } from "@/lib/restaurants-api";

const EMPTY: RestaurantInput = {
  name: "",
  tagline: "",
  address: "",
  phone: "",
  email: "",
  description: "",
  hours: "",
  delivery: true,
  pickup: true,
  active: true,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant?: Restaurant | null;
  saving?: boolean;
  onSubmit: (input: RestaurantInput) => void;
}

export function RestaurantFormDialog({
  open,
  onOpenChange,
  restaurant,
  saving = false,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<RestaurantInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      restaurant
        ? {
            name: restaurant.name,
            tagline: restaurant.tagline,
            address: restaurant.address,
            phone: restaurant.phone,
            email: restaurant.email,
            description: restaurant.description,
            hours: restaurant.hours,
            delivery: restaurant.delivery,
            pickup: restaurant.pickup,
            active: restaurant.active,
          }
        : EMPTY,
    );
  }, [open, restaurant]);

  const set = <K extends keyof RestaurantInput>(key: K, value: RestaurantInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("A restaurant name is required.");
      return;
    }
    setError(null);
    onSubmit({ ...form, name: form.name.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {restaurant ? `Edit ${restaurant.name}` : "Add restaurant"}
          </DialogTitle>
          <DialogDescription>
            Location details, contact info and the service options customers can choose.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="r-name">Name</Label>
              <Input
                id="r-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Aveline Centrale"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="r-tagline">Tagline</Label>
              <Input
                id="r-tagline"
                value={form.tagline}
                onChange={(e) => set("tagline", e.target.value)}
                placeholder="Wood-fired Italian · Downtown"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="r-address">Address</Label>
              <Input
                id="r-address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="14 Rue de la Kasbah, Tunis"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="r-phone">Phone</Label>
              <Input
                id="r-phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+216 71 220 118"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="r-email">Email</Label>
              <Input
                id="r-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="centrale@aveline.co"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="r-hours">Opening hours</Label>
              <Input
                id="r-hours"
                value={form.hours}
                onChange={(e) => set("hours", e.target.value)}
                placeholder="11:30 – 23:30 · Daily"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="r-description">Description</Label>
              <Textarea
                id="r-description"
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Flagship trattoria with a wood-fired oven and a 90-seat terrace."
              />
            </div>
          </div>

          <div className="grid gap-3 rounded-xl bg-surface p-4 sm:grid-cols-3">
            {(
              [
                ["delivery", "Delivery"],
                ["pickup", "Pickup"],
                ["active", "Accepting orders"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <Switch checked={form[key]} onCheckedChange={(v) => set(key, v)} />
              </label>
            ))}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {restaurant ? "Save changes" : "Create restaurant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
