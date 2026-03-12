import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, MessageCircle, X } from "lucide-react";
import type { Order } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export interface ExtendedOrderData {
  customerAddress?: string;
  discount?: number;
  advance?: number;
  balance?: number;
  transactionType?: string;
  orderDate?: string;
  deliveredDate?: string;
  productPhoto?: string;
  sendWhatsApp?: boolean;
  rightSph?: string;
  rightCyl?: string;
  rightAxis?: string;
  rightAdd?: string;
  rightNearVision?: string;
  leftSph?: string;
  leftCyl?: string;
  leftAxis?: string;
  leftAdd?: string;
  leftNearVision?: string;
}

export function getExtOrder(orderId: bigint | string): ExtendedOrderData {
  try {
    const raw = localStorage.getItem(`extOrder_${orderId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveExtOrder(
  orderId: bigint | string,
  data: ExtendedOrderData,
) {
  localStorage.setItem(`extOrder_${orderId}`, JSON.stringify(data));
}

function formatBillNo(id: bigint): string {
  return `BILL-${id.toString().padStart(3, "0")}`;
}

function formatDate(dateStr?: string): string {
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

interface BillDetailModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function BillDetailModal({
  order,
  open,
  onOpenChange,
}: BillDetailModalProps) {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  if (!order) return null;

  const ext = getExtOrder(order.id);
  const shopLogo =
    (principal && localStorage.getItem(`shopLogo_${principal}`)) ||
    "/assets/generated/sr-logo.dim_300x300.png";
  const shopId =
    (principal && localStorage.getItem(`shopId_${principal}`)) ||
    localStorage.getItem("userShopId") ||
    "My Shop";
  const shopPhone =
    (principal && localStorage.getItem(`shopPhone_${principal}`)) ||
    localStorage.getItem("userShopPhone") ||
    "";
  const shopAddress =
    (principal && localStorage.getItem(`shopAddress_${principal}`)) ||
    localStorage.getItem("userShopAddress") ||
    "";
  const shopGst =
    (principal && localStorage.getItem(`shopGst_${principal}`)) ||
    localStorage.getItem("userShopGst") ||
    "";

  const billNo = formatBillNo(order.id);
  const total = order.grandTotal;
  const discount = ext.discount ?? 0;
  const grandTotal = total - discount;
  const advance = ext.advance ?? 0;
  const balance = ext.balance ?? grandTotal - advance;

  const hasLens = ext.rightSph || ext.rightCyl || ext.leftSph || ext.leftCyl;

  const handleWhatsApp = () => {
    const separator = "══════════════════════";
    const lineSep = "──────────────────────";

    const productLines = order.items.map(
      (it) =>
        `• ${it.productName}\n  Qty: ${it.qty} | Price: ₹${it.price.toFixed(2)} | Total: ₹${(it.price * Number(it.qty)).toFixed(2)}`,
    );

    const lensLines: string[] = [];
    if (hasLens) {
      lensLines.push("", "🔍 LENS POWER");
      if (ext.rightSph || ext.rightCyl) {
        lensLines.push(
          `Right Eye: SPH: ${ext.rightSph || "—"} | CYL: ${ext.rightCyl || "—"} | AXIS: ${ext.rightAxis || "—"} | ADD: ${ext.rightAdd || "—"} | Near: ${ext.rightNearVision || "—"}`,
        );
      }
      if (ext.leftSph || ext.leftCyl) {
        lensLines.push(
          `Left Eye:  SPH: ${ext.leftSph || "—"} | CYL: ${ext.leftCyl || "—"} | AXIS: ${ext.leftAxis || "—"} | ADD: ${ext.leftAdd || "—"} | Near: ${ext.leftNearVision || "—"}`,
        );
      }
    }

    const dateStr = ext.orderDate
      ? formatDate(ext.orderDate)
      : new Date().toLocaleDateString("en-IN");

    const lines = [
      `🏪 *${shopId}*`,
      shopPhone ? `📞 ${shopPhone}` : "",
      shopAddress ? `📍 ${shopAddress}` : "",
      shopGst ? `GST: ${shopGst}` : "",
      separator,
      "",
      `📋 *BILL: ${billNo}*`,
      `📅 Date: ${dateStr}`,
      "",
      "👤 *CUSTOMER DETAILS*",
      `Name: ${order.customerName}`,
      `Mobile: ${order.customerMobile}`,
      ext.customerAddress ? `Address: ${ext.customerAddress}` : "",
      "",
      "📦 *PRODUCTS*",
      lineSep,
      ...productLines,
      lineSep,
      "",
      "💰 *PAYMENT SUMMARY*",
      `SubTotal:        ₹${total.toFixed(2)}`,
      discount > 0 ? `Discount:        -₹${discount.toFixed(2)}` : "",
      `Grand Total:     ₹${grandTotal.toFixed(2)}`,
      advance > 0 ? `Advance:         ₹${advance.toFixed(2)}` : "",
      `Dues:            ₹${balance.toFixed(2)}`,
      ext.transactionType ? `Payment:         ${ext.transactionType}` : "",
      ...lensLines,
      "",
      separator,
      `Thank you for shopping at *${shopId}*! 🙏`,
      "— sraiwebsitedevelop",
    ]
      .filter((l) => l !== "")
      .join("\n");

    const num = order.customerMobile.replace(/\D/g, "");
    window.open(
      `https://wa.me/${num}?text=${encodeURIComponent(lines)}`,
      "_blank",
    );
  };

  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="bill.dialog"
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center justify-between">
            <span>Bill Detail</span>
          </DialogTitle>
        </DialogHeader>

        {/* Printable Bill Area */}
        <div id="print-bill" className="space-y-4 text-sm">
          {/* Shop Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed">
            <img
              src={shopLogo}
              alt="Shop Logo"
              className="w-14 h-14 rounded-xl object-cover mx-auto border"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/assets/generated/sr-logo.dim_300x300.png";
              }}
            />
            <h2 className="font-display font-bold text-lg">{shopId}</h2>
            <p className="text-xs text-muted-foreground">
              SR.AIWEBSITEDEVELOPER
            </p>
            {shopPhone && (
              <p className="text-xs text-muted-foreground">📞 {shopPhone}</p>
            )}
            {shopAddress && (
              <p className="text-xs text-muted-foreground">📍 {shopAddress}</p>
            )}
            {shopGst && (
              <p className="text-xs font-medium text-muted-foreground">
                GST: {shopGst}
              </p>
            )}
            <div className="flex justify-between text-xs mt-2 pt-2 border-t border-dashed">
              <span className="font-bold text-primary">{billNo}</span>
              <Badge
                variant={order.status === "delivered" ? "default" : "secondary"}
                className={order.status === "delivered" ? "bg-emerald-500" : ""}
              >
                {order.status}
              </Badge>
            </div>
          </div>

          {/* Customer */}
          <div className="space-y-1">
            <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
              Customer
            </h3>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{order.customerName}</span>
              <span className="text-muted-foreground">Mobile:</span>
              <span>{order.customerMobile}</span>
              {ext.customerAddress && (
                <>
                  <span className="text-muted-foreground">Address:</span>
                  <span>{ext.customerAddress}</span>
                </>
              )}
              {ext.orderDate && (
                <>
                  <span className="text-muted-foreground">Order Date:</span>
                  <span>{formatDate(ext.orderDate)}</span>
                </>
              )}
              {ext.deliveredDate && (
                <>
                  <span className="text-muted-foreground">Delivered:</span>
                  <span>{formatDate(ext.deliveredDate)}</span>
                </>
              )}
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Products
            </h3>
            <table className="w-full text-xs border border-border rounded overflow-hidden">
              <thead>
                <tr className="bg-muted/60">
                  <th className="text-left p-2">Product</th>
                  <th className="text-center p-2">Qty</th>
                  <th className="text-right p-2">Price</th>
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr
                    key={`item-${i}-${item.productName}`}
                    className="border-t border-border"
                    data-ocid={`bill.item.${i + 1}`}
                  >
                    <td className="p-2 font-medium">{item.productName}</td>
                    <td className="p-2 text-center">{item.qty.toString()}</td>
                    <td className="p-2 text-right">₹{item.price.toFixed(2)}</td>
                    <td className="p-2 text-right">
                      ₹{(item.price * Number(item.qty)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>- ₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-border pt-1.5">
              <span>Grand Total</span>
              <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
            </div>
            {advance > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Advance</span>
                <span>₹{advance.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Balance</span>
              <span className="font-medium">₹{balance.toFixed(2)}</span>
            </div>
            {ext.transactionType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span>{ext.transactionType}</span>
              </div>
            )}
          </div>

          {/* Lens Power */}
          {hasLens && (
            <div>
              <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Lens Power
              </h3>
              <table className="w-full text-xs border border-border rounded overflow-hidden">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="text-left p-2">Eye</th>
                    <th className="p-2">SPH</th>
                    <th className="p-2">CYL</th>
                    <th className="p-2">AXIS</th>
                    <th className="p-2">ADD</th>
                    <th className="p-2">Near</th>
                  </tr>
                </thead>
                <tbody>
                  {(ext.rightSph || ext.rightCyl) && (
                    <tr className="border-t border-border">
                      <td className="p-2 font-medium">Right 👁️</td>
                      <td className="p-2 text-center">{ext.rightSph || "—"}</td>
                      <td className="p-2 text-center">{ext.rightCyl || "—"}</td>
                      <td className="p-2 text-center">
                        {ext.rightAxis || "—"}
                      </td>
                      <td className="p-2 text-center">{ext.rightAdd || "—"}</td>
                      <td className="p-2 text-center">
                        {ext.rightNearVision || "—"}
                      </td>
                    </tr>
                  )}
                  {(ext.leftSph || ext.leftCyl) && (
                    <tr className="border-t border-border">
                      <td className="p-2 font-medium">Left 👁️</td>
                      <td className="p-2 text-center">{ext.leftSph || "—"}</td>
                      <td className="p-2 text-center">{ext.leftCyl || "—"}</td>
                      <td className="p-2 text-center">{ext.leftAxis || "—"}</td>
                      <td className="p-2 text-center">{ext.leftAdd || "—"}</td>
                      <td className="p-2 text-center">
                        {ext.leftNearVision || "—"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-2 border-t border-dashed">
            <p className="text-sm font-semibold">
              Thank you for shopping at {shopId}!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              — sraiwebsitedevelop
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print flex gap-2 flex-wrap pt-2">
          <Button
            data-ocid="bill.upload_button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex-1"
          >
            <Download size={14} className="mr-1" /> Download PDF
          </Button>
          <Button
            data-ocid="bill.whatsapp_button"
            size="sm"
            onClick={handleWhatsApp}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white border-0"
          >
            <MessageCircle size={14} className="mr-1" /> WhatsApp
          </Button>
          <Button
            data-ocid="bill.close_button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X size={14} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
