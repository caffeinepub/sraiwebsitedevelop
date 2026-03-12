import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, ClipboardList, Plus, ReceiptText } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { Order } from "../backend";
import { BillDetailModal } from "../components/BillDetailModal";
import { BillReceiptModal } from "../components/BillReceiptModal";
import { NewBillModal } from "../components/NewBillModal";
import type { LocalBill } from "../components/NewBillModal";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useDashboardStats, useOrders } from "../hooks/useQueries";

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

export function Dashboard() {
  const { data: stats, isLoading, isError } = useDashboardStats();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { identity } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString() ?? "guest";

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [billOpen, setBillOpen] = useState(false);
  const [newBillOpen, setNewBillOpen] = useState(false);
  const [localBills, setLocalBills] = useState<LocalBill[]>([]);
  const [selectedLocalBill, setSelectedLocalBill] = useState<LocalBill | null>(
    null,
  );
  const [receiptOpen, setReceiptOpen] = useState(false);

  const loadLocalBills = useCallback(() => {
    const key = `bills_${principalId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        setLocalBills(JSON.parse(raw));
      } catch {
        setLocalBills([]);
      }
    } else {
      setLocalBills([]);
    }
  }, [principalId]);

  useEffect(() => {
    loadLocalBills();
  }, [loadLocalBills]);

  const recentOrders = orders ? [...orders].slice(-5).reverse() : [];

  const cards = [
    {
      id: "dashboard.total_bills.card",
      title: "Total Bills",
      subtitle: "Sum of all bill amounts",
      value: stats ? `₹${stats.totalBills.toFixed(2)}` : "₹0.00",
      icon: ReceiptText,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      id: "dashboard.active_bills.card",
      title: "Active Bills",
      subtitle: "Pending orders",
      value: stats ? stats.activeBills.toString() : "0",
      icon: ClipboardList,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      id: "dashboard.delivered_bills.card",
      title: "Delivered Bills",
      subtitle: "Completed orders",
      value: stats ? stats.deliveredBills.toString() : "0",
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Dashboard
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your shop&apos;s performance
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            data-ocid="dashboard.primary_button"
            onClick={() => setNewBillOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md gap-2"
          >
            <Plus size={16} />
            Add New Bill
          </Button>
        </motion.div>
      </div>

      {isError && (
        <div
          data-ocid="dashboard.error_state"
          className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm"
        >
          Failed to load dashboard stats. Please try again.
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              data-ocid={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="stat-card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {card.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {card.subtitle}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}
                >
                  <Icon size={20} className={card.color} />
                </div>
              </div>
              {isLoading ? (
                <Skeleton
                  data-ocid="dashboard.loading_state"
                  className="h-8 w-28 mt-4"
                />
              ) : (
                <p
                  className={`text-3xl font-display font-bold mt-4 ${card.color}`}
                >
                  {card.value}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Local Bills (New Bill system) */}
      {localBills.length > 0 && (
        <div>
          <h3 className="text-lg font-display font-semibold text-foreground mb-3">
            My Bills
          </h3>
          <div className="space-y-2">
            {[...localBills]
              .reverse()
              .slice(0, 10)
              .map((bill, i) => (
                <motion.button
                  type="button"
                  key={bill.id}
                  data-ocid={`dashboard.bill.item.${i + 1}`}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  onClick={() => {
                    setSelectedLocalBill(bill);
                    setReceiptOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-primary/40 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <ReceiptText size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {bill.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bill.billNo} • {formatDate(bill.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`text-xs ${
                        bill.dues <= 0
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-amber-100 text-amber-700 border-amber-200"
                      }`}
                    >
                      {bill.dues <= 0 ? "Paid" : `Due ₹${bill.dues.toFixed(0)}`}
                    </Badge>
                    <span className="font-bold text-primary">
                      ₹{bill.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </motion.button>
              ))}
          </div>
        </div>
      )}

      {/* Recent Orders from backend */}
      <div>
        <h3 className="text-lg font-display font-semibold text-foreground mb-3">
          Recent Orders
        </h3>
        {ordersLoading ? (
          <div className="space-y-2" data-ocid="dashboard.orders.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div
            data-ocid="dashboard.orders.empty_state"
            className="text-center py-12 rounded-xl border border-dashed text-muted-foreground text-sm"
          >
            <ReceiptText size={32} className="mx-auto mb-2 opacity-30" />
            No orders yet. Use &ldquo;Add New Bill&rdquo; above to create your
            first bill!
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order, i) => (
              <motion.button
                type="button"
                key={order.id.toString()}
                data-ocid={`dashboard.order.item.${i + 1}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                onClick={() => {
                  setSelectedOrder(order);
                  setBillOpen(true);
                }}
                className="w-full flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-primary/40 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ReceiptText size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""} •{" "}
                      {formatDate(order.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      order.status === "delivered" ? "default" : "secondary"
                    }
                    className={
                      order.status === "delivered"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : "bg-amber-100 text-amber-700 border-amber-200"
                    }
                  >
                    {order.status}
                  </Badge>
                  <span className="font-bold text-primary">
                    ₹{order.grandTotal.toFixed(2)}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <BillDetailModal
        order={selectedOrder}
        open={billOpen}
        onOpenChange={setBillOpen}
      />

      <NewBillModal
        open={newBillOpen}
        onOpenChange={setNewBillOpen}
        onBillCreated={loadLocalBills}
      />

      <BillReceiptModal
        bill={selectedLocalBill}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
      />
    </div>
  );
}
