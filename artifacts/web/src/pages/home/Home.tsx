import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useListTopBarbershops } from "@workspace/api-client-react";
import { MapPin, Star, Scissors, ArrowRight, Search, Shield, Zap, Sparkles, ChevronRight, Check, Users, Calendar, TrendingUp, Play, ShoppingBag } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

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
function StatCard({ value, suffix, label, icon: Icon }: { value: number; suffix: string; label: string; icon: any }) {
  const { ref, inView } = useInView();
  const count = useCountUp(value, 1800, inView);
  return (
    <div ref={ref} className="glass rounded-2xl p-6 flex flex-col gap-3 hover-lift group">
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <div className="text-3xl font-bold tracking-tight stat-number">
          {count.toLocaleString()}<span className="text-primary">{suffix}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
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
      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg shadow-primary/30 group-hover:shadow-primary/50 group-hover:scale-110 transition-all duration-300">
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
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Rating pill */}
          <div className="absolute top-3 right-3 glass px-2.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 animate-badge-pop">
            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
            {shop.rating?.toFixed(1) || "New"}
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
              {shop.totalReviews ?? 0} reviews
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
              Book Now <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Ticker ──────────────────────────────────────────────── */
const tickerItems = [
  "Haircut", "Beard Trim", "Hot Towel Shave", "Fade",
  "Skin Fade", "Line Up", "Color Treatment", "Hair Wash",
  "Kids Cut", "Razor Shave", "Pompadour", "Burst Fade",
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
            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
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
        {/* Background orbs */}
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] glow-orb bg-primary/8 animate-glow-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] glow-orb bg-primary/5 animate-glow-pulse delay-500" />
        <div className="absolute top-[30%] right-[15%] w-[300px] h-[300px] glow-orb bg-primary/4 animate-float-slow" />

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

        <div className="container px-6 max-w-7xl mx-auto relative z-10 py-16">
          <div className="max-w-4xl">

            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs font-semibold text-primary mb-8 animate-badge-pop">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
              Kosovo's #1 Barber Platform
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </div>

            {/* Headline */}
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[1.04] animate-fade-up">
              Find your
              <br />
              <span className="text-shimmer">perfect barber.</span>
            </h1>

            <p className="mt-6 text-xl text-muted-foreground max-w-xl leading-relaxed animate-fade-up delay-200">
              Book appointments at Kosovo's finest barbershops in under 30 seconds. No phone calls, no waiting.
            </p>

            {/* Search bar */}
            <div className="mt-10 animate-fade-up delay-300">
              <div className="glass-strong rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-xl shadow-2xl shadow-black/30">
                <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5">
                  <MapPin className="text-primary w-4 h-4 shrink-0" />
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 px-0 text-sm h-auto">
                      <SelectValue placeholder="Choose a city…" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">Anywhere in Kosovo</SelectItem>
                      {cities.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <button
                  onClick={handleSearch}
                  className="btn-pill flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>

            {/* Trust pills */}
            <div className="mt-8 flex flex-wrap gap-3 animate-fade-up delay-400">
              {[
                { icon: Check, text: "Free to book" },
                { icon: Shield, text: "OTP confirmed" },
                { icon: Zap, text: "Instant slots" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 glass px-3.5 py-2 rounded-full text-xs font-medium text-muted-foreground">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating shop preview card */}
        <div className="absolute right-[4%] top-[20%] hidden xl:block animate-float delay-300">
          <div className="glass-strong rounded-2xl p-4 w-56 shadow-2xl">
            <div className="w-full h-28 rounded-xl overflow-hidden mb-3 bg-muted">
              <img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400" className="w-full h-full object-cover" alt="shop" />
            </div>
            <p className="text-sm font-semibold">The Barber Lab</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> Prishtina</p>
            <div className="mt-2.5 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              <span className="text-xs font-bold">4.9</span>
              <span className="text-xs text-muted-foreground">· 203 reviews</span>
            </div>
          </div>
        </div>

        {/* Floating OTP card */}
        <div className="absolute right-[28%] bottom-[22%] hidden xl:block animate-float-slow delay-200">
          <div className="glass-strong rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold">Booking confirmed!</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">OTP: 847 391</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ──────────────────────────────────────── */}
      <Ticker />

      {/* ── STATS ────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container px-6 max-w-7xl mx-auto">
          <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard value={6}    suffix="+"  label="Cities in Kosovo"    icon={MapPin} />
            <StatCard value={500}  suffix="+"  label="Active barbers"       icon={Scissors} />
            <StatCard value={12000} suffix="+" label="Happy customers"      icon={Users} />
            <StatCard value={50000} suffix="+" label="Appointments booked"  icon={Calendar} />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card/50 to-background pointer-events-none" />
        <div className="container px-6 max-w-7xl mx-auto relative z-10">
          <div className="max-w-xl mb-16">
            <span className="text-xs font-semibold text-primary tracking-widest uppercase mb-3 block">How it works</span>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Book in 3 simple steps</h2>
            <p className="text-muted-foreground text-lg">From discovery to appointment — faster than a phone call.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-10">
              <StepCard step="01" title="Find your shop" desc="Search by city, browse ratings, and explore photos of Kosovo's best barbershops." delay="delay-100" />
              <StepCard step="02" title="Pick a slot" desc="Choose your barber and your preferred time from real-time availability." delay="delay-200" />
              <StepCard step="03" title="Confirm with OTP" desc="Get a one-time code to your phone. Confirmed instantly, zero calls needed." delay="delay-300" />
            </div>

            {/* Visual mockup */}
            <div className="relative hidden md:flex items-center justify-center">
              <div className="absolute w-72 h-72 glow-orb bg-primary/10 animate-glow-pulse" />
              <div className="relative glass-strong rounded-3xl p-6 w-72 animate-float shadow-2xl">
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
                    <div key={t} className={`py-2.5 text-center text-xs font-medium rounded-xl transition-all ${i === 2 ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105" : "glass hover:bg-primary/10"}`}>
                      {t}
                    </div>
                  ))}
                </div>
                <div className="glass rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">V</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">Visar Berisha</p>
                    <p className="text-[10px] text-muted-foreground">Haircut · 30 min · 8€</p>
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
              <span className="text-xs font-semibold text-primary tracking-widest uppercase mb-3 block">Top rated</span>
              <h2 className="text-4xl font-bold tracking-tight">
                Best shops in{" "}
                <span className="text-shimmer">{city !== "all" ? city : "Kosovo"}</span>
              </h2>
              <p className="text-muted-foreground mt-2">Verified by thousands of real customers</p>
            </div>
            <Link href="/barbershops" className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group">
              View all <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "glass text-muted-foreground hover:text-foreground hover:bg-white/8"
                }`}
              >
                {c === "all" ? "All cities" : c}
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
            <Link href="/barbershops" className="btn-pill inline-flex items-center gap-2 px-6 py-3 glass text-sm font-semibold hover:bg-white/8 transition-all">
              View all shops <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-card/30 pointer-events-none" />
        <div className="container px-6 max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-semibold text-primary tracking-widest uppercase mb-3 block">Why TRIM</span>
            <h2 className="text-4xl font-bold tracking-tight mb-4">Built for Kosovo's barber culture</h2>
            <p className="text-muted-foreground text-lg">Everything you need, nothing you don't.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={Zap}        title="Instant booking"       desc="Real-time slot availability. Book in under 30 seconds without a single phone call." delay="delay-100" />
            <FeatureCard icon={Shield}     title="OTP confirmation"      desc="Every appointment is secured with a one-time code — no double bookings, ever." delay="delay-200" />
            <FeatureCard icon={MapPin}     title="All of Kosovo"         desc="Prishtina, Prizren, Peja, Gjilan, Ferizaj, and more — 6 cities and growing." delay="delay-300" />
            <FeatureCard icon={Star}       title="Verified reviews"      desc="Real ratings from real customers. Know exactly what you're getting before you book." delay="delay-100" />
            <FeatureCard icon={ShoppingBagIcon} title="Grooming products" desc="Shop premium pomades, beard oils, and styling essentials directly from your barber." delay="delay-200" />
            <FeatureCard icon={TrendingUp} title="Shop analytics"        desc="Owners get a full dashboard — revenue, appointments, barbers, and product sales." delay="delay-300" />
          </div>
        </div>
      </section>

      {/* ── CITIES ───────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="container px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-primary tracking-widest uppercase mb-3 block">Available in</span>
            <h2 className="text-4xl font-bold tracking-tight">Your city is covered</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
            {cities.map((c, i) => (
              <Link
                key={c}
                href={`/barbershops?city=${c}`}
                className={`glass rounded-2xl p-5 flex flex-col items-center gap-2 text-center hover-lift hover:bg-white/8 transition-all group animate-fade-up`}
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
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] glow-orb bg-primary/6 animate-glow-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] glow-orb bg-primary/4 animate-float-slow" />

        <div className="container px-6 max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs font-semibold text-primary mb-8">
            <TrendingUp className="w-3.5 h-3.5" />
            For barbershop owners
          </div>
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Grow your shop
            <br />
            <span className="text-shimmer">with TRIM.</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
            Get discovered by thousands of customers across Kosovo. Manage bookings, team, products, and revenue — all in one dashboard.
          </p>

          {/* Pricing pill */}
          <div className="inline-flex items-center gap-2 glass px-5 py-2.5 rounded-full text-sm font-medium mb-10">
            <span className="text-primary font-bold">10€/month</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">0.50€ per appointment</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-green-400 font-medium">First 30 days free</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="btn-pill w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold text-base shadow-2xl shadow-primary/30 hover:shadow-primary/50"
            >
              <Sparkles className="w-4.5 h-4.5" />
              Partner with us
            </Link>
            <Link
              href="/barbershops"
              className="btn-pill w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 glass text-base font-semibold hover:bg-white/8"
            >
              <Play className="w-4 h-4" />
              See how it works
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
