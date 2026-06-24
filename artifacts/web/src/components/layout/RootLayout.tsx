import { Navbar } from "./Navbar";
import { Link } from "wouter";
import {
  MapPin, Calendar, ShoppingBag,
  Mail, Twitter, Instagram, ArrowUpRight,
  Sparkles, Phone,
} from "lucide-react";
import logoImg from "@assets/LINE_1782305856031.png";

function FooterSection({ label, icon: Icon, children }: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">
          //
        </span>
        <Icon className="w-3.5 h-3.5 text-primary" />
        <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-foreground/70">{label}</h4>
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
        className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
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
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* ── Ad Banner ── */}
      <div className="border-t border-border/40 bg-gradient-to-r from-card/80 via-card to-card/80">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-10 bg-primary rounded-full shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 block mb-0.5">
                  Reklamë Sponsorizuese
                </span>
                <p className="text-sm font-semibold text-foreground">
                  Regjistro dyqanin tënd në TRIM — Hapi i parë drejt klientëve të rinj
                </p>
              </div>
            </div>
            <Link
              href="/register"
              className="btn-pill shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold shadow-sm shadow-primary/20 hover:shadow-primary/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Fillo Falas
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative overflow-hidden border-t border-border/50 bg-card/50">
        {/* Animated top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-shimmer-line" />
        </div>

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-primary/4 rounded-full blur-3xl animate-glow-pulse" />
        </div>

        <div className="container px-6 max-w-7xl mx-auto pt-14 pb-10 relative z-10">
          {/* Section label */}
          <div className="flex items-center gap-3 mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/40">// TRIM</span>
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/40">Kosovo's Barbershop Network</span>
          </div>

          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src={logoImg} alt="TRIM" className="h-8 w-auto object-contain" style={{ filter: "brightness(0)" }} />
                <span className="text-xl font-bold tracking-tight">TRIM<span className="text-primary">.</span></span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
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
                    className="w-9 h-9 rounded-xl border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Discover */}
            <FooterSection label="Zbulo" icon={MapPin}>
              <ul className="space-y-3">
                {[
                  ["Të gjitha barberët", "/barbershops"],
                  ["Prishtinë", "/barbershops?city=Prishtinë"],
                  ["Prizren", "/barbershops?city=Prizren"],
                  ["Pejë", "/barbershops?city=Pejë"],
                  ["Gjakovë", "/barbershops?city=Gjakovë"],
                  ["Gjilan", "/barbershops?city=Gjilan"],
                ].map(([label, href]) => (
                  <FooterLink key={label} href={href}>{label}</FooterLink>
                ))}
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
                  ["Qendra e ndihmës", "/"],
                  ["Na kontakto", "/"],
                ].map(([label, href]) => (
                  <FooterLink key={label} href={href}>{label}</FooterLink>
                ))}
              </ul>
              <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/15">
                <p className="text-xs font-semibold text-foreground mb-1">Bashkohu me ne</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mbi 340 berberë tashmë e besojnë TRIM-in.
                </p>
              </div>
            </FooterSection>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-border/40">
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} TRIM. Të gjitha të drejtat e rezervuara.
              </p>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs font-medium text-muted-foreground">
                Made in Kosovo 🇽🇰
              </span>
            </div>
            <div className="flex gap-5">
              {["Kushtet e Përdorimit", "Privatësia", "Cookies"].map(item => (
                <span
                  key={item}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
