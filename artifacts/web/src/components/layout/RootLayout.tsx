import { Navbar } from "./Navbar";
import { Link } from "wouter";
import { Scissors, MapPin, Calendar, ShoppingBag, Mail, Twitter, Instagram } from "lucide-react";

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="relative overflow-hidden border-t border-border/50 bg-card/30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="container px-6 max-w-7xl mx-auto py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Scissors className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold tracking-tight">TRIM<span className="text-primary">.</span></span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Kosovo's premium barbershop booking platform. Find, book, and enjoy.
              </p>
              <div className="flex gap-3 mt-5">
                {[Instagram, Twitter, Mail].map((Icon, i) => (
                  <button key={i} className="w-9 h-9 glass rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/8 transition-all">
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Discover */}
            <div>
              <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Discover
              </h4>
              <ul className="space-y-2.5">
                {["All barbershops", "Prishtina", "Prizren", "Peja", "Gjilan", "Ferizaj"].map(item => (
                  <li key={item}>
                    <Link href={item === "All barbershops" ? "/barbershops" : `/barbershops?city=${item}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Platform
              </h4>
              <ul className="space-y-2.5">
                {[
                  ["Book appointment", "/barbershops"],
                  ["Shop products", "/marketplace"],
                  ["My appointments", "/appointments"],
                  ["My orders", "/orders"],
                  ["Profile", "/profile"],
                ].map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Business */}
            <div>
              <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-primary" /> For owners
              </h4>
              <ul className="space-y-2.5">
                {[
                  "Partner with us",
                  "Owner dashboard",
                  "Pricing",
                  "Help center",
                  "Contact us",
                ].map(item => (
                  <li key={item}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} TRIM. All rights reserved. Made in Kosovo 🇽🇰
            </p>
            <div className="flex gap-6">
              {["Terms", "Privacy", "Cookies"].map(item => (
                <span key={item} className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
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
