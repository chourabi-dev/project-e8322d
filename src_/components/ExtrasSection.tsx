import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useQuery as useRestaurantsQuery } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  CupSoda,
  ImageIcon,
  ChevronDown,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { SectionCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fetchRestaurants } from "@/lib/restaurants-api";
import {
  createExtra,
  createExtraCategory,
  deleteExtra,
  deleteExtraCategory,
  fetchExtraCategories,
  fetchExtras,
  updateExtra,
  updateExtraCategory,
  type Extra,
  type ExtraCategory,
  type ExtraCategoryInput,
  type ExtraInput,
} from "@/lib/extras-api";

/* ------------------------------- dialogs ------------------------------- */

const EMPTY_GROUP: ExtraCategoryInput = {
  name: "",
  description: "",
  visible: true,
  restaurantId: "",
};

function ExtraCategoryDialog({
  open,
  onOpenChange,
  category,
  lockedRestaurantId,
  saving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: ExtraCategory | null | undefined;
  lockedRestaurantId?: string | undefined;
  saving?: boolean;
  onSubmit: (input: ExtraCategoryInput) => void;
}) {
  const [form, setForm] = useState<ExtraCategoryInput>(EMPTY_GROUP);
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(category);

  const restaurantsQuery = useRestaurantsQuery({
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
            name: category.name,
            description: category.description,
            visible: category.visible,
            restaurantId: lockedRestaurantId ?? category.restaurantId,
          }
        : { ...EMPTY_GROUP, restaurantId: lockedRestaurantId ?? "" },
    );
  }, [open, category, lockedRestaurantId]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return setError("Give this extras group a name.");
    if (!lockedRestaurantId && !form.restaurantId)
      return setError("Pick the restaurant this group belongs to.");
    setError(null);
    onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      restaurantId: lockedRestaurantId ?? form.restaurantId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit extras group" : "Add extras group"}</DialogTitle>
            <DialogDescription>
              Groups like Drinks or Sauces hold the individual extras guests can add.
            </DialogDescription>
          </DialogHeader>

          {!lockedRestaurantId && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="extra-group-restaurant">Restaurant</Label>
              <Select
                value={form.restaurantId}
                onValueChange={(v) => setForm((p) => ({ ...p, restaurantId: v }))}
              >
                <SelectTrigger id="extra-group-restaurant">
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
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="extra-group-name">Name</Label>
            <Input
              id="extra-group-name"
              value={form.name}
              placeholder="Drinks, Sauces, Sides…"
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="extra-group-description">Description</Label>
            <Textarea
              id="extra-group-description"
              rows={2}
              value={form.description}
              placeholder="Optional note for your team"
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-medium">Visible to guests</p>
              <p className="text-xs text-muted-foreground">Hide to keep it internal for now</p>
            </div>
            <Switch
              checked={form.visible}
              onCheckedChange={(v) => setForm((p) => ({ ...p, visible: v }))}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editing ? "Save changes" : "Create group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const EMPTY_EXTRA: ExtraInput = {
  name: "",
  description: "",
  price: 0,
  photo: "",
  available: true,
  extraCategoryId: "",
  restaurantId: "",
};

function ExtraDialog({
  open,
  onOpenChange,
  extra,
  groups,
  defaultGroupId,
  saving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extra?: Extra | null | undefined;
  groups: ExtraCategory[];
  defaultGroupId?: string | undefined;
  saving?: boolean;
  onSubmit: (input: ExtraInput) => void;
}) {
  const [form, setForm] = useState<ExtraInput>(EMPTY_EXTRA);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editing = Boolean(extra);

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

  useEffect(() => {
    if (!open) return;
    setError(null);
    const groupId = extra?.extraCategoryId ?? defaultGroupId ?? "";
    const group = groups.find((g) => g.id === groupId);
    setForm(
      extra
        ? {
            name: extra.name,
            description: extra.description,
            price: extra.price,
            photo: extra.photo,
            available: extra.available,
            extraCategoryId: groupId,
            restaurantId: extra.restaurantId || group?.restaurantId || "",
          }
        : {
            ...EMPTY_EXTRA,
            extraCategoryId: groupId,
            restaurantId: group?.restaurantId ?? "",
          },
    );
  }, [open, extra, defaultGroupId, groups]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return setError("Every extra needs a name.");
    if (!form.extraCategoryId) return setError("Pick the group this extra belongs to.");
    if (!Number.isFinite(form.price) || form.price < 0)
      return setError("Enter a valid price.");
    setError(null);
    const group = groups.find((g) => g.id === form.extraCategoryId);
    onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      photo: form.photo.trim(),
      restaurantId: form.restaurantId || group?.restaurantId || "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit extra" : "Add extra"}</DialogTitle>
            <DialogDescription>
              Coke, Fanta, mayonnaise… each extra has a name, photo, price and description.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="extra-group">Group</Label>
            <Select
              value={form.extraCategoryId}
              onValueChange={(v) =>
                setForm((p) => ({
                  ...p,
                  extraCategoryId: v,
                  restaurantId:
                    groups.find((g) => g.id === v)?.restaurantId ?? p.restaurantId,
                }))
              }
            >
              <SelectTrigger id="extra-group">
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                    {g.restaurantName ? ` · ${g.restaurantName}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="extra-name">Name</Label>
              <Input
                id="extra-name"
                value={form.name}
                placeholder="Coca-Cola 33cl"
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="extra-price">Price</Label>
              <Input
                id="extra-price"
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="extra-photo">Photo</Label>
            <div className="flex items-center gap-3">
              {form.photo ? (
                <div className="relative">
                  <img
                    src={form.photo}
                    alt={form.name || "Extra preview"}
                    className="size-20 rounded-xl border border-border object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-destructive"
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
              id="extra-photo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
          </div>


          <div className="flex flex-col gap-2">
            <Label htmlFor="extra-description">Description</Label>
            <Textarea
              id="extra-description"
              rows={3}
              value={form.description}
              placeholder="Chilled, served in a glass bottle"
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-medium">Available</p>
              <p className="text-xs text-muted-foreground">Turn off when you run out</p>
            </div>
            <Switch
              checked={form.available}
              onCheckedChange={(v) => setForm((p) => ({ ...p, available: v }))}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editing ? "Save changes" : "Create extra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- section ------------------------------- */

export function ExtrasSection({ restaurantId }: { restaurantId?: string | undefined }) {
  const queryClient = useQueryClient();
  const scope = restaurantId || undefined;

  const [groupDialog, setGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ExtraCategory | null>(null);
  const [extraDialog, setExtraDialog] = useState(false);
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);
  const [defaultGroupId, setDefaultGroupId] = useState<string>("");
  const [pendingGroup, setPendingGroup] = useState<ExtraCategory | null>(null);
  const [pendingExtra, setPendingExtra] = useState<Extra | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groupsQuery = useQuery({
    queryKey: ["extra-categories", scope ?? "all"],
    queryFn: () => fetchExtraCategories(scope),
  });
  const extrasQuery = useQuery({
    queryKey: ["extras", scope ?? "all"],
    queryFn: () => fetchExtras(scope),
  });

  const groups = groupsQuery.data ?? [];
  const extras = extrasQuery.data ?? [];

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["extra-categories"] }),
      queryClient.invalidateQueries({ queryKey: ["extras"] }),
    ]);
  };

  const saveGroup = useMutation({
    mutationFn: (input: ExtraCategoryInput) =>
      editingGroup ? updateExtraCategory(editingGroup.id, input) : createExtraCategory(input),
    onSuccess: async () => {
      await invalidate();
      toast.success(editingGroup ? "Group updated" : "Group created");
      setGroupDialog(false);
      setEditingGroup(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeGroup = useMutation({
    mutationFn: (group: ExtraCategory) => deleteExtraCategory(group.id),
    onSuccess: async () => {
      await invalidate();
      toast.success("Group deleted");
      setPendingGroup(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveExtra = useMutation({
    mutationFn: (input: ExtraInput) =>
      editingExtra ? updateExtra(editingExtra.id, input) : createExtra(input),
    onSuccess: async () => {
      await invalidate();
      toast.success(editingExtra ? "Extra updated" : "Extra created");
      setExtraDialog(false);
      setEditingExtra(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeExtra = useMutation({
    mutationFn: (extra: Extra) => deleteExtra(extra.id),
    onSuccess: async () => {
      await invalidate();
      toast.success("Extra deleted");
      setPendingExtra(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openAddGroup = () => {
    setEditingGroup(null);
    setGroupDialog(true);
  };
  const openAddExtra = (groupId: string) => {
    setEditingExtra(null);
    setDefaultGroupId(groupId);
    setExtraDialog(true);
  };

  const loading = groupsQuery.isLoading || extrasQuery.isLoading;
  const error = groupsQuery.error ?? extrasQuery.error;

  return (
    <SectionCard
      title="Extras & options"
      description="Groups like Drinks or Sauces, each with its own extras you can attach to products"
      action={
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-warning/12 text-warning">
            <CupSoda className="size-4.5" />
          </span>
          <Button size="sm" className="gap-2" onClick={openAddGroup}>
            <Plus className="size-4" /> Add group
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-start gap-3 py-6">
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              groupsQuery.refetch();
              extrasQuery.refetch();
            }}
          >
            <RefreshCw className="size-4" /> Retry
          </Button>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-start gap-3 py-8">
          <p className="text-sm text-muted-foreground">
            No extras groups yet — start with Drinks or Sauces.
          </p>
          <Button size="sm" className="gap-2" onClick={openAddGroup}>
            <Plus className="size-4" /> Add group
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => {
            const items = extras.filter((e) => e.extraCategoryId === group.id);
            const isCollapsed = collapsed[group.id] ?? false;
            return (
              <div key={group.id} className="rounded-xl border border-border">
                <div className="flex flex-wrap items-center gap-3 p-3">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() =>
                      setCollapsed((prev) => ({ ...prev, [group.id]: !isCollapsed }))
                    }
                    aria-expanded={!isCollapsed}
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform",
                        isCollapsed && "-rotate-90",
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{group.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {items.length} extra{items.length === 1 ? "" : "s"}
                        {group.restaurantName ? ` · ${group.restaurantName}` : ""}
                        {group.description ? ` · ${group.description}` : ""}
                      </span>
                    </span>
                  </button>
                  {!group.visible && <Badge variant="secondary">Hidden</Badge>}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => openAddExtra(group.id)}
                    >
                      <Plus className="size-4" /> Extra
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${group.name}`}
                      onClick={() => {
                        setEditingGroup(group);
                        setGroupDialog(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${group.name}`}
                      onClick={() => setPendingGroup(group)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="border-t border-border p-3">
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No extras in this group yet.
                      </p>
                    ) : (
                      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {items.map((extra) => (
                          <li
                            key={extra.id}
                            className="group flex items-center gap-3 rounded-xl border border-border p-2.5"
                          >
                            {extra.photo ? (
                              <img
                                src={extra.photo}
                                alt={extra.name}
                                loading="lazy"
                                className="size-12 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-surface text-muted-foreground">
                                <ImageIcon className="size-4" />
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{extra.name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {extra.price.toFixed(2)}
                                {extra.description ? ` · ${extra.description}` : ""}
                              </p>
                            </div>
                            {!extra.available && <Badge variant="secondary">Out</Badge>}
                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Edit ${extra.name}`}
                                onClick={() => {
                                  setEditingExtra(extra);
                                  setDefaultGroupId(extra.extraCategoryId);
                                  setExtraDialog(true);
                                }}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Delete ${extra.name}`}
                                onClick={() => setPendingExtra(extra)}
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ExtraCategoryDialog
        open={groupDialog}
        onOpenChange={(open) => {
          setGroupDialog(open);
          if (!open) setEditingGroup(null);
        }}
        category={editingGroup}
        lockedRestaurantId={restaurantId}
        saving={saveGroup.isPending}
        onSubmit={(input) => saveGroup.mutate(input)}
      />

      <ExtraDialog
        open={extraDialog}
        onOpenChange={(open) => {
          setExtraDialog(open);
          if (!open) setEditingExtra(null);
        }}
        extra={editingExtra}
        groups={groups}
        defaultGroupId={defaultGroupId}
        saving={saveExtra.isPending}
        onSubmit={(input) => saveExtra.mutate(input)}
      />

      <AlertDialog
        open={Boolean(pendingGroup)}
        onOpenChange={(open) => !open && setPendingGroup(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingGroup?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the group. Extras inside it will need a new group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeGroup.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={removeGroup.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pendingGroup) removeGroup.mutate(pendingGroup);
              }}
            >
              {removeGroup.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(pendingExtra)}
        onOpenChange={(open) => !open && setPendingExtra(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingExtra?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This extra will no longer be available to add to products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeExtra.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={removeExtra.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pendingExtra) removeExtra.mutate(pendingExtra);
              }}
            >
              {removeExtra.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionCard>
  );
}
