import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2 } from "lucide-react";
import { useDeliveredOrders } from "../hooks/useQueries";

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

export function Delivered() {
  const { data: orders, isLoading, isError } = useDeliveredOrders();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">
          Delivered Orders
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {orders?.length ?? 0} delivered orders
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
                <TableHead>Customer</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Grand Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!orders?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="delivered.empty_state"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2
                        size={32}
                        className="text-muted-foreground/40"
                      />
                      No delivered orders yet.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order, idx) => (
                  <TableRow
                    key={order.id.toString()}
                    data-ocid={`delivered.item.${idx + 1}`}
                  >
                    <TableCell className="font-medium">
                      {order.customerName}
                    </TableCell>
                    <TableCell>{order.customerMobile}</TableCell>
                    <TableCell className="font-medium text-emerald-600">
                      ₹{order.grandTotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(order.date)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
