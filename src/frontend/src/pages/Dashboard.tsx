import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, ClipboardList, ReceiptText } from "lucide-react";
import { motion } from "motion/react";
import { useDashboardStats } from "../hooks/useQueries";

export function Dashboard() {
  const { data: stats, isLoading, isError } = useDashboardStats();

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">
          Dashboard
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your shop&apos;s performance
        </p>
      </div>

      {isError && (
        <div
          data-ocid="dashboard.error_state"
          className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm"
        >
          Failed to load dashboard stats. Please try again.
        </div>
      )}

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
    </div>
  );
}
