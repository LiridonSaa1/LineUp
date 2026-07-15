import { useState, useRef, useEffect } from "react";
import logoImg from "@assets/LINE_(2)_1782771053641.png";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, Scissors, Mail, Lock,
  Building2, MapPin, Phone, Check, ChevronDown, Users,
  ShieldCheck,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";

/* ── Constants ───────────────────────────────────────────── */
import { KOSOVO_CITIES } from "@/lib/kosovo-cities";

const PRIMARY = "#4f8ef7";

interface PkgOption {
  id: string;
  label: string;
  workers: number;
  price: number;
  color: string;
  popular?: boolean;
}

const PACKAGES: PkgOption[] = [
  { id: "2", label: "Starter",  workers: 2, price: 5,  color: "#4f8ef7" },
  { id: "4", label: "Standard", workers: 4, price: 10, color: "#7c3aed", popular: true },
  { id: "6", label: "Pro",      workers: 6, price: 15, color: "#059669" },
  { id: "8", label: "Business", workers: 8, price: 20, color: "#d97706" },
];

/* ── Step 1 schema ───────────────────────────────────────── */
/**
 * Validates Kosovo phone numbers in any of these formats:
 *   +383 44 123 456  /  +38344123456
 *   00383 44 123 456
 *   044 123 456  /  044123456
 * Allowed mobile prefixes: 44, 45, 46, 48, 49
 */
function isValidKosovoPhone(raw: string): boolean {
  const p = raw.trim().replace(/[\s\-().]/g, "");
  return /^(\+383|00383|0)(4[4-9])\d{6}$/.test(p);
}

const step1Schema = z.object({
  businessName: z.string().min(2, "Emri i biznesit i detyrueshëm"),
  email:        z.string().email("Email i pavlefshëm"),
  phone:        z.string()
    .min(1, "Telefoni i detyrueshëm")
    .refine(isValidKosovoPhone, "Numri duhet të jetë kosovar (p.sh. +383 44 123 456 ose 044 123 456)"),
  password:     z.string().min(6, "Minimum 6 karaktere"),
  city:         z.string().min(1, "Qyteti i detyrueshëm"),
  address:      z.string().min(3, "Adresa e detyrueshme"),
});
type S1Values = z.infer<typeof step1Schema>;

/* ── IconInput ───────────────────────────────────────────── */
function IconInput({
  id, icon: Icon, label, type = "text", placeholder,
  value, onChange, error,
}: {
  id: string; icon: React.ElementType; label: string; type?: string;
  placeholder?: string; value: string; onChange: (v: string) => void;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow]       = useState(false);
  const filled  = value.length > 0;
  const active  = focused || filled;
  const isPass  = type === "password";

  return (
    <div className="space-y-1.5">
      <div className="relative rounded-[14px] transition-all duration-200"
        style={{
          background: focused ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${focused ? "rgba(79,142,247,0.45)" : error ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(79,142,247,0.10), 0 4px 16px rgba(0,0,0,0.2)" : "none",
        }}>
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Icon className="w-4 h-4 transition-colors duration-200"
            style={{ color: focused ? PRIMARY : "rgba(255,255,255,0.25)" }} />
        </div>
        <label htmlFor={id} className="absolute left-11 pointer-events-none select-none transition-all duration-200"
          style={{
            top: active ? "9px" : "50%",
            transform: active ? "none" : "translateY(-50%)",
            fontSize: active ? "10px" : "13px",
            fontWeight: active ? 600 : 400,
            letterSpacing: active ? "0.05em" : "0",
            textTransform: active ? "uppercase" : "none",
            color: active ? PRIMARY : "rgba(255,255,255,0.35)",
          }}>
          {label}
        </label>
        <input
          id={id}
          type={isPass ? (show ? "text" : "password") : type}
          placeholder={focused && placeholder ? placeholder : ""}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={isPass ? "new-password" : type === "email" ? "email" : "off"}
          className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/20 pl-11 pr-12"
          style={{ paddingTop: "26px", paddingBottom: "10px" }}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(p => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1"
            style={{ color: "rgba(255,255,255,0.28)" }}>
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs pl-1" style={{ color: "#f87171" }}>{error}</p>}
    </div>
  );
}

/* ── CityDropdown ────────────────────────────────────────── */
function CityDropdown({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div className="space-y-1.5" ref={ref}>
      <div className="relative">
        <button type="button" onClick={() => setOpen(p => !p)}
          className="w-full rounded-[14px] transition-all duration-200 relative"
          style={{
            background: open ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${open ? "rgba(79,142,247,0.45)" : error ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
            boxShadow: open ? "0 0 0 3px rgba(79,142,247,0.10), 0 4px 16px rgba(0,0,0,0.2)" : "none",
            paddingTop: "26px", paddingBottom: "10px", paddingLeft: "44px", paddingRight: "44px",
            minHeight: "58px",
          }}>
          <span className="text-sm text-left block w-full" style={{ color: value ? "#fff" : "transparent" }}>
            {value || "\u200B"}
          </span>
        </button>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <MapPin className="w-4 h-4" style={{ color: open ? PRIMARY : "rgba(255,255,255,0.25)" }} />
        </div>
        <label className="absolute left-11 pointer-events-none select-none transition-all duration-200"
          style={{
            top: (open || value) ? "9px" : "50%",
            transform: (open || value) ? "none" : "translateY(-50%)",
            fontSize: (open || value) ? "10px" : "13px",
            fontWeight: (open || value) ? 600 : 400,
            letterSpacing: (open || value) ? "0.05em" : "0",
            textTransform: (open || value) ? "uppercase" : "none",
            color: (open || value) ? PRIMARY : "rgba(255,255,255,0.35)",
          }}>
          Qyteti
        </label>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown className="w-4 h-4 transition-transform duration-200"
            style={{ color: "rgba(255,255,255,0.28)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
        </div>
        {open && (
          <div className="absolute z-50 w-full mt-1.5 rounded-[14px] overflow-hidden overflow-y-auto"
            style={{ background: "#12151e", border: "1px solid rgba(79,142,247,0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxHeight: "220px" }}>
            {KOSOVO_CITIES.map(city => (
              <button key={city} type="button"
                onClick={() => { onChange(city); setOpen(false); }}
                className="w-full px-4 py-2.5 text-left text-sm transition-all duration-150"
                style={{
                  color: value === city ? PRIMARY : "rgba(255,255,255,0.7)",
                  background: value === city ? "rgba(79,142,247,0.1)" : "transparent",
                }}>
                {city}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-xs pl-1" style={{ color: "#f87171" }}>{error}</p>}
    </div>
  );
}

/* ── StepBar ─────────────────────────────────────────────── */
function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                style={{
                  background: done ? "rgba(79,142,247,0.2)" : active ? PRIMARY : "rgba(255,255,255,0.06)",
                  border: `1.5px solid ${done ? "rgba(79,142,247,0.4)" : active ? PRIMARY : "rgba(255,255,255,0.1)"}`,
                  color: done ? PRIMARY : active ? "#fff" : "rgba(255,255,255,0.3)",
                  boxShadow: active ? `0 0 0 3px rgba(79,142,247,0.15)` : "none",
                }}>
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
            </div>
            {i < total - 1 && (
              <div className="flex-1 h-px transition-all duration-500"
                style={{ background: done ? "rgba(79,142,247,0.4)" : "rgba(255,255,255,0.07)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── PrimaryBtn ──────────────────────────────────────────── */
function PrimaryBtn({ children, disabled, type = "submit", onClick }: {
  children: React.ReactNode; disabled?: boolean; type?: "submit" | "button"; onClick?: () => void;
}) {
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      className="w-full flex items-center justify-center gap-2 rounded-[14px] font-semibold text-sm text-white transition-all duration-200"
      style={{
        background: disabled ? "rgba(79,142,247,0.3)" : "linear-gradient(135deg,#4f8ef7,#3b7de8)",
        padding: "14px 20px",
        boxShadow: disabled ? "none" : "0 4px 20px rgba(79,142,247,0.3)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}>
      {children}
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 rounded-[14px] font-semibold text-sm transition-all duration-200 shrink-0"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "14px 16px", color: "rgba(255,255,255,0.5)" }}>
      <ArrowLeft className="w-4 h-4" />
    </button>
  );
}

/* ── OwnerForm ───────────────────────────────────────────── */
function OwnerForm() {
  const [step, setStep]   = useState(0);
  const { login }         = useAuth();
  const { toast }         = useToast();

  const [s1, setS1]             = useState<S1Values | null>(null);
  const [selectedPkg, setPkg]   = useState<PkgOption | null>(null);
  const [clientSecret, setCS]   = useState<string>("");
  const [loadingPay, setLoadPay]= useState(false);
  const [stripePromise, setSP]  = useState<ReturnType<typeof loadStripe> | null>(null);

  useEffect(() => {
    fetch("/api/payments/stripe-config")
      .then(r => r.json())
      .then(d => { if (d.publishableKey) setSP(loadStripe(d.publishableKey)); })
      .catch(() => {});
  }, []);

  const f1 = useForm<S1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: { businessName: "", email: "", phone: "", password: "", city: "", address: "" },
  });
  const w1 = (k: keyof S1Values) => (f1.watch(k) ?? "") as string;

  async function handleGoPayment(pkg: PkgOption) {
    if (!s1) return;
    setLoadPay(true);
    try {
      const res = await fetch("/api/payments/register-owner-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: s1.businessName,
          email: s1.email,
          password: s1.password,
          phone: s1.phone,
          businessName: s1.businessName,
          city: s1.city,
          address: s1.address,
          packageId: pkg.id,
        }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        toast({
          variant: "destructive",
          title: "Gabim",
          description: "Lidhja me serverin dështoi. Provo përsëri.",
        });
        return;
      }
      if (!res.ok) {
        toast({ variant: "destructive", title: "Gabim", description: data?.error ?? "Ndodhi një gabim." });
        return;
      }
      // Login immediately — user will already be authenticated when Stripe
      // redirects back to /dashboard after successful payment
      if (data.token && data.user) login(data.token, data.user);
      setCS(data.clientSecret);
      setPkg(pkg);
      setStep(2);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gabim", description: err.message });
    } finally {
      setLoadPay(false);
    }
  }

  return (
    <div>
      <StepBar current={step} total={3} />

      {/* ── Step 0: Info + Location ─────────────────────── */}
      {step === 0 && (
        <form onSubmit={f1.handleSubmit(d => { setS1(d); setStep(1); })} className="space-y-3.5">
          <div className="text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-2"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            <Building2 className="w-3.5 h-3.5" /> Informata Bazë
          </div>
          <IconInput id="bname"  icon={Building2} label="Emri i biznesit" placeholder="LineUp Prishtina"
            value={w1("businessName")} onChange={v => f1.setValue("businessName", v)}
            error={f1.formState.errors.businessName?.message} />
          <IconInput id="oemail" icon={Mail}      label="Email" type="email" placeholder="biznesi@shembull.com"
            value={w1("email")} onChange={v => f1.setValue("email", v)}
            error={f1.formState.errors.email?.message} />
          <IconInput id="ophone" icon={Phone}     label="Telefoni" type="tel" placeholder="+383 44 000 000"
            value={w1("phone")} onChange={v => f1.setValue("phone", v)}
            error={f1.formState.errors.phone?.message} />
          <IconInput id="opw"    icon={Lock}      label="Fjalëkalimi" type="password"
            value={w1("password")} onChange={v => f1.setValue("password", v)}
            error={f1.formState.errors.password?.message} />

          <div className="text-xs font-semibold uppercase tracking-widest mt-4 mb-1 flex items-center gap-2"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            <MapPin className="w-3.5 h-3.5" /> Lokacioni
          </div>
          <CityDropdown value={w1("city")} onChange={v => f1.setValue("city", v)}
            error={f1.formState.errors.city?.message} />
          <IconInput id="addr" icon={MapPin} label="Adresa" placeholder="Rr. Garibaldi, Nr. 12"
            value={w1("address")} onChange={v => f1.setValue("address", v)}
            error={f1.formState.errors.address?.message} />

          <div className="pt-1">
            <PrimaryBtn>Vazhdo <ArrowRight className="w-4 h-4" /></PrimaryBtn>
          </div>
        </form>
      )}

      {/* ── Step 1: Package selection ───────────────────── */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-2"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            <Users className="w-3.5 h-3.5" /> Zgjidh Paketën
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PACKAGES.map(pkg => (
              <div key={pkg.id} className="relative rounded-[14px] p-3.5 flex flex-col transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: `rgba(${pkg.color === "#4f8ef7" ? "79,142,247" : pkg.color === "#7c3aed" ? "124,58,237" : pkg.color === "#059669" ? "5,150,105" : "217,119,6"},0.07)`,
                  border: `1px solid ${pkg.color}44`,
                }}>
                {pkg.popular && (
                  <span className="absolute -top-2.5 left-3 text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: pkg.color, color: "#fff" }}>
                    ★ TOP
                  </span>
                )}

                {/* Icon + name */}
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${pkg.color}22` }}>
                    <Users className="w-3.5 h-3.5" style={{ color: pkg.color }} />
                  </div>
                  <p className="font-semibold text-white text-xs leading-tight">LineUp {pkg.label}</p>
                </div>

                {/* Price */}
                <div className="mb-2">
                  <span className="text-2xl font-bold" style={{ color: pkg.color }}>{pkg.price}€</span>
                  <span className="text-[11px] ml-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>/muaj</span>
                </div>

                {/* Workers */}
                <p className="text-[11px] mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Deri {pkg.workers} punëtorë
                </p>

                {/* CTA */}
                <button
                  type="button"
                  disabled={loadingPay}
                  onClick={() => handleGoPayment(pkg)}
                  className="mt-auto w-full rounded-xl py-2 text-xs font-semibold transition-all duration-200"
                  style={{
                    background: `${pkg.color}22`,
                    border: `1px solid ${pkg.color}55`,
                    color: pkg.color,
                    cursor: loadingPay ? "not-allowed" : "pointer",
                    opacity: loadingPay ? 0.6 : 1,
                  }}>
                  {loadingPay ? "..." : "Zgjidh →"}
                </button>
              </div>
            ))}
          </div>

          <div className="pt-1">
            <BackBtn onClick={() => setStep(0)} />
          </div>
        </div>
      )}

      {/* ── Step 2: Embedded Stripe Checkout ────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-semibold uppercase tracking-widest flex items-center gap-2"
              style={{ color: "rgba(255,255,255,0.3)" }}>
              <ShieldCheck className="w-3.5 h-3.5" /> Pagesa e Sigurt
            </div>
            <button type="button" onClick={() => setStep(1)}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: "rgba(255,255,255,0.35)" }}>
              <ArrowLeft className="w-3 h-3" /> Kthehu
            </button>
          </div>

          {clientSecret && stripePromise ? (
            <div className="rounded-[14px] overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <span className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            </div>
          )}

          <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            🔒 Pagesa e sigurt me Stripe · Fatura dërgohet me email pas pagesës
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────── */
export default function Register() {
  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "#080b12", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Left brand panel ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[38%] relative overflow-hidden flex-col">
        <img
          src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=85"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.35) saturate(0.9)" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(8,11,18,0.92) 0%, rgba(8,11,18,0.5) 60%, transparent 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,11,18,0.98) 0%, transparent 55%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(8,11,18,0.4) 0%, transparent 100%)" }} />
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }} />
        <div className="relative z-10 flex flex-col justify-between h-full p-11">
          <Link href="/" className="flex items-center w-fit">
            <img src={logoImg} alt="LineUP" className="h-10 w-auto" style={{ filter: "invert(1) brightness(2)" }} />
          </Link>

          <div className="space-y-7">
            <div>
              <h2 className="text-[38px] font-bold text-white leading-[1.12] tracking-tight mb-4">
                Fillo udhëtimin<br />
                <span style={{
                  background: "linear-gradient(90deg, #4f8ef7, #93c5fd, #4f8ef7)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "shimmer 3s linear infinite",
                }}>
                  tënd me LineUP.
                </span>
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", maxWidth: "260px" }}>
                Bashkohu me mijëra klientë dhe berberë që zgjodhën platformën premium të Kosovës.
              </p>
            </div>
            <div className="space-y-3">
              {[
                "Rezervo termin në 30 sekonda",
                "Konfirmim i sigurt me OTP",
                "Gjej berberët kryesorë",
                "Produkte premium në marketplace",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.35)" }}>
                    <Check className="w-2.5 h-2.5" style={{ color: "#4f8ef7" }} />
                  </div>
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["B", "A", "V", "D"].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
                    style={{ background: `rgba(79,142,247,${0.1 + i * 0.05})`, borderColor: "#080b12", color: "#7db3ff" }}>
                    {l}
                  </div>
                ))}
              </div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                <span className="text-white font-semibold">12,000+</span> klientë besojnë LineUP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center p-6 lg:p-10 relative"
        style={{ background: "#0d1117" }}>
        <div className="absolute top-0 right-0 w-[350px] h-[350px] pointer-events-none"
          style={{ background: "radial-gradient(circle at top right, rgba(79,142,247,0.06) 0%, transparent 70%)" }} />

        <div className="w-full max-w-[420px] relative z-10 py-8">
          <Link href="/" className="flex items-center mb-8 lg:hidden">
            <img src={logoImg} alt="LineUP" className="h-8 w-auto" style={{ filter: "invert(1) brightness(2)" }} />
          </Link>

          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.3)" }}>
                <Building2 className="w-4 h-4" style={{ color: "#4f8ef7" }} />
              </div>
              <h1 className="text-[26px] font-bold text-white tracking-tight">Regjistro biznesin</h1>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              Shto sallon tënd dhe fillo të marrësh rezervime.
            </p>
          </div>

          <OwnerForm />

          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.28)" }}>
            Keni tashmë llogari?{" "}
            <Link href="/login" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: "#4f8ef7" }}>
              Kyçu tani →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
