import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { OrderStatus } from "../backend";
import { usePendingOrders, useUpdateOrderStatus } from "../hooks/useQueries";

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function Pending() {
  const { data: orders, isLoading, isError } = usePendingOrders();
  const updateStatus = useUpdateOrderStatus();

  const handleDeliver = async (id: bigint) => {
    try {
      await updateStatus.mutateAsync({ id, status: OrderStatus.delivered });
      toast.success("Order marked as delivered");
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const handleWhatsApp = (mobile: string, name: string, total: number) => {
    const message = `Hi ${name}, your bill total is ₹${total.toFixed(2)}`;
    const url = `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">
          Pending Orders
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {orders?.length ?? 0} orders awaiting delivery
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
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !orders?.length ? (
        <div data-ocid="pending.empty_state" className="py-16 text-center">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3" />
          <p className="text-muted-foreground">
            All orders delivered! No pending orders.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, idx) => (
            <div
              key={order.id.toString()}
              data-ocid={`pending.item.${idx + 1}`}
              className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {order.customerName}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {formatDate(order.date)}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-muted-foreground">
                    📞 {order.customerMobile}
                  </span>
                  <span className="text-sm font-medium text-primary">
                    ₹{order.grandTotal.toFixed(2)}
                  </span>
                </div>
                {order.items.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {order.items
                      .map((it) => `${it.productName} ×${it.qty}`)
                      .join(", ")}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  data-ocid={`pending.whatsapp.button.${idx + 1}`}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleWhatsApp(
                      order.customerMobile,
                      order.customerName,
                      order.grandTotal,
                    )
                  }
                  className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                >
                  <MessageCircle size={14} className="mr-1" /> WhatsApp
                </Button>
                <Button
                  data-ocid={`pending.deliver.button.${idx + 1}`}
                  size="sm"
                  onClick={() => handleDeliver(order.id)}
                  disabled={updateStatus.isPending}
                  className="pharmacy-gradient text-white border-0 hover:opacity-90"
                >
                  {updateStatus.isPending ? (
                    <Loader2 size={14} className="mr-1 animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} className="mr-1" />
                  )}
                  Mark Delivered
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
