import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
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

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [userName, setUserName] = useState<string | null>(null);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: isAdmin } = useIsAdmin();

  // Start a 6-second timeout on mount -- if still loading, show login screen
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setLoadingTimedOut(true);
    }, 6000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // When loading completes, clear the timeout
  useEffect(() => {
    if (!isInitializing) {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [isInitializing]);

  useEffect(() => {
    if (profile) {
      setUserName(profile.name);
      // Clear the timeout since we are now loaded
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [profile]);

  const handleLogout = () => {
    clear();
    setUserName(null);
  };

  // Show spinner ONLY during the first few seconds of initializing
  const showLoading =
    !loadingTimedOut && (isInitializing || (!!identity && profileLoading));

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary animate-pulse" />
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
        &copy; {new Date().getFullYear()}. Built with ❤️ using{" "}
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
