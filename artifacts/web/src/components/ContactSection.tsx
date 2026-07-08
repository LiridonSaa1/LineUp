import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { CheckCircle2, Mail, MapPin, Phone, Send, Sparkles } from "lucide-react";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}

const initialForm = { name: "", email: "", phone: "", subject: "", message: "" };

export default function ContactSection() {
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { ref, inView } = useInView(0.1);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Contact form failed");
      setSent(true);
    } catch {
      setError("Mesazhi nuk u dergua. Provoni perseri.");
    } finally {
      setSending(false);
    }
  };

  const contactInfo = [
    { icon: Mail, label: "Email", value: "info@trimkosova.com", sub: "Brenda 24 oreve" },
    { icon: Phone, label: "Telefon", value: "+383 44 123 456", sub: "E hene-E premte, 09-18" },
    { icon: MapPin, label: "Adresa", value: "Rr. Nena Tereze, Prishtine", sub: "Kosove 10000" },
  ];

  return (
    <section id="kontakt" className="relative overflow-hidden bg-primary/6 py-24" ref={ref}>
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

      <div className="container mx-auto max-w-7xl px-6">
        <div
          className="mb-14 text-center"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div className="mb-3 flex items-center justify-center gap-2">
            <div className="h-[2px] w-5 rounded-full bg-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Na kontaktoni</span>
            <div className="h-[2px] w-5 rounded-full bg-primary" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Si mund t'ju ndihmojme?</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Pyetje rreth platformes, partneriteteve ose mbeshtetjes teknike - jemi ketu.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-5">
          <div
            className="space-y-4 lg:col-span-2"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateX(0)" : "translateX(-30px)",
              transition: "opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s",
            }}
          >
            {contactInfo.map(({ icon: Icon, label, value, sub }) => (
              <div
                key={label}
                className="group flex gap-4 rounded-2xl border border-border/50 bg-card p-5 transition-colors hover:border-primary/25"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
                  <p className="text-sm font-semibold">{value}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-primary/15 bg-primary/8 p-5">
              <p className="mb-1 text-sm font-bold">Deshiron te bashkohesh si pronar?</p>
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                Regjistro dyqanin tend falas dhe fillo te marresh kliente te rinj sot.
              </p>
              <Link
                href="/register"
                className="btn-pill inline-flex items-center gap-1.5 bg-primary px-4 py-2 text-xs font-bold text-white"
              >
                <Sparkles className="h-3 w-3" />
                Fillo Falas
              </Link>
            </div>
          </div>

          <div
            className="lg:col-span-3"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateX(0)" : "translateX(30px)",
              transition: "opacity 0.6s ease 0.25s, transform 0.6s ease 0.25s",
            }}
          >
            <div className="rounded-3xl border border-border/50 bg-card p-8 shadow-xl shadow-black/5">
              {sent ? (
                <div className="py-14 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="mb-2 text-2xl font-bold">Mesazhi u dergua!</h3>
                  <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Faleminderit! Ekipi yne do t'ju pergjigjet brenda 24 oreve.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setError("");
                      setForm(initialForm);
                    }}
                    className="mt-6 text-sm font-semibold text-primary hover:underline"
                  >
                    Dergoni mesazh tjeter
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h3 className="mb-1 text-xl font-bold">Dergoni nje mesazh</h3>
                    <p className="text-sm text-muted-foreground">Plotesoni formularin dhe do t'ju kontaktojme sa me shpejt.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Emri i plote <span className="text-primary">*</span>
                      </label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Artan Berisha"
                        className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Email <span className="text-primary">*</span>
                      </label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="artan@email.com"
                        className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Telefoni
                      </label>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+383 44 000 000"
                        className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Tema
                      </label>
                      <select
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                      >
                        <option value="">Zgjidhni temen</option>
                        <option value="support">Mbeshtetje teknike</option>
                        <option value="partnership">Partneritet / Regjistrim dyqani</option>
                        <option value="billing">Faturimi &amp; Pagesa</option>
                        <option value="feedback">Koment / Sugjerim</option>
                        <option value="other">Tjeter</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Mesazhi <span className="text-primary">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Shkruani mesazhin tuaj ketu..."
                      className="w-full resize-none rounded-xl border border-border/60 bg-background px-4 py-3 text-sm transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                    />
                  </div>

                  {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

                  <button
                    type="submit"
                    disabled={sending || !form.name || !form.email || !form.message}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary py-3.5 text-base font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Duke derguar...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Dergo Mesazhin
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
