import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useListTopBarbershops } from "@workspace/api-client-react";
import { MapPin, Star, Scissors, ArrowRight, Search, Shield, Zap, Sparkles, ChevronRight, Check, Users, Calendar, TrendingUp, Play, ShoppingBag } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import barberToolsBg from "@assets/vintage-equipment-of-barber-shop-on-wood-backgroun-2023-11-27-_1782291490098.jpg";
import barberCutout from "@assets/bearded-handsome-barber-holding-comb-and-scissors-2023-11-27-_1782291537000.webp";

/* ── SVG Barber Tool icons ───────────────────────────────── */
const ScissorsSVG = ({ size = 64, opacity = 0.08, rotate = 0, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="hsl(38 78% 50%)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
    style={{ opacity, transform: `rotate(${rotate}deg)` }} className={className}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);

const CombSVG = ({ size = 56, opacity = 0.07, rotate = 0, className = "" }) => (
  <svg width={size} height={size * 0.45} viewBox="0 0 80 36" fill="none"
    style={{ opacity, transform: `rotate(${rotate}deg)` }} className={className}>
    <rect x="2" y="2" width="76" height="14" rx="4" stroke="hsl(38 78% 50%)" strokeWidth="2.5" fill="none"/>
    {[0,1,2,3,4,5,6,7,8].map(i => (
      <rect key={i} x={8 + i * 8} y="16" width="4" height="18" rx="2" fill="hsl(38 78% 50%)" />
    ))}
  </svg>
);

const RazorSVG = ({ size = 60, opacity = 0.08, rotate = 0, className = "" }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 40 52" fill="none"
    style={{ opacity, transform: `rotate(${rotate}deg)` }} className={className}>
    <rect x="14" y="2" width="12" height="40" rx="4" stroke="hsl(38 78% 50%)" strokeWidth="2" fill="hsl(38 78% 50%)" fillOpacity="0.15"/>
    <path d="M10 42 C10 46 14 50 20 50 C26 50 30 46 30 42 L14 42 Z" stroke="hsl(38 78% 50%)" strokeWidth="2" fill="hsl(38 78% 50%)" fillOpacity="0.12"/>
    <line x1="20" y1="6" x2="20" y2="36" stroke="hsl(38 78% 50%)" strokeWidth="1" opacity="0.5"/>
  </svg>
);

const ClipperSVG = ({ size = 72, opacity = 0.07, rotate = 0, className = "" }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 80 48" fill="none"
    style={{ opacity, transform: `rotate(${rotate}deg)` }} className={className}>
    <rect x="4" y="4" width="56" height="28" rx="8" stroke="hsl(38 78% 50%)" strokeWidth="2.2" fill="hsl(38 78% 50%)" fillOpacity="0.1"/>
    <rect x="4" y="32" width="56" height="10" rx="4" stroke="hsl(38 78% 50%)" strokeWidth="2" fill="hsl(38 78% 50%)" fillOpacity="0.12"/>
    {[0,1,2,3,4,5,6,7].map(i => (
      <line key={i} x1={8 + i * 7} y1="42" x2={8 + i * 7} y2="44" stroke="hsl(38 78% 50%)" strokeWidth="2" strokeLinecap="round"/>
    ))}
    <circle cx="68" cy="18" r="8" stroke="hsl(38 78% 50%)" strokeWidth="2" fill="hsl(38 78% 50%)" fillOpacity="0.08"/>
    <path d="M65 18 L71 18 M68 15 L68 21" stroke="hsl(38 78% 50%)" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const BarberPoleSVG = ({ size = 36, opacity = 0.09, className = "" }) => (
  <svg width={size} height={size * 3.2} viewBox="0 0 36 115" fill="none"
    style={{ opacity }} className={className}>
    <rect x="8" y="8" width="20" height="100" rx="10" stroke="hsl(38 78% 50%)" strokeWidth="2.5" fill="hsl(38 78% 50%)" fillOpacity="0.08"/>
    {[0,1,2,3,4].map(i => (
      <path key={i} d={`M8 ${16 + i * 18} Q18 ${22 + i * 18} 28 ${16 + i * 18}`}
        stroke="hsl(38 78% 50%)" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5"/>
    ))}
    <circle cx="18" cy="8" r="8" stroke="hsl(38 78% 50%)" strokeWidth="2" fill="hsl(38 78% 50%)" fillOpacity="0.12"/>
    <circle cx="18" cy="108" r="8" stroke="hsl(38 78% 50%)" strokeWidth="2" fill="hsl(38 78% 50%)" fillOpacity="0.12"/>
  </svg>
);

const StraightRazorSVG = ({ size = 68, opacity = 0.07, rotate = 0, className = "" }) => (
  <svg width={size} height={size * 0.38} viewBox="0 0 80 30" fill="none"
    style={{ opacity, transform: `rotate(${rotate}deg)` }} className={className}>
    <path d="M4 6 C4 4 6 2 8 2 L58 2 L76 14 L58 26 L8 26 C6 26 4 24 4 22 Z"
      stroke="hsl(38 78% 50%)" strokeWidth="2" fill="hsl(38 78% 50%)" fillOpacity="0.1"/>
    <path d="M58 2 L76 14 L58 26" stroke="hsl(38 78% 50%)" strokeWidth="2" fill="hsl(38 78% 50%)" fillOpacity="0.15"/>
    <line x1="4" y1="14" x2="58" y2="14" stroke="hsl(38 78% 50%)" strokeWidth="1" opacity="0.3"/>
    <circle cx="16" cy="14" r="5" stroke="hsl(38 78% 50%)" strokeWidth="1.5" fill="none"/>
  </svg>
);

/* ── Floating background tools ───────────────────────────── */
function BarberBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Top-right cluster */}
      <div className="absolute top-[6%] right-[8%] animate-drift-1" style={{ animationDelay: '0s' }}>
        <ScissorsSVG size={90} opacity={0.1} rotate={-25} />
      </div>
      <div className="absolute top-[18%] right-[22%] animate-drift-2" style={{ animationDelay: '1.2s' }}>
        <CombSVG size={70} opacity={0.08} rotate={15} />
      </div>
      <div className="absolute top-[3%] right-[38%] animate-drift-5" style={{ animationDelay: '2s' }}>
        <RazorSVG size={52} opacity={0.07} rotate={40} />
      </div>

      {/* Left side */}
      <div className="absolute top-[30%] left-[2%] animate-drift-3" style={{ animationDelay: '0.5s' }}>
        <CombSVG size={60} opacity={0.07} rotate={-10} />
      </div>
      <div className="absolute bottom-[30%] left-[6%] animate-drift-4" style={{ animationDelay: '3s' }}>
        <ScissorsSVG size={70} opacity={0.08} rotate={45} />
      </div>
      <div className="absolute top-[12%] left-[14%] animate-drift-2" style={{ animationDelay: '1.8s' }}>
        <StraightRazorSVG size={64} opacity={0.06} rotate={-20} />
      </div>

      {/* Center / scattered */}
      <div className="absolute top-[55%] right-[10%] animate-drift-1" style={{ animationDelay: '0.8s' }}>
        <ClipperSVG size={78} opacity={0.09} rotate={-12} />
      </div>
      <div className="absolute bottom-[12%] right-[28%] animate-drift-3" style={{ animationDelay: '2.5s' }}>
        <ScissorsSVG size={60} opacity={0.07} rotate={60} />
      </div>
      <div className="absolute top-[45%] left-[20%] animate-drift-5" style={{ animationDelay: '4s' }}>
        <RazorSVG size={44} opacity={0.06} rotate={-35} />
      </div>

      {/* Barber poles — vertical accents */}
      <div className="absolute top-[5%] left-[32%] animate-float-slow" style={{ animationDelay: '1s' }}>
        <BarberPoleSVG size={28} opacity={0.08} />
      </div>
      <div className="absolute bottom-[5%] right-[15%] animate-float-slow" style={{ animationDelay: '3.5s' }}>
        <BarberPoleSVG size={22} opacity={0.07} />
      </div>

      {/* Bottom row */}
      <div className="absolute bottom-[8%] left-[18%] animate-drift-2" style={{ animationDelay: '2.2s' }}>
        <StraightRazorSVG size={72} opacity={0.07} rotate={10} />
      </div>
      <div className="absolute bottom-[20%] right-[4%] animate-drift-4" style={{ animationDelay: '1.5s' }}>
        <CombSVG size={56} opacity={0.07} rotate={-30} />
      </div>
    </div>
  );
}

/* ── Animated counter hook ───────────────────────────────── */
function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

/* ── Intersection observer hook ─────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ── StatCard ────────────────────────────────────────────── */
const STAT_DELAYS = ["delay-100", "delay-200", "delay-300", "delay-400"];

function StatCard({
  value, suffix, label, icon: Icon, index, color,
}: {
  value: number; suffix: string; label: string; icon: any; index: number;
  color: { bg: string; text: string; border: string; glow: string };
}) {
  const { ref, inView } = useInView(0.2);
  const count = useCountUp(value, 2000, inView);

  return (
    <div
      ref={ref}
      className={`relative group transition-all duration-700 ${
        inView ? `opacity-100 translate-y-0 ${STAT_DELAYS[index]}` : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: inView ? `${index * 120}ms` : "0ms" }}
    >
      {/* Glow behind card */}
      <div
        className={`absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 ${color.glow}`}
      />

      <div
        className={`relative rounded-3xl border p-7 overflow-hidden transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl bg-card/80 backdrop-blur-sm ${color.border}`}
      >
        {/* Animated gradient corner accent */}
        <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${color.bg}`} />

        {/* Top row: icon + number */}
        <div className="flex items-start justify-between mb-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 ${color.bg}`}>
            <Icon className={`w-6 h-6 ${color.text}`} />
          </div>

          {/* Subtle animated dot */}
          <div className={`w-2 h-2 rounded-full mt-1 ${color.text} opacity-60 animate-pulse`} style={{ animationDelay: `${index * 300}ms` }} />
        </div>

        {/* Number */}
        <div className="mb-1">
          <span className="text-4xl font-extrabold tracking-tight stat-number text-foreground">
            {count.toLocaleString()}
          </span>
          <span className={`text-3xl font-extrabold ${color.text}`}>{suffix}</span>
        </div>

        {/* Label */}
        <p className="text-sm text-muted-foreground font-medium">{label}</p>

        {/* Animated progress bar */}
        <div className="mt-5 h-1 bg-border/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-[2000ms] ease-out ${color.bg}`}
            style={{ width: inView ? "100%" : "0%", transitionDelay: `${index * 120 + 400}ms` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── FeatureCard ─────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, desc, delay }: { icon: any; title: string; desc: string; delay: string }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={`glass rounded-2xl p-7 hover-lift group transition-all duration-500 ${inView ? `animate-fade-up ${delay}` : "opacity-0 translate-y-6"}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── StepCard ────────────────────────────────────────────── */
function StepCard({ step, title, desc, delay }: { step: string; title: string; desc: string; delay: string }) {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className={`flex gap-5 group transition-all duration-500 ${inView ? `animate-fade-up ${delay}` : "opacity-0"}`}>
      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-primary/25 group-hover:shadow-primary/40 group-hover:scale-110 transition-all duration-300">
        {step}
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-1.5">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ── ShopCard ────────────────────────────────────────────── */
function ShopCard({ shop, index }: { shop: any; index: number }) {
  const { ref, inView } = useInView();
  const delays = ["delay-75", "delay-150", "delay-200", "delay-300", "delay-400", "delay-500"];
  return (
    <Link href={`/barbershops/${shop.id}`}>
      <div
        ref={ref}
        className={`group cursor-pointer rounded-2xl overflow-hidden glass hover-lift transition-all duration-500 ${inView ? `animate-scale-in ${delays[index] || ""}` : "opacity-0"}`}
      >
        <div className="h-52 relative overflow-hidden bg-muted">
          {shop.imageUrl ? (
            <img
              src={shop.imageUrl}
              alt={shop.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Scissors className="w-12 h-12 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Rating pill */}
          <div className="absolute top-3 right-3 glass px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 animate-badge-pop">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            {shop.rating?.toFixed(1) || "E re"}
          </div>

          {/* City pill */}
          <div className="absolute bottom-3 left-3 glass px-2.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary" />
            {shop.city}
          </div>
        </div>

        <div className="p-5">
          <h3 className="font-bold text-base mb-1 truncate">{shop.name}</h3>
          <p className="text-xs text-muted-foreground mb-4 truncate">{shop.address}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {shop.totalReviews ?? 0} vlerësime
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
              Rezervo Tani <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Ticker ──────────────────────────────────────────────── */
const tickerItems = [
  "Prerje Flokësh", "Rregullim Mjekre", "Rrojë me Peshqir të Nxehtë", "Fade",
  "Skin Fade", "Line Up", "Ngjyrosje", "Larje Flokësh",
  "Prerje për Fëmijë", "Rrojë me Brisk", "Pompadour", "Burst Fade",
];

function Ticker() {
  const doubled = [...tickerItems, ...tickerItems];
  return (
    <div className="overflow-hidden py-5 border-y border-border/50 relative">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="flex animate-ticker gap-10 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-3 text-sm font-medium text-muted-foreground shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function Home() {
  const [, setLocation] = useLocation();
  const [city, setCity] = useState<string>("all");
  const statsRef = useRef<HTMLDivElement>(null);

  const { data: topShops, isLoading } = useListTopBarbershops({
    city: city !== "all" ? city : undefined,
    limit: 6,
  });

  const handleSearch = () => {
    setLocation(city !== "all" ? `/barbershops?city=${city}` : "/barbershops");
  };

  const cities = ["Prishtina", "Prizren", "Peja", "Gjakova", "Mitrovica", "Ferizaj", "Gjilan"];

  return (
    <div className="flex flex-col">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Barber tools photo background */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={barberToolsBg}
            alt=""
            className="w-full h-full object-cover opacity-[0.07] scale-105"
          />
          {/* colour overlay so readability stays high */}
          <div className="absolute inset-0 bg-background/85" />
        </div>

        {/* Background orbs */}
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] glow-orb bg-primary/10 animate-glow-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] glow-orb bg-primary/6 animate-glow-pulse delay-500" />

        {/* Grid overlay */}
        <div className="absolute inset-0 hero-grid pointer-events-none" />

        {/* Floating barber tools */}
        <BarberBackground />

        <div className="container px-6 max-w-7xl mx-auto relative z-10 py-16">
          <div className="max-w-4xl">

            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs font-semibold text-primary mb-8 animate-badge-pop">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
              Platforma #1 e Berberëve në Kosovë
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </div>

            {/* Headline */}
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.04] animate-fade-up text-foreground">
              Gjej berberin
              <br />
              <span className="text-shimmer">tënd të përsosur.</span>
            </h1>

            <p className="mt-6 text-xl text-muted-foreground max-w-xl leading-relaxed animate-fade-up delay-200">
              Rezervo takime në berbertë më të mirë të Kosovës në nën 30 sekonda. Pa telefonata, pa pritje.
            </p>

            {/* Search bar */}
            <div className="mt-10 animate-fade-up delay-300">
              <div className="glass-strong rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-xl shadow-lg shadow-black/5">
                <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/3">
                  <MapPin className="text-primary w-4 h-4 shrink-0" />
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 px-0 text-sm h-auto">
                      <SelectValue placeholder="Zgjidhni qytetin…" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="all">Kudo në Kosovë</SelectItem>
                      {cities.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <button
                  onClick={handleSearch}
                  className="btn-pill flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-white text-sm font-bold shadow-md shadow-primary/25"
                >
                  <Search className="w-4 h-4" />
                  Kërko
                </button>
              </div>
            </div>

            {/* Trust pills */}
            <div className="mt-8 flex flex-wrap gap-3 animate-fade-up delay-400">
              {[
                { icon: Check, text: "Falas për rezervim" },
                { icon: Shield, text: "Konfirmim OTP" },
                { icon: Zap, text: "Vende menjëherë" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 glass px-3.5 py-2 rounded-full text-xs font-medium text-muted-foreground">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Barber cutout figure */}
        <div className="absolute right-0 bottom-0 hidden lg:block w-[420px] xl:w-[500px] pointer-events-none select-none" style={{ zIndex: 8 }}>
          {/* Shadow under feet */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-8 bg-primary/20 blur-2xl rounded-full" />
          <img
            src={barberCutout}
            alt="Berber profesional"
            className="w-full h-auto object-contain drop-shadow-2xl animate-float-slow"
            style={{ filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.35))" }}
          />
        </div>

        {/* Floating shop preview card */}
        <div className="absolute right-[4%] top-[20%] hidden xl:block animate-float delay-300" style={{ zIndex: 10 }}>
          <div className="glass-strong rounded-2xl p-4 w-56 shadow-xl">
            <div className="w-full h-28 rounded-xl overflow-hidden mb-3 bg-muted">
              <img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400" className="w-full h-full object-cover" alt="dyqan" />
            </div>
            <p className="text-sm font-semibold">The Barber Lab</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> Prishtina</p>
            <div className="mt-2.5 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              <span className="text-xs font-bold">4.9</span>
              <span className="text-xs text-muted-foreground">· 203 vlerësime</span>
            </div>
          </div>
        </div>

        {/* Floating OTP card */}
        <div className="absolute right-[28%] bottom-[22%] hidden xl:block animate-float-slow delay-200" style={{ zIndex: 10 }}>
          <div className="glass-strong rounded-2xl px-4 py-3 shadow-md flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold">Takimi konfirmuar!</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">OTP: 847 391</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ──────────────────────────────────────── */}
      <Ticker />

      {/* ── STATS ────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        {/* Section background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/40 to-background pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-primary/5 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />

        <div className="container px-6 max-w-7xl mx-auto relative z-10">
          {/* Section label */}
          <div className="flex items-center gap-4 mb-14">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/40">// TRIM</span>
            <div className="flex-1 h-px bg-gradient-to-r from-border via-primary/20 to-transparent" />
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Numrat tanë</span>
            <div className="flex-1 h-px bg-gradient-to-l from-border via-primary/20 to-transparent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/40">Stats</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              value={6}     suffix="+"  label="Qytete në Kosovë"    icon={MapPin}   index={0}
              color={{ bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/15 hover:border-blue-500/40", glow: "bg-blue-400/20" }}
            />
            <StatCard
              value={500}   suffix="+"  label="Berberë aktivë"       icon={Scissors} index={1}
              color={{ bg: "bg-violet-500/10", text: "text-violet-500", border: "border-violet-500/15 hover:border-violet-500/40", glow: "bg-violet-400/20" }}
            />
            <StatCard
              value={12000} suffix="+"  label="Klientë të kënaqur"   icon={Users}    index={2}
              color={{ bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/15 hover:border-emerald-500/40", glow: "bg-emerald-400/20" }}
            />
            <StatCard
              value={50000} suffix="+"  label="Takime të rezervuara" icon={Calendar} index={3}
              color={{ bg: "bg-primary/10", text: "text-primary", border: "border-primary/15 hover:border-primary/40", glow: "bg-primary/20" }}
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card/50 to-background pointer-events-none" />
        <div className="container px-6 max-w-7xl mx-auto relative z-10">
          <div className="max-w-xl mb-16">
            <span className="text-xs font-semibold text-primary tracking-widest uppercase mb-3 block">Si funksionon</span>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Rezervo në 3 hapa të thjeshtë</h2>
            <p className="text-muted-foreground text-lg">Nga zbulimi deri te takimi — më shpejt se një telefonatë.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-10">
              <StepCard step="01" title="Gjej dyqanin tënd" desc="Kërko sipas qytetit, shfleto vlerësimet dhe eksploro fotot e berberive më të mira të Kosovës." delay="delay-100" />
              <StepCard step="02" title="Zgjidhni një vend" desc="Zgjidhni berberin tuaj dhe orën e preferuar nga disponueshmëria në kohë reale." delay="delay-200" />
              <StepCard step="03" title="Konfirmo me OTP" desc="Merrni një kod të njëhershëm. Konfirmuar menjëherë, pa asnjë telefonatë." delay="delay-300" />
            </div>

            {/* Visual mockup */}
            <div className="relative hidden md:flex items-center justify-center">
              <div className="absolute w-72 h-72 glow-orb bg-primary/10 animate-glow-pulse" />
              <div className="relative glass-strong rounded-3xl p-6 w-72 animate-float shadow-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">TRIM Prishtina</p>
                    <p className="text-xs text-muted-foreground">Rr. Bill Clinton Nr. 42</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {["09:00", "09:30", "10:30", "11:00", "14:00", "15:30"].map((t, i) => (
                    <div key={t} className={`py-2.5 text-center text-xs font-medium rounded-xl transition-all ${i === 2 ? "bg-primary text-white shadow-md shadow-primary/25 scale-105" : "glass hover:bg-primary/10"}`}>
                      {t}
                    </div>
                  ))}
                </div>
                <div className="glass rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">V</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">Visar Berisha</p>
                    <p className="text-[10px] text-muted-foreground">Prerje Flokësh · 30 min · 8€</p>
                  </div>
                  <Check className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOP SHOPS ────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="container px-6 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-xs font-semibold text-primary tracking-widest uppercase mb-3 block">Më të vlerësuarat</span>
              <h2 className="text-4xl font-bold tracking-tight">
                Dyqanet më të mira në{" "}
                <span className="text-shimmer">{city !== "all" ? city : "Kosovë"}</span>
              </h2>
              <p className="text-muted-foreground mt-2">Verifikuar nga mijëra klientë të vërtetë</p>
            </div>
            <Link href="/barbershops" className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group">
              Shiko të gjitha <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* City filter pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {["all", ...cities].map(c => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`btn-pill px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  city === c
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "glass text-muted-foreground hover:text-foreground"
                }`}
              >
                {c === "all" ? "Të gjitha qytetet" : c}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="rounded-2xl overflow-hidden glass">
                  <Skeleton className="h-52 w-full rounded-none" />
                  <div className="p-5 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(Array.isArray(topShops) ? topShops : []).map((shop, i) => (
                <ShopCard key={shop.id} shop={shop} index={i} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Link href="/barbershops" className="btn-pill inline-flex items-center gap-2 px-6 py-3 glass text-sm font-semibold hover:bg-black/5 transition-all">
              Shiko të gjitha dyqanet <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-card/30 pointer-events-none" />
        <div className="container px-6 max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold text-primary tracking-widest uppercase mb-3 block">Pse TRIM</span>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Ndërtuar për kulturën e berberëve të Kosovës</h2>
            <p className="text-muted-foreground text-lg">Gjithçka që ju nevojitet, asgjë tjetër.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={Zap}         title="Rezervim i menjëhershëm"  desc="Disponueshmëri vendesh në kohë reale. Rezervo në nën 30 sekonda pa asnjë telefonatë." delay="delay-100" />
            <FeatureCard icon={Shield}      title="Konfirmim OTP"             desc="Çdo takim sigurohet me një kod të njëhershëm — pa rezervime të dyfishta, asnjëherë." delay="delay-200" />
            <FeatureCard icon={MapPin}      title="E gjithë Kosova"           desc="Prishtina, Prizren, Peja, Gjilan, Ferizaj dhe më shumë — 6 qytete dhe duke u rritur." delay="delay-300" />
            <FeatureCard icon={Star}        title="Vlerësime të verifikuara"  desc="Vlerësime reale nga klientë të vërtetë. Dije çfarë të pret para se të rezervosh." delay="delay-100" />
            <FeatureCard icon={ShoppingBagIcon} title="Produkte kozmetike"   desc="Bli pomadë, vaj mjekre dhe produkte stilimi direkt nga berberi juaj." delay="delay-200" />
            <FeatureCard icon={TrendingUp}  title="Analitikë dyqani"          desc="Pronarët marrin një panel të plotë — të ardhura, takime, berberë dhe shitje produktesh." delay="delay-300" />
          </div>
        </div>
      </section>

      {/* ── CITIES ───────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-primary tracking-widest uppercase mb-3 block">I disponueshëm në</span>
            <h2 className="text-4xl font-bold tracking-tight">Qyteti juaj është i mbuluar</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            {cities.map((c, i) => (
              <Link
                key={c}
                href={`/barbershops?city=${c}`}
                className="glass rounded-2xl p-5 flex flex-col items-center gap-2 text-center hover-lift hover:bg-black/3 transition-all group animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <MapPin className="w-4.5 h-4.5 text-primary" />
                </div>
                <span className="text-sm font-semibold">{c}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── OWNER CTA ────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-background" />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] glow-orb bg-primary/8 animate-glow-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] glow-orb bg-primary/5 animate-float-slow" />

        <div className="container px-6 max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs font-semibold text-primary mb-8">
            <TrendingUp className="w-3.5 h-3.5" />
            Për pronarët e berberive
          </div>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Zhvillo dyqanin tënd
            <br />
            <span className="text-shimmer">me TRIM.</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
            Bëhuni i dukshëm nga mijëra klientë në të gjithë Kosovën. Menaxhoni rezervimet, ekipin, produktet dhe të ardhurat — të gjitha në një panel.
          </p>

          {/* Pricing pill */}
          <div className="inline-flex items-center gap-2 glass px-5 py-2.5 rounded-full text-sm font-medium mb-10">
            <span className="text-primary font-bold">10€/muaj</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">0.50€ për takim</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-green-600 font-medium">30 ditët e para falas</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="btn-pill w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-bold text-base shadow-xl shadow-primary/25"
            >
              <Sparkles className="w-4.5 h-4.5" />
              Partnero me ne
            </Link>
            <Link
              href="/barbershops"
              className="btn-pill w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 glass text-base font-semibold hover:bg-black/5"
            >
              <Play className="w-4 h-4" />
              Shiko si funksionon
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* Inline icon to avoid import collision */
function ShoppingBagIcon(props: any) {
  return <ShoppingBag {...props} />;
}
