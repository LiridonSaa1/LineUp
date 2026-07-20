import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListTopBarbershops, useListBarbershops } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import {
  Search, MapPin, Star, Scissors, Sparkles, Clock, CheckCircle2,
  ChevronRight, ArrowRight, Flame, Tag, ShieldCheck, Award, Navigation
} from "lucide-react";

const PROMO_CARDS = [
  {
    id: 1,
    name: "Starter",
    badge: "Starter",
    price: "5€",
    period: "/muaj",
    subtitle: "Deri 2 punëtorë",
    popular: false,
  },
  {
    id: 2,
    name: "Standard",
    badge: "★ MË E KËRKUARA",
    price: "10€",
    period: "/muaj",
    subtitle: "Deri 4 punëtorë",
    popular: true,
  },
  {
    id: 3,
    name: "Pro",
    badge: "Pro",
    price: "15€",
    period: "/muaj",
    subtitle: "Deri 6 punëtorë",
    popular: false,
  },
  {
    id: 4,
    name: "Business",
    badge: "Business",
    price: "20€",
    period: "/muaj",
    subtitle: "Deri 8 punëtorë",
    popular: false,
  },
];

const QUICK_SERVICES = [
  { title: "Qethje Klasike", time: "30 min", price: "€10", icon: "✂️" },
  { title: "Mjekërr & Konturë", time: "20 min", price: "€6", icon: "🧔" },
  { title: "Kombo Executive VIP", time: "50 min", price: "€15", icon: "👑" },
  { title: "Trajtim me Peshqir të Nxehtë", time: "25 min", price: "€8", icon: "🔥" },
];

export default function MobileHome() {
  const [, setLocation] = useLocation();
  const [city, setCity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: topShopsData, isLoading: isLoadingTop } = useListTopBarbershops({ limit: 10 });
  const { data: allShopsData } = useListBarbershops({ status: "active", limit: 200 });

  const { data: cityShopsData, isLoading: isLoadingCity } = useListBarbershops(
    city !== "all" ? { city, status: "active", limit: 50 } : { limit: 0 }
  );

  const isLoading = city === "all" ? isLoadingTop : isLoadingCity;
  const shops = city === "all"
    ? (Array.isArray(topShopsData) ? topShopsData : [])
    : (cityShopsData?.data ?? []);

  const availableCities = Array.from(
    new Set((allShopsData?.data ?? []).map((s: any) => s.city).filter(Boolean))
  ).sort() as string[];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city !== "all") params.set("city", city);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    setLocation(`/barbershops?${params.toString()}`);
  };

  return (
    <div className="px-4 py-4 space-y-6">
      {/* ── City Only Selection Hero Card ── */}
      <div className="relative rounded-3xl bg-white border border-slate-200/80 p-4 shadow-sm overflow-hidden space-y-3">
        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900">
              Kërko sipas Qytetit
            </h1>
            <p className="text-xs text-slate-500">
              Zgjidh qytetin tënd për të gjetur berberët më të mirë
            </p>
          </div>
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        {/* Integrated Dropdown City Picker */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus-within:border-blue-500 transition-all">
          <MapPin className="w-4.5 h-4.5 text-blue-600 shrink-0" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="bg-transparent border-0 outline-none text-slate-900 text-xs font-extrabold w-full cursor-pointer"
          >
            <option value="all" className="bg-white text-slate-900">📍 Kudo në Kosovë (Të gjitha qytetet)</option>
            {availableCities.map((c) => (
              <option key={c} value={c} className="bg-white text-slate-900">📍 {c}</option>
            ))}
          </select>
        </div>

        {/* Quick City Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
          <button
            onClick={() => setCity("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap border transition-all ${
              city === "all"
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
            }`}
          >
            🔥 Të gjitha
          </button>
          {availableCities.map((c) => (
            <button
              key={c}
              onClick={() => setCity(c)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap border transition-all ${
                city === c
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
              }`}
            >
              📍 {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Special Promo Cards Carousel ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Paketat për Pronarët e Berberive
          </h2>
          <Link href="/offers" className="text-[11px] font-bold text-blue-600 flex items-center">
            Shiko të gjitha <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
          {PROMO_CARDS.map((card) => (
            <div
              key={card.id}
              className={`min-w-[150px] sm:min-w-[170px] rounded-2xl p-3.5 space-y-2 shrink-0 border transition-all ${
                card.popular
                  ? "bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white border-purple-500/50 shadow-md"
                  : "bg-white border-slate-200 text-slate-900 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${
                    card.popular
                      ? "bg-purple-500 text-white"
                      : "bg-blue-50 text-blue-600 border border-blue-100"
                  }`}
                >
                  {card.badge}
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-extrabold">{card.price}</span>
                  <span className={`text-[10px] ${card.popular ? "text-slate-300" : "text-slate-500"}`}>{card.period}</span>
                </div>
                <p className={`text-[11px] font-medium mt-0.5 ${card.popular ? "text-slate-200" : "text-slate-600"}`}>
                  {card.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Si Funksionon Section ── */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-blue-50/40 border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
            SI FUNKSIONON
          </span>
          <h2 className="text-base font-black text-slate-900 leading-tight">
            Rezervo në 3 hapa të thjeshtë
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Nga zbulimi deri te takimi — më shpejt se një telefonatë.
          </p>
        </div>

        <div className="relative space-y-3 pl-2">
          {/* Vertical connecting line */}
          <div className="absolute top-4 bottom-4 left-6 w-0.5 bg-blue-200 z-0" />

          {/* Step 1 */}
          <div className="relative z-10 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
              01
            </div>
            <div className="flex-1 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Gjej dyqanin tënd
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Kërko sipas qytetit, shfleto vlerësimet dhe eksploro fotot e berberive më të mira të Kosovës.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
              02
            </div>
            <div className="flex-1 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Zgjidhni një vend & orarin
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Zgjidhni berberin tuaj dhe orën e preferuar nga disponueshmëria në kohë reale.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
              03
            </div>
            <div className="flex-1 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Konfirmo me OTP
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Merrni një kod të njëhershëm. Konfirmuar menjëherë, pa asnjë telefonatë.
              </p>
            </div>
          </div>
        </div>

        {/* Instant Preview Mockup Badge */}
        <div className="p-3 rounded-2xl bg-white border border-blue-200/80 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">Takimi i konfirmuar</p>
              <p className="text-[10px] text-slate-500">OTP: 847391 • 10:30 AM</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
            Imediat
          </span>
        </div>
      </div>

      {/* ── Quick Services Menu ── */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Shërbimet Popullore
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          {QUICK_SERVICES.map((srv) => (
            <div
              key={srv.title}
              className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{srv.icon}</span>
                <span className="text-xs font-extrabold text-blue-600">{srv.price}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 truncate">{srv.title}</p>
                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {srv.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Featured Barbershops ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            {city === "all" ? "Barbershop-et Më të Vlerësuara" : `Barbershop-et në ${city}`}
          </h2>
          <Link href="/barbershops" className="text-[11px] font-bold text-blue-600 flex items-center">
            Shiko hartën <ArrowRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[240px] h-60 rounded-3xl bg-slate-200/60 animate-pulse shrink-0" />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold text-slate-700">Nuk u gjet asnjë dyqan në këtë qytet</p>
          </div>
        ) : (
          <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 no-scrollbar -mx-4 px-4">
            {shops.map((shop: any, idx: number) => {
              const rating = parseFloat(shop.rating) || 4.9;
              return (
                <div
                  key={shop.id}
                  className="min-w-[260px] max-w-[270px] rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-md flex flex-col justify-between shrink-0 group hover:shadow-lg transition-all"
                >
                  {/* Top Image Banner with Overlay & Badges */}
                  <div className="relative h-36 bg-slate-900 overflow-hidden">
                    {shop.imageUrl ? (
                      <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center text-3xl">💈</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                    {/* Top Left Rank Badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm ${
                        idx === 0
                          ? "bg-amber-500 text-slate-950"
                          : "bg-slate-900/80 text-white border border-white/20 backdrop-blur-md"
                      }`}>
                        {idx === 0 ? "👑 #1" : `#${idx + 1}`}
                      </span>
                    </div>

                    {/* Top Right Status & Rating */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[9px] font-extrabold flex items-center gap-1 backdrop-blur-md shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Hapur
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-900/80 text-amber-400 text-[10px] font-black flex items-center gap-1 backdrop-blur-md border border-white/20">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
                      </span>
                    </div>

                    {/* Bottom Title & City */}
                    <div className="absolute bottom-2.5 left-3 right-3">
                      <h3 className="text-sm font-extrabold text-white truncate drop-shadow-md flex items-center gap-1">
                        {shop.name}
                        {idx === 0 && <span className="text-amber-400">👑</span>}
                      </h3>
                      <p className="text-[10px] font-semibold text-slate-300 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-blue-400" />
                        {shop.city || "Kosovo"}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Body */}
                  <div className="p-3 bg-white space-y-2.5 flex-1 flex flex-col justify-between">
                    <p className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-slate-400 shrink-0" />
                      {shop.address || "Qendra e qytetit"}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> 4.9 vlerësime
                      </span>

                      <Link href={`/book/${shop.id}`}>
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          className="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1"
                        >
                          Rezervo →
                        </motion.button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
