import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, Scissors, Loader2, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type EmailStatus = "idle" | "verifying" | "valid" | "invalid" | "service-down";

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending]         = useState(false);
  const [sent, setSent]               = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [emailError, setEmailError]   = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === "email") {
      setEmailStatus("idle");
      setEmailError("");
    }
  };

  async function verifyEmail(email: string): Promise<boolean> {
    setEmailStatus("verifying");
    setEmailError("");
    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { valid: boolean; reason?: string; serviceDown?: boolean };

      if (data.serviceDown) {
        setEmailStatus("service-down");
        setEmailError("We couldn't verify your email at the moment. Please try again later.");
        return false;
      }
      if (!data.valid) {
        setEmailStatus("invalid");
        setEmailError(
          data.reason
            ? `The email address appears to be invalid or does not exist. Please enter a valid email address.`
            : "The email address appears to be invalid or does not exist. Please enter a valid email address."
        );
        return false;
      }
      setEmailStatus("valid");
      return true;
    } catch {
      setEmailStatus("service-down");
      setEmailError("We couldn't verify your email at the moment. Please try again later.");
      return false;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      toast({ title: "Plotëso fushat e detyrueshme", variant: "destructive" });
      return;
    }

    const ok = await verifyEmail(form.email);
    if (!ok) return;

    setSending(true);
    await new Promise(r => setTimeout(r, 900));
    setSending(false);
    setSent(true);
    toast({ title: "Mesazhi u dërgua!", description: "Do t'ju kontaktojmë brenda 24 orëve." });
  };

  const info = [
    { icon: Mail,  label: "Email",         value: "info@trimkosova.com",          sub: "Përgjigje brenda 24 orëve" },
    { icon: Phone, label: "Telefon",        value: "+383 44 123 456",              sub: "E hënë – E premte, 09:00–18:00" },
    { icon: MapPin,label: "Adresa",         value: "Rr. Nëna Terezë, Prishtinë",  sub: "Kosovë, 10000" },
    { icon: Clock, label: "Orari i punës",  value: "E hënë – E premte",            sub: "09:00 – 18:00" },
  ];

  const emailBorderColor =
    emailStatus === "valid"        ? "border-emerald-500/60 focus:border-emerald-500/80" :
    emailStatus === "invalid"      ? "border-red-500/60 focus:border-red-500/80" :
    emailStatus === "service-down" ? "border-amber-500/60 focus:border-amber-500/80" :
    "border-border/60 focus:border-primary/50";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="py-24 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0c1445 0%, #1a1060 50%, #081229 100%)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-primary/12 rounded-full blur-3xl pointer-events-none" />
        <div className="container px-6 max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/8 border border-white/12 px-4 py-2 rounded-full text-xs font-semibold text-primary mb-6">
            <Scissors className="w-3.5 h-3.5" />
            Na kontaktoni
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Si mund t'ju ndihmojmë?
          </h1>
          <p className="text-xl text-white/55 max-w-xl mx-auto">
            Jemi këtu për çdo pyetje rreth platformës, partneriteteve ose mbështetjes teknike.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container px-6 max-w-6xl mx-auto py-20">
        <div className="grid lg:grid-cols-5 gap-12">

          {/* Left: Contact info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Informacioni i kontaktit</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Zgjidhni mënyrën që ju përshtatet më mirë për të komunikuar me ekipin tonë.
              </p>
            </div>
            <div className="space-y-4">
              {info.map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="flex gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/25 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold">{value}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/15">
              <p className="text-sm font-bold mb-1">Na ndiqni</p>
              <p className="text-xs text-muted-foreground mb-3">Lajmet e fundit dhe oferta ekskluzive</p>
              <div className="flex gap-2">
                {["Instagram", "Facebook", "TikTok"].map(s => (
                  <button key={s} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border/60 hover:border-primary/40 hover:text-primary transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-3">
            <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-xl shadow-black/5">
              {sent ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Mesazhi u dërgua!</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Faleminderit që na kontaktuat. Ekipi ynë do t'ju përgjigjet brenda 24 orëve.
                  </p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); setEmailStatus("idle"); }}
                    className="mt-6 text-sm text-primary font-semibold hover:underline"
                  >
                    Dërgoni mesazh tjetër
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Dërgoni një mesazh</h3>
                    <p className="text-sm text-muted-foreground">Plotësoni formularin dhe do t'ju kontaktojmë sa më shpejt.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                        Emri i plotë <span className="text-primary">*</span>
                      </label>
                      <input
                        name="name" value={form.name} onChange={handleChange}
                        placeholder="Artan Berisha"
                        className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/50"
                      />
                    </div>

                    {/* Email with live verification indicator */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                        Email <span className="text-primary">*</span>
                      </label>
                      <div className="relative">
                        <input
                          name="email" type="email" value={form.email} onChange={handleChange}
                          placeholder="artan@email.com"
                          className={`w-full px-4 py-3 pr-10 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/50 ${emailBorderColor}`}
                        />
                        {/* Status icon */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {emailStatus === "verifying" && (
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          )}
                          {emailStatus === "valid" && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                          {emailStatus === "invalid" && (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          {emailStatus === "service-down" && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      </div>

                      {/* Error / warning message */}
                      {(emailStatus === "invalid" || emailStatus === "service-down") && emailError && (
                        <div className={`mt-1.5 flex items-start gap-1.5 text-xs rounded-lg px-3 py-2 ${
                          emailStatus === "invalid"
                            ? "bg-red-500/8 border border-red-500/20 text-red-500"
                            : "bg-amber-500/8 border border-amber-500/20 text-amber-600"
                        }`}>
                          {emailStatus === "invalid"
                            ? <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            : <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          }
                          <span>{emailError}</span>
                        </div>
                      )}
                      {emailStatus === "valid" && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Email i vlefshëm
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                        Telefoni
                      </label>
                      <input
                        name="phone" value={form.phone} onChange={handleChange}
                        placeholder="+383 44 000 000"
                        className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/50"
                      />
                    </div>
                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                        Tema
                      </label>
                      <select
                        name="subject" value={form.subject} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all text-muted-foreground"
                      >
                        <option value="">Zgjidhni temën</option>
                        <option value="support">Mbështetje teknike</option>
                        <option value="partnership">Partneritet / Regjistrim dyqani</option>
                        <option value="billing">Faturimi &amp; Pagesa</option>
                        <option value="feedback">Koment / Sugjerim</option>
                        <option value="other">Tjetër</option>
                      </select>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      Mesazhi <span className="text-primary">*</span>
                    </label>
                    <textarea
                      name="message" value={form.message} onChange={handleChange}
                      rows={5} placeholder="Shkruani mesazhin tuaj këtu..."
                      className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none placeholder:text-muted-foreground/50"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={sending || emailStatus === "verifying" || emailStatus === "invalid"}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-primary text-white font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {emailStatus === "verifying" ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Duke verifikuar emailin...</>
                    ) : sending ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Duke dërguar...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Dërgo Mesazhin</>
                    )}
                  </button>

                  <p className="text-xs text-center text-muted-foreground">
                    Duke dërguar, pranoni{" "}
                    <span className="text-primary cursor-pointer hover:underline">Kushtet e Përdorimit</span>{" "}
                    dhe{" "}
                    <span className="text-primary cursor-pointer hover:underline">Politikën e Privatësisë</span>.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
