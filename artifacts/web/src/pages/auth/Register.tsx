import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useRegister } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, Scissors, User,
  Building2, MapPin, Image, Check, Sparkles, Plus, Trash2,
} from "lucide-react";

/* ── Schemas ─────────────────────────────────────────────── */
const userSchema = z.object({
  firstName:       z.string().min(1, "Emri është i detyrueshëm"),
  lastName:        z.string().min(1, "Mbiemri është i detyrueshëm"),
  email:           z.string().email("Email i pavlefshëm"),
  phone:           z.string().min(5, "Numri i telefonit është i detyrueshëm"),
  password:        z.string().min(6, "Minimum 6 karaktere"),
  confirmPassword: z.string().min(6, "Konfirmo fjalëkalimin"),
}).refine(d => d.password === d.confirmPassword, { message: "Fjalëkalimet nuk përputhen", path: ["confirmPassword"] });

const ownerStep1Schema = z.object({
  ownerName:      z.string().min(2, "Emri i plotë i detyrueshëm"),
  email:          z.string().email("Email i pavlefshëm"),
  phone:          z.string().min(5, "Numri i detyrueshëm"),
  password:       z.string().min(6, "Minimum 6 karaktere"),
  businessName:   z.string().min(2, "Emri i biznesit i detyrueshëm"),
  businessNumber: z.string().optional(),
});

const ownerStep2Schema = z.object({
  city:        z.string().min(1, "Qyteti i detyrueshëm"),
  address:     z.string().min(3, "Adresa e detyrueshme"),
  latitude:    z.coerce.number().optional().or(z.literal("")),
  longitude:   z.coerce.number().optional().or(z.literal("")),
  description: z.string().optional(),
  gender:      z.enum(["male", "female", "both"], { required_error: "Zgjidhni gjininë" }),
});

const ownerStep3Schema = z.object({
  imageUrl: z.string().optional(),
  iban:     z.string().optional(),
});

type UserFormValues    = z.infer<typeof userSchema>;
type OwnerStep1Values  = z.infer<typeof ownerStep1Schema>;
type OwnerStep2Values  = z.infer<typeof ownerStep2Schema>;
type OwnerStep3Values  = z.infer<typeof ownerStep3Schema>;

/* ── Floating-label input ────────────────────────────────── */
function FloatingInput({
  id, label, type = "text", placeholder, value, onChange, error, hint,
}: {
  id: string; label: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void; error?: string; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const filled = value.length > 0;
  const isPass = type === "password";

  return (
    <div className="space-y-1.5">
      <div className={`relative rounded-2xl transition-all duration-200 ${
        focused ? "ring-2 ring-primary/40 shadow-lg shadow-primary/8"
        : error  ? "ring-2 ring-red-500/40"
        : "ring-1 ring-white/8 hover:ring-white/14"
      } bg-white/4`}>
        <label htmlFor={id} className={`absolute left-4 pointer-events-none select-none transition-all duration-200 ${
          focused || filled
            ? "top-2.5 text-[10px] font-semibold uppercase tracking-wider text-primary"
            : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
        }`}>
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
          className="w-full bg-transparent pt-7 pb-3 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 rounded-2xl pr-12"
          step={type === "number" ? "any" : undefined}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(p => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 pl-1">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground/60 pl-1">{hint}</p>}
    </div>
  );
}

/* ── FloatingTextarea ────────────────────────────────────── */
function FloatingTextarea({ id, label, placeholder, value, onChange, error }: {
  id: string; label: string; placeholder?: string;
  value: string; onChange: (v: string) => void; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const filled = value.length > 0;
  return (
    <div className="space-y-1.5">
      <div className={`relative rounded-2xl transition-all duration-200 ${
        focused ? "ring-2 ring-primary/40 shadow-lg shadow-primary/8"
        : error  ? "ring-2 ring-red-500/40"
        : "ring-1 ring-white/8 hover:ring-white/14"
      } bg-white/4`}>
        <label htmlFor={id} className={`absolute left-4 pointer-events-none select-none transition-all duration-200 ${
          focused || filled
            ? "top-3 text-[10px] font-semibold uppercase tracking-wider text-primary"
            : "top-4 text-sm text-muted-foreground"
        }`}>{label}</label>
        <textarea
          id={id}
          rows={3}
          placeholder={focused && placeholder ? placeholder : ""}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent pt-8 pb-3 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 rounded-2xl resize-none"
        />
      </div>
      {error && <p className="text-xs text-red-400 pl-1">{error}</p>}
    </div>
  );
}

/* ── Step dot indicator ──────────────────────────────────── */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center justify-center rounded-full transition-all duration-300 font-bold text-xs ${
            i < current
              ? "w-7 h-7 bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : i === current
              ? "w-8 h-8 bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-xl shadow-primary/30"
              : "w-7 h-7 bg-white/6 text-muted-foreground"
          }`}>
            {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-px w-8 transition-all duration-500 ${i < current ? "bg-primary" : "bg-white/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Gender picker ───────────────────────────────────────── */
function GenderPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opts = [{ v: "male", l: "Mashkull" }, { v: "female", l: "Femër" }, { v: "both", l: "Të dyja" }];
  return (
    <div className="flex gap-2">
      {opts.map(o => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`flex-1 py-3 text-xs font-semibold rounded-xl border transition-all duration-200 ${
            value === o.v
              ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
              : "border-white/8 bg-white/4 text-muted-foreground hover:border-white/15"
          }`}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

/* ── UserForm ────────────────────────────────────────────── */
function UserForm() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const w = (k: keyof UserFormValues) => watch(k) ?? "";

  async function onSubmit(data: UserFormValues) {
    try {
      const res = await registerMutation.mutateAsync({ data: {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email, password: data.password, role: "user", phone: data.phone,
      }});
      login(res.token, res.user);
      toast({ title: "Llogaria u krijua!", description: "Mirë se vini në TRIM." });
      setLocation("/");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Regjistrimi dështoi", description: err.message ?? "Provoni përsëri." });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-fade-up delay-100">
      <div className="grid grid-cols-2 gap-3">
        <FloatingInput id="fn" label="Emri" placeholder="Besim" value={w("firstName")} onChange={v => setValue("firstName", v)} error={errors.firstName?.message} />
        <FloatingInput id="ln" label="Mbiemri" placeholder="Gashi" value={w("lastName")} onChange={v => setValue("lastName", v)} error={errors.lastName?.message} />
      </div>
      <FloatingInput id="em" label="Email" type="email" placeholder="ti@shembull.com" value={w("email")} onChange={v => setValue("email", v)} error={errors.email?.message} />
      <FloatingInput id="ph" label="Telefoni" type="tel" placeholder="+383 44 000 000" value={w("phone")} onChange={v => setValue("phone", v)} error={errors.phone?.message} />
      <FloatingInput id="pw" label="Fjalëkalimi" type="password" value={w("password")} onChange={v => setValue("password", v)} error={errors.password?.message} />
      <FloatingInput id="cpw" label="Konfirmo fjalëkalimin" type="password" value={w("confirmPassword")} onChange={v => setValue("confirmPassword", v)} error={errors.confirmPassword?.message} />

      <button type="submit" disabled={registerMutation.isPending}
        className="btn-pill w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-2">
        {registerMutation.isPending ? (
          <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Duke krijuar...</>
        ) : (<>Krijo llogarinë <ArrowRight className="w-4 h-4" /></>)}
      </button>
    </form>
  );
}

/* ── OwnerForm ───────────────────────────────────────────── */
function OwnerForm() {
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const [s1, setS1] = useState<OwnerStep1Values | null>(null);
  const [s2, setS2] = useState<OwnerStep2Values | null>(null);
  const [photos, setPhotos] = useState<string[]>([""]);

  const f1 = useForm<OwnerStep1Values>({ resolver: zodResolver(ownerStep1Schema), defaultValues: { ownerName: "", email: "", phone: "", password: "", businessName: "", businessNumber: "" } });
  const f2 = useForm<OwnerStep2Values>({ resolver: zodResolver(ownerStep2Schema), defaultValues: { city: "", address: "", latitude: "", longitude: "", description: "", gender: undefined } });
  const f3 = useForm<OwnerStep3Values>({ resolver: zodResolver(ownerStep3Schema), defaultValues: { imageUrl: "", iban: "" } });

  const w1 = (k: keyof OwnerStep1Values) => f1.watch(k) ?? "";
  const w2 = (k: keyof OwnerStep2Values) => f2.watch(k) ?? "";
  const w3 = (k: keyof OwnerStep3Values) => f3.watch(k) ?? "";

  async function submit3(data: OwnerStep3Values) {
    if (!s1 || !s2) return;
    try {
      const res = await registerMutation.mutateAsync({ data: {
        name: s1.ownerName, email: s1.email, password: s1.password, role: "owner", phone: s1.phone,
      }});
      login(res.token, res.user);
      const validPhotos = photos.filter(p => p.trim());
      await fetch("/api/barbershops", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${res.token}` },
        body: JSON.stringify({
          name: s1.businessName, city: s2.city, address: s2.address,
          description: s2.description || null, phone: s1.phone,
          latitude: s2.latitude !== "" ? Number(s2.latitude) : null,
          longitude: s2.longitude !== "" ? Number(s2.longitude) : null,
          gender: s2.gender, businessNumber: s1.businessNumber || null,
          imageUrl: data.imageUrl || null,
          photos: validPhotos.length ? validPhotos : null,
          iban: data.iban || null,
        }),
      });
      toast({ title: "Biznesi u regjistrua!", description: "Profili juaj është dërguar për aprovim." });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Regjistrimi dështoi", description: err.message ?? "Provoni përsëri." });
    }
  }

  const STEPS = [
    { label: "Llogaria", icon: User },
    { label: "Lokacioni", icon: MapPin },
    { label: "Media", icon: Image },
  ];

  return (
    <div>
      <StepDots current={step} total={3} />

      {/* Step labels */}
      <div className="flex gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={i} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${i === step ? "text-primary" : i < step ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
          </div>
        ))}
      </div>

      {/* Step 1 — Account */}
      {step === 0 && (
        <form onSubmit={f1.handleSubmit(d => { setS1(d); setStep(1); })} className="space-y-4 animate-fade-up">
          <FloatingInput id="bname" label="Emri i biznesit" placeholder="TRIM Prishtina" value={w1("businessName")} onChange={v => f1.setValue("businessName", v)} error={f1.formState.errors.businessName?.message} />
          <FloatingInput id="bnum" label="Nr. i biznesit (opsionale)" placeholder="70XXXXXXX" value={w1("businessNumber") as string} onChange={v => f1.setValue("businessNumber", v)} />
          <FloatingInput id="oname" label="Pronari (emri i plotë)" placeholder="Artan Berisha" value={w1("ownerName")} onChange={v => f1.setValue("ownerName", v)} error={f1.formState.errors.ownerName?.message} />
          <FloatingInput id="oemail" label="Email" type="email" placeholder="biznesi@shembull.com" value={w1("email")} onChange={v => f1.setValue("email", v)} error={f1.formState.errors.email?.message} />
          <FloatingInput id="ophone" label="Telefoni" type="tel" placeholder="+383 44 000 000" value={w1("phone")} onChange={v => f1.setValue("phone", v)} error={f1.formState.errors.phone?.message} />
          <FloatingInput id="opw" label="Fjalëkalimi" type="password" value={w1("password")} onChange={v => f1.setValue("password", v)} error={f1.formState.errors.password?.message} />
          <button type="submit" className="btn-pill w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
            Vazhdo <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Step 2 — Location */}
      {step === 1 && (
        <form onSubmit={f2.handleSubmit(d => { setS2(d); setStep(2); })} className="space-y-4 animate-fade-up">
          <FloatingInput id="city" label="Qyteti" placeholder="Prishtinë" value={w2("city")} onChange={v => f2.setValue("city", v)} error={f2.formState.errors.city?.message} />
          <FloatingInput id="addr" label="Adresa" placeholder="Rr. Garibaldi, Nr. 12" value={w2("address")} onChange={v => f2.setValue("address", v)} error={f2.formState.errors.address?.message} />

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2 pl-1">Gjinia e klientelës</p>
            <GenderPicker value={w2("gender")} onChange={v => f2.setValue("gender", v as any)} />
            {f2.formState.errors.gender && <p className="text-xs text-red-400 pl-1 mt-1">{f2.formState.errors.gender.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FloatingInput id="lat" label="Gjerësia (lat)" type="number" placeholder="42.6629" value={w2("latitude") as string} onChange={v => f2.setValue("latitude", v)} hint="Opsionale" />
            <FloatingInput id="lng" label="Gjatësia (lng)" type="number" placeholder="21.1655" value={w2("longitude") as string} onChange={v => f2.setValue("longitude", v)} hint="Opsionale" />
          </div>

          <FloatingTextarea id="desc" label="Përshkrimi (opsionale)" placeholder="Tregoni diçka për sallon tuaj..." value={w2("description") as string} onChange={v => f2.setValue("description", v)} />

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(0)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 glass rounded-2xl text-sm font-semibold hover:bg-white/8 transition-all">
              <ArrowLeft className="w-4 h-4" /> Kthehu
            </button>
            <button type="submit"
              className="btn-pill flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
              Vazhdo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 3 — Media */}
      {step === 2 && (
        <form onSubmit={f3.handleSubmit(submit3)} className="space-y-5 animate-fade-up">
          <FloatingInput id="img" label="Logo URL (opsionale)" placeholder="https://shembull.com/logo.png" value={w3("imageUrl") as string} onChange={v => f3.setValue("imageUrl", v)} />
          <FloatingInput id="iban" label="IBAN (opsionale)" placeholder="XK05 1212 0123 4567 8906" value={w3("iban") as string} onChange={v => f3.setValue("iban", v)} />

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 pl-1">Fotot e sallonit (opsionale)</p>
            {photos.map((url, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex-1 relative rounded-2xl ring-1 ring-white/8 bg-white/4 hover:ring-white/14 transition-all">
                  <input
                    type="text"
                    placeholder={`https://shembull.com/foto-${i + 1}.jpg`}
                    value={url}
                    onChange={e => setPhotos(p => p.map((v, idx) => idx === i ? e.target.value : v))}
                    className="w-full bg-transparent py-3.5 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 rounded-2xl"
                  />
                </div>
                {photos.length > 1 && (
                  <button type="button" onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))}
                    className="w-10 h-10 my-auto flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setPhotos(p => [...p, ""])}
              className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors pl-1 mt-1">
              <Plus className="w-3.5 h-3.5" /> Shto foto tjetër
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setStep(1)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 glass rounded-2xl text-sm font-semibold hover:bg-white/8 transition-all">
              <ArrowLeft className="w-4 h-4" /> Kthehu
            </button>
            <button type="submit" disabled={registerMutation.isPending}
              className="btn-pill flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-60 transition-all">
              {registerMutation.isPending ? (
                <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Duke regjistruar...</>
              ) : (<>Regjistro biznesin <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ── Main Register ───────────────────────────────────────── */
export default function Register() {
  const [role, setRole] = useState<"user" | "owner">("user");

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">

      {/* ── Left brand panel ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden flex-col">
        <img
          src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=85"
          alt="Barbershop"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/65 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative z-10 flex flex-col justify-between p-12 h-full">
          <Link href="/" className="flex items-center gap-2.5 animate-fade-in">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/40">
              <Scissors className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">TRIM<span className="text-primary">.</span></span>
          </Link>

          <div className="space-y-6 animate-fade-up delay-100">
            <div className="inline-flex items-center gap-2 glass px-3.5 py-1.5 rounded-full text-xs font-semibold text-primary">
              <Sparkles className="w-3 h-3" />
              Platforma #1 në Kosovë
            </div>
            <h2 className="text-4xl font-bold text-white leading-[1.15] tracking-tight">
              Fillo udhëtimin<br />
              <span className="text-shimmer">tënd me TRIM.</span>
            </h2>
            <p className="text-white/55 text-base leading-relaxed max-w-xs">
              Bashkohu me mijëra klientë dhe berberë që zgjodhën platformën premium të Kosovës.
            </p>

            {/* Benefits */}
            <div className="space-y-3">
              {[
                "Rezervo në 30 sekonda",
                "Konfirmo me OTP të sigurt",
                "Gjej berberët kryesorë",
                "Blij produkte premium",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 animate-slide-right" style={{ animationDelay: `${200 + i * 80}ms` }}>
                  <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-white/70">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-4 animate-fade-up delay-400">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["B", "A", "V"].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-primary/25 border-2 border-black/50 flex items-center justify-center text-xs font-bold text-primary">
                    {l}
                  </div>
                ))}
              </div>
              <p className="text-white/60 text-xs leading-relaxed">
                <span className="text-white font-semibold">12,000+ klientë</span> tashmë besojnë TRIM
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────── */}
      <div className="flex-1 flex items-start justify-center p-6 lg:p-10 overflow-y-auto relative">
        {/* Bg orbs */}
        <div className="absolute top-1/3 right-1/4 w-72 h-72 glow-orb bg-primary/5 animate-glow-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 glow-orb bg-primary/4 animate-float-slow pointer-events-none" />

        <div className="w-full max-w-[400px] relative z-10 py-8">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden animate-fade-in">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Scissors className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">TRIM<span className="text-primary">.</span></span>
          </Link>

          {/* Header */}
          <div className="mb-7 animate-fade-up">
            <h1 className="text-3xl font-bold tracking-tight mb-1.5">Krijo llogari</h1>
            <p className="text-muted-foreground text-sm">Fillo falas sot. Pa kartë krediti.</p>
          </div>

          {/* Role toggle */}
          <div className="glass rounded-2xl p-1.5 flex mb-7 animate-fade-up delay-75">
            {[
              { v: "user" as const, icon: User, label: "Rezervoj termin" },
              { v: "owner" as const, icon: Building2, label: "Pronar salloni" },
            ].map(({ v, icon: Icon, label }) => (
              <button key={v} type="button" onClick={() => setRole(v)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  role === v
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          {role === "user" ? <UserForm /> : <OwnerForm />}

          <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in delay-200">
            Keni tashmë llogari?{" "}
            <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Kyçu tani →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
