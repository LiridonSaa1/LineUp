import { Link, useLocation } from "wouter";
import { KOSOVO_CITIES } from "@/lib/kosovo-cities";
import { useState, useEffect, useRef } from "react";
import { useListTopBarbershops, useListBarbershops, useListProducts } from "@workspace/api-client-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import KosovoCitiesMap from "@/components/map/KosovoCitiesMap";
import {
  MapPin,
  Star,
  Scissors,
  ArrowRight,
  Search,
  Shield,
  Zap,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Users,
  Calendar,
  TrendingUp,
  Play,
  ShoppingBag,
  ShoppingCart,
  Plus,
  Clock,
  Crown,
  BadgeCheck,
  Flame,
  Send,
  CheckCircle2,
  Mail,
  Phone,
  Megaphone,
  CreditCard,
  X,
  Building2,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import barberToolsBg from "@assets/vintage-equipment-of-barber-shop-on-wood-backgroun-2023-11-27-_1782291490098.jpg";
import barberCutout from "@assets/bearded-handsome-barber-holding-comb-and-scissors-2023-11-27-_1782486060662.webp";
import brushImg from "@assets/download_1782414907276.png";
import razorImg from "@assets/download_1782414908403.png";

/* ── SVG Barber Tool icons ───────────────────────────────── */
const ScissorsSVG = ({
  size = 64,
  opacity = 0.08,
  rotate = 0,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="hsl(38 78% 50%)"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ opacity, transform: `rotate(${rotate}deg)` }}
    className={className}
  >
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);

const CombSVG = ({ size = 56, opacity = 0.07, rotate = 0, className = "" }) => (
  <svg
    width={size}
    height={size * 0.45}
    viewBox="0 0 80 36"
    fill="none"
    style={{ opacity, transform: `rotate(${rotate}deg)` }}
    className={className}
  >
    <rect
      x="2"
      y="2"
      width="76"
      height="14"
      rx="4"
      stroke="hsl(38 78% 50%)"
      strokeWidth="2.5"
      fill="none"
    />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
      <rect
        key={i}
        x={8 + i * 8}
        y="16"
        width="4"
        height="18"
        rx="2"
        fill="hsl(38 78% 50%)"
      />
    ))}
  </svg>
);

const RazorSVG = ({
  size = 60,
  opacity = 0.08,
  rotate = 0,
  className = "",
}) => (
  <svg
    width={size}
    height={size * 1.3}
    viewBox="0 0 40 52"
    fill="none"
    style={{ opacity, transform: `rotate(${rotate}deg)` }}
    className={className}
  >
    <rect
      x="14"
      y="2"
      width="12"
      height="40"
      rx="4"
      stroke="hsl(38 78% 50%)"
      strokeWidth="2"
      fill="hsl(38 78% 50%)"
      fillOpacity="0.15"
    />
    <path
      d="M10 42 C10 46 14 50 20 50 C26 50 30 46 30 42 L14 42 Z"
      stroke="hsl(38 78% 50%)"
      strokeWidth="2"
      fill="hsl(38 78% 50%)"
      fillOpacity="0.12"
    />
    <line
      x1="20"
      y1="6"
      x2="20"
      y2="36"
      stroke="hsl(38 78% 50%)"
      strokeWidth="1"
      opacity="0.5"
    />
  </svg>
);

const ClipperSVG = ({
  size = 72,
  opacity = 0.07,
  rotate = 0,
  className = "",
}) => (
  <svg
    width={size}
    height={size * 0.6}
    viewBox="0 0 80 48"
    fill="none"
    style={{ opacity, transform: `rotate(${rotate}deg)` }}
    className={className}
  >
    <rect
      x="4"
      y="4"
      width="56"
      height="28"
      rx="8"
      stroke="hsl(38 78% 50%)"
      strokeWidth="2.2"
      fill="hsl(38 78% 50%)"
      fillOpacity="0.1"
    />
    <rect
      x="4"
      y="32"
      width="56"
      height="10"
      rx="4"
      stroke="hsl(38 78% 50%)"
      strokeWidth="2"
      fill="hsl(38 78% 50%)"
      fillOpacity="0.12"
    />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <line
        key={i}
        x1={8 + i * 7}
        y1="42"
        x2={8 + i * 7}
        y2="44"
        stroke="hsl(38 78% 50%)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    ))}
    <circle
      cx="68"
      cy="18"
      r="8"
      stroke="hsl(38 78% 50%)"
      strokeWidth="2"
      fill="hsl(38 78% 50%)"
      fillOpacity="0.08"
    />
    <path
      d="M65 18 L71 18 M68 15 L68 21"
      stroke="hsl(38 78% 50%)"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const BarberPoleSVG = ({ size = 36, opacity = 0.09, className = "" }) => (
  <svg
    width={size}
    height={size * 3.2}
    viewBox="0 0 36 115"
    fill="none"
    style={{ opacity }}
    className={className}
  >
    <rect
      x="8"
      y="8"
      width="20"
      height="100"
      rx="10"
      stroke="hsl(38 78% 50%)"
      strokeWidth="2.5"
      fill="hsl(38 78% 50%)"
      fillOpacity="0.08"
    />
    {[0, 1, 2, 3, 4].map((i) => (
      <path
        key={i}
        d={`M8 ${16 + i * 18} Q18 ${22 + i * 18} 28 ${16 + i * 18}`}
        stroke="hsl(38 78% 50%)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    ))}
    <circle
      cx="18"
      cy="8"
      r="8"
      stroke="hsl(38 78% 50%)"
      strokeWidth="2"
      fill="hsl(38 78% 50%)"
      fillOpacity="0.12"
    />
    <circle
      cx="18"
      cy="108"
      r="8"
      stroke="hsl(38 78% 50%)"
      strokeWidth="2"
      fill="hsl(38 78% 50%)"
      fillOpacity="0.12"
    />
  </svg>
);

const StraightRazorSVG = ({
  size = 68,
  opacity = 0.07,
  rotate = 0,
  className = "",
}) => (
  <svg
    width={size}
    height={size * 0.38}
    viewBox="0 0 80 30"
    fill="none"
    style={{ opacity, transform: `rotate(${rotate}deg)` }}
    className={className}
  >
    <path
      d="M4 6 C4 4 6 2 8 2 L58 2 L76 14 L58 26 L8 26 C6 26 4 24 4 22 Z"
      stroke="hsl(38 78% 50%)"
      strokeWidth="2"
      fill="hsl(38 78% 50%)"
      fillOpacity="0.1"
    />
    <path
      d="M58 2 L76 14 L58 26"
      stroke="hsl(38 78% 50%)"
      strokeWidth="2"
      fill="hsl(38 78% 50%)"
      fillOpacity="0.15"
    />
    <line
      x1="4"
      y1="14"
      x2="58"
      y2="14"
      stroke="hsl(38 78% 50%)"
      strokeWidth="1"
      opacity="0.3"
    />
    <circle
      cx="16"
      cy="14"
      r="5"
      stroke="hsl(38 78% 50%)"
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
);

/* ── Floating background tools ───────────────────────────── */
function BarberBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden="true"
    >
      {/* Top-right cluster */}
      <div
        className="absolute top-[6%] right-[8%] animate-drift-1"
        style={{ animationDelay: "0s" }}
      >
        <ScissorsSVG size={90} opacity={0.1} rotate={-25} />
      </div>
      <div
        className="absolute top-[18%] right-[22%] animate-drift-2"
        style={{ animationDelay: "1.2s" }}
      >
        <CombSVG size={70} opacity={0.08} rotate={15} />
      </div>
      <div
        className="absolute top-[3%] right-[38%] animate-drift-5"
        style={{ animationDelay: "2s" }}
      >
        <RazorSVG size={52} opacity={0.07} rotate={40} />
      </div>

      {/* Left side */}
      <div
        className="absolute top-[30%] left-[2%] animate-drift-3"
        style={{ animationDelay: "0.5s" }}
      >
        <CombSVG size={60} opacity={0.07} rotate={-10} />
      </div>
      <div
        className="absolute bottom-[30%] left-[6%] animate-drift-4"
        style={{ animationDelay: "3s" }}
      >
        <ScissorsSVG size={70} opacity={0.08} rotate={45} />
      </div>
      <div
        className="absolute top-[12%] left-[14%] animate-drift-2"
        style={{ animationDelay: "1.8s" }}
      >
        <StraightRazorSVG size={64} opacity={0.06} rotate={-20} />
      </div>

      {/* Center / scattered */}
      <div
        className="absolute top-[55%] right-[10%] animate-drift-1"
        style={{ animationDelay: "0.8s" }}
      >
        <ClipperSVG size={78} opacity={0.09} rotate={-12} />
      </div>
      <div
        className="absolute bottom-[12%] right-[28%] animate-drift-3"
        style={{ animationDelay: "2.5s" }}
      >
        <ScissorsSVG size={60} opacity={0.07} rotate={60} />
      </div>
      <div
        className="absolute top-[45%] left-[20%] animate-drift-5"
        style={{ animationDelay: "4s" }}
      >
        <RazorSVG size={44} opacity={0.06} rotate={-35} />
      </div>

      {/* Barber poles — vertical accents */}
      <div
        className="absolute top-[5%] left-[32%] animate-float-slow"
        style={{ animationDelay: "1s" }}
      >
        <BarberPoleSVG size={28} opacity={0.08} />
      </div>
      <div
        className="absolute bottom-[5%] right-[15%] animate-float-slow"
        style={{ animationDelay: "3.5s" }}
      >
        <BarberPoleSVG size={22} opacity={0.07} />
      </div>

      {/* Bottom row */}
      <div
        className="absolute bottom-[8%] left-[18%] animate-drift-2"
        style={{ animationDelay: "2.2s" }}
      >
        <StraightRazorSVG size={72} opacity={0.07} rotate={10} />
      </div>
      <div
        className="absolute bottom-[20%] right-[4%] animate-drift-4"
        style={{ animationDelay: "1.5s" }}
      >
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
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ── StatCard ────────────────────────────────────────────── */
const STAT_DELAYS = ["delay-100", "delay-200", "delay-300", "delay-400"];

function StatCard({
  value,
  suffix,
  label,
  icon: Icon,
  index,
  color,
}: {
  value: number;
  suffix: string;
  label: string;
  icon: any;
  index: number;
  color: { bg: string; text: string; border: string; glow: string };
}) {
  const { ref, inView } = useInView(0.2);
  const count = useCountUp(value, 2000, inView);

  return (
    <div
      ref={ref}
      className={`relative group transition-all duration-700 ${
        inView
          ? `opacity-100 translate-y-0 ${STAT_DELAYS[index]}`
          : "opacity-0 translate-y-10"
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
        <div
          className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${color.bg}`}
        />

        {/* Top row: icon + number */}
        <div className="flex items-start justify-between mb-5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 ${color.bg}`}
          >
            <Icon className={`w-6 h-6 ${color.text}`} />
          </div>

          {/* Subtle animated dot */}
          <div
            className={`w-2 h-2 rounded-full mt-1 ${color.text} opacity-60 animate-pulse`}
            style={{ animationDelay: `${index * 300}ms` }}
          />
        </div>

        {/* Number */}
        <div className="mb-1">
          <span className="text-4xl font-extrabold tracking-tight stat-number text-foreground">
            {count.toLocaleString()}
          </span>
          <span className={`text-3xl font-extrabold ${color.text}`}>
            {suffix}
          </span>
        </div>

        {/* Label */}
        <p className="text-sm text-muted-foreground font-medium">{label}</p>

        {/* Animated progress bar */}
        <div className="mt-5 h-1 bg-border/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-[2000ms] ease-out ${color.bg}`}
            style={{
              width: inView ? "100%" : "0%",
              transitionDelay: `${index * 120 + 400}ms`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── FeatureCard ─────────────────────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  delay,
  index = 0,
}: {
  icon: any;
  title: string;
  desc: string;
  delay: string;
  index?: number;
}) {
  const { ref, inView } = useInView();
  const num = String(index + 1).padStart(2, "0");
  return (
    <div
      ref={ref}
      className={`group relative flex flex-col gap-4 p-6 rounded-2xl border border-white/8 bg-white/[0.03]
        hover:bg-white/[0.06] hover:border-primary/35 transition-all duration-400
        ${inView ? `animate-fade-up ${delay}` : "opacity-0 translate-y-6"}`}
    >
      <span className="absolute top-4 right-5 text-5xl font-black text-white/[0.05] select-none leading-none pointer-events-none">
        {num}
      </span>
      <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center
        group-hover:bg-primary/25 group-hover:scale-110 transition-all duration-300">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 className="text-base font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ── StepCard ────────────────────────────────────────────── */
function StepCard({
  step,
  title,
  desc,
  index,
}: {
  step: string;
  title: string;
  desc: string;
  index: number;
  delay: string;
}) {
  const { ref, inView } = useInView(0.15);
  return (
    <div
      ref={ref}
      className="flex gap-5 group"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(-40px)",
        transition: `opacity 0.6s ease, transform 0.6s ease`,
        transitionDelay: inView ? `${index * 150}ms` : "0ms",
      }}
    >
      {/* Number badge */}
      <div className="flex-shrink-0 flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-sm tracking-wider shadow-lg shadow-primary/30 group-hover:shadow-primary/50 group-hover:scale-105 transition-all duration-300">
          {step}
        </div>
        {index < 2 && (
          <div
            className="w-px flex-1 min-h-[40px] bg-gradient-to-b from-primary/30 to-transparent"
            style={{
              opacity: inView ? 1 : 0,
              transition: "opacity 0.8s ease",
              transitionDelay: inView ? `${index * 150 + 300}ms` : "0ms",
            }}
          />
        )}
      </div>

      {/* Text */}
      <div className="pb-8">
        <h3 className="font-bold text-lg mb-1.5 text-foreground group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ── ShopCard ────────────────────────────────────────────── */
function ShopCard({ shop, index }: { shop: any; index: number }) {
  const { ref, inView } = useInView();
  const delays = [
    "delay-75",
    "delay-150",
    "delay-200",
    "delay-300",
    "delay-400",
    "delay-500",
  ];
  const rating = parseFloat(shop.rating) || 0;
  const isTop = index === 0;
  const isHot = rating >= 4.7;

  const now = new Date();
  const hhmm = now.getHours() * 100 + now.getMinutes();
  const openVal = shop.openTime
    ? parseInt(shop.openTime.replace(":", ""))
    : 900;
  const closeVal = shop.closeTime
    ? parseInt(shop.closeTime.replace(":", ""))
    : 2000;
  const isOpen = hhmm >= openVal && hhmm < closeVal;

  const rankStyles = [
    {
      pill: "from-yellow-400 to-amber-500",
      shadow: "shadow-yellow-500/30",
      ring: "ring-2 ring-yellow-400/25",
    },
    {
      pill: "from-slate-300 to-slate-500",
      shadow: "shadow-slate-400/20",
      ring: "ring-1 ring-slate-300/20",
    },
    {
      pill: "from-amber-500 to-amber-800",
      shadow: "shadow-amber-700/20",
      ring: "ring-1 ring-amber-600/20",
    },
  ];
  const rs = rankStyles[index];

  return (
    <Link href={`/barbershops/${shop.id}`}>
      <div
        ref={ref}
        className={`group cursor-pointer relative overflow-hidden transition-all duration-500
          hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/15
          ${inView ? `animate-scale-in ${delays[index] || ""}` : "opacity-0"}
          rounded-2xl bg-card border
          ${
            isTop
              ? `border-primary/25 shadow-lg shadow-primary/8 ${rs?.ring}`
              : "border-border/50 hover:border-primary/20"
          }`}
      >
        {/* Barber-pole accent line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] z-20 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

        {/* ── IMAGE ── */}
        <div className="h-52 relative overflow-hidden bg-muted">
          {shop.imageUrl ? (
            <img
              src={shop.imageUrl}
              alt={shop.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Scissors className="w-16 h-16 text-muted-foreground/20" />
            </div>
          )}

          {/* Cinematic gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />

          {/* Rank pill — top left */}
          {index < 3 && rs && (
            <div
              className={`absolute top-3 left-3 z-20 flex items-center gap-1 bg-gradient-to-r ${rs.pill} px-2.5 py-1 rounded-full shadow-lg ${rs.shadow}`}
            >
              {index === 0 && <Crown className="w-3 h-3 text-white" />}
              <span className="text-white text-[10px] font-black tracking-widest">
                #{index + 1}
              </span>
            </div>
          )}

          {/* Status + rating — top right */}
          <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5">
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm ${
                isOpen
                  ? "bg-emerald-500/90 text-white"
                  : "bg-black/60 text-white/60"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-white animate-pulse" : "bg-white/30"}`}
              />
              {isOpen ? "Hapur" : "Mbyllur"}
            </div>
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-white text-xs font-bold">
                {rating.toFixed(1)}
              </span>
            </div>
            {isHot && (
              <div className="flex items-center gap-1 bg-primary/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <Flame className="w-3 h-3 text-white" />
                <span className="text-white text-[10px] font-bold">Hot</span>
              </div>
            )}
          </div>

          {/* Bottom overlay: name + meta */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 z-10">
            <h3 className="text-white font-extrabold text-lg leading-tight drop-shadow mb-1.5 flex items-center gap-1.5">
              {shop.name}
              {isTop && <Crown className="w-4 h-4 text-yellow-400 shrink-0" />}
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-white/85 text-xs font-medium">
                <MapPin className="w-3 h-3 text-primary" />
                {shop.city}
              </span>
              {shop.openTime && (
                <span className="flex items-center gap-1 text-white/60 text-xs">
                  <Clock className="w-3 h-3" />
                  {shop.openTime}–{shop.closeTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="px-4 pt-3 pb-4">
          {/* Address */}
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mb-3">
            <MapPin className="w-3 h-3 shrink-0 opacity-50" />
            {shop.address}
          </p>

          {/* Scissors divider */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-border/60" />
            <Scissors className="w-3 h-3 text-primary/30 rotate-45" />
            <div className="h-px flex-1 bg-border/60" />
          </div>

          {/* Stats + CTA */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
                <span className="text-xs font-bold text-foreground">
                  {shop.totalReviews ?? 0}
                </span>
                <span className="text-xs text-muted-foreground">vlerësime</span>
              </div>
              {isTop && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                  <BadgeCheck className="w-3 h-3" /> Premium
                </span>
              )}
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground px-3.5 py-1.5 rounded-full group-hover:gap-2.5 transition-all duration-200 shadow-md shadow-primary/30 group-hover:shadow-primary/50 shrink-0">
              Rezervo <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Ticker ──────────────────────────────────────────────── */
const tickerItems = [
  "Prerje Flokësh",
  "Rregullim Mjekre",
  "Rrojë me Peshqir të Nxehtë",
  "Fade",
  "Skin Fade",
  "Line Up",
  "Ngjyrosje",
  "Larje Flokësh",
  "Prerje për Fëmijë",
  "Rrojë me Brisk",
  "Pompadour",
  "Burst Fade",
];

function Ticker() {
  const doubled = [...tickerItems, ...tickerItems];
  return (
    <div className="overflow-hidden py-5 border-y border-border/50 relative">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="flex animate-ticker gap-10 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-3 text-sm font-medium text-muted-foreground shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Banner Ads ──────────────────────────────────────────── */
const bannerAds = [
  {
    id: 1,
    bg: "from-[#0f0c29] via-[#302b63] to-[#24243e]",
    image:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1200&q=80",
    label: "LINE UP PRISHTINA",
    headline: "Skin Fade me çmim special",
    sub: "Vetëm këtë javë · Rezervo tani",
    cta: "Rezervo Tani",
    ctaColor: "bg-primary hover:bg-primary/90",
    badge: "−40%",
    badgeColor: "bg-primary",
  },
  {
    id: 2,
    bg: "from-[#1a1a2e] via-[#16213e] to-[#0f3460]",
    image:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80",
    label: "PAKETA VIP",
    headline: "Prerje + Larje + Pomadë falas",
    sub: "Ofertë e kufizuar · Dyqanet partnere",
    cta: "Shiko Ofertën",
    ctaColor: "bg-blue-500 hover:bg-blue-600",
    badge: "VIP",
    badgeColor: "bg-blue-500",
  },
  {
    id: 3,
    bg: "from-[#0d0d0d] via-[#1a0a00] to-[#2d1500]",
    image:
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1200&q=80",
    label: "BEARD STUDIO",
    headline: "Rregullim mjekre profesional",
    sub: "Teknikë premium · Me berber të çertifikuar",
    cta: "Zbulo Tani",
    ctaColor: "bg-amber-500 hover:bg-amber-600",
    badge: "E RE",
    badgeColor: "bg-amber-500",
  },
  {
    id: 4,
    bg: "from-[#0a0a0a] via-[#0d1f0d] to-[#0a2a0a]",
    image:
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=80",
    label: "TRIM PRIZREN",
    headline: "Hapim dyqanin tonë të ri!",
    sub: "Grand Opening · 30 ditë falas për pronarët",
    cta: "Partnero me ne",
    ctaColor: "bg-emerald-500 hover:bg-emerald-600",
    badge: "GRAND OPENING",
    badgeColor: "bg-emerald-500",
  },
];

/* ── AdvertiseModal ──────────────────────────────────────── */
const AD_PACKAGES = [
  { id: "basic",    label: "Basic",    price: 9,  duration: "7 ditë",   desc: "1 banner · 5k shikime" },
  { id: "standard", label: "Standard", price: 19, duration: "30 ditë",  desc: "1 banner · 20k shikime" },
  { id: "premium",  label: "Premium",  price: 30, duration: "30 ditë",  desc: "3 bannerë · 60k shikime + featured" },
];

function AdvertiseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<"form" | "pay" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState("standard");
  const [form, setForm] = useState({ business: "", contact: "", city: "", address: "", message: "" });
  const [cardholderName, setCardholderName] = useState("");
  const [cardError, setCardError] = useState("");
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeInitError, setStripeInitError] = useState("");
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<any>(null);
  const cardRef = useRef<any>(null);
  const { toast } = useToast();

  const pkg = AD_PACKAGES.find(p => p.id === selectedPkg)!;

  useEffect(() => {
    if (!open || step !== "pay") return;

    setStripeReady(false);
    setStripeInitError("");

    let mounted = true;

    (async () => {
      try {
        if (!stripeRef.current) {
          const cfgRes = await fetch("/api/payments/stripe-config");
          const cfgText = await cfgRes.text();
          let cfg: any = {};
          try { cfg = JSON.parse(cfgText); } catch {}
          if (!cfgRes.ok) throw new Error(cfg?.error ?? `Stripe config gabim (${cfgRes.status})`);
          if (!cfg.publishableKey) throw new Error("Çelësi publik i Stripe mungon — kontrolloni variablat e mjedisit");
          const { loadStripe } = await import("@stripe/stripe-js");
          stripeRef.current = await loadStripe(cfg.publishableKey);
          if (!stripeRef.current) throw new Error("loadStripe ktheu null");
        }

        if (!mounted) return;

        // Wait one tick to ensure the container ref is in the DOM
        await new Promise(r => setTimeout(r, 50));
        if (!mounted || !cardContainerRef.current) throw new Error("Kontaineri nuk u gjet");

        // Destroy previous card instance if any
        if (cardRef.current) {
          cardRef.current.unmount();
          cardRef.current = null;
        }

        const elements = stripeRef.current.elements();
        const card = elements.create("card", {
          hidePostalCode: true,
          style: {
            base: {
              fontSize: "15px",
              fontFamily: "Inter, sans-serif",
              color: "#e5e7eb",
              "::placeholder": { color: "#6b7280" },
              iconColor: "#9ca3af",
            },
            invalid: { color: "#f87171", iconColor: "#f87171" },
          },
        });

        card.mount(cardContainerRef.current);
        card.on("change", (e: any) => setCardError(e.error?.message ?? ""));
        cardRef.current = card;

        if (mounted) setStripeReady(true);
      } catch (err: any) {
        if (mounted) setStripeInitError(err.message ?? "Stripe nuk u ngarkua");
      }
    })();

    return () => {
      mounted = false;
      if (cardRef.current) {
        cardRef.current.unmount();
        cardRef.current = null;
      }
      setStripeReady(false);
    };
  }, [open, step]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.business || !form.contact) return;
    setStep("pay");
  };

  const handlePay = async () => {
    if (!stripeRef.current || !cardRef.current) {
      toast({ title: "Gabim", description: "Stripe nuk u ngarkua. Rifresko faqen.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/payments/create-ad-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package: selectedPkg,
          business: form.business,
          contact: form.contact,
          city: form.city,
          address: form.address,
        }),
      });

      const body = await res.text();
      let data: any = {};
      try { data = JSON.parse(body); } catch {}

      if (!res.ok) {
        throw new Error(data?.error || `Gabim i serverit (${res.status})`);
      }

      const clientSecret: string = data?.clientSecret;
      if (!clientSecret) throw new Error("Nuk u mor clientSecret nga serveri");

      const { error, paymentIntent } = await stripeRef.current.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardRef.current,
          billing_details: { name: cardholderName || form.business },
        },
      });

      if (error) throw new Error(error.message);
      if (paymentIntent?.status === "succeeded") {
        await fetch("/api/ads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            business: form.business,
            contact: form.contact,
            city: form.city || null,
            address: form.address || null,
            message: form.message || null,
            headline: form.business,
            badge: pkg.label.toUpperCase(),
            cta: "Rezervo Tani",
            pkg: selectedPkg,
            stripePaymentId: paymentIntent.id,
          }),
        });
        setStep("done");
      }
    } catch (err: any) {
      toast({ title: "Pagesa dështoi", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border/60 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent px-6 py-5 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg">Reklamo dyqanin tënd</h2>
              <p className="text-xs text-muted-foreground">Arri mijëra klientë në Kosovë</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* ── Step 1: Form ── */}
          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Zgjidhni paketën</p>
                <div className="grid grid-cols-3 gap-2">
                  {AD_PACKAGES.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPkg(p.id)}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                        selectedPkg === p.id
                          ? "border-primary bg-primary/8 shadow-lg shadow-primary/10"
                          : "border-border/50 hover:border-primary/30"
                      }`}
                    >
                      <span className="text-xs font-bold">{p.label}</span>
                      <span className="text-sm font-extrabold text-primary mt-0.5">€{p.price}</span>
                      <span className="text-[10px] text-muted-foreground">{p.duration}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Emri i biznesit *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="p.sh. Barber Lab Prishtina" className="pl-9 h-11 rounded-xl"
                      value={form.business} onChange={e => setForm(f => ({ ...f, business: e.target.value }))} required />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Kontakt (email/tel) *</label>
                  <Input placeholder="email ose nr. telefoni" className="h-11 rounded-xl"
                    value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Qyteti *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                      <Select value={form.city} onValueChange={v => setForm(f => ({ ...f, city: v }))}>
                        <SelectTrigger className="pl-9 h-11 rounded-xl">
                          <SelectValue placeholder="Zgjidhni qytetin..." />
                        </SelectTrigger>
                        <SelectContent>
                          {KOSOVO_CITIES.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Adresa</label>
                    <Input placeholder="p.sh. Rruga UCK, nr. 12" className="h-11 rounded-xl"
                      value={form.address ?? ""} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mesazh shtesë (opsional)</label>
                  <textarea placeholder="Çfarë dëshironi të reklamoni..."
                    className="w-full h-20 px-3 py-2.5 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl font-bold text-base gap-2">
                <CreditCard className="w-4 h-4" />
                Vazhdo te pagesa · €{pkg.price}
              </Button>
            </form>
          )}

          {/* ── Step 2: Card payment ── */}
          {step === "pay" && (
            <div className="space-y-4">
              {/* Order summary */}
              <div className="bg-muted/40 rounded-2xl p-4 border border-border/40">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Përmbledhje</p>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">Paketa {pkg.label}</span>
                  <span className="font-extrabold text-primary">€{pkg.price}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{pkg.duration} · {pkg.desc}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-border/40 flex justify-between text-xs text-muted-foreground">
                  <span>Biznesi</span>
                  <span className="font-semibold text-foreground">{form.business}</span>
                </div>
              </div>

              {/* Stripe init error */}
              {stripeInitError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <span className="text-red-500 text-sm">⚠</span>
                  <p className="text-xs text-red-400">{stripeInitError}</p>
                </div>
              )}

              {/* Card inputs */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Emri në kartë</label>
                  <Input
                    placeholder="p.sh. Artan Berisha"
                    className="h-11 rounded-xl"
                    value={cardholderName}
                    onChange={e => setCardholderName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Të dhënat e kartës
                    {!stripeReady && !stripeInitError && (
                      <span className="ml-2 text-muted-foreground font-normal">— duke ngarkuar...</span>
                    )}
                  </label>
                  {/* Stripe mounts its iframe directly into this div — no flex/items-center */}
                  <div
                    ref={cardContainerRef}
                    className="rounded-xl border border-input bg-background px-3 py-3 transition-shadow focus-within:ring-2 focus-within:ring-primary/30"
                    style={{ minHeight: "44px" }}
                  />
                  {cardError && (
                    <p className="text-xs text-red-500 mt-1">⚠ {cardError}</p>
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Numri i kartës · Data e skadimit · CVC
                </p>
              </div>

              {/* Security badge */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Pagesa sigurohet nga Stripe. Nuk ruajmë asnjë të dhënë bankare.
                </p>
              </div>

              {/* Test card helper */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/8 border border-blue-500/20">
                <CreditCard className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <p className="text-[10px] text-blue-400">
                  Test: <span className="font-mono font-bold">4242 4242 4242 4242</span> · çdo datë e ardhshme · çdo 3 shifra CVC
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setStep("form")}>
                  Kthehu
                </Button>
                <Button className="flex-1 h-12 rounded-xl font-bold gap-2" onClick={handlePay} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  {loading ? "Duke procesuar..." : `Paguaj €${pkg.price}`}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === "done" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl">Pagesa u krye me sukses!</h3>
                <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
                  Do t'ju kontaktojmë brenda 24 orëve në{" "}
                  <span className="font-semibold text-foreground">{form.contact}</span> për të aktivizuar reklamën tuaj.
                </p>
              </div>
              <Button className="w-full h-11 rounded-xl" onClick={onClose}>Mbyll</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BannerAds() {
  const [current, setCurrent] = useState(0);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [ads, setAds] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/ads")
      .then((r) => r.json())
      .then((data) => { setAds(Array.isArray(data) ? data : []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (ads.length < 2) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % ads.length), 4500);
    return () => clearInterval(t);
  }, [ads.length]);

  const BG_GRADIENTS = [
    "from-[#0f0c29] via-[#302b63] to-[#24243e]",
    "from-[#1a1a2e] via-[#16213e] to-[#0f3460]",
    "from-[#0d0d0d] via-[#1a0a00] to-[#2d1500]",
    "from-[#0a0a0a] via-[#0d1f0d] to-[#0a2a0a]",
  ];
  const BADGE_COLORS = ["bg-primary", "bg-blue-500", "bg-amber-500", "bg-emerald-500"];
  const CTA_COLORS = [
    "bg-primary hover:bg-primary/90",
    "bg-blue-500 hover:bg-blue-600",
    "bg-amber-500 hover:bg-amber-600",
    "bg-emerald-500 hover:bg-emerald-600",
  ];

  return (
    <>
      <AdvertiseModal open={adModalOpen} onClose={() => setAdModalOpen(false)} />

      {loaded && ads.length === 0 ? (
        /* ── Placeholder when no ads ── */
        <div
          className="relative w-full overflow-hidden rounded-2xl border border-dashed border-primary/25 bg-gradient-to-r from-primary/5 via-background to-primary/5 flex items-center justify-between px-8 gap-6 cursor-pointer group"
          style={{ height: "110px" }}
          onClick={() => setAdModalOpen(true)}
        >
          <div className="flex items-center gap-5">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-0.5">
                Hapësirë reklamimi
              </p>
              <p className="font-black text-lg text-foreground leading-tight">
                Reklamoni biznesin tuaj këtu
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Arrini mijëra klientë në Kosovë · Nga €9/javë
              </p>
            </div>
          </div>
          <button
            className="shrink-0 bg-primary text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-105 whitespace-nowrap"
            onClick={(e) => { e.stopPropagation(); setAdModalOpen(true); }}
          >
            Fillo Tani
          </button>
        </div>
      ) : (
        /* ── Rotating banner when ads exist ── */
        <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl" style={{ height: "110px" }}>
          {ads.map((a, i) => {
            const bg = BG_GRADIENTS[i % BG_GRADIENTS.length];
            const badgeColor = BADGE_COLORS[i % BADGE_COLORS.length];
            const ctaColor = CTA_COLORS[i % CTA_COLORS.length];
            return (
              <div
                key={a.id}
                className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
              >
                {a.imageUrl && (
                  <img src={a.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: "center 30%" }} />
                )}
                <div className={`absolute inset-0 bg-gradient-to-r ${bg} ${a.imageUrl ? "opacity-85" : "opacity-95"}`} />
                <div className="relative h-full flex items-center justify-between px-8 gap-6">
                  <div className="flex items-center gap-5 min-w-0">
                    {a.badge && (
                      <span className={`shrink-0 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md text-white ${badgeColor}`}>
                        {a.badge}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-0.5">
                        {a.city ? `${a.business} · ${a.city}` : a.business}
                      </p>
                      <p className="text-white font-black text-lg leading-tight truncate">
                        {a.headline || a.business}
                      </p>
                      {a.message && <p className="text-white/55 text-xs mt-0.5 truncate">{a.message}</p>}
                    </div>
                  </div>
                  <button className={`shrink-0 ${ctaColor} text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-lg transition-all duration-200 hover:scale-105 whitespace-nowrap`}>
                    {a.cta || "Zbulo Tani"}
                  </button>
                </div>
              </div>
            );
          })}
          {ads.length > 1 && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {ads.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all duration-300 ${i === current ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/35"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Advertise CTA — always visible below banner */}
      <div className="mt-3 flex items-center justify-end">
        <button
          onClick={() => setAdModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 hover:bg-primary/15 border border-primary/25 text-primary text-xs font-bold transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/10"
        >
          <Megaphone className="w-3.5 h-3.5" />
          Reklamo dyqanin tënd
        </button>
      </div>
    </>
  );
}

/* ── HowItWorks ──────────────────────────────────────────── */
function HowItWorks() {
  const { ref: headRef, inView: headInView } = useInView(0.2);
  const { ref: cardRef, inView: cardInView } = useInView(0.15);

  const steps = [
    {
      step: "01",
      title: "Gjej dyqanin tënd",
      desc: "Kërko sipas qytetit, shfleto vlerësimet dhe eksploro fotot e berberive më të mira të Kosovës.",
    },
    {
      step: "02",
      title: "Zgjidhni një vend",
      desc: "Zgjidhni berberin tuaj dhe orën e preferuar nga disponueshmëria në kohë reale.",
    },
    {
      step: "03",
      title: "Konfirmo me OTP",
      desc: "Merrni një kod të njëhershëm. Konfirmuar menjëherë, pa asnjë telefonatë.",
    },
  ];

  const [activeSlot, setActiveSlot] = useState(2);

  useEffect(() => {
    const t = setInterval(() => setActiveSlot((s) => (s + 1) % 6), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="si-funksionon" className="py-18 relative overflow-hidden bg-primary/6">
      {/* Subtle dot-grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Soft glow top-right */}
      <div className="absolute -top-32 right-0 w-[500px] h-[500px] bg-primary/6 rounded-full blur-3xl pointer-events-none" />

      <div className="container px-6 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div
          ref={headRef}
          className="max-w-xl mb-16"
          style={{
            opacity: headInView ? 1 : 0,
            transform: headInView ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold text-primary tracking-[0.22em] uppercase mb-4">
            <span className="w-6 h-px bg-primary" />
            Si Funksionon
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 leading-[1.1]">
            Rezervo në{" "}
            <span className="relative inline-block">
              3 hapa
              <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-primary rounded-full" />
            </span>{" "}
            të thjeshtë
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Nga zbulimi deri te takimi — më shpejt se një telefonatë.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Steps */}
          <div>
            {steps.map((s, i) => (
              <StepCard
                key={s.step}
                step={s.step}
                title={s.title}
                desc={s.desc}
                index={i}
                delay=""
              />
            ))}
          </div>

          {/* Booking card mockup */}
          <div
            ref={cardRef}
            className="relative hidden md:flex items-center justify-center"
            style={{
              opacity: cardInView ? 1 : 0,
              transform: cardInView
                ? "translateX(0) scale(1)"
                : "translateX(40px) scale(0.96)",
              transition: "opacity 0.8s ease, transform 0.8s ease",
              transitionDelay: cardInView ? "200ms" : "0ms",
            }}
          >
            {/* Soft glow behind card */}
            <div className="absolute w-80 h-80 bg-primary/8 rounded-full blur-3xl" />

            {/* Main card — clean white/surface look */}
            <div
              className="relative rounded-3xl p-6 w-80 shadow-2xl border border-border/60 bg-card animate-float border-white/20 bg-white/10 backdrop-blur-sm"
              style={{ animationDuration: "5s" }}
            >
              {/* Shop header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                  <Scissors className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">Line UP Prishtina</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Rr. Bill Clinton Nr. 42
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                  <span className="text-xs font-bold">4.9</span>
                </div>
              </div>

              {/* Time slots with animated active state */}
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Zgjidhni orën
              </p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {["09:00", "09:30", "10:30", "11:00", "14:00", "15:30"].map(
                  (t, i) => (
                    <button
                      key={t}
                      onClick={() => setActiveSlot(i)}
                      className={`py-2.5 text-center text-xs font-semibold rounded-xl transition-all duration-300 ${
                        i === activeSlot
                          ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                          : "bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      {t}
                    </button>
                  ),
                )}
              </div>

              {/* Selected barber row */}
              <div className="rounded-xl p-3.5 flex items-center gap-3 bg-muted/40 border border-border/40">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-sm font-black text-primary shrink-0">
                  V
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">Visar Berisha</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Prerje Flokësh · 30 min · 8€
                  </p>
                </div>
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </div>
              </div>

              {/* CTA button */}
              <button className="mt-4 w-full py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 transition-all duration-200 hover:scale-[1.02]">
                Konfirmo Rezervimin
              </button>
            </div>

            {/* Floating OTP badge */}
            <div
              className="absolute -bottom-4 -left-6 bg-card border border-border/60 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 animate-float-slow"
              style={{ animationDelay: "1.5s" }}
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-600">
                  ✓ Takimi konfirmuar
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  OTP: 847 391
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── GroomingProductCard ──────────────────────────────────── */
const CARD_ACCENTS = [
  { glow: "from-amber-500/20 to-orange-400/10",  border: "hover:border-amber-400/50",  iconBg: "bg-amber-500/15",  iconText: "text-amber-400" },
  { glow: "from-sky-500/20 to-blue-400/10",       border: "hover:border-sky-400/50",    iconBg: "bg-sky-500/15",    iconText: "text-sky-400" },
  { glow: "from-emerald-500/20 to-green-400/10",  border: "hover:border-emerald-400/50",iconBg: "bg-emerald-500/15",iconText: "text-emerald-400" },
  { glow: "from-violet-500/20 to-purple-400/10",  border: "hover:border-violet-400/50", iconBg: "bg-violet-500/15", iconText: "text-violet-400" },
  { glow: "from-cyan-500/20 to-sky-400/10",       border: "hover:border-cyan-400/50",   iconBg: "bg-cyan-500/15",   iconText: "text-cyan-400" },
  { glow: "from-pink-500/20 to-rose-400/10",      border: "hover:border-pink-400/50",   iconBg: "bg-pink-500/15",   iconText: "text-pink-400" },
];

function GroomingProductCard({ product, index }: { product: any; index: number }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [added, setAdded] = useState(false);
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.isAvailable) return;
    addItem({
      id: product.id,
      name: product.name,
      price: String(product.price),
      imageUrl: product.imageUrl,
    });
    setAdded(true);
    toast({ title: "Shtuar në shportë!", description: product.name });
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="relative group shrink-0 w-64 md:w-72">
      {/* Glow behind card */}
      <div
        className={`absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-70 transition-opacity duration-500 bg-gradient-to-b ${accent.glow} pointer-events-none`}
      />

      <Link href="/marketplace" className="block h-full">
        <div
          className={`relative flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-350 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-black/20 h-full ${accent.border}`}
        >
          {/* Product image */}
          <div className="relative h-56 overflow-hidden bg-muted flex items-center justify-center p-6">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                style={{ mixBlendMode: "multiply" }}
              />
            ) : (
              <div className={`w-20 h-20 rounded-2xl ${accent.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <ShoppingBag className={`w-10 h-10 ${accent.iconText}`} />
              </div>
            )}

            {/* Category chip */}
            {product.category && (
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/55 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider">
                {product.category}
              </div>
            )}

            {/* Out of stock */}
            {!product.isAvailable && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="px-3 py-1.5 rounded-full bg-destructive text-white text-xs font-bold">Pa stok</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-5 flex flex-col gap-4 flex-1">
            <div>
              <p className="text-base font-bold leading-tight line-clamp-2">{product.name}</p>
              {product.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
              )}
              <p className={`font-extrabold text-2xl mt-2 ${accent.iconText}`}>€{product.price}</p>
            </div>

            {/* Add to cart button */}
            <button
              onClick={handleAdd}
              disabled={!product.isAvailable}
              className={`mt-auto w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-250 active:scale-95
                ${added
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  : product.isAvailable
                    ? "bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 hover:border-transparent hover:shadow-lg hover:shadow-primary/25"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
            >
              {added ? (
                <><Check className="w-4 h-4" /> Shtuar në shportë!</>
              ) : (
                <><Plus className="w-4 h-4" /> Shto në shportë</>
              )}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ── GroomingProductGrid (Slider) ────────────────────────── */
function GroomingProductGrid() {
  const { data: productsRes, isLoading } = useListProducts({ limit: 10 });
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const products = Array.isArray(productsRes)
    ? productsRes
    : Array.isArray(productsRes?.data)
      ? productsRes.data
      : [];

  const updateScrollState = () => {
    const el = sliderRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [products.length]);

  const scroll = (dir: "left" | "right") => {
    const el = sliderRef.current;
    if (!el) return;
    const cardW = el.querySelector("div")?.offsetWidth ?? 288;
    el.scrollBy({ left: dir === "right" ? cardW + 16 : -(cardW + 16), behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="flex gap-5 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="shrink-0 w-64 md:w-72 rounded-2xl border border-border/50 bg-card overflow-hidden animate-pulse">
            <div className="h-56 bg-muted" />
            <div className="p-5 space-y-3">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-6 bg-muted rounded w-1/3" />
              <div className="h-11 bg-muted rounded-xl mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>Nuk u gjetën produkte.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Left arrow */}
      <button
        onClick={() => scroll("left")}
        className={`absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center transition-all duration-200 hover:border-primary/40 hover:shadow-primary/10 ${
          canScrollLeft ? "opacity-100 hover:scale-105" : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Scrollable track */}
      <div
        ref={sliderRef}
        className="flex gap-5 overflow-x-auto pb-4 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((p: any, i: number) => (
          <GroomingProductCard key={p.id} product={p} index={i} />
        ))}
        {/* View all card */}
        <Link href="/marketplace" className="shrink-0 w-64 md:w-72">
          <div className="h-full min-h-[360px] rounded-2xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-4 hover:border-primary/40 hover:bg-primary/3 transition-all duration-300 group cursor-pointer">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <ArrowRight className="w-7 h-7 text-primary" />
            </div>
            <div className="text-center px-4">
              <p className="font-bold text-sm">Shiko të gjitha</p>
              <p className="text-xs text-muted-foreground mt-1">Produktet grooming</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll("right")}
        className={`absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center transition-all duration-200 hover:border-primary/40 ${
          canScrollRight ? "opacity-100 hover:scale-105" : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function Home() {
  const [, setLocation] = useLocation();
  const [city, setCity] = useState<string>("all");
  const statsRef = useRef<HTMLDivElement>(null);
  const [publicStats, setPublicStats] = useState<{
    activeShops: number;
    activeBarbers: number;
    totalUsers: number;
    confirmedAppointments: number;
    citiesCount: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/stats/public")
      .then((r) => r.json())
      .then((d) => setPublicStats(d))
      .catch(() => {});
  }, []);

  const { data: topShopsData, isLoading: isLoadingTop } = useListTopBarbershops({
    limit: 12,
  });

  const { data: allShopsData } = useListBarbershops({ status: "active", limit: 200 });

  const { data: cityShopsData, isLoading: isLoadingCity } = useListBarbershops(
    city !== "all" ? { city, status: "active", limit: 50 } : { limit: 0 },
  );

  const isLoading = city === "all" ? isLoadingTop : isLoadingCity;
  const topShops =
    city === "all"
      ? (Array.isArray(topShopsData) ? topShopsData : [])
      : (cityShopsData?.data ?? []);

  // Only show cities that actually have at least one active barbershop
  const availableCities = Array.from(
    new Set((allShopsData?.data ?? []).map((s: any) => s.city).filter(Boolean))
  ).sort() as string[];

  const handleSearch = () => {
    setLocation(city !== "all" ? `/barbershops?city=${city}` : "/barbershops");
  };

  return (
    <div className="flex flex-col">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Barber tools photo — dark, full bleed */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={barberToolsBg}
            alt=""
            className="w-full h-full object-cover scale-105"
          />
          {/* dark overlay so text stays readable */}
          <div className="absolute inset-0 bg-black/62" />
          {/* subtle blue tint at bottom */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent" />
        </div>

        <div className="container px-4 sm:px-6 max-w-7xl mx-auto relative z-10 pt-24 sm:pt-28 pb-16 sm:pb-20">
          <div className="max-w-4xl">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-xs font-semibold text-white mb-8 animate-badge-pop">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
              Platforma #1 e Berberëve në Kosovë
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.04] animate-fade-up text-white">
              Gjej berberin
              <br />
              <span className="text-shimmer">tënd të përsosur.</span>
            </h1>

            <p className="mt-4 sm:mt-6 text-base sm:text-xl text-white/70 max-w-xl leading-relaxed animate-fade-up delay-200">
              Rezervo takime në berbertë më të mirë të Kosovës në nën 30
              sekonda. Pa telefonata, pa pritje.
            </p>

            {/* Search bar */}
            <div className="mt-10 animate-fade-up delay-300">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 flex flex-row gap-2 max-w-xl shadow-lg shadow-black/30">
                <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/8">
                  <MapPin className="text-primary w-4 h-4 shrink-0" />
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 px-0 text-sm h-auto text-white [&>span]:text-white/80 [&>svg]:text-white/50">
                      <SelectValue placeholder="Zgjidhni qytetin…" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl max-h-60 overflow-y-auto">
                      <SelectItem value="all">Kudo në Kosovë</SelectItem>
                      {availableCities.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <button
                  onClick={handleSearch}
                  className="search-expand-btn rounded-xl flex items-center justify-center bg-primary text-white font-bold shadow-md shadow-primary/40 transition-all duration-300 ease-out hover:shadow-xl hover:shadow-primary/50 active:scale-95"
                >
                  <Search className="w-4 h-4 shrink-0 transition-transform duration-300" />
                  <span className="search-expand-text  text-sm whitespace-nowrap overflow-hidden">
                    Kërko
                  </span>
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
                <div
                  key={text}
                  className="flex items-center gap-1.5 border border-white/20 bg-white/10 backdrop-blur-sm px-3.5 py-2 rounded-full text-xs font-medium text-white/80"
                >
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Barber cutout figure */}
        <div
          className="absolute right-0 bottom-0 hidden md:block w-[280px] lg:w-[420px] xl:w-[500px] pointer-events-none select-none"
          style={{ zIndex: 8 }}
        >
          {/* Shadow under feet */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-8 bg-primary/20 blur-2xl rounded-full" />
          <img
            src={barberCutout}
            alt="Berber profesional"
            className="w-full h-auto object-contain drop-shadow-2xl animate-float-slow"
            style={{ filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.35))" }}
          />
        </div>

        {/* Floating shop preview card — positioned right of centre, by barber's shoulder */}
        <div
          className="absolute left-[62%] top-[18%] hidden xl:block animate-float delay-300"
          style={{ zIndex: 12 }}
        >
          <div className="rounded-2xl p-4 w-56 shadow-xl  border border-white/20 bg-white/10 backdrop-blur-sm text-xs font-medium text-white/80">
            <div className="w-full h-28 rounded-xl overflow-hidden mb-3 bg-muted">
              <img
                src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400"
                className="w-full h-full object-cover"
                alt="dyqan"
              />
            </div>
            <p className="text-sm font-semibold">The Barber Lab</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Prishtina
            </p>
            <div className="mt-2.5 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              <span className="text-xs font-bold">4.9</span>
              <span className="text-xs text-muted-foreground">
                · 203 vlerësime
              </span>
            </div>
          </div>
        </div>

        {/* Floating OTP card */}
        <div
          className="absolute right-[28%] bottom-[22%] hidden xl:block animate-float-slow delay-200"
          style={{ zIndex: 10 }}
        >
          <div className="flex items-center gap-1.5 border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-full text-xs font-medium text-white/80">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold">Takimi konfirmuar!</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                OTP: 847 391
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BANNER ADS ───────────────────────────────────── */}
      <section className="py-8 bg-background">
        <div className="container px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/40">
              // STILEON
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-border via-primary/20 to-transparent" />
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
              Reklama
            </span>
            <div className="flex-1 h-px bg-gradient-to-l from-border via-primary/20 to-transparent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/40">
              Ads
            </span>
          </div>
          <BannerAds />
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────── */}
      <section id="numrat" className="py-24 relative overflow-hidden">
        {/* Tools photo background */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={barberToolsBg}
            alt=""
            className="w-full h-full object-cover opacity-[0.08]"
            style={{ objectPosition: "center 60%" }}
          />
          <div className="absolute inset-0 bg-background/88" />
        </div>
        {/* Section background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/60 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-primary/5 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />

        <div className="container px-6 max-w-7xl mx-auto relative z-10">
          {/* Section label */}
          <div className="flex items-center gap-4 mb-14">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/40">
              // STILE
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-border via-primary/20 to-transparent" />
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
              Numrat tanë
            </span>
            <div className="flex-1 h-px bg-gradient-to-l from-border via-primary/20 to-transparent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/40">
              ON
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              value={publicStats?.citiesCount ?? 0}
              suffix="+"
              label="Qytete në Kosovë"
              icon={MapPin}
              index={0}
              color={{
                bg: "bg-blue-500/10",
                text: "text-blue-500",
                border: "border-blue-500/15 hover:border-blue-500/40",
                glow: "bg-blue-400/20 ",
              }}
            />
            <StatCard
              value={publicStats?.activeBarbers ?? 0}
              suffix="+"
              label="Berberë aktivë"
              icon={Scissors}
              index={1}
              color={{
                bg: "bg-violet-500/10",
                text: "text-violet-500",
                border: "border-violet-500/15 hover:border-violet-500/40",
                glow: "bg-violet-400/20",
              }}
            />
            <StatCard
              value={publicStats?.totalUsers ?? 0}
              suffix="+"
              label="Klientë të regjistruar"
              icon={Users}
              index={2}
              color={{
                bg: "bg-emerald-500/10",
                text: "text-emerald-500",
                border: "border-emerald-500/15 hover:border-emerald-500/40",
                glow: "bg-emerald-400/20",
              }}
            />
            <StatCard
              value={publicStats?.confirmedAppointments ?? 0}
              suffix="+"
              label="Takime të konfirmuara"
              icon={Calendar}
              index={3}
              color={{
                bg: "bg-primary/10",
                text: "text-primary",
                border: "border-primary/15 hover:border-primary/40",
                glow: "bg-primary/20",
              }}
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <HowItWorks />

      {/* ── TOP SHOPS ────────────────────────────────────── */}
      <section id="vleresuar" className="py-24 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="absolute top-12 right-8 opacity-5">
            <Scissors className="w-48 h-48 text-primary rotate-12" />
          </div>
          <div className="absolute bottom-12 left-8 opacity-5">
            <Scissors className="w-32 h-32 text-primary -rotate-45" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/4 rounded-full blur-3xl" />
        </div>

        <div className="container px-6 max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-[2px] bg-primary rounded-full" />
                <span className="text-xs font-bold text-primary tracking-widest uppercase">
                  Më të vlerësuarat
                </span>
                <div className="w-5 h-[2px] bg-primary rounded-full" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Dyqanet më të mira në{" "}
                <span className="text-shimmer">
                  {city !== "all" ? city : "Kosovë"}
                </span>
              </h2>
              <p className="text-muted-foreground mt-2 flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                Verifikuar nga mijëra klientë të vërtetë
              </p>
            </div>
            <Link
              href="/barbershops"
              className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group shrink-0"
            >
              Shiko të gjitha{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* City filter pills — only cities with actual shops */}
          <div className="flex flex-wrap gap-2 mb-10">
            {["all", ...availableCities].map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`btn-pill px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  city === c
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-background/70 border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                {c === "all" ? "Të gjitha qytetet" : c}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden bg-card border border-border/40"
                >
                  <Skeleton className="h-52 w-full rounded-none" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex justify-between pt-1">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-7 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : topShops.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Scissors className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nuk ka dyqane në {city !== "all" ? city : "Kosovë"} ende.</p>
              <p className="text-sm mt-1">Provoni një qytet tjetër ose shikoni të gjitha.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topShops.map((shop, i) => (
                <ShopCard key={shop.id} shop={shop} index={i} />
              ))}
            </div>
          )}

          <div className="mt-10 text-center md:hidden">
            <Link
              href="/barbershops"
              className="btn-pill inline-flex items-center gap-2 px-6 py-3 bg-background/80 border border-border/60 text-sm font-semibold hover:border-primary/30 transition-all"
            >
              Shiko të gjitha dyqanet <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section id="pse-trim" className="py-28 bg-zinc-950 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundSize: "64px 64px",
          }}
        />
        {/* Floating razor bg decoration */}
        <div
          className="absolute -right-20 top-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.10] animate-float-slow"
          aria-hidden="true"
        >
          <img
            src={razorImg}
            alt=""
            className="w-[480px] h-[480px] object-contain"
            style={{ transform: "rotate(22deg)" }}
          />
        </div>
        {/* Top glow bar */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

        <div className="container px-6 max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-primary/60" />
              <span className="text-xs font-bold text-primary tracking-widest uppercase">Pse Line UP</span>
              <div className="w-6 h-px bg-primary/60" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Ndërtuar për kulturën e<br className="hidden md:block" /> berberëve të Kosovës
            </h2>
            <p className="text-white/50 text-lg">Gjithçka që ju nevojitet, asgjë tjetër.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard icon={Zap} title="Rezervim i menjëhershëm" desc="Disponueshmëri vendesh në kohë reale. Rezervo në nën 30 sekonda pa asnjë telefonatë." delay="delay-100" index={0} />
            <FeatureCard icon={Shield} title="Konfirmim OTP" desc="Çdo takim sigurohet me një kod të njëhershëm — pa rezervime të dyfishta, asnjëherë." delay="delay-200" index={1} />
            <FeatureCard icon={MapPin} title="E gjithë Kosova" desc="Prishtina, Prizren, Peja, Gjilan, Ferizaj dhe më shumë — 6 qytete dhe duke u rritur." delay="delay-300" index={2} />
            <FeatureCard icon={Star} title="Vlerësime të verifikuara" desc="Vlerësime reale nga klientë të vërtetë. Dije çfarë të pret para se të rezervosh." delay="delay-100" index={3} />
            <FeatureCard icon={ShoppingBagIcon} title="Produkte kozmetike" desc="Bli pomadë, vaj mjekre dhe produkte stilimi direkt nga berberi juaj." delay="delay-200" index={4} />
            <FeatureCard icon={TrendingUp} title="Analitikë dyqani" desc="Pronarët marrin një panel të plotë — të ardhura, takime, berberë dhe shitje produktesh." delay="delay-300" index={5} />
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ─────────────────────────────────────── */}
      <section id="shop" className="py-24 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
        {/* Floating brush decoration */}
        <div
          className="absolute -right-28 top-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.055] animate-float"
          aria-hidden="true"
        >
          <img
            src={brushImg}
            alt=""
            className="w-[500px] h-[500px] object-contain"
            style={{ transform: "rotate(-18deg)", animationDuration: "8s" }}
          />
        </div>

        <div className="container px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-[2px] bg-primary rounded-full" />
                <span className="text-xs font-bold text-primary tracking-widest uppercase">Grooming Shop</span>
                <div className="w-5 h-[2px] bg-primary rounded-full" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Produktet më të mira<br />
                <span className="text-shimmer">për grooming</span>
              </h2>
              <p className="text-muted-foreground mt-2">
                Pomadë, gel, vaj mjekre — drejtpërdrejt nga berberët tuaj.
              </p>
            </div>
            <Link
              href="/marketplace"
              className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group shrink-0"
            >
              Shiko të gjitha{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <GroomingProductGrid />
        </div>
      </section>

      {/* ── CITIES ───────────────────────────────────────── */}
      <section
        id="disponueshem"
        className="py-24 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0a1628 0%, #0d2137 40%, #071a14 75%, #050e0a 100%)" }}
      >
        {/* Top divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        {/* Ambient glow blobs */}
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-600/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="container px-6 max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">I disponueshëm në</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Qyteti juaj është{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                i mbuluar
              </span>
            </h2>
            <p className="text-white/50 mt-3 text-base max-w-md mx-auto">
              Zgjedh qytetin tënd dhe rezervo ose porosit online.
            </p>
          </div>

          <KosovoCitiesMap />
        </div>

        {/* Bottom divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
      </section>

      {/* ── OWNER CTA ────────────────────────────────────── */}
      <section
        id="reklama"
        className="py-28 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0c1445 0%, #1a1060 40%, #0d1b3e 70%, #081229 100%)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        {/* Razor — floating left background */}
        <div
          className="absolute -left-10 top-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.18] animate-float-slow"
          style={{ animationDuration: "8s" }}
          aria-hidden="true"
        >
          <img
            src={razorImg}
            alt=""
            className="w-[320px] h-[320px] object-contain"
            style={{ transform: "rotate(-25deg)" }}
          />
        </div>

        {/* Brush — floating right background */}
        <div
          className="absolute -right-8 bottom-10 pointer-events-none select-none opacity-[0.15] animate-float"
          style={{ animationDuration: "6.5s", animationDelay: "2s" }}
          aria-hidden="true"
        >
          <img
            src={brushImg}
            alt=""
            className="w-[240px] h-[240px] object-contain"
            style={{ transform: "rotate(22deg)" }}
          />
        </div>

        {/* Center glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container px-6 max-w-3xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/8 border border-white/12 px-4 py-2 rounded-full text-xs font-semibold text-primary mb-8">
            <TrendingUp className="w-3.5 h-3.5" />
            Për pronarët e berberive
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.06] mb-6">
            Zhvillo dyqanin tënd
            <br />
            <span className="text-shimmer">me Line UP.</span>
          </h2>

          <p className="text-xl text-white/55 mb-8 max-w-2xl mx-auto leading-relaxed">
            Bëhuni i dukshëm nga mijëra klientë në të gjithë Kosovën. Menaxhoni
            rezervimet, ekipin, produktet dhe të ardhurat — të gjitha në një panel.
          </p>

          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-3 bg-white/6 border border-white/12 px-6 py-3 rounded-full text-sm font-medium">
              <span className="text-primary font-bold">10€/muaj</span>
              <span className="text-white/25">·</span>
              <span className="text-white/50">0.50€ për takim</span>
              <span className="text-white/25">·</span>
              <span className="text-emerald-400 font-medium">30 ditët e para falas</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="btn-pill inline-flex items-center justify-center gap-2 px-9 py-4 bg-primary text-white font-bold text-base shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-shadow"
            >
              <Sparkles className="w-4 h-4" />
              Partnero me ne
            </Link>
            <Link
              href="/barbershops"
              className="btn-pill inline-flex items-center justify-center gap-2 px-9 py-4 bg-white/8 border border-white/15 text-white text-base font-semibold hover:bg-white/14 transition-colors"
            >
              <Play className="w-4 h-4" />
              Shiko si funksionon
            </Link>
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM ─────────────────────────────────── */}
      <ContactSection />
    </div>
  );
}

/* ── ContactSection ──────────────────────────────────────── */
function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { ref, inView } = useInView(0.1);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1300));
    setSending(false);
    setSent(true);
  };

  const contactInfo = [
    { icon: Mail,  label: "Email",    value: "info@trimkosova.com",     sub: "Brenda 24 orëve" },
    { icon: Phone, label: "Telefon",  value: "+383 44 123 456",          sub: "E hënë–E premte, 09–18" },
    { icon: MapPin,label: "Adresa",   value: "Rr. Nëna Terezë, Prishtinë", sub: "Kosovë 10000" },
  ];

  return (
    <section id="kontakt" className="py-24 bg-primary/6 relative overflow-hidden" ref={ref}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

      <div className="container px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div
          className="text-center mb-14"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-5 h-[2px] bg-primary rounded-full" />
            <span className="text-xs font-bold text-primary tracking-widest uppercase">Na kontaktoni</span>
            <div className="w-5 h-[2px] bg-primary rounded-full" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Si mund t'ju ndihmojmë?</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Pyetje rreth platformës, partneriteteve ose mbështetjes teknike — jemi këtu.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Left: info cards */}
          <div
            className="lg:col-span-2 space-y-4"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateX(0)" : "translateX(-30px)",
              transition: "opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s",
            }}
          >
            {contactInfo.map(({ icon: Icon, label, value, sub }) => (
              <div
                key={label}
                className="flex gap-4 p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/25 transition-colors group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold">{value}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}

            {/* CTA box */}
            <div className="p-5 rounded-2xl bg-primary/8 border border-primary/15">
              <p className="text-sm font-bold mb-1">Dëshiron të bashkohesh si pronar?</p>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Regjistro dyqanin tënd falas dhe fillo të marrësh klientë të rinj sot.
              </p>
              <Link
                href="/register"
                className="btn-pill inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold"
              >
                <Sparkles className="w-3 h-3" />
                Fillo Falas
              </Link>
            </div>
          </div>

          {/* Right: form */}
          <div
            className="lg:col-span-3"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateX(0)" : "translateX(30px)",
              transition: "opacity 0.6s ease 0.25s, transform 0.6s ease 0.25s",
            }}
          >
            <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-xl shadow-black/5">
              {sent ? (
                <div className="text-center py-14">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Mesazhi u dërgua!</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed">
                    Faleminderit! Ekipi ynë do t'ju përgjigjet brenda 24 orëve.
                  </p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}
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
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                        Emri i plotë <span className="text-primary">*</span>
                      </label>
                      <input
                        name="name" value={form.name} onChange={handleChange}
                        placeholder="Artan Berisha"
                        className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                        Email <span className="text-primary">*</span>
                      </label>
                      <input
                        name="email" type="email" value={form.email} onChange={handleChange}
                        placeholder="artan@email.com"
                        className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                        Telefoni
                      </label>
                      <input
                        name="phone" value={form.phone} onChange={handleChange}
                        placeholder="+383 44 000 000"
                        className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
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

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      Mesazhi <span className="text-primary">*</span>
                    </label>
                    <textarea
                      name="message" value={form.message} onChange={handleChange}
                      rows={4}
                      placeholder="Shkruani mesazhin tuaj këtu..."
                      className="w-full px-4 py-3 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none placeholder:text-muted-foreground/40"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending || !form.name || !form.email || !form.message}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-primary text-white font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Duke dërguar...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Dërgo Mesazhin
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

/* Inline icon to avoid import collision */
function ShoppingBagIcon(props: any) {
  return <ShoppingBag {...props} />;
}
