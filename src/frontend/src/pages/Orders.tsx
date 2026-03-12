import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  MinusCircle,
  Plus,
  PlusCircle,
  Printer,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Order, OrderItem } from "../backend";
import { useAddOrder, useDeleteOrder, useOrders } from "../hooks/useQueries";

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

type ItemRow = { id: number; productName: string; qty: string; price: string };
let itemCounter = 0;
function newItem(): ItemRow {
  return { id: ++itemCounter, productName: "", qty: "1", price: "" };
}

// ----- Print Bill Dialog -----
interface PrintBillDialogProps {
  order: Order;
  billNumber: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function PrintBillDialog({
  order,
  billNumber,
  open,
  onOpenChange,
}: PrintBillDialogProps) {
  const shopId = localStorage.getItem("userShopId") || "My Shop";
  const shopAddress = localStorage.getItem("userShopAddress") || "";
  const shopPhone = localStorage.getItem("userShopPhone") || "";
  const shopGst = localStorage.getItem("userShopGst") || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="bill.dialog" className="max-w-md">
        <style>{`
          @media print {
            body > * { display: none !important; }
            .print-bill-area { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
            [data-radix-popper-content-wrapper] { display: block !important; }
            [role="dialog"] { box-shadow: none !important; border: none !important; }
          }
        `}</style>
        <div className="print-bill-area">
          <DialogHeader className="mb-2">
            <DialogTitle className="sr-only">Print Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-2">
            {/* Shop Header */}
            <div className="text-center space-y-1 border-b border-dashed pb-4">
              <img
                src="/assets/generated/sr-logo.dim_300x300.png"
                alt="SR Logo"
                className="w-12 h-12 rounded-lg object-cover mx-auto"
              />
              <h2 className="text-xl font-bold font-display">{shopId}</h2>
              <p className="text-xs text-muted-foreground">
                SR.AIWEBSITEDEVELOPER
              </p>
              {shopPhone && (
                <p className="text-xs text-muted-foreground">📞 {shopPhone}</p>
              )}
              {shopAddress && (
                <p className="text-xs text-muted-foreground">
                  📍 {shopAddress}
                </p>
              )}
              {shopGst && (
                <p className="text-xs text-muted-foreground font-medium">
                  GST: {shopGst}
                </p>
              )}
              <div className="mt-2 flex justify-between text-sm">
                <span className="font-semibold">Bill No: {billNumber}</span>
                <span className="text-muted-foreground">
                  {formatDate(order.date)}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mobile:</span>
                <span>{order.customerMobile}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="text-left px-2 py-1.5 font-medium">
                      Product
                    </th>
                    <th className="text-center px-2 py-1.5 font-medium">Qty</th>
                    <th className="text-right px-2 py-1.5 font-medium">
                      Price
                    </th>
                    <th className="text-right px-2 py-1.5 font-medium">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: bill items have no stable key
                    <tr key={i} className="border-t border-border">
                      <td className="px-2 py-1.5">{item.productName}</td>
                      <td className="text-center px-2 py-1.5">
                        {item.qty.toString()}
                      </td>
                      <td className="text-right px-2 py-1.5">
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td className="text-right px-2 py-1.5">
                        ₹{(Number(item.qty) * item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/40">
                    <td colSpan={3} className="px-2 py-2 font-bold text-right">
                      Grand Total
                    </td>
                    <td className="px-2 py-2 font-bold text-right text-primary">
                      ₹{order.grandTotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p className="text-center text-xs text-muted-foreground border-t border-dashed pt-3">
              SR.AIWEBSITEDEVELOPER — Help to make your own bill site
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            data-ocid="bill.cancel_button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            data-ocid="bill.print_button"
            className="pharmacy-gradient text-white border-0"
            onClick={() => window.print()}
          >
            <Printer size={14} className="mr-1" /> Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----- Main Orders Component -----
export function Orders() {
  const { data: orders, isLoading, isError } = useOrders();
  const addOrder = useAddOrder();
  const deleteOrder = useDeleteOrder();

  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [items, setItems] = useState<ItemRow[]>([newItem()]);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [printBillNumber, setPrintBillNumber] = useState("");
  const [printOpen, setPrintOpen] = useState(false);

  const grandTotal = items.reduce((sum, it) => {
    const qty = Number.parseFloat(it.qty) || 0;
    const price = Number.parseFloat(it.price) || 0;
    return sum + qty * price;
  }, 0);

  const resetForm = () => {
    setCustomerName("");
    setCustomerMobile("");
    setItems([newItem()]);
  };

  const handleAddOrder = async () => {
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!customerMobile.trim()) {
      toast.error("Mobile number is required");
      return;
    }
    if (items.some((it) => !it.productName.trim())) {
      toast.error("All items must have a product name");
      return;
    }

    const orderItems: OrderItem[] = items.map((it) => ({
      productName: it.productName,
      qty: BigInt(Math.round(Number.parseFloat(it.qty) || 1)),
      price: Number.parseFloat(it.price) || 0,
    }));

    try {
      await addOrder.mutateAsync({
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        items: orderItems,
        grandTotal,
        date: new Date().toISOString(),
      });
      toast.success("Order added successfully");
      setOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to add order");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteOrder.mutateAsync(id);
      toast.success("Order deleted");
    } catch {
      toast.error("Failed to delete order");
    }
  };

  const handlePrint = (order: Order, idx: number) => {
    setPrintOrder(order);
    setPrintBillNumber(`BILL-${String(idx + 1).padStart(3, "0")}`);
    setPrintOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            All Orders
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {orders?.length ?? 0} total orders
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="orders.add_order.button"
              className="pharmacy-gradient text-white border-0 hover:opacity-90"
            >
              <Plus size={16} className="mr-1" /> Add Order
            </Button>
          </DialogTrigger>
          <DialogContent
            data-ocid="orders.dialog"
            className="max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <DialogHeader>
              <DialogTitle>New Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Customer Name</Label>
                  <Input
                    data-ocid="order.customer_name.input"
                    placeholder="e.g. Amit Kumar"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Mobile Number</Label>
                  <Input
                    data-ocid="order.mobile.input"
                    placeholder="e.g. 9876543210"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Items</Label>
                {items.map((item, idx) => (
                  <div key={item.id} className="flex gap-2 items-center">
                    <Input
                      data-ocid={`order.item_name.input.${idx + 1}`}
                      placeholder="Product name"
                      value={item.productName}
                      className="flex-1"
                      onChange={(e) =>
                        setItems(
                          items.map((it) =>
                            it.id === item.id
                              ? { ...it, productName: e.target.value }
                              : it,
                          ),
                        )
                      }
                    />
                    <Input
                      placeholder="Qty"
                      type="number"
                      min="1"
                      value={item.qty}
                      className="w-16"
                      onChange={(e) =>
                        setItems(
                          items.map((it) =>
                            it.id === item.id
                              ? { ...it, qty: e.target.value }
                              : it,
                          ),
                        )
                      }
                    />
                    <Input
                      placeholder="₹ Price"
                      type="number"
                      min="0"
                      value={item.price}
                      className="w-24"
                      onChange={(e) =>
                        setItems(
                          items.map((it) =>
                            it.id === item.id
                              ? { ...it, price: e.target.value }
                              : it,
                          ),
                        )
                      }
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setItems(items.filter((it) => it.id !== item.id))
                        }
                        className="text-destructive hover:text-destructive/80"
                      >
                        <MinusCircle size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setItems([...items, newItem()])}
                >
                  <PlusCircle size={14} className="mr-1" /> Add Item
                </Button>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-accent rounded-lg">
                <span className="text-sm font-medium">Grand Total</span>
                <span className="text-lg font-display font-bold text-primary">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                data-ocid="orders.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddOrder}
                disabled={addOrder.isPending}
                className="pharmacy-gradient text-white border-0"
                data-ocid="orders.submit_button"
              >
                {addOrder.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {addOrder.isPending ? "Adding..." : "Add Order"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isError && (
        <div
          data-ocid="orders.error_state"
          className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm"
        >
          Failed to load orders.
        </div>
      )}

      {isLoading ? (
        <div data-ocid="orders.loading_state" className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table data-ocid="orders.table">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Bill No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Grand Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!orders?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="orders.empty_state"
                  >
                    No orders yet. Add your first order!
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order, idx) => (
                  <TableRow
                    key={order.id.toString()}
                    data-ocid={`orders.item.${idx + 1}`}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{`BILL-${String(idx + 1).padStart(3, "0")}`}</TableCell>
                    <TableCell className="font-medium">
                      {order.customerName}
                    </TableCell>
                    <TableCell>{order.customerMobile}</TableCell>
                    <TableCell className="font-medium text-primary">
                      ₹{order.grandTotal.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === "delivered" ? "default" : "secondary"
                        }
                        className={
                          order.status === "delivered"
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                        }
                      >
                        {order.status === "delivered" ? "Delivered" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(order.date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          data-ocid={`orders.print_button.${idx + 1}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrint(order, idx)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          title="Print Bill"
                        >
                          <Printer size={14} />
                        </Button>
                        <Button
                          data-ocid={`orders.delete_button.${idx + 1}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(order.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {printOrder && (
        <PrintBillDialog
          order={printOrder}
          billNumber={printBillNumber}
          open={printOpen}
          onOpenChange={(v) => {
            setPrintOpen(v);
            if (!v) setPrintOrder(null);
          }}
        />
      )}
    </div>
  );
}
