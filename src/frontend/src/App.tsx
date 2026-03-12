import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { Navbar } from "./components/Navbar";
import type { Tab } from "./components/Navbar";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useIsAdmin, useUserProfile } from "./hooks/useQueries";
import { AdminPanel } from "./pages/AdminPanel";
import { Dashboard } from "./pages/Dashboard";
import { Delivered } from "./pages/Delivered";
import { Orders } from "./pages/Orders";
import { Pending } from "./pages/Pending";
import { Prescription } from "./pages/Prescription";
import { Products } from "./pages/Products";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function AppInner() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [userName, setUserName] = useState<string | null>(null);
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: isAdmin } = useIsAdmin();

  useEffect(() => {
    if (profile) {
      setUserName(profile.name);
    }
  }, [profile]);

  const handleLogout = () => {
    clear();
    setUserName(null);
    queryClient.clear();
  };

  if (isInitializing || (identity && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-lg pharmacy-gradient animate-pulse" />
          <p className="text-muted-foreground text-sm">Loading your shop...</p>
        </div>
      </div>
    );
  }

  if (!identity || !userName) {
    return <LoginScreen onLoginComplete={(name) => setUserName(name)} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName={userName}
        onLogout={handleLogout}
        isAdmin={!!isAdmin}
      />
      <main className="flex-1 container mx-auto px-4 py-6">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "orders" && <Orders />}
        {activeTab === "pending" && <Pending />}
        {activeTab === "delivered" && <Delivered />}
        {activeTab === "products" && <Products />}
        {activeTab === "prescription" && <Prescription />}
        {activeTab === "admin" && <AdminPanel />}
      </main>
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-primary"
        >
          caffeine.ai
        </a>
      </footer>
      <Toaster richColors position="top-right" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
