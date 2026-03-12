import { Button } from "@/components/ui/button";
import { LogOut, Menu, Pencil, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export type Tab =
  | "dashboard"
  | "orders"
  | "pending"
  | "delivered"
  | "products"
  | "prescription"
  | "admin";

interface NavbarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  userName: string;
  onLogout: () => void;
  isAdmin?: boolean;
}

const mainTabs: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "orders", label: "Orders" },
  { id: "pending", label: "Pending" },
  { id: "delivered", label: "Delivered" },
  { id: "products", label: "Products" },
  { id: "prescription", label: "Prescription" },
];

const FALLBACK_LOGO = "/assets/generated/sr-logo.dim_300x300.png";

export function Navbar({
  activeTab,
  onTabChange,
  userName,
  onLogout,
  isAdmin = false,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopLogo, setShopLogo] = useState<string>(FALLBACK_LOGO);
  const [showLogoHint, setShowLogoHint] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { identity } = useInternetIdentity();

  // Load logo from localStorage on mount / identity change
  useEffect(() => {
    const principal = identity?.getPrincipal().toString();
    if (principal) {
      const stored = localStorage.getItem(`shopLogo_${principal}`);
      setShopLogo(stored ?? FALLBACK_LOGO);
    }
  }, [identity]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const principal = identity?.getPrincipal().toString();
      if (principal) {
        localStorage.setItem(`shopLogo_${principal}`, base64);
      }
      setShopLogo(base64);
    };
    reader.readAsDataURL(file);
  };

  const tabs = isAdmin
    ? [...mainTabs, { id: "admin" as Tab, label: "Admin Panel" }]
    : mainTabs;

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-xs">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo area with change button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative group cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onMouseEnter={() => setShowLogoHint(true)}
              onMouseLeave={() => setShowLogoHint(false)}
              onClick={() => logoInputRef.current?.click()}
              onKeyDown={(e) =>
                e.key === "Enter" && logoInputRef.current?.click()
              }
              title="Click to change shop logo"
              aria-label="Change shop logo"
            >
              <img
                src={shopLogo}
                onError={() => setShopLogo(FALLBACK_LOGO)}
                className="w-9 h-9 rounded-lg object-cover"
                alt="Shop Logo"
              />
              {/* Hover overlay */}
              <div
                className={`absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center transition-opacity pointer-events-none ${
                  showLogoHint ? "opacity-100" : "opacity-0"
                }`}
              >
                <Pencil size={12} className="text-white" />
              </div>
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              data-ocid="nav.upload_button"
              onChange={handleLogoChange}
            />
            <span className="font-display font-bold text-lg text-foreground hidden sm:block">
              Sraiwebsitedevelop
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                data-ocid={`nav.${tab.id}.tab`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab.id === "admin"
                    ? activeTab === "admin"
                      ? "bg-amber-500 text-white"
                      : "text-amber-600 hover:bg-amber-50 border border-amber-200"
                    : activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {tab.id === "admin" && <ShieldCheck size={14} />}
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-sm text-muted-foreground max-w-[120px] truncate">
              {userName}
            </span>
            <Button
              data-ocid="nav.logout.button"
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut size={16} />
              <span className="hidden sm:block ml-1">Logout</span>
            </Button>
            <button
              type="button"
              className="md:hidden p-2 rounded-md hover:bg-accent"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden pb-3 flex flex-col gap-1">
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                data-ocid={`nav.${tab.id}.tab`}
                onClick={() => {
                  onTabChange(tab.id);
                  setMobileOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-left transition-colors ${
                  tab.id === "admin"
                    ? activeTab === "admin"
                      ? "bg-amber-500 text-white"
                      : "text-amber-600 hover:bg-amber-50 border border-amber-200"
                    : activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {tab.id === "admin" && <ShieldCheck size={14} />}
                {tab.label}
              </button>
            ))}
            {/* Mobile: Change Logo button */}
            <button
              type="button"
              data-ocid="nav.upload_button"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent text-left"
              onClick={() => {
                logoInputRef.current?.click();
                setMobileOpen(false);
              }}
            >
              <Pencil size={14} />
              Change Shop Logo
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
