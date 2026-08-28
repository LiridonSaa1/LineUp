import React, { useState, useEffect, useMemo } from "react";
import {
  Scissors,
  Palette,
  User,
  Eye,
  Hand,
  Smile,
  Shield,
  Zap,
  Search,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Star,
  Check,
  Mail,
  Phone,
  MessageSquare,
  Send,
  Heart
} from "lucide-react-native";
import { Platform } from "react-native";
import { getShopCardImage } from "../../utils/imageUtils";
import { supabase } from "../../config/supabase";

const veheesBanner = require('../../../assets/vehees_banner.jpg');
const noasimBanner = require('../../../assets/noasim_banner.jpg');
const noaiptvBanner = require('../../../assets/noaiptv_banner.jpg');
const technovaBanner = require('../../../assets/technova_banner.jpg');
const logoImg = require('../../../assets/logo.png');

const extractUri = (mod: any): string => {
  if (!mod) return "";
  if (typeof mod === "string") return mod;
  if (typeof mod === "number") return String(mod);
  if (typeof mod === "object") {
    if (typeof mod.default === "string") return mod.default;
    if (mod.default && typeof mod.default === "object" && typeof mod.default.uri === "string") return mod.default.uri;
    if (typeof mod.uri === "string") return mod.uri;
    if (typeof mod.src === "string") return mod.src;
  }
  return String(mod || "");
};

const resolveAdImage = (ad: any): string => {
  try {
    if (ad?.image_url && typeof ad.image_url === 'string' && ad.image_url.startsWith('http')) {
      return ad.image_url;
    }

    const bName = String(ad?.business_name || ad?.businessName || ad?.name || '').toLowerCase();
    const imgUrl = String(ad?.image_url || ad?.imageUrl || '').toLowerCase();

    let sourceModule = technovaBanner;
    if (bName.includes('vehees') || imgUrl.includes('vehees')) sourceModule = veheesBanner;
    else if (bName.includes('noasim') || imgUrl.includes('noasim')) sourceModule = noasimBanner;
    else if (bName.includes('iptv') || imgUrl.includes('iptv') || imgUrl.includes('noaiptv')) sourceModule = noaiptvBanner;
    else if (bName.includes('technova') || imgUrl.includes('technova')) sourceModule = technovaBanner;

    return extractUri(sourceModule) || extractUri(technovaBanner);
  } catch (e) {
    return extractUri(technovaBanner);
  }
};

interface DesktopHomeWebProps {
  categories: any[];
  recommendedShops: any[];
  newShops: any[];
  ads: any[];
  user: any;
  selectedLocation: string;
  onSelectShop: (shop: any) => void;
  onOpenLocation: () => void;
  onOpenSearch: () => void;
  onStartPlan: (planId: string) => void;
  onManagePlan: () => void;
  onUpgradePlan: (planId: string) => void;
  onDowngradePlan: (planId: string) => void;
  onRenewPlan: (planId: string) => void;
  currentPlanInfo: any;
  teamEmployees: string;
  setTeamEmployees: (val: string) => void;
  favorites: any[];
  onToggleFavorite: (shop: any) => void;
  activeTab: number;
  onTabPress: (idx: number) => void;
  onSelectCategory?: (categoryName: string) => void;
}

const servicesList = [
  { icon: Scissors, label: "Flokët & Trajtimet", count: 128 },
  { icon: Palette, label: "Ngjyrosja e Flokëve", count: 74 },
  { icon: User, label: "Mjekra & Rruajtja", count: 96 },
  { icon: Eye, label: "Vetulla & Qerpikë", count: 52 },
  { icon: Hand, label: "Thonjtë", count: 61 },
  { icon: Smile, label: "Makeup", count: 38 },
  { icon: Shield, label: "Fytyra & Kujdesi i Lëkurës", count: 27 },
  { icon: Zap, label: "Depilim & Trup", count: 19 },
];

const stepsList = [
  {
    n: "01",
    icon: Search,
    colorBg: "bg-[#3473ef] text-white",
    title: "Gjej dyqanin tënd",
    text: "Kërko sipas qytetit, shfleto vlerësimet dhe eksploro fotot e berberive më të mira të Kosovës.",
  },
  {
    n: "02",
    icon: MapPin,
    colorBg: "bg-[#f47458] text-white",
    title: "Zgjidhni një vend",
    text: "Zgjidhni berberin tuaj dhe orën e preferuar nga disponueshmëria në kohë reale.",
  },
  {
    n: "03",
    icon: Shield,
    colorBg: "bg-[#10b981] text-white",
    title: "Konfirmo me OTP",
    text: "Konfirmoni terminin tuaj menjëherë pa pasur nevojë për telefonata të lodhshme.",
  },
];

export const DesktopHomeWeb: React.FC<DesktopHomeWebProps> = ({
  categories,
  recommendedShops,
  newShops,
  ads,
  user,
  selectedLocation,
  onSelectShop,
  onOpenLocation,
  onOpenSearch,
  onStartPlan,
  onManagePlan,
  onUpgradePlan,
  onDowngradePlan,
  onRenewPlan,
  currentPlanInfo,
  teamEmployees,
  setTeamEmployees,
  favorites,
  onToggleFavorite,
  activeTab,
  onTabPress,
  onSelectCategory,
}) => {
  if (Platform.OS !== 'web') {
    return null;
  }

  const [adIndex, setAdIndex] = React.useState(0);
  const [realCategoryCounts, setRealCategoryCounts] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    if (!ads || ads.length <= 1) return;
    const interval = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads]);

  React.useEffect(() => {
    async function fetchRealCategoryCounts() {
      try {
        const [catsRes, subsRes, shopsRes] = await Promise.all([
          supabase.from('categories').select('*'),
          supabase.from('subcategories').select('*'),
          supabase.from('barbershops').select('id, name, category, subcategories, categories')
        ]);

        if (catsRes.data && subsRes.data && shopsRes.data) {
          const counts: Record<string, number> = {};
          catsRes.data.forEach((c: any) => {
            const cSubIds = subsRes.data
              .filter((s: any) => s.category_id === c.id)
              .map((s: any) => String(s.id));

            const matchingShops = shopsRes.data.filter((shop: any) => {
              if (shop.category === c.name) return true;
              if (Array.isArray(shop.categories) && shop.categories.includes(c.name)) return true;
              if (Array.isArray(shop.subcategories)) {
                return shop.subcategories.some((subId: any) => cSubIds.includes(String(subId)));
              }
              return false;
            });

            counts[c.name] = matchingShops.length;
          });
          setRealCategoryCounts(counts);
        }
      } catch (e) {
        console.warn("Could not fetch real category counts from Supabase:", e);
      }
    }
    fetchRealCategoryCounts();
  }, []);

  const [stats, setStats] = useState({
    shopsCount: '...',
    appointmentsCount: '...',
    avgRating: '4.9'
  });

  useEffect(() => {
    async function fetchRealStats() {
      try {
        const [shopsRes, apptsRes, ratingRes] = await Promise.all([
          supabase.from('barbershops').select('id, rating', { count: 'exact', head: false }),
          supabase.from('appointments').select('id', { count: 'exact', head: true }),
          supabase.from('barbershops').select('rating')
        ]);

        const totalShops = shopsRes.count !== null && shopsRes.count !== undefined ? shopsRes.count : (shopsRes.data?.length || 0);
        const totalAppts = apptsRes.count !== null && apptsRes.count !== undefined ? apptsRes.count : 0;

        let avgRating = 4.9;
        if (ratingRes.data && ratingRes.data.length > 0) {
          const validRatings = ratingRes.data
            .map(s => parseFloat(String(s.rating)))
            .filter(r => !isNaN(r) && r > 0);
          if (validRatings.length > 0) {
            avgRating = validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length;
          }
        }

        const formatCount = (num: number, suffix = '+') => {
          if (num >= 1000) return `${(num / 1000).toFixed(1).replace('.0', '')}k`;
          return num > 0 ? `${num}${suffix}` : '0';
        };

        setStats({
          shopsCount: formatCount(totalShops, '+'),
          appointmentsCount: formatCount(totalAppts, totalAppts >= 1000 ? '' : '+'),
          avgRating: avgRating.toFixed(1)
        });
      } catch (e) {
        console.warn("Could not fetch real stats from Supabase:", e);
      }
    }
    fetchRealStats();
  }, []);

  const [contactForm, setContactForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    subject: '',
    message: ''
  });
  const [isSendingContact, setIsSendingContact] = useState(false);

  const handleSendContactMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      alert("Ju lutemi plotësoni emrin, email-in dhe mesazhin tuaj!");
      return;
    }

    setIsSendingContact(true);
    try {
      const { error } = await supabase.from('system_feedback').insert({
        user_id: user?.id || null,
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        subject: `SUPPORT: ${contactForm.subject.trim() || 'Kërkesë nga Uebsajti'}`,
        content: `[TEL: ${contactForm.phone.trim() || 'N/A'}] [EMAIL: ${contactForm.email.trim()}]\n\n${contactForm.message.trim()}`,
        status: 'open',
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      setContactForm({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        subject: '',
        message: ''
      });
      alert("Mesazhi juaj u dërgua me sukses te administratori! Do t'ju kontaktojmë së shpejti.");
    } catch (err: any) {
      console.error("Contact Form Error:", err);
      alert("Gabim gjatë dërgimit të mesazhit: " + (err.message || "Provoni përsëri."));
    } finally {
      setIsSendingContact(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] font-sans text-slate-900">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Space+Grotesk:wght@300..700&display=swap');
        html, body, #root, #root > div {
          display: block !important;
          overflow: visible !important;
          height: auto !important;
          min-height: 100vh !important;
        }
        body, html, div, span, p, a, button, input {
          font-family: 'DM Sans', ui-sans-serif, system-ui, -apple-system, sans-serif !important;
        }
        h1, h2, h3, h4, h5, h6, .font-display {
          font-family: 'Space Grotesk', 'DM Sans', ui-sans-serif, system-ui, sans-serif !important;
        }
      `}</style>
      {/* ── SITE HEADER ─────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-6 py-4 lg:px-10">
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex cursor-pointer shrink-0 items-center gap-2 mr-6 lg:mr-12"
          >
            <img src={extractUri(logoImg)} alt="LineUp" style={{ width: '28px', height: '28px', objectFit: 'contain' }} className="rounded-lg transition-transform hover:scale-105" />
          </div>

          <nav className="hidden items-center gap-2 lg:flex ml-4 lg:ml-8">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Ballina
            </button>
            <button
              onClick={() => onTabPress && onTabPress(1)}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Kërko
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("recommended-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Të rekomanduara
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("how-it-works-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Si funksionon
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("contact-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Kontakt
            </button>
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onOpenLocation}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 cursor-pointer"
            >
              <MapPin className="h-4 w-4 shrink-0 text-[#3473ef]" />
              <span className="truncate">{selectedLocation}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* ── SEARCH BAR SECTION ──────────────────────────────── */}
      <section className="mx-auto max-w-[1440px] px-6 pb-8 pt-10 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl text-slate-900">
              Rezervo termin te berberi
              <br className="hidden sm:block" /> më i mirë në Kosovë
            </h1>
            <p className="mt-3 max-w-xl text-base text-slate-500 font-medium">
              Shfleto sallonet, zgjidh orën që të përshtatet dhe konfirmo me OTP — pa telefonata.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 lg:justify-end">
            <div>
              <p className="font-display text-2xl font-bold text-slate-900">{stats.shopsCount}</p>
              <p className="text-xs font-semibold">Sallone</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-slate-900">{stats.appointmentsCount}</p>
              <p className="text-xs font-semibold">Termine</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-[#3473ef]">{stats.avgRating}</p>
              <p className="text-xs font-semibold">Vlerësim</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onOpenSearch();
          }}
          onClick={onOpenSearch}
          className="mt-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-full border border-slate-200 bg-white p-2 shadow-sm sm:p-2.5 cursor-pointer"
        >
          <div className="flex min-w-0 items-center gap-3 pl-3">
            <Search className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              aria-label="Kërko sallone, trajtime"
              placeholder="Kërko sallone, trajtime…"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSearch();
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).blur();
                onOpenSearch();
              }}
              className="w-full min-w-0 bg-transparent py-2 text-base text-slate-900 outline-none placeholder:text-slate-400 cursor-pointer"
              readOnly
            />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSearch();
            }}
            className="shrink-0 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:px-8 cursor-pointer"
          >
            Kërko
          </button>
        </form>
      </section>

      {/* ── MAIN 3-COLUMN LAYOUT ────────────────────────────── */}
      <main className="mx-auto grid max-w-[1440px] items-start gap-8 px-6 pb-16 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-10 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        {/* LEFT SIDEBAR: SERVICE RAIL (STICKY AT TOP 88PX UNDER HEADER) */}
        <aside
          style={{
            position: 'sticky',
            top: '88px',
            alignSelf: 'flex-start',
            zIndex: 10
          }}
          className="w-full"
        >
          <p className="mb-4 font-display text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Shërbimet
          </p>
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
            {servicesList.map(({ icon: Icon, label, count: fallbackCount }) => {
              const realCount = realCategoryCounts[label] !== undefined ? realCategoryCounts[label] : fallbackCount;
              return (
                <button
                  key={label}
                  onClick={() => {
                    if (onSelectCategory) {
                      onSelectCategory(label);
                    } else {
                      onOpenSearch();
                    }
                  }}
                  className="group grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-slate-200/60 bg-white px-3 py-3 text-left transition-all hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-0 outline-none select-none shadow-2xs"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-[#3473ef] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">{label}</span>
                    <span className="block text-xs font-medium text-slate-400">
                      {realCount} {realCount === 1 ? 'sallon' : 'sallone'}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* MIDDLE FEED: PARTNER BANNER + RECOMMENDED + HOW IT WORKS */}
        <div className="grid min-w-0 gap-12">
          {/* Partner Banner Auto-Scroll Loop */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Partnerët tanë</h2>
              {ads && ads.length > 1 && (
                <div className="flex items-center gap-1.5">
                  {ads.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAdIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        adIndex % ads.length === idx ? "w-6 bg-[#3473ef]" : "w-2 bg-slate-200 hover:bg-slate-300"
                      }`}
                      aria-label={`Shko te reklama ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {(() => {
              const activeAd = ads && ads.length > 0 ? ads[adIndex % ads.length] : null;
              const imgSrc = resolveAdImage(activeAd);
              const businessName = activeAd?.business_name || activeAd?.businessName || "Technova";
              const tagline = activeAd?.tagline || "Future Ready";
              const title = activeAd?.title || activeAd?.headline || "Dizajnojmë faqe që shesin";
              const description = activeAd?.description || activeAd?.subtitle || "Web dizajn, zhvillim dhe SEO për biznesin tënd.";
              const stats = activeAd?.stats || "150+ Projekte · 50+ Klientë · 10+ Vite";

              return (
                <div
                  onClick={() => activeAd?.url && window.open(activeAd.url, '_blank')}
                  className="relative mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-sm cursor-pointer group transition-all duration-500"
                >
                  <img
                    key={adIndex}
                    src={imgSrc}
                    alt={`${businessName} — partner`}
                    className={`h-[340px] w-full transition-transform duration-700 group-hover:scale-105 ${
                      activeAd?.only_button ? "object-fill opacity-100" : "object-cover opacity-60"
                    }`}
                  />
                  {!activeAd?.only_button && (
                    <div className="absolute inset-0 grid content-center gap-3 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent p-8">
                      <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-slate-300">
                        {businessName} · {tagline}
                      </p>
                      <p className="max-w-md font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
                        {title}
                      </p>
                      <p className="max-w-sm text-sm text-slate-300">
                        {description}
                      </p>
                      <p className="text-xs font-medium text-slate-400">
                        {stats}
                      </p>
                    </div>
                  )}

                  {/* Manual Navigation Controls */}
                  {ads && ads.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAdIndex((prev) => (prev - 1 + ads.length) % ads.length);
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-slate-900/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAdIndex((prev) => (prev + 1) % ads.length);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-slate-900/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              );
            })()}
          </section>

          {/* Recommended Salons */}
          <section id="recommended-section" className="scroll-mt-28">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                Të rekomanduara
              </h2>
              <button
                onClick={onOpenSearch}
                className="shrink-0 text-sm font-semibold text-[#3473ef] hover:underline"
              >
                Shiko të gjitha
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recommendedShops.slice(0, 3).map((s) => {
                const isFav = favorites?.some((f: any) => String(f.shop_id) === String(s.id) || String(f.id) === String(s.id));
                return (
                  <article
                    key={s.id}
                    onClick={() => onSelectShop(s)}
                    className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all hover:shadow-md hover:border-slate-300 relative"
                  >
                    <div className="relative">
                      <img
                        src={getShopCardImage(s)}
                        alt={`${s.name} në ${s.address || s.city}`}
                        className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(s);
                        }}
                        className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/80 backdrop-blur-md shadow-sm transition-transform hover:scale-110 active:scale-95 cursor-pointer z-10"
                        aria-label="Shto te të preferuarat"
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            isFav ? "fill-rose-500 text-rose-500" : "text-slate-600 hover:text-rose-500"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="min-w-0 truncate font-display text-base font-bold text-slate-900">{s.name}</h3>
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-900">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {s.rating ? parseFloat(String(s.rating)).toFixed(1) : '4.9'}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {s.address || s.city || "Prishtinë"}
                      </p>
                      <div className="mt-4 flex items-center justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectShop(s);
                          }}
                          className="w-full rounded-full bg-slate-900 py-2.5 text-center text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        >
                          Rezervo
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* How It Works (Enhanced Step-by-Step UI) */}
          <section id="how-it-works-section" className="scroll-mt-28">
            <div className="flex items-baseline justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                  Si funksionon
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Përjetoni stilimin më të mirë në Kosovë me vetëm 3 hapa të thjeshtë
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                ✨ Proces 100% Automatik
              </span>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <ol className="relative space-y-8">
                {[
                  {
                    n: "01",
                    icon: Search,
                    iconBg: "bg-[#3473ef] text-white shadow-md shadow-[#3473ef]/30",
                    badge: "Kërko Pa Mundim",
                    title: "Gjej dyqanin tënd",
                    text: "Kërko sipas qytetit (Prishtinë, Prizren, Pejë...), shfleto vlerësimet reale dhe eksploro fotot e berberive më të mira.",
                    highlight: "450+ Sallone me vlerësim 4.9⭐"
                  },
                  {
                    n: "02",
                    icon: MapPin,
                    iconBg: "bg-[#f47458] text-white shadow-md shadow-[#f47458]/30",
                    badge: "Disponueshmëri Live",
                    title: "Zgjidhni një vend",
                    text: "Zgjidhni berberin tuaj të preferuar, shërbimin (qethje, mjekërr, trajtim) dhe orën e lirë nga disponueshmëria në kohë reale.",
                    highlight: "Orari përditësohet automatikisht"
                  },
                  {
                    n: "03",
                    icon: Shield,
                    iconBg: "bg-[#10b981] text-white shadow-md shadow-[#10b981]/30",
                    badge: "Konfirmim I Menjëhershëm",
                    title: "Konfirmo me OTP",
                    text: "Prano kodin e konfirmimit në SMS/WhatsApp dhe konfirmo terminin tuaj menjëherë — pa nevojë për telefonata të lodhshme.",
                    highlight: "SMS rikujtues 1 orë para terminit"
                  }
                ].map(({ n, icon: Icon, iconBg, badge, title, text, highlight }, i, arr) => (
                  <li key={n} className="group relative flex gap-5">
                    {/* Connecting Vertical Line */}
                    {i < arr.length - 1 && (
                      <span
                        className="absolute left-6 top-14 -bottom-6 w-0.5 bg-gradient-to-b from-slate-200 via-slate-200 to-transparent"
                        aria-hidden="true"
                      />
                    )}

                    {/* Step Icon Badge */}
                    <div className="relative z-10 flex flex-col items-center">
                      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className="h-6 w-6" />
                      </span>
                    </div>

                    {/* Step Content Box */}
                    <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 transition-all duration-300 hover:border-slate-200 hover:bg-white hover:shadow-md">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                          <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                            {badge}
                          </span>
                        </div>
                        <span className="font-display text-xs font-black tracking-widest text-[#3473ef]">
                          HAPI {n}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[#475569] font-medium">{text}</p>

                      <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                        {highlight}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Contact Form Section (Na Kontaktoni) */}
          <section id="contact-section" className="scroll-mt-28">
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                Na Kontaktoni
              </h2>
              <p className="text-sm font-medium text-slate-500">
                Ke ndonjë pyetje ose sugjerim? Na shkruaj dhe ekipi ynë do t'ju përgjigjet menjëherë.
              </p>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <form
                onSubmit={handleSendContactMessage}
                className="grid gap-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Emri dhe Mbiemri
                    </label>
                    <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 transition-colors focus-within:border-[#3473ef] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3473ef]/10">
                      <User className="h-4 w-4 shrink-0 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Filan Fisteku"
                        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Email Adresa
                    </label>
                    <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 transition-colors focus-within:border-[#3473ef] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3473ef]/10">
                      <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="emri@shembull.ks"
                        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Numri i Telefonit
                    </label>
                    <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 transition-colors focus-within:border-[#3473ef] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3473ef]/10">
                      <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                      <input
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        placeholder="+383 44 000 000"
                        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Subjekti
                    </label>
                    <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 transition-colors focus-within:border-[#3473ef] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3473ef]/10">
                      <MessageSquare className="h-4 w-4 shrink-0 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        placeholder="Pyetje për termin, abonim..."
                        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Mesazhi Tuaj
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Shkruani mesazhin tuaj këtu..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-medium transition-colors focus:border-[#3473ef] focus:bg-white focus:ring-2 focus:ring-[#3473ef]/10 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingContact}
                  className={`flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 px-6 font-display text-sm font-bold text-white shadow-md transition-all hover:bg-[#3473ef] active:scale-[0.99] cursor-pointer ${isSendingContact ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <Send className="h-4 w-4" />
                  {isSendingContact ? 'Duke dërguar...' : 'Dërgo Mesazhin'}
                </button>
              </form>
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR: PRICING RAIL (STICKY AT TOP 88PX UNDER HEADER) */}
        <aside
          style={{
            position: 'sticky',
            top: '88px',
            alignSelf: 'flex-start',
            zIndex: 10
          }}
          className="w-full"
        >
          <p className="mb-4 font-display text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Planet e Çmimeve
          </p>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {(() => {
              const currentBarbersCount = Math.max(3, parseInt(teamEmployees || "3"));
              const extraBarbers = Math.max(0, currentBarbersCount - 3);
              const calculatedTeamPrice = 25 + extraBarbers * 5;

              const planWeights: Record<string, number> = { solo: 1, duo: 2, team: 3 };
              const userCurrentPlanId = (
                currentPlanInfo?.planId ||
                currentPlanInfo?.plan_id ||
                user?.subscription_plan ||
                user?.plan_id ||
                user?.plan ||
                ""
              )?.toLowerCase();

              const isBarbershopUser = Boolean(
                user && (
                  user.role === 'barbershop' || 
                  user.role === 'owner' || 
                  user.role === 'barber' || 
                  user.role === 'business' || 
                  user.barbershop_id != null
                )
              );

              // If barbershop user is logged in, resolve active plan id (default to solo if not set)
              const activePlanId = userCurrentPlanId || (isBarbershopUser ? "solo" : "");
              const currentWeight = planWeights[activePlanId] || 0;

              const isEmployee = user?.role === 'employee';

              return [
                {
                  name: "Solo",
                  price: "15€",
                  seats: "1 berber",
                  desc: "Ideale për berberët individualë",
                  icon: User,
                  featured: false,
                  id: "solo",
                  weight: 1
                },
                {
                  name: "Duo",
                  price: "20€",
                  seats: "2 berberë",
                  desc: "Për ekipe të vogla prej dy personash",
                  icon: Scissors,
                  featured: true,
                  isPopular: true,
                  id: "duo",
                  weight: 2
                },
                {
                  name: "Team",
                  price: `${calculatedTeamPrice}€`,
                  seats: `${currentBarbersCount} berberë`,
                  desc: "Për ekipe në rritje",
                  icon: Zap,
                  featured: false,
                  id: "team",
                  isTeam: true,
                  weight: 3
                },
              ].map(({ name, price, seats, desc, icon: Icon, featured, isPopular, id, isTeam, weight }) => {
                const isCurrentPlan = Boolean(activePlanId && activePlanId === id);
                const isExpired = isCurrentPlan && currentPlanInfo?.isExpired;

                let buttonText = "Fillo Tani";
                let buttonAction = () => onStartPlan(id);

                if (isEmployee) {
                  buttonText = "Fillo Tani";
                  buttonAction = () => alert("Abonimet mund të blihen vetëm nga Pronari i Biznesit.");
                } else if (isCurrentPlan) {
                  buttonText = isExpired ? "Rinovon" : "Plani Aktual";
                  buttonAction = () => onManagePlan();
                } else if (currentPlanInfo?.status === 'active' || currentPlanInfo?.status === 'trialing' || isBarbershopUser) {
                  if (weight > currentWeight) {
                    buttonText = "Përmirëso";
                    buttonAction = () => onUpgradePlan(id);
                  } else {
                    buttonText = "Zbrit";
                    buttonAction = () => onDowngradePlan(id);
                  }
                }

                return (
                  <div
                    key={name}
                    className={`rounded-3xl p-5 transition-colors relative ${
                      featured || isCurrentPlan ? "border-2 border-[#3473ef] bg-white" : "border border-slate-200/80 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-[#3473ef]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block font-display text-base font-bold text-slate-900 leading-snug">{name}</span>
                          <span className="block text-[11px] font-semibold text-slate-400 whitespace-nowrap">LineUp Premium</span>
                        </div>
                      </div>

                      {isPopular && (
                        <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-400 px-2 py-0.5 font-display text-[9px] font-black uppercase tracking-tight text-slate-900">
                          Më i Populluari
                        </span>
                      )}

                      {isCurrentPlan && (
                        <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 font-display text-[9px] font-black uppercase tracking-tight text-emerald-800">
                          Aktiv
                        </span>
                      )}
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-3xl font-bold text-slate-900">{price}</span>
                        <span className="text-sm font-medium text-slate-400">/muaj</span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <Check className="h-3.5 w-3.5" /> {seats}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 font-medium">{desc}</p>

                      {/* Team Plan Barber Stepper (+5€/barber) */}
                      {isTeam && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700">Ndrysho berberët (+5€):</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setTeamEmployees(String(Math.max(3, currentBarbersCount - 1)))}
                                disabled={currentBarbersCount <= 3}
                                className="h-6 w-6 rounded-md bg-white border border-slate-300 font-bold text-slate-700 text-xs shadow-sm disabled:opacity-40 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-display text-xs font-bold text-slate-900 min-w-[20px] text-center">
                                {currentBarbersCount}
                              </span>
                              <button
                                type="button"
                                onClick={() => setTeamEmployees(String(currentBarbersCount + 1))}
                                className="h-6 w-6 rounded-md bg-[#3473ef] font-bold text-white text-xs shadow-sm hover:bg-[#2558c7] flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={buttonAction}
                      disabled={isCurrentPlan && !isExpired}
                      className={`mt-4 w-full rounded-full px-4 py-3 text-sm font-semibold transition-all ${
                        isCurrentPlan && !isExpired
                          ? "bg-slate-100 text-slate-400 cursor-default"
                          : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                      }`}
                    >
                      {buttonText}
                    </button>
                  </div>
                );
              });
            })()}
          </div>
        </aside>
      </main>

      {/* ── SITE FOOTER ─────────────────────────────────────── */}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
          <div>
            <div className="flex items-center gap-2">
              <img src={extractUri(logoImg)} alt="LineUp" style={{ width: '32px', height: '32px', objectFit: 'contain' }} className="rounded-xl" />
            </div>
          </div>

          {[
            { t: "Platforma", l: ["Ballina", "Kërko", "Aktiviteti", "Profili"] },
            { t: "Për bizneset", l: ["Planet e çmimeve", "Bëhu partner", "Ndihmë"] },
            { t: "Kontakt", l: ["info@lineup.ks", "+383 44 000 000", "Prishtinë, Kosovë"] },
          ].map((col) => (
            <div key={col.t}>
              <p className="font-display text-sm font-bold text-slate-900">{col.t}</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-500 font-medium">
                {col.l.map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-slate-900">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 py-5 text-center text-xs text-slate-400 font-semibold">
          © {new Date().getFullYear()} LineUp. Të gjitha të drejtat e rezervuara.
        </div>
      </footer>
    </div>
  );
};
