import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer, TruckIcon } from "lucide-react";
import { useState } from "react";
import type { Order } from "../backend";
import { BillDetailModal, getExtOrder } from "../components/BillDetailModal";
import { useDeliveredOrders } from "../hooks/useQueries";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatBillNo(id: bigint): string {
  return `BILL-${id.toString().padStart(3, "0")}`;
}

export function Delivered() {
  const { data: orders, isLoading, isError } = useDeliveredOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [billOpen, setBillOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">
          Delivered Orders
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {orders?.length ?? 0} orders delivered
        </p>
      </div>

      {isError && (
        <div
          data-ocid="delivered.error_state"
          className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm"
        >
          Failed to load delivered orders.
        </div>
      )}

      {isLoading ? (
        <div data-ocid="delivered.loading_state" className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Bill No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Grand Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Delivered Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!orders?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="delivered.empty_state"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <TruckIcon size={32} className="opacity-30" />
                      No delivered orders yet.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order, idx) => {
                  const ext = getExtOrder(order.id);
                  const discount = ext.discount ?? 0;
                  const grandTotal = order.grandTotal - discount;
                  return (
                    <TableRow
                      key={order.id.toString()}
                      data-ocid={`delivered.item.${idx + 1}`}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => {
                        setSelectedOrder(order);
                        setBillOpen(true);
                      }}
                    >
                      <TableCell className="font-medium text-primary">
                        {formatBillNo(order.id)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.customerName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.customerMobile}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{grandTotal.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          delivered
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(order.date)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {ext.deliveredDate
                          ? formatDate(ext.deliveredDate)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          data-ocid={`delivered.print_button.${idx + 1}`}
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                            setBillOpen(true);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Printer size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
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
