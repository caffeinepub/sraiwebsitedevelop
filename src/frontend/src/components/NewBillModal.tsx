import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Separator } from "@/components/ui/separator";
import { Eye, ImagePlus, Package, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export interface LocalBillProduct {
  name: string;
  photo: string | null;
  price: number;
  discount: number;
  total: number;
}

export interface LensEye {
  sph: string;
  cyl: string;
  axis: string;
  add: string;
  nearVision: string;
}

export interface LocalBill {
  id: string;
  billNo: string;
  date: string;
  customerName: string;
  customerAddress: string;
  customerMobile: string;
  products: LocalBillProduct[];
  subTotal: number;
  additionalDiscount: number;
  grandTotal: number;
  advance: number;
  dues: number;
  transactionType: string;
  sendWhatsApp: boolean;
  lensRight?: LensEye;
  lensLeft?: LensEye;
}

function getNextBillNo(principalId: string): string {
  const key = `billCounter_${principalId}`;
  const current = Number.parseInt(localStorage.getItem(key) || "0", 10);
  const next = current + 1;
  localStorage.setItem(key, next.toString());
  return `BILL-${next.toString().padStart(3, "0")}`;
}

function saveLocalBill(principalId: string, bill: LocalBill) {
  const key = `bills_${principalId}`;
  const existing: LocalBill[] = JSON.parse(localStorage.getItem(key) || "[]");
  existing.push(bill);
  localStorage.setItem(key, JSON.stringify(existing));
}

function getShopInfo(principalId: string) {
  return {
    shopName:
      localStorage.getItem(`shopId_${principalId}`) ||
      localStorage.getItem("userShopId") ||
      "My Shop",
    shopPhone:
      localStorage.getItem(`shopPhone_${principalId}`) ||
      localStorage.getItem("userShopPhone") ||
      "",
    shopLogo: localStorage.getItem(`shopLogo_${principalId}`) || null,
  };
}

const emptyLens = (): LensEye => ({
  sph: "",
  cyl: "",
  axis: "",
  add: "",
  nearVision: "",
});

interface ProductRow {
  id: number;
  name: string;
  photo: string | null;
  price: string;
  discount: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onBillCreated: () => void;
}

export function NewBillModal({ open, onOpenChange, onBillCreated }: Props) {
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString() ?? "guest";

  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([
    { id: 1, name: "", photo: null, price: "", discount: "" },
  ]);
  const [additionalDiscount, setAdditionalDiscount] = useState("");
  const [advance, setAdvance] = useState("");
  const [transactionType, setTransactionType] = useState("Cash");
  const [sendWhatsApp, setSendWhatsApp] = useState("No");
  const [nextId, setNextId] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [lensRight, setLensRight] = useState<LensEye>(emptyLens());
  const [lensLeft, setLensLeft] = useState<LensEye>(emptyLens());

  const resetForm = useCallback(() => {
    setCustomerName("");
    setCustomerAddress("");
    setCustomerMobile("");
    setProducts([{ id: 1, name: "", photo: null, price: "", discount: "" }]);
    setAdditionalDiscount("");
    setAdvance("");
    setTransactionType("Cash");
    setSendWhatsApp("No");
    setNextId(2);
    setLensRight(emptyLens());
    setLensLeft(emptyLens());
  }, []);

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const updateProduct = (
    id: number,
    field: keyof ProductRow,
    value: string | null,
  ) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const addProduct = () => {
    setProducts((prev) => [
      ...prev,
      { id: nextId, name: "", photo: null, price: "", discount: "" },
    ]);
    setNextId((n) => n + 1);
  };

  const removeProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePhotoUpload = (id: number, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updateProduct(id, "photo", e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Calculations
  const calcProducts: LocalBillProduct[] = products.map((p) => {
    const price = Number.parseFloat(p.price) || 0;
    const discount = Number.parseFloat(p.discount) || 0;
    return {
      name: p.name,
      photo: p.photo,
      price,
      discount,
      total: Math.max(0, price - discount),
    };
  });
  const subTotal = calcProducts.reduce((s, p) => s + p.total, 0);
  const addDiscount = Number.parseFloat(additionalDiscount) || 0;
  const grandTotal = Math.max(0, subTotal - addDiscount);
  const advanceAmt = Number.parseFloat(advance) || 0;
  const dues = Math.max(0, grandTotal - advanceAmt);

  const hasLensRight = Object.values(lensRight).some((v) => v.trim() !== "");
  const hasLensLeft = Object.values(lensLeft).some((v) => v.trim() !== "");

  const handleSubmit = () => {
    if (!customerName.trim()) return;
    setSubmitting(true);

    const billNo = getNextBillNo(principalId);
    const shop = getShopInfo(principalId);

    const bill: LocalBill = {
      id: `${Date.now()}`,
      billNo,
      date: new Date().toISOString(),
      customerName: customerName.trim(),
      customerAddress: customerAddress.trim(),
      customerMobile: customerMobile.trim(),
      products: calcProducts,
      subTotal,
      additionalDiscount: addDiscount,
      grandTotal,
      advance: advanceAmt,
      dues,
      transactionType,
      sendWhatsApp: sendWhatsApp === "Yes",
      lensRight: hasLensRight ? lensRight : undefined,
      lensLeft: hasLensLeft ? lensLeft : undefined,
    };

    saveLocalBill(principalId, bill);

    if (sendWhatsApp === "Yes" && customerMobile.trim()) {
      const lensLines: string[] = [];
      if (hasLensRight || hasLensLeft) {
        lensLines.push("", "🔍 Lens Power:");
        if (hasLensRight) {
          lensLines.push(
            `  Right Eye - SPH: ${lensRight.sph} CYL: ${lensRight.cyl} AXIS: ${lensRight.axis} ADD: ${lensRight.add} Near: ${lensRight.nearVision}`,
          );
        }
        if (hasLensLeft) {
          lensLines.push(
            `  Left Eye - SPH: ${lensLeft.sph} CYL: ${lensLeft.cyl} AXIS: ${lensLeft.axis} ADD: ${lensLeft.add} Near: ${lensLeft.nearVision}`,
          );
        }
      }

      const msg = [
        `🏪 ${shop.shopName}`,
        shop.shopPhone ? `📞 ${shop.shopPhone}` : "",
        "",
        `*New Bill - ${billNo}*`,
        "",
        `👤 Customer: ${bill.customerName}`,
        `📱 Mobile: ${bill.customerMobile}`,
        bill.customerAddress ? `📍 Address: ${bill.customerAddress}` : "",
        "",
        "📦 Products:",
        ...calcProducts.map(
          (p) =>
            `• ${p.name}: ₹${p.price.toFixed(2)} - Discount ₹${p.discount.toFixed(2)} = ₹${p.total.toFixed(2)}`,
        ),
        "",
        `💰 SubTotal: ₹${subTotal.toFixed(2)}`,
        addDiscount > 0
          ? `🏷️ Additional Discount: ₹${addDiscount.toFixed(2)}`
          : "",
        `✅ Grand Total: ₹${grandTotal.toFixed(2)}`,
        `💵 Advance: ₹${advanceAmt.toFixed(2)}`,
        `⚠️ Dues: ₹${dues.toFixed(2)}`,
        `💳 Payment: ${transactionType}`,
        ...lensLines,
        "",
        `Thank you for shopping at ${shop.shopName}!`,
        "— sraiwebsitedevelop",
      ]
        .filter((l) => l !== undefined)
        .join("\n");

      const num = bill.customerMobile.replace(/\D/g, "");
      window.open(
        `https://wa.me/${num}?text=${encodeURIComponent(msg)}`,
        "_blank",
      );
    }

    setSubmitting(false);
    resetForm();
    onOpenChange(false);
    onBillCreated();
  };

  const lensFieldClass = "h-8 text-xs px-2";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        data-ocid="newbill.dialog"
        className="max-w-xl w-full max-h-[92vh] overflow-y-auto p-0"
      >
        <DialogHeader className="px-6 pt-6 pb-0 sticky top-0 bg-white z-10 border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-display font-bold text-foreground flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package size={16} className="text-primary" />
              </span>
              Add New Bill
            </DialogTitle>
            <Button
              data-ocid="newbill.close_button"
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-7 w-7"
            >
              <X size={14} />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-6">
          {/* Customer Info */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Customer Information
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="cname" className="text-sm font-medium">
                  Customer Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cname"
                  data-ocid="newbill.input"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cmobile" className="text-sm font-medium">
                    Mobile Number
                  </Label>
                  <Input
                    id="cmobile"
                    data-ocid="newbill.input"
                    type="tel"
                    placeholder="10-digit mobile"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="caddress" className="text-sm font-medium">
                    Address
                  </Label>
                  <Input
                    id="caddress"
                    data-ocid="newbill.input"
                    placeholder="Customer address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Products */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Products
              </h3>
              <Button
                data-ocid="newbill.primary_button"
                type="button"
                size="sm"
                variant="outline"
                onClick={addProduct}
                className="h-7 text-xs border-primary/40 text-primary hover:bg-primary/5"
              >
                <Plus size={12} className="mr-1" /> Add Product
              </Button>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {products.map((prod, i) => (
                  <motion.div
                    key={prod.id}
                    data-ocid={`newbill.product.item.${i + 1}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="bg-secondary/40 rounded-xl p-4 space-y-3 border border-border/60"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Product {i + 1}
                      </span>
                      {products.length > 1 && (
                        <Button
                          data-ocid={`newbill.product.delete_button.${i + 1}`}
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProduct(prod.id)}
                          className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={12} />
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {/* Photo upload */}
                      <label
                        data-ocid={`newbill.upload_button.${i + 1}`}
                        className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors shrink-0"
                      >
                        {prod.photo ? (
                          <img
                            src={prod.photo}
                            alt="Product"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <>
                            <ImagePlus
                              size={16}
                              className="text-muted-foreground"
                            />
                            <span className="text-[9px] text-muted-foreground mt-0.5">
                              Photo
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handlePhotoUpload(
                              prod.id,
                              e.target.files?.[0] ?? null,
                            )
                          }
                        />
                      </label>

                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Product name"
                          value={prod.name}
                          onChange={(e) =>
                            updateProduct(prod.id, "name", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">
                              Price ₹
                            </Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={prod.price}
                              onChange={(e) =>
                                updateProduct(prod.id, "price", e.target.value)
                              }
                              className="h-8 text-sm mt-0.5"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">
                              Discount ₹
                            </Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={prod.discount}
                              onChange={(e) =>
                                updateProduct(
                                  prod.id,
                                  "discount",
                                  e.target.value,
                                )
                              }
                              className="h-8 text-sm mt-0.5"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">
                              Total ₹
                            </Label>
                            <div className="h-8 mt-0.5 rounded-md border bg-muted/50 px-3 flex items-center text-sm font-semibold text-primary">
                              ₹
                              {Math.max(
                                0,
                                (Number.parseFloat(prod.price) || 0) -
                                  (Number.parseFloat(prod.discount) || 0),
                              ).toFixed(0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          <Separator />

          {/* Totals Summary */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Bill Summary
            </h3>
            <div className="bg-secondary/40 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SubTotal</span>
                <span className="font-semibold">₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">
                  Additional Discount ₹
                </Label>
                <Input
                  data-ocid="newbill.input"
                  type="number"
                  placeholder="0"
                  value={additionalDiscount}
                  onChange={(e) => setAdditionalDiscount(e.target.value)}
                  className="w-32 h-8 text-sm text-right"
                />
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-border pt-2">
                <span>Grand Total</span>
                <span className="text-primary text-base">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">
                  Advance ₹
                </Label>
                <Input
                  data-ocid="newbill.input"
                  type="number"
                  placeholder="0"
                  value={advance}
                  onChange={(e) => setAdvance(e.target.value)}
                  className="w-32 h-8 text-sm text-right"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dues</span>
                <span
                  className={`font-bold ${dues > 0 ? "text-destructive" : "text-emerald-600"}`}
                >
                  ₹{dues.toFixed(2)}
                </span>
              </div>
            </div>
          </section>

          <Separator />

          {/* Payment */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Payment Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Transaction Type</Label>
                <Select
                  value={transactionType}
                  onValueChange={setTransactionType}
                >
                  <SelectTrigger data-ocid="newbill.select" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Send to WhatsApp</Label>
                <Select value={sendWhatsApp} onValueChange={setSendWhatsApp}>
                  <SelectTrigger data-ocid="newbill.select" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes — Send Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          {/* Lens Power (Optional) */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Eye size={14} className="text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Lens Power
              </h3>
              <span className="text-[10px] text-muted-foreground/60 bg-muted rounded px-1.5 py-0.5">
                Optional
              </span>
            </div>

            <div className="space-y-4">
              {/* Right Eye */}
              <div className="bg-secondary/40 rounded-xl p-4 border border-border/60">
                <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <span>👁️</span> Right Eye
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {(["SPH", "CYL", "AXIS", "ADD", "Near"] as const).map(
                    (label) => {
                      const key =
                        label === "Near"
                          ? "nearVision"
                          : (label.toLowerCase() as keyof LensEye);
                      return (
                        <div key={label}>
                          <Label className="text-[10px] text-muted-foreground block mb-0.5">
                            {label}
                          </Label>
                          <Input
                            data-ocid="newbill.input"
                            placeholder="—"
                            value={lensRight[key]}
                            onChange={(e) =>
                              setLensRight((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            className={lensFieldClass}
                          />
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Left Eye */}
              <div className="bg-secondary/40 rounded-xl p-4 border border-border/60">
                <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                  <span>👁️</span> Left Eye
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {(["SPH", "CYL", "AXIS", "ADD", "Near"] as const).map(
                    (label) => {
                      const key =
                        label === "Near"
                          ? "nearVision"
                          : (label.toLowerCase() as keyof LensEye);
                      return (
                        <div key={label}>
                          <Label className="text-[10px] text-muted-foreground block mb-0.5">
                            {label}
                          </Label>
                          <Input
                            data-ocid="newbill.input"
                            placeholder="—"
                            value={lensLeft[key]}
                            onChange={(e) =>
                              setLensLeft((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            className={lensFieldClass}
                          />
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 sticky bottom-0 bg-white border-t flex gap-3">
          <Button
            data-ocid="newbill.cancel_button"
            variant="outline"
            className="flex-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            data-ocid="newbill.submit_button"
            className="flex-1 bg-primary text-primary-foreground font-semibold"
            onClick={handleSubmit}
            disabled={!customerName.trim() || submitting}
          >
            {submitting ? "Saving..." : "Submit Bill"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
