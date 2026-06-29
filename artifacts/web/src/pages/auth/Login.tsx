import { useState } from "react";
import logoImg from "@assets/LINE_(2)_1782771053641.png";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Eye, EyeOff, ArrowRight, Scissors, Mail, Lock,
  Users, Calendar, Star, Shield,
} from "lucide-react";

const schema = z.object({
  email:    z.string().email("Email i pavlefshëm"),
  password: z.string().min(6, "Minimum 6 karaktere"),
});
type FormValues = z.infer<typeof schema>;

const DEMO = [
  { role: "Admin",  email: "admin@trimkosova.com", pass: "admin123", color: "#ef4444" },
  { role: "Owner",  email: "artan@trimkosova.com", pass: "owner123", color: "#4f8ef7" },
  { role: "Klient", email: "besim@gmail.com",       pass: "user123",  color: "#22c55e" },
];

const STATS = [
  { icon: Users,    value: "12K+", label: "Klientë aktivë" },
  { icon: Scissors, value: "500+", label: "Berberë" },
  { icon: Calendar, value: "50K+", label: "Rezervime" },
  { icon: Star,     value: "4.9",  label: "Vlerësim" },
];

/* ── Icon input ──────────────────────────────────────────── */
function IconInput({
  id, icon: Icon, label, type = "text", placeholder,
  value, onChange, error,
}: {
  id: string; icon: React.ElementType; label: string; type?: string;
  placeholder?: string; value: string; onChange: (v: string) => void; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow]       = useState(false);
  const filled  = value.length > 0;
  const isPass  = type === "password";
  const active  = focused || filled;

  return (
    <div className="space-y-1.5">
      <div
        className="relative rounded-[14px] transition-all duration-200"
        style={{
          background: focused ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${focused ? "rgba(79,142,247,0.45)" : error ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(79,142,247,0.10), 0 4px 16px rgba(0,0,0,0.2)" : "none",
        }}
      >
        {/* Left icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Icon
            className="w-4 h-4 transition-colors duration-200"
            style={{ color: focused ? "#4f8ef7" : "rgba(255,255,255,0.28)" }}
          />
        </div>

        {/* Floating label */}
        <label
          htmlFor={id}
          className="absolute left-11 pointer-events-none select-none transition-all duration-200"
          style={{
            top:       active ? "9px" : "50%",
            transform: active ? "none" : "translateY(-50%)",
            fontSize:  active ? "10px" : "13px",
            fontWeight: active ? 600 : 400,
            letterSpacing: active ? "0.05em" : "0",
            textTransform: active ? "uppercase" : "none",
            color:     active ? "#4f8ef7" : "rgba(255,255,255,0.38)",
          }}
        >
          {label}
        </label>

        {/* Input */}
        <input
          id={id}
          type={isPass ? (show ? "text" : "password") : type}
          placeholder={focused && placeholder ? placeholder : ""}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={isPass ? "current-password" : "email"}
          className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/20 pl-11 pr-12"
          style={{ paddingTop: "26px", paddingBottom: "10px" }}
        />

        {/* Eye toggle */}
        {isPass && (
          <button
            type="button"
            onClick={() => setShow(p => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 transition-colors"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs pl-1" style={{ color: "#f87171" }}>{error}</p>}
    </div>
  );
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { login }       = useAuth();
  const { toast }       = useToast();
  const mut             = useLogin();

  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const emailVal = watch("email") ?? "";
  const passVal  = watch("password") ?? "";

  async function onSubmit(data: FormValues) {
    try {
      const res = await mut.mutateAsync({ data });
      login(res.token, res.user);
      toast({ title: "Mirë se u kthye!" });
      if (res.user.role === "admin") setLocation("/admin");
      else if (res.user.role === "owner") setLocation("/dashboard");
      else setLocation("/");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Hyrja dështoi", description: err.message ?? "Kontrolloni të dhënat." });
    }
  }

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{ background: "#080b12", fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Left photo panel ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[56%] relative overflow-hidden flex-col">
        {/* Photo */}
        <img
          src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1600&q=90"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.45) saturate(1.1)" }}
        />

        {/* Gradient layers */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(8,11,18,0.85) 0%, rgba(8,11,18,0.4) 50%, transparent 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,11,18,0.9) 0%, transparent 60%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(8,11,18,0.3) 0%, transparent 100%)" }} />

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Blue glow orb */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20" style={{
          background: "radial-gradient(circle, #4f8ef7 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />

        <div className="relative z-10 flex flex-col justify-between h-full p-14">
          {/* Logo */}
          <Link href="/" className="flex items-center w-fit">
            <img src={logoImg} alt="LineUP" className="h-10 w-auto" style={{ filter: "invert(1) brightness(2)" }} />
          </Link>

          <div className="space-y-8">
            {/* Headline */}
            <div className="animate-fade-up delay-100">
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold mb-5"
                style={{ background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.25)", color: "#7db3ff" }}>
                <Shield className="w-3 h-3" />
                Platforma #1 në Kosovë
              </div>
              <h2 className="text-[46px] font-bold leading-[1.1] tracking-tight text-white mb-4">
                Prerje precize,<br />
                <span style={{
                  background: "linear-gradient(90deg, #4f8ef7, #93c5fd, #4f8ef7)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "shimmer 3s linear infinite",
                }}>
                  pa asnjë pritje.
                </span>
              </h2>
              <p className="text-white/50 text-base leading-relaxed max-w-xs">
                Rezervo berberët kryesorë të qytetit me vetëm disa klikime.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 animate-fade-up delay-200">
              {STATS.map(({ icon: Icon, value, label }, i) => (
                <div key={i} className="rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
                  <Icon className="w-4 h-4 mb-2.5" style={{ color: "#4f8ef7" }} />
                  <div className="text-[26px] font-bold text-white tracking-tight leading-none">{value}</div>
                  <div className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="rounded-2xl p-5 animate-fade-up delay-300"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(16px)" }}>
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: "rgba(79,142,247,0.2)", border: "2px solid rgba(79,142,247,0.3)", color: "#7db3ff" }}>
                  D
                </div>
                <div>
                  <p className="text-sm leading-relaxed italic" style={{ color: "rgba(255,255,255,0.65)" }}>
                    "Që kur u bashkuam me LineUP, dyqani ka 40% rritje në klientë të rinj çdo muaj."
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="font-semibold text-white text-sm">Dardan Krasniqi</div>
                    <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
                    <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Classic Cuts Prishtina</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-12 relative"
        style={{ background: "#0d1117" }}
      >
        {/* Ambient glows */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(circle at top right, rgba(79,142,247,0.07) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] pointer-events-none"
          style={{ background: "radial-gradient(circle at bottom left, rgba(79,142,247,0.05) 0%, transparent 70%)" }} />

        <div className="w-full max-w-[360px] relative z-10">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center mb-9 lg:hidden">
            <img src={logoImg} alt="LineUP" className="h-8 w-auto" style={{ filter: "invert(1) brightness(2)" }} />
          </Link>

          {/* Header */}
          <div className="mb-8 animate-fade-up">
            <h1 className="text-[28px] font-bold text-white tracking-tight mb-1.5">Hyr në llogari</h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>Mirë se u ktheve. Vazhdo ku e leve.</p>
          </div>

          {/* Glass form card */}
          <div className="rounded-[20px] p-6 animate-fade-up delay-75"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <IconInput
                id="email" icon={Mail} label="Email" type="email"
                placeholder="ti@shembull.com"
                value={emailVal} onChange={v => setValue("email", v)}
                error={errors.email?.message}
              />
              <IconInput
                id="password" icon={Lock} label="Fjalëkalimi" type="password"
                value={passVal} onChange={v => setValue("password", v)}
                error={errors.password?.message}
              />

              <div className="flex justify-end pt-0.5">
                <Link href="#" className="text-xs transition-colors hover:opacity-80" style={{ color: "#4f8ef7" }}>
                  Keni harruar fjalëkalimin?
                </Link>
              </div>

              <button
                type="submit"
                disabled={mut.isPending}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-[14px] text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #4f8ef7 0%, #3b6fd4 100%)",
                  boxShadow: "0 4px 20px rgba(79,142,247,0.35), 0 1px 0 rgba(255,255,255,0.08) inset",
                }}
                onMouseEnter={e => { if (!mut.isPending) (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(79,142,247,0.50), 0 1px 0 rgba(255,255,255,0.08) inset"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(79,142,247,0.35), 0 1px 0 rgba(255,255,255,0.08) inset"; }}
              >
                {mut.isPending ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                    Duke hyrë...
                  </>
                ) : (
                  <>Hyr tani <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-5 animate-fade-in delay-200" style={{ color: "rgba(255,255,255,0.3)" }}>
            Nuk keni llogari?{" "}
            <Link href="/register" className="font-semibold transition-colors hover:opacity-80" style={{ color: "#4f8ef7" }}>
              Regjistrohu falas →
            </Link>
          </p>

          {/* Demo accounts */}
          <div className="mt-7 animate-fade-in delay-300">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
                Demo
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            </div>
            <div className="space-y-2">
              {DEMO.map(({ role, email, pass, color }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => { setValue("email", email); setValue("password", pass); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-[14px] text-left transition-all group"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(255,255,255,0.1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(255,255,255,0.06)"; }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                  <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{role}</span>
                  <span className="text-[11px] ml-auto" style={{ color: "rgba(255,255,255,0.3)" }}>{email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
