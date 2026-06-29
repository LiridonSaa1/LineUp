import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, Scissors, Mail, Lock,
  Building2, MapPin, Phone, Layers, Check, Upload, X, ImagePlus,
  ChevronDown, CreditCard,
} from "lucide-react";

const KOSOVO_CITIES = [
  "Prishtinë", "Prizren", "Pejë", "Gjakovë", "Gjilan", "Mitrovicë",
  "Ferizaj", "Vushtrri", "Suharekë", "Rahovec", "Malishevë", "Skënderaj",
  "Klinë", "Istog", "Deçan", "Junik", "Dragash", "Shtime", "Lipjan",
  "Podujevë", "Drenas", "Obiliq", "Fushë Kosovë", "Kaçanik", "Viti",
  "Kamenicë", "Novobërdë",
];

/* ── Schemas ─────────────────────────────────────────────── */
const step1Schema = z.object({
  businessName: z.string().min(2, "Emri i biznesit i detyrueshëm"),
  email:        z.string().email("Email i pavlefshëm"),
  phone:        z.string().min(5, "Telefoni i detyrueshëm"),
  password:     z.string().min(6, "Minimum 6 karaktere"),
  city:         z.string().min(1, "Qyteti i detyrueshëm"),
  address:      z.string().min(3, "Adresa e detyrueshme"),
});

type S1Values = z.infer<typeof step1Schema>;

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

/* ── City Dropdown ───────────────────────────────────────── */
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
          className="w-full rounded-[14px] transition-all duration-200 flex items-center"
          style={{
            background: open ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${open ? "rgba(79,142,247,0.45)" : error ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
            boxShadow: open ? "0 0 0 3px rgba(79,142,247,0.10), 0 4px 16px rgba(0,0,0,0.2)" : "none",
            paddingTop: "26px", paddingBottom: "10px", paddingLeft: "44px", paddingRight: "44px",
          }}>
          <span className="text-sm text-left w-full" style={{ color: value ? "#fff" : "rgba(255,255,255,0.35)" }}>
            {value || ""}
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
          <ChevronDown className="w-4 h-4 transition-transform duration-200" style={{
            color: "rgba(255,255,255,0.28)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }} />
        </div>
        {open && (
          <div className="absolute z-50 w-full mt-1.5 rounded-[14px] overflow-hidden overflow-y-auto"
            style={{
              background: "#12151e",
              border: "1px solid rgba(79,142,247,0.25)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              maxHeight: "220px",
            }}>
            {KOSOVO_CITIES.map(city => (
              <button key={city} type="button"
                onClick={() => { onChange(city); setOpen(false); }}
                className="w-full px-4 py-2.5 text-left text-sm transition-all duration-150"
                style={{
                  background: city === value ? "rgba(79,142,247,0.15)" : "transparent",
                  color: city === value ? "#7db3ff" : "rgba(255,255,255,0.7)",
                }}
                onMouseEnter={e => { if (city !== value) (e.target as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = city === value ? "rgba(79,142,247,0.15)" : "transparent"; }}>
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

/* ── File Upload ─────────────────────────────────────────── */
function FileUploadBox({
  label, accept = "image/*", preview, onFile, onRemove, loading,
}: {
  label: string; accept?: string; preview?: string;
  onFile: (file: File) => void; onRemove: () => void; loading?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest mb-2 pl-1"
        style={{ color: "rgba(255,255,255,0.3)" }}>
        {label}
      </div>
      {preview ? (
        <div className="relative rounded-[14px] overflow-hidden"
          style={{ border: "1px solid rgba(79,142,247,0.3)", background: "rgba(255,255,255,0.03)" }}>
          <img src={preview} alt="preview" className="w-full h-28 object-cover" />
          <button type="button" onClick={onRemove}
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="w-full h-24 rounded-[14px] flex flex-col items-center justify-center gap-2 transition-all duration-200"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1.5px dashed rgba(255,255,255,0.12)",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(79,142,247,0.4)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}>
          {loading
            ? <span className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            : <><ImagePlus className="w-5 h-5" style={{ color: "rgba(255,255,255,0.3)" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Kliko për të ngarkuar</span></>
          }
        </button>
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
    </div>
  );
}

/* ── Photo Grid Upload ───────────────────────────────────── */
function PhotosUpload({ photos, onAdd, onRemove, loadingIdx }: {
  photos: { url: string; preview: string }[];
  onAdd: (file: File) => void;
  onRemove: (i: number) => void;
  loadingIdx: number | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest mb-2 pl-1"
        style={{ color: "rgba(255,255,255,0.3)" }}>
        Fotot e sallonit (opsionale)
      </div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <div key={i} className="relative rounded-xl overflow-hidden aspect-square"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <img src={p.preview} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => onRemove(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.7)" }}>
              <X className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
        ))}
        {loadingIdx !== null && (
          <div className="aspect-square rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}>
            <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          </div>
        )}
        {photos.length < 6 && loadingIdx === null && (
          <button type="button" onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
            style={{ background: "rgba(255,255,255,0.02)", border: "1.5px dashed rgba(255,255,255,0.1)" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(79,142,247,0.35)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}>
            <Upload className="w-4 h-4" style={{ color: "rgba(255,255,255,0.25)" }} />
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>Shto</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && onAdd(e.target.files[0])} />
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
      <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${((current) / total) * 100}%`, background: `linear-gradient(90deg, ${PRIMARY}, #93c5fd)` }} />
      </div>
    </div>
  );
}

/* ── Primary button ──────────────────────────────────────── */
function PrimaryBtn({ children, disabled, type = "submit", onClick }: {
  children: React.ReactNode; disabled?: boolean; type?: "submit" | "button"; onClick?: () => void;
}) {
  return (
    <button type={type} disabled={disabled} onClick={onClick}
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

/* ── Upload helper ───────────────────────────────────────── */
async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Ngarkimi dështoi");
  const data = await res.json();
  return data.url as string;
}

/* ── Owner multi-step ────────────────────────────────────── */
function OwnerForm() {
  const [step, setStep]   = useState(0);
  const [, setLocation]   = useLocation();
  const { login }         = useAuth();
  const { toast }         = useToast();
  const [s1, setS1]       = useState<S1Values | null>(null);

  const [logoUrl, setLogoUrl]       = useState<string>("");
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoLoading, setLogoLoading] = useState(false);

  const [photos, setPhotos]         = useState<{ url: string; preview: string }[]>([]);
  const [photoLoadingIdx, setPhotoLoadingIdx] = useState<number | null>(null);

  const [paying, setPaying] = useState(false);

  const f1 = useForm<S1Values>({ resolver: zodResolver(step1Schema), defaultValues: { businessName: "", email: "", phone: "", password: "", city: "", address: "" } });

  const w1 = (k: keyof S1Values) => (f1.watch(k) ?? "") as string;

  async function handleLogoFile(file: File) {
    setLogoPreview(URL.createObjectURL(file));
    setLogoLoading(true);
    try {
      const url = await uploadFile(file);
      setLogoUrl(url);
    } catch {
      toast({ variant: "destructive", title: "Logo nuk u ngarkua" });
      setLogoPreview("");
    } finally {
      setLogoLoading(false);
    }
  }

  async function handlePhotoFile(file: File) {
    const idx = photos.length;
    setPhotoLoadingIdx(idx);
    const preview = URL.createObjectURL(file);
    try {
      const url = await uploadFile(file);
      setPhotos(p => [...p, { url, preview }]);
    } catch {
      toast({ variant: "destructive", title: "Foto nuk u ngarkua" });
    } finally {
      setPhotoLoadingIdx(null);
    }
  }

  async function handlePay() {
    if (!s1) return;
    setPaying(true);
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
          businessNumber: null,
          city: s1.city,
          address: s1.address,
          description: null,
          imageUrl: logoUrl || null,
          photos: photos.map(p => p.url),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Regjistrimi dështoi", description: data.error });
        return;
      }
      login(data.token, data.user);
      window.location.href = data.stripeUrl;
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gabim", description: err.message });
    } finally {
      setPaying(false);
    }
  }

  return (
    <div>
      <StepBar current={step} total={2} />
      <StepSlide step={step}>
        {step === 0 && (
          <form onSubmit={f1.handleSubmit(d => { setS1(d); setStep(1); })} className="space-y-3.5">
            <div className="text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              <Building2 className="w-3.5 h-3.5" /> Informata Bazë
            </div>
            <IconInput id="bname"  icon={Building2} label="Emri i biznesit" placeholder="TRIM Prishtina" value={w1("businessName")} onChange={v => f1.setValue("businessName", v)} error={f1.formState.errors.businessName?.message} />
            <IconInput id="oemail" icon={Mail}       label="Email" type="email" placeholder="biznesi@shembull.com" value={w1("email")} onChange={v => f1.setValue("email", v)} error={f1.formState.errors.email?.message} />
            <IconInput id="ophone" icon={Phone}      label="Telefoni" type="tel" placeholder="+383 44 000 000" value={w1("phone")} onChange={v => f1.setValue("phone", v)} error={f1.formState.errors.phone?.message} />
            <IconInput id="opw"    icon={Lock}       label="Fjalëkalimi" type="password" value={w1("password")} onChange={v => f1.setValue("password", v)} error={f1.formState.errors.password?.message} />
            <div className="text-xs font-semibold uppercase tracking-widest mt-4 mb-1 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              <MapPin className="w-3.5 h-3.5" /> Lokacioni
            </div>
            <CityDropdown
              value={w1("city")}
              onChange={v => f1.setValue("city", v)}
              error={f1.formState.errors.city?.message}
            />
            <IconInput id="addr" icon={MapPin} label="Adresa" placeholder="Rr. Garibaldi, Nr. 12" value={w1("address")} onChange={v => f1.setValue("address", v)} error={f1.formState.errors.address?.message} />
            <div className="pt-1"><PrimaryBtn>Vazhdo <ArrowRight className="w-4 h-4" /></PrimaryBtn></div>
          </form>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              <Layers className="w-3.5 h-3.5" /> Media
            </div>

            <FileUploadBox
              label="Logo e sallonit (opsionale)"
              preview={logoPreview}
              onFile={handleLogoFile}
              onRemove={() => { setLogoUrl(""); setLogoPreview(""); }}
              loading={logoLoading}
            />

            <PhotosUpload
              photos={photos}
              onAdd={handlePhotoFile}
              onRemove={i => setPhotos(p => p.filter((_, idx) => idx !== i))}
              loadingIdx={photoLoadingIdx}
            />

            {/* Pricing card */}
            <div className="rounded-[14px] p-4" style={{ background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.2)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" style={{ color: PRIMARY }} />
                  <span className="text-sm font-semibold text-white">TRIM Pro</span>
                </div>
                <span className="text-lg font-bold" style={{ color: PRIMARY }}>5€<span className="text-xs font-normal text-white/40">/muaj</span></span>
              </div>
              <ul className="space-y-1">
                {["Listim i pakufizuar i sallonit", "Sistemi i rezervimit online", "Njoftimet me email për klientët", "Panel i menaxhimit"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <Check className="w-3 h-3" style={{ color: PRIMARY }} /> {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <BackBtn onClick={() => setStep(0)} />
              <PrimaryBtn type="button" disabled={paying} onClick={handlePay}>
                {paying
                  ? <><span className="w-4 h-4 rounded-full border-2 border-white/25 border-t-white animate-spin" /> Duke procesuar...</>
                  : <><CreditCard className="w-4 h-4" /> Paguaj 5€/muaj</>
                }
              </PrimaryBtn>
            </div>

            <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.22)" }}>
              Do të ridrejtoheni te Stripe për pagesë të sigurt. Fatura dërgohet me email pas pagesës.
            </p>
          </div>
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
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#4f8ef7" }}>
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">TRIM<span style={{ color: "#4f8ef7" }}>.</span></span>
          </Link>

          <div className="mb-6 animate-fade-up">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.3)" }}>
                <Building2 className="w-4 h-4" style={{ color: "#4f8ef7" }} />
              </div>
              <h1 className="text-[26px] font-bold text-white tracking-tight">Regjistro biznesin</h1>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Shto sallon tënd dhe fillo të marrësh rezervime.</p>
          </div>

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
