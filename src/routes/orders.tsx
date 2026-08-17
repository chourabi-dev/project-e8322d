import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Filter, ChefHat, Loader2, RefreshCw, Banknote, Archive } from "lucide-react";
import { toast } from "sonner";
import pusher from "../services/pusher";

import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/lib/auth";
import { fetchRestaurants } from "@/lib/restaurants-api";
import {
  archiveOrder,
  fetchOrders,
  markOrderPaidAndSend,
  orderItemTotal,
  orderTotal,
  parseOrderDate,
  type Order,
} from "@/lib/orders-api";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders · Dalu | Web master" },
      {
        name: "description",
        content:
          "Filter every order by restaurant, status, delivery type and payment method, or jump straight to an order.",
      },
      { property: "og:title", content: "Orders · Dalu | Web master" },
      { property: "og:description", content: "One table for every ticket across every location." },
    ],
  }),
  component: OrdersPage,
});

const money = (n: number) => `€${n.toFixed(2)}`;

const typeLabel: Record<string, string> = {
  dine_in: "Dine-in",
  delivery: "Delivery",
  pickup: "Pickup",
};

const paymentLabel: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  online: "Online",
};

const isUnpaid = (status: string) => status.toLowerCase() === "unpayed";

const paymentStatusTone = (status: string) =>
  isUnpaid(status)
    ? "bg-destructive/12 text-destructive border-destructive/30"
    : "bg-success/15 text-success border-success/30";

const paymentStatusLabel = (status: string) => (isUnpaid(status) ? "Unpaid" : "Paid");

const kitchenStatusTone = (status: string) => {
  const s = status.toLowerCase();
  if (s === "pending") return "bg-info/15 text-info border-info/30";
  if (s === "preparing") return "bg-warning/15 text-warning border-warning/30";
  if (s === "ready") return "bg-success/15 text-success border-success/30";
  if (s === "completed") return "bg-muted text-muted-foreground border-border";
  if (s === "cancelled") return "bg-destructive/12 text-destructive border-destructive/30";
  return "bg-muted text-muted-foreground border-border";
};

const kitchenStatusLabel = (status: string) =>
  status.length ? status.charAt(0).toUpperCase() + status.slice(1) : status;

const PAYMENT_STATUS_OPTIONS = ["paid", "unpayed"];
const KITCHEN_STATUS_OPTIONS = ["pending", "preparing", "ready", "completed", "cancelled"];
const TYPE_OPTIONS = ["dine_in", "delivery", "pickup"];
const PAYMENT_OPTIONS = ["cash", "card", "online"];

function orderTime(createdAt: string) {
  const date = parseOrderDate(createdAt);
  if (!date) return createdAt;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function OrdersPage() {
  useRequireAuth();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [restaurant, setRestaurant] = useState("all");
  const [status, setStatus] = useState("all");
  const [kitchenStatus, setKitchenStatus] = useState("all");
  const [type, setType] = useState("all");
  const [payment, setPayment] = useState("all");
  const [pendingSend, setPendingSend] = useState<Order | null>(null);

  const {
    data: orders,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  const { data: restaurants } = useQuery({
    queryKey: ["restaurants"],
    queryFn: fetchRestaurants,
  });

  const list = useMemo(() => orders ?? [], [orders]);
  const restaurantOptions = restaurants ?? [];

  const restaurantName = (id: string) => restaurantOptions.find((r) => r.id === id)?.name ?? id;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["orders"] });

  const sendMutation = useMutation({
    mutationFn: (order: Order) => markOrderPaidAndSend(order.id),
    onSuccess: (_result, order) => {
      toast.success(`Order sent to kitchen`, {
        description: `Cash payment confirmed for ${order.clientName || "the customer"}.`,
      });
      setPendingSend(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (order: Order) => archiveOrder(order.id),
    onSuccess: (_result, order) => {
      toast.success(`Order #${order.orderNumber.toUpperCase()} archived`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(
    () =>
      list.filter(
        (o) =>
          (restaurant === "all" || o.restaurantId === restaurant) &&
          (status === "all" || (status === "unpayed" ? isUnpaid(o.status) : !isUnpaid(o.status))) &&
          (kitchenStatus === "all" || o.kitchenStatus === kitchenStatus) &&
          (type === "all" || o.type === type) &&
          (payment === "all" || o.paymentMethod === payment) &&
          (!query.trim() ||
            o.id.toLowerCase().includes(query.trim().toLowerCase()) ||
            o.clientName.toLowerCase().includes(query.trim().toLowerCase())),
      ),
    [list, query, restaurant, status, kitchenStatus, type, payment],
  );

  useEffect(() => {
    const channel = pusher.subscribe("channel-orders");

    channel.bind_global((eventName: string, data: unknown) => {
      if (eventName.startsWith("pusher:")) return;
       
      if (eventName === "order-ready") {
        invalidate();
        toast.success("order in", { description: "Order ready" });
      }
    });
 
    

    channel.bind("new-order", (data: unknown) => {
      console.log("🔥 NEW ORDER", data);
      toast.success("New order received");
      invalidate();
    });


    

    

    return () => {
      channel.unbind("new-order"); 
      channel.unbind_global();
      pusher.unsubscribe("channel-orders");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell
      title="Orders"
      subtitle={isLoading ? "Loading orders…" : `${filtered.length} of ${list.length} orders shown`}
      actions={
        <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Refresh">
          <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
        </Button>
      }
    >
      <div className="panel flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order or client"
            className="h-10 pl-9"
          />
        </div>

        <Select value={restaurant} onValueChange={setRestaurant}>
          <SelectTrigger className="h-10 w-[180px]">
            <SelectValue placeholder="All restaurants" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All restaurants</SelectItem>
            {restaurantOptions.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 w-[152px]">
            <SelectValue placeholder="Paid / unpaid" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Paid / unpaid</SelectItem>
            {PAYMENT_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {paymentStatusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={kitchenStatus} onValueChange={setKitchenStatus}>
          <SelectTrigger className="h-10 w-[168px]">
            <SelectValue placeholder="All kitchen statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All kitchen statuses</SelectItem>
            {KITCHEN_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {kitchenStatusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-10 w-[168px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPE_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {typeLabel[t] ?? t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={payment} onValueChange={setPayment}>
          <SelectTrigger className="h-10 w-[168px]">
            <SelectValue placeholder="All payment methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payment methods</SelectItem>
            {PAYMENT_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {paymentLabel[p] ?? p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => {
            setQuery("");
            setRestaurant("all");
            setStatus("all");
            setKitchenStatus("all");
            setType("all");
            setPayment("all");
          }}
        >
          <Filter className="size-4" /> Reset
        </Button>
      </div>

      {isLoading ? (
        <div className="panel space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">Couldn’t load orders</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {(error as Error)?.message ?? "The API did not respond."}
          </p>
          <Button variant="outline" className="gap-2" onClick={() => refetch()}>
            <RefreshCw className="size-4" /> Try again
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">No orders match these filters</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Reset the filters to see the full service.
          </p>
        </div>
      ) : (
        <div className="panel overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kitchen</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => {
                const canSendToKitchen = o.paymentMethod === "cash" && isUnpaid(o.status);
                return (
                  <TableRow key={o.id}>
                    <TableCell>
                      <p className="num text-sm font-semibold">#{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.clientName || o.clientEmail} · {orderTime(o.createdAt)}
                      </p>
                      {o.type === "delivery" && o.deliveryAddress && (
                        <p className="max-w-[180px] truncate text-xs text-muted-foreground">
                          {o.deliveryAddress}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {restaurantName(o.restaurantId)}
                    </TableCell>
                    <TableCell className="max-w-[320px]">
                      <div className="flex flex-col gap-2">
                        {o.items.map((item) => (
                          <div key={item.id} className="text-sm">
                            <p className="leading-tight">
                              <span className="num font-semibold">{item.quantity}×</span>{" "}
                              <span className="font-medium">{item.name}</span>
                              <span className="ml-1.5 text-xs text-muted-foreground">
                                {money(orderItemTotal(item))}
                              </span>
                            </p>
                            {item.extras.length > 0 && (
                              <p className="pl-5 text-xs text-muted-foreground">
                                + {item.extras.map((e) => e.name).join(", ")}
                              </p>
                            )}
                            {item.note && (
                              <p className="pl-5 text-xs text-warning">Note: {item.note}</p>
                            )}
                          </div>
                        ))}
                        {o.note && (
                          <p className="rounded-md bg-surface px-2 py-1 text-xs text-muted-foreground">
                            Order note: {o.note}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeLabel[o.type] ?? o.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1.5">
                        <Banknote className="size-3.5" />
                        {paymentLabel[o.paymentMethod] ?? o.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(paymentStatusTone(o.status))}>
                        {paymentStatusLabel(o.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(kitchenStatusTone(o.kitchenStatus))}>
                        {kitchenStatusLabel(o.kitchenStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="num text-right text-sm">{money(orderTotal(o))}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {canSendToKitchen && (
                          <Button size="sm" className="gap-1.5" onClick={() => setPendingSend(o)}>
                            <ChefHat className="size-3.5" /> Send to kitchen
                          </Button>
                        )}
                        {o.kitchenStatus.toLowerCase() === "ready" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={archiveMutation.isPending}
                            onClick={() => archiveMutation.mutate(o)}
                          >
                            <Archive className="size-3.5" /> Archive
                          </Button>
                        )}
                        {!canSendToKitchen && o.kitchenStatus.toLowerCase() !== "ready" && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={Boolean(pendingSend)}
        onOpenChange={(open) => !open && setPendingSend(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm cash payment?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingSend && (
                <>
                  Confirm you've collected <strong>{money(orderTotal(pendingSend))}</strong> in cash
                  for order #{pendingSend.id.slice(-6).toUpperCase()}
                  {pendingSend.clientName ? ` (${pendingSend.clientName})` : ""}. Only paid orders
                  are sent to the kitchen — this will mark it as paid and send it in.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={sendMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pendingSend) sendMutation.mutate(pendingSend);
              }}
            >
              {sendMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Confirm & send to kitchen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
