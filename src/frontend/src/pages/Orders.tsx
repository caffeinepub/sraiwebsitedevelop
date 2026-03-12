import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Camera,
  ChevronDown,
  Loader2,
  MinusCircle,
  Plus,
  PlusCircle,
  Printer,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Order, OrderItem } from "../backend";
import {
  BillDetailModal,
  getExtOrder,
  saveExtOrder,
} from "../components/BillDetailModal";
import type { ExtendedOrderData } from "../components/BillDetailModal";
import {
  OrderStatus,
  useAddOrder,
  useDeleteOrder,
  useOrders,
  useUpdateOrderStatus,
} from "../hooks/useQueries";

function formatDate(dateStr: string) {
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

type ItemRow = {
  id: number;
  productName: string;
  qty: string;
  price: string;
  photo: string | null;
};
let itemCounter = 0;
function newItem(): ItemRow {
  return {
    id: ++itemCounter,
    productName: "",
    qty: "1",
    price: "",
    photo: null,
  };
}

export function Orders() {
  const { data: orders, isLoading, isError } = useOrders();
  const addOrder = useAddOrder();
  const deleteOrder = useDeleteOrder();

  const [addOpen, setAddOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [billOpen, setBillOpen] = useState(false);
  const [lensOpen, setLensOpen] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [items, setItems] = useState<ItemRow[]>([newItem()]);
  const [discount, setDiscount] = useState("");
  const [advance, setAdvance] = useState("");
  const [transactionType, setTransactionType] = useState("Cash");
  const [orderDate, setOrderDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [sendWhatsApp, setSendWhatsApp] = useState("No");
  // Lens power
  const [rightSph, setRightSph] = useState("");
  const [rightCyl, setRightCyl] = useState("");
  const [rightAxis, setRightAxis] = useState("");
  const [rightAdd, setRightAdd] = useState("");
  const [rightNear, setRightNear] = useState("");
  const [leftSph, setLeftSph] = useState("");
  const [leftCyl, setLeftCyl] = useState("");
  const [leftAxis, setLeftAxis] = useState("");
  const [leftAdd, setLeftAdd] = useState("");
  const [leftNear, setLeftNear] = useState("");

  const photoRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const resetForm = () => {
    setCustomerName("");
    setCustomerMobile("");
    setCustomerAddress("");
    setItems([newItem()]);
    setDiscount("");
    setAdvance("");
    setTransactionType("Cash");
    setOrderDate(new Date().toISOString().split("T")[0]);
    setSendWhatsApp("No");
    setRightSph("");
    setRightCyl("");
    setRightAxis("");
    setRightAdd("");
    setRightNear("");
    setLeftSph("");
    setLeftCyl("");
    setLeftAxis("");
    setLeftAdd("");
    setLeftNear("");
    setLensOpen(false);
  };

  const total = items.reduce((sum, it) => {
    const p = Number.parseFloat(it.price) || 0;
    const q = Number.parseInt(it.qty) || 0;
    return sum + p * q;
  }, 0);
  const discountVal = Number.parseFloat(discount) || 0;
  const grandTotal = total - discountVal;
  const advanceVal = Number.parseFloat(advance) || 0;
  const balance = grandTotal - advanceVal;

  const handleItemPhoto = (id: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, photo: b64 } : it)),
      );
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!customerMobile.trim()) {
      toast.error("Mobile number is required");
      return;
    }
    const orderItems: OrderItem[] = items
      .filter((it) => it.productName.trim())
      .map((it) => ({
        productName: it.productName.trim(),
        qty: BigInt(Number.parseInt(it.qty) || 1),
        price: Number.parseFloat(it.price) || 0,
      }));
    if (!orderItems.length) {
      toast.error("Add at least one product");
      return;
    }
    try {
      const id = await addOrder.mutateAsync({
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        items: orderItems,
        grandTotal,
        date: new Date(orderDate).toISOString(),
      });
      // Save extended data
      const ext: ExtendedOrderData = {
        customerAddress: customerAddress.trim() || undefined,
        discount: discountVal || undefined,
        advance: advanceVal || undefined,
        balance: balance || undefined,
        transactionType,
        orderDate,
        sendWhatsApp: sendWhatsApp === "Yes",
        rightSph: rightSph || undefined,
        rightCyl: rightCyl || undefined,
        rightAxis: rightAxis || undefined,
        rightAdd: rightAdd || undefined,
        rightNearVision: rightNear || undefined,
        leftSph: leftSph || undefined,
        leftCyl: leftCyl || undefined,
        leftAxis: leftAxis || undefined,
        leftAdd: leftAdd || undefined,
        leftNearVision: leftNear || undefined,
      };
      saveExtOrder(id, ext);
      // Save product photos
      items.forEach((it, idx) => {
        if (it.photo) {
          localStorage.setItem(`orderItemPhoto_${id}_${idx}`, it.photo);
        }
      });
      toast.success("Order created!");
      if (sendWhatsApp === "Yes") {
        const num = customerMobile.replace(/\D/g, "");
        const shopId = localStorage.getItem("userShopId") || "My Shop";
        const lines = [
          `Namaskar ${customerName}!`,
          "Aapka bill taiyar hai.",
          "",
          `Bill No: BILL-${id.toString().padStart(3, "0")}`,
          `Shop: ${shopId}`,
          "---",
          "Products:",
          ...orderItems.map(
            (oi) =>
              `${oi.productName} x${oi.qty} = ₹${(oi.price * Number(oi.qty)).toFixed(2)}`,
          ),
          "---",
          `Total: ₹${total.toFixed(2)}`,
          `Discount: ₹${discountVal.toFixed(2)}`,
          `Grand Total: ₹${grandTotal.toFixed(2)}`,
          `Advance: ₹${advanceVal.toFixed(2)}`,
          `Balance: ₹${balance.toFixed(2)}`,
          `Payment: ${transactionType}`,
          "---",
          "Dhanyawad! — sraiwebsitedevelop",
        ].join("\n");
        window.open(
          `https://wa.me/${num}?text=${encodeURIComponent(lines)}`,
          "_blank",
        );
      }
      setAddOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to create order");
    }
  };

  const handleDelete = async (id: bigint) => {
    if (!confirm("Delete this order?")) return;
    try {
      await deleteOrder.mutateAsync(id);
      localStorage.removeItem(`extOrder_${id}`);
      toast.success("Order deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Orders
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {orders?.length ?? 0} total orders
          </p>
        </div>
        <Dialog
          open={addOpen}
          onOpenChange={(o) => {
            setAddOpen(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              data-ocid="orders.add_order.button"
              className="sr-gradient text-white border-0 hover:opacity-90"
            >
              <Plus size={16} className="mr-1" /> New Order
            </Button>
          </DialogTrigger>
          <DialogContent
            data-ocid="orders.dialog"
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <DialogHeader>
              <DialogTitle>New Order Bill</DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Customer Name *</Label>
                    <Input
                      data-ocid="orders.customer_name.input"
                      placeholder="e.g. Ramesh Kumar"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Mobile Number *</Label>
                    <Input
                      data-ocid="orders.customer_mobile.input"
                      placeholder="e.g. 9876543210"
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Label>Address</Label>
                  <Input
                    data-ocid="orders.customer_address.input"
                    placeholder="e.g. 123, MG Road, Delhi"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Products */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                  Products
                </h3>
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      data-ocid={`orders.product.item.${idx + 1}`}
                      className="p-3 border border-border rounded-lg space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        {/* Photo */}
                        <button
                          type="button"
                          className="w-12 h-12 rounded-lg border border-dashed border-border flex items-center justify-center cursor-pointer shrink-0 overflow-hidden"
                          onClick={() => photoRefs.current[item.id]?.click()}
                        >
                          {item.photo ? (
                            <img
                              src={item.photo}
                              alt="product"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Camera
                              size={18}
                              className="text-muted-foreground"
                            />
                          )}
                        </button>
                        <input
                          ref={(el) => {
                            photoRefs.current[item.id] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleItemPhoto(item.id, f);
                          }}
                        />
                        <Input
                          placeholder="Product name"
                          value={item.productName}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((it) =>
                                it.id === item.id
                                  ? { ...it, productName: e.target.value }
                                  : it,
                              ),
                            )
                          }
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.qty}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((it) =>
                                it.id === item.id
                                  ? { ...it, qty: e.target.value }
                                  : it,
                              ),
                            )
                          }
                          className="w-16"
                          min="1"
                        />
                        <Input
                          type="number"
                          placeholder="Price"
                          value={item.price}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((it) =>
                                it.id === item.id
                                  ? { ...it, price: e.target.value }
                                  : it,
                              ),
                            )
                          }
                          className="w-24"
                          min="0"
                        />
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setItems((prev) =>
                                prev.filter((it) => it.id !== item.id),
                              )
                            }
                            className="text-destructive hover:text-destructive/70"
                          >
                            <MinusCircle size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-ocid="orders.add_product.button"
                    onClick={() => setItems((prev) => [...prev, newItem()])}
                  >
                    <PlusCircle size={14} className="mr-1" /> Add Product
                  </Button>
                </div>
              </div>

              {/* Payment Summary */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                  Payment Summary
                </h3>
                <div className="bg-muted/30 rounded-lg p-3 space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span>Total</span>
                    <span className="font-semibold">₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount</span>
                    <span>- ₹{discountVal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-border pt-2">
                    <span>Grand Total</span>
                    <span className="text-primary">
                      ₹{grandTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Balance</span>
                    <span>₹{balance.toFixed(2)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Discount (₹)</Label>
                    <Input
                      data-ocid="orders.discount.input"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Advance (₹)</Label>
                    <Input
                      data-ocid="orders.advance.input"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={advance}
                      onChange={(e) => setAdvance(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="space-y-1">
                    <Label>Transaction Type</Label>
                    <Select
                      value={transactionType}
                      onValueChange={setTransactionType}
                    >
                      <SelectTrigger data-ocid="orders.transaction.select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="Online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Order Date</Label>
                    <Input
                      data-ocid="orders.date.input"
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Lens Power (collapsible) */}
              <Collapsible open={lensOpen} onOpenChange={setLensOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-ocid="orders.lens.toggle"
                    className="w-full justify-between"
                  >
                    <span>Lens Power (Optional)</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        lensOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Right Eye 👁️</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { label: "SPH", val: rightSph, set: setRightSph },
                        { label: "CYL", val: rightCyl, set: setRightCyl },
                        { label: "AXIS", val: rightAxis, set: setRightAxis },
                        { label: "ADD", val: rightAdd, set: setRightAdd },
                        { label: "Near", val: rightNear, set: setRightNear },
                      ].map(({ label, val, set }) => (
                        <div key={label} className="space-y-1">
                          <Label className="text-xs">{label}</Label>
                          <Input
                            placeholder={label}
                            value={val}
                            onChange={(e) => set(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Left Eye 👁️</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { label: "SPH", val: leftSph, set: setLeftSph },
                        { label: "CYL", val: leftCyl, set: setLeftCyl },
                        { label: "AXIS", val: leftAxis, set: setLeftAxis },
                        { label: "ADD", val: leftAdd, set: setLeftAdd },
                        { label: "Near", val: leftNear, set: setLeftNear },
                      ].map(({ label, val, set }) => (
                        <div key={label} className="space-y-1">
                          <Label className="text-xs">{label}</Label>
                          <Input
                            placeholder={label}
                            value={val}
                            onChange={(e) => set(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* WhatsApp */}
              <div className="space-y-1">
                <Label>Send Receipt via WhatsApp?</Label>
                <Select value={sendWhatsApp} onValueChange={setSendWhatsApp}>
                  <SelectTrigger data-ocid="orders.whatsapp.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                data-ocid="orders.cancel_button"
                onClick={() => {
                  setAddOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={addOrder.isPending}
                data-ocid="orders.submit_button"
                className="sr-gradient text-white border-0"
              >
                {addOrder.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {addOrder.isPending ? "Creating..." : "Submit Order"}
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
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Bill No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Grand Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    No orders yet. Create your first order!
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
                      data-ocid={`orders.item.${idx + 1}`}
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
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            order.status === "delivered"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(order.date)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            data-ocid={`orders.print_button.${idx + 1}`}
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
                          <Button
                            data-ocid={`orders.delete_button.${idx + 1}`}
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(order.id);
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
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
