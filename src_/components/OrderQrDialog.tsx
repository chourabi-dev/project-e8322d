import { QRCodeSVG } from "qrcode.react";
import { Gift } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Order } from "@/lib/orders-api";

/**
 * Shown right after a staff-created order is placed. The client scans the
 * code to link this order to their loyalty account and start earning points
 * toward free meals — purely optional, so the dialog is easy to dismiss.
 */
export function OrderQrDialog({
  open,
  onOpenChange,
  order,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}) {
  // Encodes enough for the client app to resolve the order and attach loyalty
  // points to whichever account scans it.
  const qrValue = order ? JSON.stringify({  type: "dalu-order-bonus", orderId: order.id }) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Order placed{order ? ` · #${order.orderNumber || order.id.slice(-6).toUpperCase()}` : ""}</DialogTitle>
          <DialogDescription>
            Have the client scan this with the Dalu app to earn bonus points toward a free meal.
            Entirely optional — they can skip it.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {order && (
            <div className="rounded-2xl border border-border bg-white p-4">
              <QRCodeSVG value={qrValue} size={192} />
            </div>
          )}
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <Gift className="size-3.5" />
            Scan to earn loyalty points
          </div>
        </div>

        <DialogFooter>
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
