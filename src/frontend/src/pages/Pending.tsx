import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Order } from "../backend";
import { BillDetailModal, getExtOrder } from "../components/BillDetailModal";
import {
  OrderStatus,
  usePendingOrders,
  useUpdateOrderStatus,
} from "../hooks/useQueries";

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatBillNo(id: bigint): string {
  return `BILL-${id.toString().padStart(3, "0")}`;
}

export function Pending() {
  const { data: orders, isLoading, isError } = usePendingOrders();
  const updateStatus = useUpdateOrderStatus();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [billOpen, setBillOpen] = useState(false);

  const handleMarkDelivered = async (id: bigint) => {
    try {
      await updateStatus.mutateAsync({ id, status: OrderStatus.delivered });
      toast.success("Marked as delivered!");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleWhatsApp = (order: Order) => {
    const ext = getExtOrder(order.id);
    const num = order.customerMobile.replace(/\D/g, "");
    const shopId = localStorage.getItem("userShopId") || "My Shop";
    const discount = ext.discount ?? 0;
    const grandTotal = order.grandTotal - discount;
    const advance = ext.advance ?? 0;
    const balance = ext.balance ?? grandTotal - advance;
    const lines = [
      `Namaskar ${order.customerName}!`,
      "Aapka order pending hai.",
      `Bill No: ${formatBillNo(order.id)}`,
      `Shop: ${shopId}`,
      `Grand Total: \u20b9${grandTotal.toFixed(2)}`,
      `Balance: \u20b9${balance.toFixed(2)}`,
      "Dhanyawad! \u2014 sraiwebsitedevelop",
    ].join("\n");
    window.open(
      `https://wa.me/${num}?text=${encodeURIComponent(lines)}`,
      "_blank",
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">
          Pending Orders
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {orders?.length ?? 0} orders pending delivery
        </p>
      </div>

      {isError && (
        <div
          data-ocid="pending.error_state"
          className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm"
        >
          Failed to load pending orders.
        </div>
      )}

      {isLoading ? (
        <div data-ocid="pending.loading_state" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : !orders?.length ? (
        <div
          data-ocid="pending.empty_state"
          className="text-center py-16 rounded-xl border border-dashed text-muted-foreground"
        >
          <CheckCircle2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">All caught up!</p>
          <p className="text-sm">No pending orders right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order, i) => {
            const ext = getExtOrder(order.id);
            const discount = ext.discount ?? 0;
            const grandTotal = order.grandTotal - discount;
            return (
              <motion.article
                key={order.id.toString()}
                data-ocid={`pending.item.${i + 1}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                className="bg-card rounded-xl border border-border p-4 hover:border-primary/40 hover:shadow-md transition-all space-y-3"
              >
                <button
                  type="button"
                  className="w-full text-left space-y-3"
                  onClick={() => {
                    setSelectedOrder(order);
                    setBillOpen(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {order.customerMobile} • {formatBillNo(order.id)}
                      </p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                      pending
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {order.items
                      .slice(0, 2)
                      .map((it) => it.productName)
                      .join(", ")}
                    {order.items.length > 2 &&
                      ` +${order.items.length - 2} more`}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-lg">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(order.date)}
                    </span>
                  </div>
                </button>
                <div className="flex gap-2 pt-1">
                  <Button
                    data-ocid={`pending.deliver_button.${i + 1}`}
                    size="sm"
                    className="flex-1 sr-gradient text-white border-0 text-xs"
                    onClick={() => handleMarkDelivered(order.id)}
                    disabled={updateStatus.isPending}
                  >
                    <CheckCircle2 size={12} className="mr-1" />
                    Mark Delivered
                  </Button>
                  <Button
                    data-ocid={`pending.whatsapp_button.${i + 1}`}
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-200 hover:bg-green-50 text-xs"
                    onClick={() => handleWhatsApp(order)}
                  >
                    <MessageCircle size={12} />
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      <BillDetailModal
        order={selectedOrder}
        open={billOpen}
        onOpenChange={setBillOpen}
      />
    </div>
  );
}
