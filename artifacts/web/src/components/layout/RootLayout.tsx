import { Navbar } from "./Navbar";
import { Link } from "wouter";
import { KOSOVO_CITIES } from "@/lib/kosovo-cities";
import { useState, useEffect } from "react";
import {
  MapPin, Calendar, ShoppingBag,
  Mail, Twitter, Instagram, ArrowUpRight,
  Sparkles, Phone, Users, Star, ArrowUp,
} from "lucide-react";
import logoImg from "@assets/LINE_(2)_1782421072087.png";

function FooterSection({ label, icon: Icon, children }: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
          //
        </span>
        <Icon className="w-3.5 h-3.5 text-primary" />
        <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-300">{label}</h4>
      </div>
      {children}
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-100 transition-colors duration-200"
      >
        <span className="relative">
          {children}
          <span className="absolute -bottom-px left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
        </span>
        <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
      </Link>
    </li>
  );
}

export function RootLayout({ children }: { children: React.ReactNode }) {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* ── Ad Banner ── */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(90deg, #0a0f20 0%, #0d1a4a 25%, #1a2580 50%, #0d1a4a 75%, #0a0f20 100%)" }}>
        {/* Animated shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shimmer-line pointer-events-none" />
        {/* Top + bottom accent lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6 flex-wrap">

            {/* Left: badge + text */}
            <div className="flex items-center gap-4 min-w-0">
              {/* Pulsing dot */}
              <div className="relative shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-glow-pulse" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-primary/40 animate-ping" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/35">
                    Reklamë Sponsorizuese
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-[9px] font-bold text-emerald-400 tracking-wide uppercase">
                    30 ditë Falas
                  </span>
                </div>
                <p className="text-sm font-bold text-white truncate">
                  Regjistro dyqanin tënd në Line UP{" "}
                  <span className="hidden md:inline text-white/60 font-normal">
                    — Hapi i parë drejt klientëve të rinj
                  </span>
                </p>
              </div>

              {/* Stats pills — hidden on mobile */}
              <div className="hidden lg:flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 bg-white/8 border border-white/10 px-3 py-1.5 rounded-full">
                  <Users className="w-3 h-3 text-primary" />
                  <span className="text-[11px] font-semibold text-white/70">340+ berberë</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/8 border border-white/10 px-3 py-1.5 rounded-full">
                  <Star className="w-3 h-3 text-amber-400" />
                  <span className="text-[11px] font-semibold text-white/70">4.9 vlerësim</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/8 border border-white/10 px-3 py-1.5 rounded-full">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px] font-semibold text-white/70">10€/muaj</span>
                </div>
              </div>
            </div>

            {/* Right: CTA */}
            <Link
              href="/register"
              className="btn-pill shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-900 text-sm font-bold hover:bg-white/90 transition-colors shadow-lg shadow-black/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Fillo Falas
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative overflow-hidden border-t border-white/8 bg-zinc-950">
        {/* Animated top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-shimmer-line" />
        </div>

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[220px] bg-primary/5 rounded-full blur-3xl animate-glow-pulse" />
        </div>

        <div className="container px-6 max-w-7xl mx-auto pt-14 pb-10 relative z-10">
          {/* Section label */}
          <div className="flex items-center gap-3 mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">// LINE UP</span>
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">Kosovo's Barbershop Network</span>
          </div>

          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src={logoImg} alt="Line UP" className="h-24 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} />
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed mb-5">
                Platforma premium e rezervimit të berberive në Kosovë. Gjej, rezervo, dhe shijo.
              </p>
              <div className="flex gap-2.5">
                {[
                  { Icon: Instagram, label: "Instagram" },
                  { Icon: Twitter, label: "Twitter" },
                  { Icon: Mail, label: "Email" },
                  { Icon: Phone, label: "Telefon" },
                ].map(({ Icon, label }) => (
                  <button
                    key={label}
                    aria-label={label}
                    className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-zinc-500 hover:text-primary hover:border-primary/40 hover:bg-primary/8 transition-all duration-200"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Discover */}
            <FooterSection label="Zbulo" icon={MapPin}>
              <ul className="space-y-3">
                <FooterLink href="/barbershops">Të gjitha barberët</FooterLink>
              </ul>
            </FooterSection>

            {/* Platform */}
            <FooterSection label="Platforma" icon={Calendar}>
              <ul className="space-y-3">
                {[
                  ["Rezervo termin", "/barbershops"],
                  ["Dyqani i produkteve", "/marketplace"],
                  ["Takimet e mia", "/appointments"],
                  ["Porositë e mia", "/orders"],
                  ["Profili im", "/profile"],
                  ["Njoftimet", "/notifications"],
                ].map(([label, href]) => (
                  <FooterLink key={label} href={href}>{label}</FooterLink>
                ))}
              </ul>
            </FooterSection>

            {/* Business */}
            <FooterSection label="Për pronarë" icon={ShoppingBag}>
              <ul className="space-y-3">
                {[
                  ["Regjistro dyqanin", "/register"],
                  ["Paneli i pronarit", "/dashboard"],
                  ["Çmimet & Planet", "/register"],
                  ["Qendra e ndihmës", "/contact"],
                  ["Na kontakto", "/contact"],
                ].map(([label, href]) => (
                  <FooterLink key={label} href={href}>{label}</FooterLink>
                ))}
              </ul>
              <div className="mt-6 p-4 rounded-2xl bg-primary/8 border border-primary/15">
                <p className="text-xs font-semibold text-zinc-200 mb-1">Bashkohu me ne</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Mbi 340 berberë tashmë e besojnë Line UP-in.
                </p>
              </div>
            </FooterSection>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-white/8">
            <div className="flex items-center gap-3">
              <p className="text-xs text-zinc-600">
                © {new Date().getFullYear()} Line UP. Të gjitha të drejtat e rezervuara.
              </p>
              <span className="text-xs text-zinc-700">·</span>
              <span className="text-xs font-medium text-zinc-600">
                Made in Kosovo 🇽🇰
              </span>
            </div>
            <div className="flex gap-5">
              {["Kushtet e Përdorimit", "Privatësia", "Cookies"].map(item => (
                <span
                  key={item}
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Go to Top button ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Shko lart"
        className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg shadow-black/40 transition-all duration-300 ${
          showTop
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        style={{
          background: "rgba(15,15,20,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <ArrowUp className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
