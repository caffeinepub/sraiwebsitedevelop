import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveUserProfile, useUserProfile } from "../hooks/useQueries";

interface LoginScreenProps {
  onLoginComplete: (name: string) => void;
}

const greetings = [
  "Good Morning! Keep up the great work!",
  "Good Afternoon! Keep up the great work!",
  "Good Evening! Welcome back!",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return greetings[0];
  if (h < 17) return greetings[1];
  return greetings[2];
}

export function LoginScreen({ onLoginComplete }: LoginScreenProps) {
  const { login, isLoggingIn, isLoginSuccess, identity } =
    useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const [shopName, setShopName] = useState("");
  const [shopId, setShopId] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopGst, setShopGst] = useState("");
  const [nameError, setNameError] = useState("");
  const [step, setStep] = useState<"auth" | "setup" | "waiting">("auth");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const saveProfile = useSaveUserProfile();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  // When identity is set (from stored session OR fresh login), check profile
  useEffect(() => {
    if (!identity) return;

    // Still loading actor or profile -- show waiting
    if (actorFetching || profileLoading) {
      setStep("waiting");
      return;
    }

    // Profile loaded
    if (profile) {
      onLoginComplete(profile.name);
    } else {
      // No profile yet -- show setup form
      setStep("setup");
    }
  }, [identity, actorFetching, profileLoading, profile, onLoginComplete]);

  const handleLogin = () => {
    login();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSetup = async () => {
    if (!shopName.trim()) {
      setNameError("Please enter your name");
      return;
    }
    setNameError("");
    await saveProfile.mutateAsync(shopName.trim());
    const principal = identity?.getPrincipal().toString();
    if (principal) {
      localStorage.setItem(`shopId_${principal}`, shopId.trim() || "SHOP-001");
      if (logoPreview)
        localStorage.setItem(`shopLogo_${principal}`, logoPreview);
      if (shopAddress.trim())
        localStorage.setItem(`shopAddress_${principal}`, shopAddress.trim());
      if (shopPhone.trim())
        localStorage.setItem(`shopPhone_${principal}`, shopPhone.trim());
      if (shopGst.trim())
        localStorage.setItem(`shopGst_${principal}`, shopGst.trim());
    }
    localStorage.setItem("userShopId", shopId.trim() || shopName.trim());
    if (shopAddress.trim())
      localStorage.setItem("userShopAddress", shopAddress.trim());
    if (shopPhone.trim())
      localStorage.setItem("userShopPhone", shopPhone.trim());
    if (shopGst.trim()) localStorage.setItem("userShopGst", shopGst.trim());
    onLoginComplete(shopName.trim());
  };

  // Show waiting spinner when actor/profile loading after login
  if (step === "waiting" || (!!identity && (actorFetching || profileLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-400 animate-pulse" />
          <p className="text-muted-foreground text-sm">
            Aapki shop load ho rahi hai...
          </p>
        </div>
      </div>
    );
  }

  if (step === "setup") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 overflow-y-auto"
        style={{ background: "#f5f5f5" }}
      >
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6 space-y-4 my-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">Setup Your Shop</h2>
            <p className="text-sm text-gray-500">
              Enter your details to get started
            </p>
          </div>

          {/* Logo Upload */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="w-16 h-16 rounded-xl border-2 border-dashed border-orange-300 overflow-hidden flex items-center justify-center bg-orange-50 shrink-0 cursor-pointer"
              onClick={() => logoInputRef.current?.click()}
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera size={22} className="text-orange-400" />
              )}
            </button>
            <div>
              <p className="text-sm font-medium text-gray-700">Shop Logo</p>
              <button
                type="button"
                data-ocid="setup.upload_button"
                onClick={() => logoInputRef.current?.click()}
                className="text-xs text-orange-500 underline mt-0.5"
              >
                {logoPreview ? "Change Logo" : "Upload Logo (optional)"}
              </button>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>

          {/* Shop Name */}
          <div className="space-y-1">
            <Label htmlFor="shopName" className="text-sm text-gray-700">
              Your Name / Shop Name *
            </Label>
            <Input
              id="shopName"
              data-ocid="setup.input"
              placeholder="e.g. Rahul Medical Store"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="rounded-xl border-gray-200"
            />
            {nameError && (
              <p data-ocid="setup.error_state" className="text-xs text-red-500">
                {nameError}
              </p>
            )}
          </div>

          {/* Shop ID */}
          <div className="space-y-1">
            <Label htmlFor="shopId" className="text-sm text-gray-700">
              Shop ID
            </Label>
            <Input
              id="shopId"
              data-ocid="setup.shop_id.input"
              placeholder="e.g. SHOP-001"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              className="rounded-xl border-gray-200"
            />
            <p className="text-xs text-gray-400">Bill par dikhega</p>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label htmlFor="shopPhone" className="text-sm text-gray-700">
              Shop Phone Number
            </Label>
            <Input
              id="shopPhone"
              data-ocid="setup.phone.input"
              placeholder="e.g. 9876543210"
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
              className="rounded-xl border-gray-200"
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <Label htmlFor="shopAddress" className="text-sm text-gray-700">
              Shop Address
            </Label>
            <Input
              id="shopAddress"
              data-ocid="setup.address.input"
              placeholder="e.g. 123, Main Street, Delhi"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              className="rounded-xl border-gray-200"
            />
          </div>

          {/* GST */}
          <div className="space-y-1">
            <Label htmlFor="shopGst" className="text-sm text-gray-700">
              GST Number (optional)
            </Label>
            <Input
              id="shopGst"
              data-ocid="setup.gst.input"
              placeholder="e.g. 07AAAAA0000A1Z5"
              value={shopGst}
              onChange={(e) => setShopGst(e.target.value)}
              className="rounded-xl border-gray-200"
            />
          </div>

          <button
            type="button"
            data-ocid="setup.submit_button"
            onClick={handleSetup}
            disabled={saveProfile.isPending}
            className="w-full py-3 rounded-full text-white font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
          >
            {saveProfile.isPending ? "Saving..." : "Get Started"}
          </button>
        </div>
      </div>
    );
  }

  // Default: auth screen (login)
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(160deg, #f0f0f0 0%, #e8e8e8 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div
            className="relative flex flex-col items-center pt-8 pb-4 px-6"
            style={{ background: "white" }}
          >
            <div className="absolute top-4 right-5 flex flex-col items-end">
              <div className="flex items-baseline gap-0.5">
                <span
                  className="font-black text-2xl"
                  style={{ color: "#1a1a1a" }}
                >
                  SR
                </span>
                <sup className="text-xs font-bold" style={{ color: "#f97316" }}>
                  AI
                </sup>
              </div>
              <span
                className="text-xs font-semibold"
                style={{ color: "#f97316" }}
              >
                sraiwebsitedevelop
              </span>
            </div>
            <div className="self-start mb-2 max-w-[55%]">
              <div className="relative bg-white border border-gray-200 rounded-2xl rounded-bl-none px-3 py-2 shadow-sm">
                <p className="text-xs text-gray-700 leading-snug">
                  {getGreeting()}
                </p>
                <div
                  className="absolute -bottom-2 left-4 w-0 h-0"
                  style={{
                    borderLeft: "8px solid transparent",
                    borderRight: "0px solid transparent",
                    borderTop: "8px solid white",
                  }}
                />
              </div>
            </div>
            <img
              src="/assets/generated/sr-mascot.dim_400x500.png"
              alt="SR"
              className="w-48 h-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div className="text-center py-3 px-6">
            <h1
              className="text-4xl font-black tracking-tight"
              style={{ color: "#1a1a1a", letterSpacing: "-1px" }}
            >
              <span style={{ color: "#f97316" }}>S</span>R
              <span className="text-xl font-bold ml-1 text-gray-500">App</span>
            </h1>
          </div>
          <div className="px-6 pb-6 space-y-3">
            <button
              type="button"
              data-ocid="login.primary_button"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-full text-white font-semibold text-base flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #f97316, #ea580c)",
              }}
            >
              {isLoggingIn && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoggingIn ? "Logging in..." : "Login / Register"}
            </button>
            {isLoginSuccess && (
              <p className="text-center text-xs text-emerald-600">
                Login successful! Loading your shop...
              </p>
            )}
            <p className="text-center text-xs text-gray-400">
              Secure login — sirf aap apna data dekh sakte ho
            </p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-5 space-y-1"
        >
          <p
            className="text-base font-bold tracking-wide"
            style={{ color: "#1a1a1a" }}
          >
            <span style={{ color: "#f97316" }}>SR AI</span> — Help to Easy Deal
            to Customer
          </p>
          <p className="text-xs text-gray-500">
            India&apos;s First{" "}
            <span style={{ color: "#f97316" }} className="font-semibold">
              AI-Integrated
            </span>{" "}
            Shop Manager
          </p>
        </motion.div>
        <p className="text-center text-xs text-gray-400 mt-3">
          &copy; {new Date().getFullYear()}. Built with &hearts; using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-orange-500"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
