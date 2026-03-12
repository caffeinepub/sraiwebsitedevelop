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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  MinusCircle,
  Pencil,
  Plus,
  PlusCircle,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { OrderItem, Product } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  OrderStatus,
  UserRole,
  useAddOrder,
  useAddPrescription,
  useAddProduct,
  useAssignUserRole,
  useDeleteOrder,
  useDeletePrescription,
  useDeleteProduct,
  useGetAllRegisteredUsers,
  useLookupUserProfile,
  useOrders,
  usePrescriptions,
  useProducts,
  useUpdateOrderStatus,
  useUpdateProduct,
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

type ItemRow = { id: number; productName: string; qty: string; price: string };
let rowCounter = 0;
function newRow(): ItemRow {
  return { id: ++rowCounter, productName: "", qty: "1", price: "" };
}

// ─── Admin Orders Section ────────────────────────────────────────────────────
function AdminOrders() {
  const { data: orders, isLoading } = useOrders();
  const deleteOrder = useDeleteOrder();
  const updateStatus = useUpdateOrderStatus();
  const addOrder = useAddOrder();

  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [items, setItems] = useState<ItemRow[]>([newRow()]);

  const grandTotal = items.reduce((s, it) => {
    return (
      s + (Number.parseFloat(it.qty) || 0) * (Number.parseFloat(it.price) || 0)
    );
  }, 0);

  const resetForm = () => {
    setCustomerName("");
    setCustomerMobile("");
    setItems([newRow()]);
  };

  const handleAdd = async () => {
    if (!customerName.trim() || !customerMobile.trim()) {
      toast.error("Customer name and mobile are required");
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
      toast.success("Order added");
      setOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to add order");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {orders?.length ?? 0} orders
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="pharmacy-gradient text-white border-0 hover:opacity-90"
            >
              <Plus size={14} className="mr-1" /> Add Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Order (Admin)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Customer Name</Label>
                  <Input
                    placeholder="Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Mobile</Label>
                  <Input
                    placeholder="Mobile"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Items</Label>
                {items.map((item, _idx) => (
                  <div key={item.id} className="flex gap-2 items-center">
                    <Input
                      placeholder="Product"
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
                      placeholder="₹"
                      type="number"
                      value={item.price}
                      className="w-20"
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
                        className="text-destructive"
                      >
                        <MinusCircle size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setItems([...items, newRow()])}
                >
                  <PlusCircle size={13} className="mr-1" /> Add Item
                </Button>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-accent rounded-lg">
                <span className="text-sm font-medium">Grand Total</span>
                <span className="font-display font-bold text-primary">
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
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAdd}
                disabled={addOrder.isPending}
                className="pharmacy-gradient text-white border-0"
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
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Customer</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!orders?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="admin.orders.empty_state"
                  >
                    No orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order, idx) => (
                  <TableRow
                    key={order.id.toString()}
                    data-ocid={`admin.orders.item.${idx + 1}`}
                  >
                    <TableCell className="font-medium">
                      {order.customerName}
                    </TableCell>
                    <TableCell>{order.customerMobile}</TableCell>
                    <TableCell className="text-primary font-medium">
                      ₹{order.grandTotal.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          order.status === "delivered"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }
                      >
                        {order.status === "delivered" ? "Delivered" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(order.date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            data-ocid={`admin.orders.deliver.button.${idx + 1}`}
                            onClick={async () => {
                              try {
                                await updateStatus.mutateAsync({
                                  id: order.id,
                                  status: OrderStatus.delivered,
                                });
                                toast.success("Marked as delivered");
                              } catch {
                                toast.error("Failed");
                              }
                            }}
                            className="text-emerald-600 hover:text-emerald-700 text-xs"
                          >
                            <CheckCircle2 size={14} />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          data-ocid={`admin.orders.delete_button.${idx + 1}`}
                          onClick={async () => {
                            try {
                              await deleteOrder.mutateAsync(order.id);
                              toast.success("Order deleted");
                            } catch {
                              toast.error("Failed");
                            }
                          }}
                          className="text-destructive hover:text-destructive"
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
    </div>
  );
}

// ─── Admin Products Section ──────────────────────────────────────────────────
function AdminProducts() {
  const { data: products, isLoading } = useProducts();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [editId, setEditId] = useState<bigint | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");

  const handleAdd = async () => {
    if (!name.trim()) {
      toast.error("Product name required");
      return;
    }
    try {
      await addProduct.mutateAsync({
        name: name.trim(),
        price: Number.parseFloat(price) || 0,
        stock: BigInt(Number.parseInt(stock) || 0),
      });
      toast.success("Product added");
      setAddOpen(false);
      setName("");
      setPrice("");
      setStock("");
    } catch {
      toast.error("Failed");
    }
  };

  const handleUpdate = async (id: bigint) => {
    try {
      await updateProduct.mutateAsync({
        id,
        name: editName,
        price: Number.parseFloat(editPrice) || 0,
        stock: BigInt(Number.parseInt(editStock) || 0),
      });
      toast.success("Product updated");
      setEditId(null);
    } catch {
      toast.error("Failed");
    }
  };

  const startEdit = (p: Product) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditPrice(p.price.toString());
    setEditStock(p.stock.toString());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {products?.length ?? 0} products
        </p>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="pharmacy-gradient text-white border-0 hover:opacity-90"
            >
              <Plus size={14} className="mr-1" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Product (Admin)</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  placeholder="Product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAdd}
                disabled={addProduct.isPending}
                className="pharmacy-gradient text-white border-0"
              >
                {addProduct.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {addProduct.isPending ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Name</TableHead>
                <TableHead>Price (₹)</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!products?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="admin.products.empty_state"
                  >
                    No products yet.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p, idx) => (
                  <TableRow
                    key={p.id.toString()}
                    data-ocid={`admin.products.item.${idx + 1}`}
                  >
                    <TableCell>
                      {editId === p.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8"
                        />
                      ) : (
                        <span className="font-medium">{p.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === p.id ? (
                        <Input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="h-8 w-24"
                        />
                      ) : (
                        <span className="text-primary">
                          ₹{p.price.toFixed(2)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === p.id ? (
                        <Input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          className="h-8 w-20"
                        />
                      ) : (
                        p.stock.toString()
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editId === p.id ? (
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdate(p.id)}
                            data-ocid={`admin.products.save_button.${idx + 1}`}
                            className="text-emerald-600"
                          >
                            <Check size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditId(null)}
                            data-ocid={`admin.products.cancel_button.${idx + 1}`}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(p)}
                            data-ocid={`admin.products.edit_button.${idx + 1}`}
                            className="text-muted-foreground"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              try {
                                await deleteProduct.mutateAsync(p.id);
                                toast.success("Deleted");
                              } catch {
                                toast.error("Failed");
                              }
                            }}
                            data-ocid={`admin.products.delete_button.${idx + 1}`}
                            className="text-destructive"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
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

// ─── Admin Prescriptions Section ─────────────────────────────────────────────
function AdminPrescriptions() {
  const { data: prescriptions, isLoading } = usePrescriptions();
  const addPrescription = useAddPrescription();
  const deletePrescription = useDeletePrescription();

  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [notes, setNotes] = useState("");

  const handleAdd = async () => {
    if (!customerName.trim() || !customerMobile.trim()) {
      toast.error("Name and mobile required");
      return;
    }
    try {
      await addPrescription.mutateAsync({
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        notes: notes.trim(),
        date: new Date().toISOString(),
      });
      toast.success("Prescription added");
      setOpen(false);
      setCustomerName("");
      setCustomerMobile("");
      setNotes("");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {prescriptions?.length ?? 0} prescriptions
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="pharmacy-gradient text-white border-0 hover:opacity-90"
            >
              <Plus size={14} className="mr-1" /> Add Prescription
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Prescription (Admin)</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Customer Name</Label>
                  <Input
                    placeholder="Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Mobile</Label>
                  <Input
                    placeholder="Mobile"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Medicines, dosage..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAdd}
                disabled={addPrescription.isPending}
                className="pharmacy-gradient text-white border-0"
              >
                {addPrescription.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {addPrescription.isPending ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Customer</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!prescriptions?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                    data-ocid="admin.prescriptions.empty_state"
                  >
                    No prescriptions yet.
                  </TableCell>
                </TableRow>
              ) : (
                prescriptions.map((rx, idx) => (
                  <TableRow
                    key={rx.id.toString()}
                    data-ocid={`admin.prescriptions.item.${idx + 1}`}
                  >
                    <TableCell className="font-medium">
                      {rx.customerName}
                    </TableCell>
                    <TableCell>{rx.customerMobile}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate">
                        {rx.notes || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(rx.date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        data-ocid={`admin.prescriptions.delete_button.${idx + 1}`}
                        onClick={async () => {
                          try {
                            await deletePrescription.mutateAsync(rx.id);
                            toast.success("Deleted");
                          } catch {
                            toast.error("Failed");
                          }
                        }}
                        className="text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
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

// ─── Main AdminPanel ──────────────────────────────────────────────────────────
export function AdminPanel() {
  const lookupProfile = useLookupUserProfile();
  const assignRole = useAssignUserRole();
  const { data: registeredUsers, isLoading: usersLoading } =
    useGetAllRegisteredUsers();
  const { identity } = useInternetIdentity();
  const myPrincipalId = identity?.getPrincipal().toString() ?? "";
  const [copied, setCopied] = useState(false);
  const copyPrincipal = () => {
    if (myPrincipalId) {
      navigator.clipboard.writeText(myPrincipalId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [lookupPrincipal, setLookupPrincipal] = useState("");
  const [lookedUpName, setLookedUpName] = useState<string | null | undefined>(
    undefined,
  );
  const [lookupError, setLookupError] = useState("");

  const [rolePrincipal, setRolePrincipal] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("user");

  const handleLookup = async () => {
    if (!lookupPrincipal.trim()) {
      setLookupError("Please enter a Principal ID");
      return;
    }
    setLookupError("");
    setLookedUpName(undefined);
    try {
      const result = await lookupProfile.mutateAsync(lookupPrincipal.trim());
      setLookedUpName(result ? result.name : null);
    } catch {
      setLookupError("Invalid Principal ID or user not found");
    }
  };

  const handleAssignRole = async () => {
    if (!rolePrincipal.trim()) {
      toast.error("Please enter a Principal ID");
      return;
    }
    const roleMap: Record<string, UserRole> = {
      admin: UserRole.admin,
      user: UserRole.user,
      guest: UserRole.guest,
    };
    const role = roleMap[selectedRole];
    if (!role) {
      toast.error("Invalid role");
      return;
    }
    try {
      await assignRole.mutateAsync({
        principalStr: rolePrincipal.trim(),
        role,
      });
      toast.success(`Role "${selectedRole}" assigned successfully`);
      setRolePrincipal("");
    } catch {
      toast.error("Failed to assign role. Check the Principal ID.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-4 rounded-xl border-2 border-amber-200 bg-amber-50"
      >
        <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
          <ShieldCheck size={20} className="text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-display font-bold text-foreground">
              Admin Panel
            </h2>
            <Badge className="bg-amber-500 text-white hover:bg-amber-500 text-xs">
              ADMIN ONLY
            </Badge>
          </div>
          <p className="text-sm text-amber-700 mt-0.5">
            Manage users, roles, and your own account data. Backend APIs are
            caller-scoped — only your own data can be managed directly.
          </p>
        </div>
      </motion.div>

      {/* My Principal ID */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={16} className="text-amber-600" />
          <h3 className="font-display font-semibold text-base text-amber-800">
            Mera Principal ID
          </h3>
        </div>
        <p className="text-xs text-amber-700 mb-3">
          Yeh aapka unique ID hai. Admin access ke liye yeh ID share karein.
        </p>
        <div className="flex gap-2 items-center">
          <code className="flex-1 text-xs bg-white border border-amber-200 rounded-lg px-3 py-2 font-mono text-amber-900 break-all select-all">
            {myPrincipalId || "Login karne ke baad dikhega..."}
          </code>
          <Button
            type="button"
            size="sm"
            onClick={copyPrincipal}
            className="bg-amber-500 hover:bg-amber-600 text-white border-0 shrink-0"
            data-ocid="admin.copy_principal.button"
          >
            {copied ? <Check size={14} /> : <FileText size={14} />}
            <span className="ml-1 text-xs">{copied ? "Copied!" : "Copy"}</span>
          </Button>
        </div>
      </motion.section>

      {/* Registered Shopkeepers */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-card border border-border rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <UserCheck size={18} className="text-primary" />
          <h3 className="font-display font-semibold text-lg">
            Registered Shopkeepers
          </h3>
          <Badge className="bg-amber-500 text-white text-xs">
            {registeredUsers?.length ?? 0} users
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Sabhi registered dukandaaron ki list.
        </p>
        {usersLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : registeredUsers && registeredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Naam</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Principal ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registeredUsers.map((u, idx) => (
                  <TableRow
                    key={u.principal}
                    data-ocid={`admin.shopkeeper.row.${idx + 1}`}
                  >
                    <TableCell className="text-muted-foreground text-sm">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {u.name || "(No name)"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          u.role === "admin"
                            ? "bg-amber-500 text-white"
                            : u.role === "user"
                              ? "bg-green-500 text-white"
                              : "bg-gray-400 text-white"
                        }
                      >
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono text-muted-foreground break-all">
                        {u.principal}
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div
            data-ocid="admin.shopkeepers.empty_state"
            className="text-center py-6 text-muted-foreground text-sm"
          >
            Abhi tak koi shopkeeper registered nahi hai.
          </div>
        )}
      </motion.section>

      {/* User Lookup */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Search size={18} className="text-primary" />
          <h3 className="font-display font-semibold text-lg">
            User Profile Lookup
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter a shopkeeper&apos;s Principal ID to look up their registered
          profile name.
        </p>
        <div className="flex gap-2">
          <Input
            data-ocid="admin.principal.input"
            placeholder="e.g. aaaaa-aa (Principal ID)"
            value={lookupPrincipal}
            onChange={(e) => setLookupPrincipal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            className="flex-1 font-mono text-sm"
          />
          <Button
            type="button"
            data-ocid="admin.lookup.button"
            onClick={handleLookup}
            disabled={lookupProfile.isPending}
            className="pharmacy-gradient text-white border-0 hover:opacity-90"
          >
            {lookupProfile.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search size={16} />
            )}
            <span className="ml-1 hidden sm:block">Lookup</span>
          </Button>
        </div>

        {lookupError && (
          <div
            data-ocid="admin.lookup.error_state"
            className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
          >
            <AlertCircle size={16} />
            {lookupError}
          </div>
        )}

        {lookedUpName !== undefined && !lookupError && (
          <div
            data-ocid="admin.lookup.success_state"
            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              lookedUpName
                ? "bg-emerald-50 text-emerald-700"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {lookedUpName ? (
              <>
                <UserCheck size={16} />{" "}
                <span>
                  Found: <strong>{lookedUpName}</strong>
                </span>
              </>
            ) : (
              <>
                <AlertCircle size={16} />{" "}
                <span>
                  No profile found for this Principal. The user may not have
                  registered yet.
                </span>
              </>
            )}
          </div>
        )}

        {/* Info about data access */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-700">
          <p className="font-medium mb-1">ℹ️ About Data Access</p>
          <p>
            To edit a shopkeeper&apos;s data, ask them to share their screen or
            log in together. You can also directly edit your own account&apos;s
            data from the main dashboard or the{" "}
            <strong>Admin Data Management</strong> section below.
          </p>
        </div>
      </motion.section>

      {/* Assign Role */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-amber-500" />
          <h3 className="font-display font-semibold text-lg">
            Assign User Role
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Grant or revoke admin/user/guest access for any Principal.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            data-ocid="admin.role_principal.input"
            placeholder="Principal ID"
            value={rolePrincipal}
            onChange={(e) => setRolePrincipal(e.target.value)}
            className="flex-1 font-mono text-sm"
          />
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger
              data-ocid="admin.role.select"
              className="w-full sm:w-36"
            >
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="guest">Guest</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            data-ocid="admin.assign_role.button"
            onClick={handleAssignRole}
            disabled={assignRole.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-white border-0"
          >
            {assignRole.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {assignRole.isPending ? "Assigning..." : "Assign Role"}
          </Button>
        </div>
      </motion.section>

      {/* Admin's Own Data Management */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-primary" />
          <h3 className="font-display font-semibold text-lg">
            Admin Data Management
          </h3>
          <Badge variant="secondary" className="text-xs">
            Your Account
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your own orders, products, and prescriptions. Use this to test
          and demonstrate the app to shopkeepers.
        </p>

        <Tabs defaultValue="orders">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="orders" data-ocid="admin.data.orders.tab">
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" data-ocid="admin.data.products.tab">
              Products
            </TabsTrigger>
            <TabsTrigger
              value="prescriptions"
              data-ocid="admin.data.prescriptions.tab"
            >
              Prescriptions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="mt-4">
            <AdminOrders />
          </TabsContent>
          <TabsContent value="products" className="mt-4">
            <AdminProducts />
          </TabsContent>
          <TabsContent value="prescriptions" className="mt-4">
            <AdminPrescriptions />
          </TabsContent>
        </Tabs>
      </motion.section>
    </div>
  );
}
