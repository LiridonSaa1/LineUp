import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowRight, Scissors, Users, Calendar, Star, Sparkles } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email i pavlefshëm"),
  password: z.string().min(6, "Minimum 6 karaktere"),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO = [
  { role: "Admin", label: "A", email: "admin@trimkosova.com", pass: "admin123", color: "from-red-500/20 to-red-500/5 border-red-500/20 text-red-400" },
  { role: "Owner", label: "O", email: "artan@trimkosova.com", pass: "owner123", color: "from-primary/20 to-primary/5 border-primary/20 text-primary" },
  { role: "Klient", label: "K", email: "besim@gmail.com", pass: "user123", color: "from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400" },
];

/* Floating-label input */
function FloatingInput({
  id, label, type = "text", placeholder, value, onChange, error,
}: {
  id: string; label: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const filled = value.length > 0;
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <div className={`relative rounded-2xl transition-all duration-200 ${
        focused
          ? "ring-2 ring-primary/40 shadow-lg shadow-primary/10"
          : error
          ? "ring-2 ring-red-500/40"
          : "ring-1 ring-white/8 hover:ring-white/15"
      } bg-white/4`}>
        <label
          htmlFor={id}
          className={`absolute left-4 transition-all duration-200 pointer-events-none select-none ${
            focused || filled
              ? "top-2.5 text-[10px] font-semibold uppercase tracking-wider text-primary"
              : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
          }`}
        >
          {label}
        </label>
        <input
          id={id}
          type={inputType}
          placeholder={focused && placeholder ? placeholder : ""}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent pt-7 pb-3 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 rounded-2xl pr-12"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(p => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 pl-1">{error}</p>}
    </div>
  );
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const emailVal = watch("email") ?? "";
  const passVal = watch("password") ?? "";

  async function onSubmit(data: LoginFormValues) {
    try {
      const res = await loginMutation.mutateAsync({ data });
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
    <div className="min-h-screen flex bg-background overflow-hidden">

      {/* ── Left panel ──────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1400&q=85"
          alt="Barbershop"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Layered overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/55 to-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 animate-fade-in">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/40">
              <Scissors className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">TRIM<span className="text-primary">.</span></span>
          </Link>

          <div className="space-y-8">
            {/* Hero text */}
            <div className="animate-fade-up delay-100">
              <div className="inline-flex items-center gap-2 glass px-3.5 py-1.5 rounded-full text-xs font-semibold text-primary mb-4">
                <Sparkles className="w-3 h-3" />
                Platforma #1 në Kosovë
              </div>
              <h2 className="text-5xl font-bold text-white leading-[1.1] mb-4 tracking-tight">
                Prerje precize,<br />
                <span className="text-shimmer">pa asnjë pritje.</span>
              </h2>
              <p className="text-white/55 text-base leading-relaxed max-w-sm">
                Rezervo berberët kryesorë të qytetit tënd me vetëm disa klikime.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 animate-fade-up delay-200">
              {[
                { icon: Users, value: "12K+", label: "Klientë aktivë" },
                { icon: Scissors, value: "500+", label: "Berberë" },
                { icon: Calendar, value: "50K+", label: "Rezervime" },
                { icon: Star, value: "4.9★", label: "Vlerësim mesatar" },
              ].map(({ icon: Icon, value, label }, i) => (
                <div key={i} className="glass rounded-2xl p-4 hover-lift">
                  <Icon className="w-4 h-4 text-primary mb-2.5" />
                  <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
                  <div className="text-xs text-white/45 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="glass rounded-2xl p-5 animate-fade-up delay-300">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/25 flex items-center justify-center text-primary font-bold shrink-0 ring-2 ring-primary/30 text-sm">
                  D
                </div>
                <div>
                  <p className="text-white/75 text-sm leading-relaxed italic">
                    "Që kur u bashkuam me TRIM, dyqani ka 40% rritje në klientë të rinj."
                  </p>
                  <div className="mt-2.5">
                    <div className="font-semibold text-white text-sm">Dardan Krasniqi</div>
                    <div className="text-[11px] text-white/35 mt-0.5">Pronar — Classic Cuts Prishtina</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 relative">
        {/* Bg orbs */}
        <div className="absolute top-1/4 right-1/4 w-72 h-72 glow-orb bg-primary/6 animate-glow-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-52 h-52 glow-orb bg-primary/4 animate-float-slow pointer-events-none" />

        <div className="w-full max-w-[360px] relative z-10">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden animate-fade-in">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Scissors className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">TRIM<span className="text-primary">.</span></span>
          </Link>

          {/* Header */}
          <div className="mb-8 animate-fade-up">
            <h1 className="text-3xl font-bold tracking-tight mb-1.5">Hyr në llogari</h1>
            <p className="text-muted-foreground text-sm">Mirë se u ktheve! Vazhdo ku e leve.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-fade-up delay-100">
            <FloatingInput
              id="email"
              label="Email"
              type="email"
              placeholder="ti@shembull.com"
              value={emailVal}
              onChange={v => setValue("email", v)}
              error={errors.email?.message}
            />
            <FloatingInput
              id="password"
              label="Fjalëkalimi"
              type="password"
              value={passVal}
              onChange={v => setValue("password", v)}
              error={errors.password?.message}
            />

            <div className="flex justify-end">
              <Link href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">
                Keni harruar fjalëkalimin?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn-pill w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-2"
            >
              {loginMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Duke hyrë...
                </>
              ) : (
                <>Hyr tani <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-5 animate-fade-in delay-200">
            Nuk keni llogari?{" "}
            <Link href="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Regjistrohu falas →
            </Link>
          </p>

          {/* Demo accounts */}
          <div className="mt-7 pt-6 border-t border-white/6 animate-fade-in delay-300">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 text-center mb-3">
              Demo accounts
            </p>
            <div className="flex flex-col gap-2">
              {DEMO.map(({ role, label, email, pass, color }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => { setValue("email", email); setValue("password", pass); }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border bg-gradient-to-r ${color} hover:scale-[1.01] transition-all text-left group`}
                >
                  <span className="w-7 h-7 rounded-lg bg-current/10 flex items-center justify-center text-xs font-bold shrink-0">
                    {label}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold">{role}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{email}</div>
                  </div>
                  <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
