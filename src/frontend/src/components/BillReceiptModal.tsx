import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Eye, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { LocalBill } from "./NewBillModal";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

interface Props {
  bill: LocalBill | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function BillReceiptModal({ bill, open, onOpenChange }: Props) {
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString() ?? "guest";
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  if (!bill) return null;

  const shopName =
    localStorage.getItem(`shopId_${principalId}`) ||
    localStorage.getItem("userShopId") ||
    "My Shop";
  const shopPhone =
    localStorage.getItem(`shopPhone_${principalId}`) ||
    localStorage.getItem("userShopPhone") ||
    "";
  const shopAddress =
    localStorage.getItem(`shopAddress_${principalId}`) ||
    localStorage.getItem("userShopAddress") ||
    "";
  const shopGst =
    localStorage.getItem(`shopGst_${principalId}`) ||
    localStorage.getItem("userShopGst") ||
    "";
  const shopLogo = localStorage.getItem(`shopLogo_${principalId}`) || null;

  const handlePrint = () => window.print();

  const buildWhatsApp = () => {
    const separator = "══════════════════════";
    const lineSep = "──────────────────────";

    const productLines = bill.products.map(
      (p) =>
        `• ${p.name}\n  Price: ₹${p.price.toFixed(2)} | Disc: ₹${p.discount.toFixed(2)} | Total: ₹${p.total.toFixed(2)}`,
    );

    const lensLines: string[] = [];
    const hasLens =
      (bill.lensRight && Object.values(bill.lensRight).some((v) => v)) ||
      (bill.lensLeft && Object.values(bill.lensLeft).some((v) => v));

    if (hasLens) {
      lensLines.push("", "🔍 LENS POWER");
      if (bill.lensRight && Object.values(bill.lensRight).some((v) => v)) {
        lensLines.push(
          `Right Eye: SPH: ${bill.lensRight.sph || "—"} | CYL: ${bill.lensRight.cyl || "—"} | AXIS: ${bill.lensRight.axis || "—"} | ADD: ${bill.lensRight.add || "—"} | Near: ${bill.lensRight.nearVision || "—"}`,
        );
      }
      if (bill.lensLeft && Object.values(bill.lensLeft).some((v) => v)) {
        lensLines.push(
          `Left Eye:  SPH: ${bill.lensLeft.sph || "—"} | CYL: ${bill.lensLeft.cyl || "—"} | AXIS: ${bill.lensLeft.axis || "—"} | ADD: ${bill.lensLeft.add || "—"} | Near: ${bill.lensLeft.nearVision || "—"}`,
        );
      }
    }

    const lines = [
      `🏪 *${shopName}*`,
      shopPhone ? `📞 ${shopPhone}` : "",
      shopAddress ? `📍 ${shopAddress}` : "",
      shopGst ? `GST: ${shopGst}` : "",
      separator,
      "",
      `📋 *BILL: ${bill.billNo}*`,
      `📅 Date: ${formatDate(bill.date)}`,
      "",
      "👤 *CUSTOMER DETAILS*",
      `Name: ${bill.customerName}`,
      `Mobile: ${bill.customerMobile}`,
      bill.customerAddress ? `Address: ${bill.customerAddress}` : "",
      "",
      "📦 *PRODUCTS*",
      lineSep,
      ...productLines,
      lineSep,
      "",
      "💰 *PAYMENT SUMMARY*",
      `SubTotal:        ₹${bill.subTotal.toFixed(2)}`,
      bill.additionalDiscount > 0
        ? `Additional Disc: -₹${bill.additionalDiscount.toFixed(2)}`
        : "",
      `Grand Total:     ₹${bill.grandTotal.toFixed(2)}`,
      `Advance:         ₹${bill.advance.toFixed(2)}`,
      `Dues:            ₹${bill.dues.toFixed(2)}`,
      `Payment:         ${bill.transactionType}`,
      ...lensLines,
      "",
      separator,
      `Thank you for shopping at *${shopName}*! 🙏`,
      "— sraiwebsitedevelop",
    ]
      .filter((l) => l !== "")
      .join("\n");

    const num = bill.customerMobile.replace(/\D/g, "");
    window.open(
      `https://wa.me/${num}?text=${encodeURIComponent(lines)}`,
      "_blank",
    );
  };

  const photosWithProduct = bill.products.filter((p) => p.photo);

  return (
    <>
      {/* Photo Lightbox */}
      {lightboxPhoto && (
        <div
          data-ocid="receipt.photo_lightbox"
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
          onKeyDown={(e) => e.key === "Escape" && setLightboxPhoto(null)}
          aria-label="Close photo preview"
        >
          <div
            className="relative max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <img
              src={lightboxPhoto}
              alt="Product preview"
              className="w-full rounded-xl object-contain max-h-[70vh]"
            />
            <div className="flex gap-2 mt-3">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setLightboxPhoto(null)}
                data-ocid="receipt.lightbox_close_button"
              >
                <X size={14} className="mr-1" /> Close
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = lightboxPhoto;
                  a.download = "product-photo.jpg";
                  a.click();
                }}
                data-ocid="receipt.lightbox_download_button"
              >
                <Download size={14} className="mr-1" /> Download
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          data-ocid="receipt.dialog"
          className="max-w-lg max-h-[92vh] overflow-y-auto p-0"
        >
          <DialogHeader className="no-print px-5 pt-5 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span className="font-display">Bill Receipt</span>
              <Button
                data-ocid="receipt.close_button"
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-7 w-7"
              >
                <X size={14} />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Printable Area */}
          <div id="print-receipt" className="px-5 py-4 space-y-4 text-sm">
            {/* Shop Header */}
            <div className="text-center space-y-1.5 pb-4 border-b border-dashed">
              {shopLogo && (
                <img
                  src={shopLogo}
                  alt="Shop Logo"
                  className="w-16 h-16 rounded-xl object-cover mx-auto border shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <h2 className="font-display font-bold text-xl text-foreground">
                {shopName}
              </h2>
              {shopPhone && (
                <p className="text-xs text-muted-foreground">📞 {shopPhone}</p>
              )}
              {shopAddress && (
                <p className="text-xs text-muted-foreground">
                  📍 {shopAddress}
                </p>
              )}
              {shopGst && (
                <p className="text-xs text-muted-foreground">GST: {shopGst}</p>
              )}
              <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-dashed">
                <span className="font-bold text-primary text-sm">
                  {bill.billNo}
                </span>
                <span className="text-muted-foreground">
                  {formatDate(bill.date)}
                </span>
              </div>
            </div>

            {/* Customer */}
            <div className="bg-secondary/40 rounded-lg p-3 space-y-1.5">
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                Customer Details
              </p>
              <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-semibold">{bill.customerName}</span>
                {bill.customerMobile && (
                  <>
                    <span className="text-muted-foreground">Mobile:</span>
                    <span>{bill.customerMobile}</span>
                  </>
                )}
                {bill.customerAddress && (
                  <>
                    <span className="text-muted-foreground">Address:</span>
                    <span>{bill.customerAddress}</span>
                  </>
                )}
              </div>
            </div>

            {/* Products */}
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                Products
              </p>
              <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-primary/8 text-foreground">
                    <th className="text-left p-2 font-semibold">Product</th>
                    <th className="text-right p-2 font-semibold">Price</th>
                    <th className="text-right p-2 font-semibold">Disc.</th>
                    <th className="text-right p-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.products.map((p, i) => (
                    <tr
                      key={`p-${p.name}-${i}`}
                      data-ocid={`receipt.product.item.${i + 1}`}
                      className="border-t border-border"
                    >
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {p.photo && (
                            <button
                              type="button"
                              data-ocid={`receipt.photo_eye_button.${i + 1}`}
                              onClick={() => setLightboxPhoto(p.photo)}
                              className="relative shrink-0 group"
                              title="View photo"
                            >
                              <img
                                src={p.photo}
                                alt={p.name}
                                className="w-8 h-8 rounded object-cover border group-hover:opacity-70 transition-opacity"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye
                                  size={14}
                                  className="text-white drop-shadow"
                                />
                              </div>
                            </button>
                          )}
                          <span className="font-medium">{p.name || "—"}</span>
                        </div>
                      </td>
                      <td className="p-2 text-right">₹{p.price.toFixed(2)}</td>
                      <td className="p-2 text-right text-emerald-600">
                        ₹{p.discount.toFixed(2)}
                      </td>
                      <td className="p-2 text-right font-semibold">
                        ₹{p.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SubTotal</span>
                <span>₹{bill.subTotal.toFixed(2)}</span>
              </div>
              {bill.additionalDiscount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Additional Discount</span>
                  <span>− ₹{bill.additionalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                <span>Grand Total</span>
                <span className="text-primary">
                  ₹{bill.grandTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Advance</span>
                <span>₹{bill.advance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dues</span>
                <span
                  className={`font-bold ${
                    bill.dues > 0 ? "text-destructive" : "text-emerald-600"
                  }`}
                >
                  ₹{bill.dues.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="text-muted-foreground">Payment</span>
                <span className="font-medium">{bill.transactionType}</span>
              </div>
            </div>

            {/* Lens Power */}
            {(bill.lensRight || bill.lensLeft) && (
              <div className="bg-secondary/40 rounded-lg p-3 space-y-2">
                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                  🔍 Lens Power
                </p>
                {bill.lensRight &&
                  Object.values(bill.lensRight).some((v) => v) && (
                    <div>
                      <p className="text-xs font-semibold mb-1">Right Eye 👁️</p>
                      <div className="grid grid-cols-5 gap-1 text-xs text-center">
                        {(["SPH", "CYL", "AXIS", "ADD", "Near"] as const).map(
                          (label, i) => {
                            const keys: Array<keyof typeof bill.lensRight> = [
                              "sph",
                              "cyl",
                              "axis",
                              "add",
                              "nearVision",
                            ];
                            const val = bill.lensRight![keys[i]];
                            return val ? (
                              <div
                                key={label}
                                className="bg-white rounded p-1 border"
                              >
                                <p className="text-muted-foreground text-[9px]">
                                  {label}
                                </p>
                                <p className="font-semibold">{val}</p>
                              </div>
                            ) : null;
                          },
                        )}
                      </div>
                    </div>
                  )}
                {bill.lensLeft &&
                  Object.values(bill.lensLeft).some((v) => v) && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold mb-1">Left Eye 👁️</p>
                      <div className="grid grid-cols-5 gap-1 text-xs text-center">
                        {(["SPH", "CYL", "AXIS", "ADD", "Near"] as const).map(
                          (label, i) => {
                            const keys: Array<keyof typeof bill.lensLeft> = [
                              "sph",
                              "cyl",
                              "axis",
                              "add",
                              "nearVision",
                            ];
                            const val = bill.lensLeft![keys[i]];
                            return val ? (
                              <div
                                key={label}
                                className="bg-white rounded p-1 border"
                              >
                                <p className="text-muted-foreground text-[9px]">
                                  {label}
                                </p>
                                <p className="font-semibold">{val}</p>
                              </div>
                            ) : null;
                          },
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Thank you footer */}
            <div className="text-center pt-3 border-t border-dashed">
              <p className="text-sm font-semibold text-foreground">
                Thank you for shopping at {shopName}!
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                — sraiwebsitedevelop
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="no-print px-5 pb-5 pt-2 flex gap-2 flex-wrap">
            {photosWithProduct.length > 0 && (
              <Button
                data-ocid="receipt.view_photos_button"
                variant="outline"
                size="sm"
                onClick={() => setLightboxPhoto(photosWithProduct[0].photo)}
                className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Eye size={14} className="mr-1" /> View Photos
              </Button>
            )}
            <Button
              data-ocid="receipt.download_pdf_button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex-1"
            >
              <Download size={14} className="mr-1" /> Download PDF
            </Button>
            <Button
              data-ocid="receipt.whatsapp_button"
              size="sm"
              onClick={buildWhatsApp}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white border-0"
            >
              <MessageCircle size={14} className="mr-1" /> WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
