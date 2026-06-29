import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useRegister } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, Scissors, Mail, Lock,
  User, Building2, MapPin, Phone, Layers, Check, Plus, Trash2,
} from "lucide-react";

/* ── Schemas ─────────────────────────────────────────────── */
const step1Schema = z.object({
  ownerName:      z.string().min(2, "Emri i detyrueshëm"),
  email:          z.string().email("Email i pavlefshëm"),
  phone:          z.string().min(5, "Telefoni i detyrueshëm"),
  password:       z.string().min(6, "Minimum 6 karaktere"),
  businessName:   z.string().min(2, "Emri i biznesit i detyrueshëm"),
  businessNumber: z.string().optional(),
});

const step2Schema = z.object({
  city:        z.string().min(1, "Qyteti i detyrueshëm"),
  address:     z.string().min(3, "Adresa e detyrueshme"),
  latitude:    z.coerce.number().optional().or(z.literal("")),
  longitude:   z.coerce.number().optional().or(z.literal("")),
  description: z.string().optional(),
  gender:      z.enum(["male", "female", "both"], { required_error: "Zgjidhni gjininë" }),
});

const step3Schema = z.object({
  imageUrl: z.string().optional(),
  iban:     z.string().optional(),
});

type S1Values       = z.infer<typeof step1Schema>;
type S2Values       = z.infer<typeof step2Schema>;
type S3Values       = z.infer<typeof step3Schema>;

const PRIMARY = "#4f8ef7";

/* ── Icon input ──────────────────────────────────────────── */
function IconInput({
  id, icon: Icon, label, type = "text", placeholder,
  value, onChange, error, hint,
}: {
  id: string; icon: React.ElementType; label: string; type?: string;
  placeholder?: string; value: string; onChange: (v: string) => void;
  error?: string; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow]       = useState(false);
  const filled  = value.length > 0;
  const active  = focused || filled;
  const isPass  = type === "password";

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
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Icon className="w-4 h-4 transition-colors duration-200"
            style={{ color: focused ? PRIMARY : "rgba(255,255,255,0.25)" }} />
        </div>
        <label htmlFor={id} className="absolute left-11 pointer-events-none select-none transition-all duration-200"
          style={{
            top:           active ? "9px" : "50%",
            transform:     active ? "none" : "translateY(-50%)",
            fontSize:      active ? "10px" : "13px",
            fontWeight:    active ? 600 : 400,
            letterSpacing: active ? "0.05em" : "0",
            textTransform: active ? "uppercase" : "none",
            color:         active ? PRIMARY : "rgba(255,255,255,0.35)",
          }}>
          {label}
        </label>
        <input
          id={id}
          type={isPass ? (show ? "text" : "password") : type}
          placeholder={focused && placeholder ? placeholder : ""}
          value={value}
          step={type === "number" ? "any" : undefined}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={isPass ? "new-password" : type === "email" ? "email" : "off"}
          className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/20 pl-11 pr-12"
          style={{ paddingTop: "26px", paddingBottom: "10px" }}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(p => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 transition-colors"
            style={{ color: "rgba(255,255,255,0.28)" }}>
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs pl-1" style={{ color: "#f87171" }}>{error}</p>}
      {hint && !error && <p className="text-xs pl-1" style={{ color: "rgba(255,255,255,0.25)" }}>{hint}</p>}
    </div>
  );
}

/* ── Textarea input ──────────────────────────────────────── */
function TextareaInput({ id, label, placeholder, value, onChange, error }: {
  id: string; label: string; placeholder?: string;
  value: string; onChange: (v: string) => void; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const filled = value.length > 0;
  const active = focused || filled;
  return (
    <div className="space-y-1.5">
      <div className="relative rounded-[14px] transition-all duration-200"
        style={{
          background: focused ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${focused ? "rgba(79,142,247,0.45)" : error ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(79,142,247,0.10)" : "none",
        }}>
        <label htmlFor={id} className="absolute left-4 pointer-events-none select-none transition-all duration-200"
          style={{
            top: active ? "10px" : "16px",
            fontSize: active ? "10px" : "13px",
            fontWeight: active ? 600 : 400,
            letterSpacing: active ? "0.05em" : "0",
            textTransform: active ? "uppercase" : "none",
            color: active ? PRIMARY : "rgba(255,255,255,0.35)",
          }}>
          {label}
        </label>
        <textarea
          id={id} rows={3}
          placeholder={focused && placeholder ? placeholder : ""}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/20 resize-none px-4 pb-3"
          style={{ paddingTop: "28px" }}
        />
      </div>
      {error && <p className="text-xs pl-1" style={{ color: "#f87171" }}>{error}</p>}
    </div>
  );
}

/* ── Gender picker ───────────────────────────────────────── */
function GenderPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {[{ v: "male", l: "Mashkull" }, { v: "female", l: "Femër" }, { v: "both", l: "Të dyja" }].map(o => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className="flex-1 py-3 text-xs font-semibold rounded-xl transition-all duration-200"
          style={{
            background: value === o.v ? "rgba(79,142,247,0.15)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${value === o.v ? "rgba(79,142,247,0.4)" : "rgba(255,255,255,0.08)"}`,
            color: value === o.v ? "#7db3ff" : "rgba(255,255,255,0.4)",
            boxShadow: value === o.v ? "0 0 12px rgba(79,142,247,0.15)" : "none",
          }}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

/* ── Step bar ────────────────────────────────────────────── */
function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="space-y-2 mb-7">
      <div className="flex items-center justify-between mb-1">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300"
              style={{
                background: i < current ? PRIMARY : i === current ? "rgba(79,142,247,0.2)" : "rgba(255,255,255,0.05)",
                border: `1.5px solid ${i <= current ? PRIMARY : "rgba(255,255,255,0.1)"}`,
                color: i <= current ? (i < current ? "#fff" : PRIMARY) : "rgba(255,255,255,0.3)",
                boxShadow: i === current ? `0 0 12px rgba(79,142,247,0.35)` : "none",
              }}>
              {i < current ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            {i < total - 1 && (
              <div className="flex-1 h-px w-16 transition-all duration-500"
                style={{ background: i < current ? PRIMARY : "rgba(255,255,255,0.08)" }} />
            )}
          </div>
        ))}
      </div>
      {/* Progress bar */}
      <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${((current) / total) * 100}%`, background: `linear-gradient(90deg, ${PRIMARY}, #93c5fd)` }} />
      </div>
    </div>
  );
}

/* ── Primary button ──────────────────────────────────────── */
function PrimaryBtn({ children, disabled, type = "submit" }: {
  children: React.ReactNode; disabled?: boolean; type?: "submit" | "button";
}) {
  return (
    <button type={type} disabled={disabled}
      className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-[14px] text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
      style={{
        background: "linear-gradient(135deg, #4f8ef7 0%, #3b6fd4 100%)",
        boxShadow: "0 4px 20px rgba(79,142,247,0.35), 0 1px 0 rgba(255,255,255,0.08) inset",
      }}>
      {children}
    </button>
  );
}

/* ── Ghost back button ───────────────────────────────────── */
function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-[14px] text-sm font-semibold transition-all"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
      <ArrowLeft className="w-4 h-4" /> Kthehu
    </button>
  );
}

/* ── Animated step container ─────────────────────────────── */
function StepSlide({ children, step }: { children: React.ReactNode; step: number }) {
  const [key, setKey] = useState(step);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => { setKey(step); setVisible(true); }, 120);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.25s ease, transform 0.25s ease",
    }}>
      {children}
    </div>
  );
}

/* ── Owner multi-step ────────────────────────────────────── */
function OwnerForm() {
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();
  const { login }       = useAuth();
  const { toast }       = useToast();
  const mut             = useRegister();
  const [s1, setS1]     = useState<S1Values | null>(null);
  const [s2, setS2]     = useState<S2Values | null>(null);
  const [photos, setPhotos] = useState<string[]>([""]);

  const f1 = useForm<S1Values>({ resolver: zodResolver(step1Schema), defaultValues: { ownerName: "", email: "", phone: "", password: "", businessName: "", businessNumber: "" } });
  const f2 = useForm<S2Values>({ resolver: zodResolver(step2Schema), defaultValues: { city: "", address: "", latitude: "", longitude: "", description: "", gender: undefined } });
  const f3 = useForm<S3Values>({ resolver: zodResolver(step3Schema), defaultValues: { imageUrl: "", iban: "" } });

  const w1 = (k: keyof S1Values) => (f1.watch(k) ?? "") as string;
  const w2 = (k: keyof S2Values) => (f2.watch(k) ?? "") as string;
  const w3 = (k: keyof S3Values) => (f3.watch(k) ?? "") as string;

  async function submit3(data: S3Values) {
    if (!s1 || !s2) return;
    try {
      const res = await mut.mutateAsync({ data: { name: s1.ownerName, email: s1.email, password: s1.password, role: "owner", phone: s1.phone } });
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
      toast({ variant: "destructive", title: "Regjistrimi dështoi", description: err.message });
    }
  }

  return (
    <div>
      <StepBar current={step} total={3} />
      <StepSlide step={step}>
        {step === 0 && (
          <form onSubmit={f1.handleSubmit(d => { setS1(d); setStep(1); })} className="space-y-3.5">
            <div className="text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              <Building2 className="w-3.5 h-3.5" /> Informata Bazë
            </div>
            <IconInput id="bname" icon={Building2} label="Emri i biznesit" placeholder="TRIM Prishtina" value={w1("businessName")} onChange={v => f1.setValue("businessName", v)} error={f1.formState.errors.businessName?.message} />
            <IconInput id="bnum"  icon={Layers}    label="Nr. biznesit (opsionale)" placeholder="70XXXXXXX" value={w1("businessNumber")} onChange={v => f1.setValue("businessNumber", v)} />
            <IconInput id="oname" icon={User}      label="Pronari (emri i plotë)" placeholder="Artan Berisha" value={w1("ownerName")} onChange={v => f1.setValue("ownerName", v)} error={f1.formState.errors.ownerName?.message} />
            <IconInput id="oemail" icon={Mail}     label="Email" type="email" placeholder="biznesi@shembull.com" value={w1("email")} onChange={v => f1.setValue("email", v)} error={f1.formState.errors.email?.message} />
            <IconInput id="ophone" icon={Phone}    label="Telefoni" type="tel" placeholder="+383 44 000 000" value={w1("phone")} onChange={v => f1.setValue("phone", v)} error={f1.formState.errors.phone?.message} />
            <IconInput id="opw"   icon={Lock}      label="Fjalëkalimi" type="password" value={w1("password")} onChange={v => f1.setValue("password", v)} error={f1.formState.errors.password?.message} />
            <div className="pt-1"><PrimaryBtn>Vazhdo <ArrowRight className="w-4 h-4" /></PrimaryBtn></div>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={f2.handleSubmit(d => { setS2(d); setStep(2); })} className="space-y-3.5">
            <div className="text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              <MapPin className="w-3.5 h-3.5" /> Lokacioni & Detajet
            </div>
            <IconInput id="city" icon={MapPin} label="Qyteti" placeholder="Prishtinë" value={w2("city")} onChange={v => f2.setValue("city", v)} error={f2.formState.errors.city?.message} />
            <IconInput id="addr" icon={MapPin} label="Adresa" placeholder="Rr. Garibaldi, Nr. 12" value={w2("address")} onChange={v => f2.setValue("address", v)} error={f2.formState.errors.address?.message} />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-2 pl-1" style={{ color: "rgba(255,255,255,0.3)" }}>Gjinia e klientelës</div>
              <GenderPicker value={w2("gender")} onChange={v => f2.setValue("gender", v as any)} />
              {f2.formState.errors.gender && <p className="text-xs pl-1 mt-1" style={{ color: "#f87171" }}>{f2.formState.errors.gender.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <IconInput id="lat" icon={MapPin} label="Gjerësia (lat)" type="number" placeholder="42.6629" value={w2("latitude")} onChange={v => f2.setValue("latitude", v)} hint="Opsionale" />
              <IconInput id="lng" icon={MapPin} label="Gjatësia (lng)" type="number" placeholder="21.1655" value={w2("longitude")} onChange={v => f2.setValue("longitude", v)} hint="Opsionale" />
            </div>
            <TextareaInput id="desc" label="Përshkrimi (opsionale)" placeholder="Tregoni diçka për sallon tuaj..." value={w2("description")} onChange={v => f2.setValue("description", v)} />
            <div className="flex gap-3 pt-1">
              <BackBtn onClick={() => setStep(0)} />
              <PrimaryBtn>Vazhdo <ArrowRight className="w-4 h-4" /></PrimaryBtn>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={f3.handleSubmit(submit3)} className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              <Layers className="w-3.5 h-3.5" /> Media & Pagesa
            </div>
            <IconInput id="img"  icon={Layers} label="Logo URL (opsionale)" placeholder="https://..." value={w3("imageUrl")} onChange={v => f3.setValue("imageUrl", v)} />
            <IconInput id="iban" icon={Layers} label="IBAN (opsionale)" placeholder="XK05 1212..." value={w3("iban")} onChange={v => f3.setValue("iban", v)} />

            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest pl-1" style={{ color: "rgba(255,255,255,0.3)" }}>Fotot e sallonit (opsionale)</div>
              {photos.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex-1 rounded-[14px] transition-all"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <input type="text" placeholder={`https://.../foto-${i + 1}.jpg`} value={url}
                      onChange={e => setPhotos(p => p.map((v, idx) => idx === i ? e.target.value : v))}
                      className="w-full bg-transparent px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/20 rounded-[14px]" />
                  </div>
                  {photos.length > 1 && (
                    <button type="button" onClick={() => setPhotos(p => p.filter((_, idx) => idx !== i))}
                      className="w-10 h-10 my-auto flex items-center justify-center rounded-xl transition-all"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setPhotos(p => [...p, ""])}
                className="flex items-center gap-1.5 text-xs font-medium transition-colors pl-1 pt-0.5"
                style={{ color: PRIMARY }}>
                <Plus className="w-3.5 h-3.5" /> Shto foto tjetër
              </button>
            </div>

            <div className="flex gap-3 pt-1">
              <BackBtn onClick={() => setStep(1)} />
              <PrimaryBtn disabled={mut.isPending}>
                {mut.isPending ? <><span className="w-4 h-4 rounded-full border-2 border-white/25 border-t-white animate-spin" /> Duke regjistruar...</> : <>Regjistro biznesin <ArrowRight className="w-4 h-4" /></>}
              </PrimaryBtn>
            </div>
          </form>
        )}
      </StepSlide>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────── */
export default function Register() {
  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "#080b12", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Left brand panel ──────────────────────────── */}
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
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-15" style={{
          background: "radial-gradient(circle, #4f8ef7 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />

        <div className="relative z-10 flex flex-col justify-between h-full p-11">
          <Link href="/" className="flex items-center gap-2.5 animate-fade-in w-fit">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#4f8ef7", boxShadow: "0 4px 20px rgba(79,142,247,0.4)" }}>
              <Scissors className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="text-[22px] font-bold text-white tracking-tight">TRIM<span style={{ color: "#4f8ef7" }}>.</span></span>
          </Link>

          <div className="space-y-7">
            <div className="animate-fade-up delay-100">
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
                  tënd me TRIM.
                </span>
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", maxWidth: "260px" }}>
                Bashkohu me mijëra klientë dhe berberë që zgjodhën platformën premium të Kosovës.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              {[
                "Rezervo termin në 30 sekonda",
                "Konfirmim i sigurt me OTP",
                "Gjej berberët kryesorë",
                "Produkte premium në marketplace",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 animate-slide-right"
                  style={{ animationDelay: `${200 + i * 80}ms` }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.35)" }}>
                    <Check className="w-2.5 h-2.5" style={{ color: "#4f8ef7" }} />
                  </div>
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social proof */}
          <div className="rounded-2xl p-4 animate-fade-up delay-400"
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
                <span className="text-white font-semibold">12,000+</span> klientë besojnë TRIM
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto flex items-start justify-center p-6 lg:p-10 relative"
        style={{ background: "#0d1117" }}
      >
        <div className="absolute top-0 right-0 w-[350px] h-[350px] pointer-events-none"
          style={{ background: "radial-gradient(circle at top right, rgba(79,142,247,0.06) 0%, transparent 70%)" }} />

        <div className="w-full max-w-[420px] relative z-10 py-8">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#4f8ef7" }}>
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">TRIM<span style={{ color: "#4f8ef7" }}>.</span></span>
          </Link>

          {/* Header */}
          <div className="mb-6 animate-fade-up">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.3)" }}>
                <Building2 className="w-4 h-4" style={{ color: "#4f8ef7" }} />
              </div>
              <h1 className="text-[26px] font-bold text-white tracking-tight">Regjistro biznesin</h1>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Shto sallon tënd dhe fillo të marrësh rezervime.</p>
          </div>

          {/* Form */}
          <div className="animate-fade-up delay-100">
            <OwnerForm />
          </div>

          <p className="text-center text-xs mt-6 animate-fade-in delay-200" style={{ color: "rgba(255,255,255,0.28)" }}>
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
