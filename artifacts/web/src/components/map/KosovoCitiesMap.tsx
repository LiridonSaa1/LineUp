import { useState } from "react";
import { useLocation } from "wouter";
import { MapPin, ArrowRight, Scissors } from "lucide-react";
import { MUNICIPALITIES } from "./kosovo-paths";

const COVERED_CITIES = [
  { name: "Prishtina", shops: 12, emoji: "🏙️" },
  { name: "Prizren",   shops: 8,  emoji: "🏰" },
  { name: "Peja",      shops: 6,  emoji: "🏔️" },
  { name: "Gjakova",   shops: 5,  emoji: "🌿" },
  { name: "Mitrovica", shops: 4,  emoji: "⚙️" },
  { name: "Ferizaj",   shops: 4,  emoji: "🚉" },
  { name: "Gjilan",    shops: 3,  emoji: "🌄" },
];

const LABEL_OFFSETS: Record<string, { dx?: number; dy?: number; anchor?: "start" | "middle" | "end" }> = {
  Prishtina:  { dy: -14, anchor: "middle" },
  Prizren:    { dy:  14, anchor: "middle" },
  Peja:       { dx: -8, dy: -13, anchor: "end" },
  Gjakova:    { dy:  15, anchor: "middle" },
  Mitrovica:  { dy: -13, anchor: "middle" },
  Ferizaj:    { dy:  15, anchor: "middle" },
  Gjilan:     { dx: 8,  dy: -13, anchor: "start" },
};

export default function KosovoCitiesMap() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const hoveredCity = COVERED_CITIES.find(c => {
    const m = MUNICIPALITIES.find(m => m.displayName === c.name);
    return m?.shapeName === hovered;
  });

  const handleClick = (displayName: string | null) => {
    if (displayName) setLocation(`/barbershops?city=${displayName}`);
  };

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-16 w-full">

      {/* ── MAP ── */}
      <div className="relative flex-1 w-full">
        {/* Ambient glow behind map */}
        <div className="absolute inset-0 -m-8 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <svg
          viewBox="0 0 600 520"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-auto drop-shadow-2xl"
          aria-label="Harta e Komunave të Kosovës"
        >
          <defs>
            <linearGradient id="coveredGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="hoveredGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="hoverGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="mapShadow" x="-8%" y="-8%" width="120%" height="120%">
              <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#000" floodOpacity="0.5" />
            </filter>
            <filter id="textShadow">
              <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor="#000" floodOpacity="0.9" />
            </filter>
            <filter id="innerShadow" x="-5%" y="-5%" width="110%" height="110%">
              <feOffset dx="0" dy="2" />
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <g filter="url(#mapShadow)">
            {MUNICIPALITIES.map((m) => {
              const isHovered = hovered === m.shapeName;
              const isCovered = m.isCovered;
              let fill: string;
              if (isCovered) {
                fill = isHovered ? "url(#hoveredGrad)" : "url(#coveredGrad)";
              } else {
                fill = isHovered ? "#374151" : "#1e293b";
              }
              return (
                <path
                  key={m.shapeName}
                  d={m.d}
                  fill={fill}
                  stroke={isCovered ? "#064e3b" : "#0f172a"}
                  strokeWidth={isHovered ? 1.8 : 0.8}
                  strokeLinejoin="round"
                  className={isCovered ? "cursor-pointer" : "cursor-default"}
                  style={{ transition: "fill 0.2s, stroke-width 0.2s" }}
                  onMouseEnter={() => setHovered(m.shapeName)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleClick(m.displayName)}
                  filter={isHovered && isCovered ? "url(#hoverGlow)" : undefined}
                />
              );
            })}
          </g>

          {MUNICIPALITIES.filter(m => m.isCovered).map((m, i) => {
            const off    = LABEL_OFFSETS[m.displayName!] ?? {};
            const dx     = off.dx ?? 0;
            const dy     = off.dy ?? 0;
            const anchor = off.anchor ?? "middle";
            const isHov  = hovered === m.shapeName;
            return (
              <g
                key={m.shapeName}
                className="cursor-pointer"
                onMouseEnter={() => setHovered(m.shapeName)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleClick(m.displayName)}
              >
                <circle cx={m.cx} cy={m.cy} r="8" fill="#34d399" opacity="0">
                  <animate attributeName="r"       values="6;18;6"     dur="2.6s" repeatCount="indefinite" begin={`${i * 0.37}s`} />
                  <animate attributeName="opacity" values="0.3;0;0.3"  dur="2.6s" repeatCount="indefinite" begin={`${i * 0.37}s`} />
                </circle>
                <circle cx={m.cx} cy={m.cy} r={isHov ? 9 : 7} fill="white" opacity="0.2"
                  style={{ transition: "r 0.15s" }} />
                <circle cx={m.cx} cy={m.cy} r={isHov ? 5.5 : 4}
                  fill={isHov ? "#ffffff" : "#a7f3d0"}
                  stroke={isHov ? "#059669" : "#065f46"}
                  strokeWidth="1.5"
                  filter="url(#hoverGlow)"
                  style={{ transition: "r 0.15s" }}
                />
                <text
                  x={m.cx + dx} y={m.cy + dy}
                  textAnchor={anchor}
                  fontSize={isHov ? "13" : "11"}
                  fontWeight="800"
                  fill={isHov ? "#ffffff" : "#d1fae5"}
                  filter="url(#textShadow)"
                  letterSpacing="0.3"
                  style={{ fontFamily: "Inter, sans-serif", transition: "font-size 0.15s, fill 0.15s" }}
                >
                  {m.displayName}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm"
              style={{ background: "linear-gradient(135deg, #34d399, #059669)" }} />
            <span className="text-xs text-white/40 font-medium">7 qytete aktive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-slate-700 border border-slate-600" />
            <span className="text-xs text-white/40 font-medium">Duke ardhur</span>
          </div>
        </div>
      </div>

      {/* ── CITY LIST PANEL ── */}
      <div className="w-full lg:w-72 flex-shrink-0">
        <p className="text-xs font-bold text-emerald-400/70 tracking-widest uppercase mb-3">
          Qytetet e mbuluara
        </p>

        {/* Mobile: 2-column compact grid | Desktop: single-column list */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
          {COVERED_CITIES.map((city) => {
            const muni     = MUNICIPALITIES.find(m => m.displayName === city.name);
            const isActive = hovered === muni?.shapeName;

            return (
              <button
                key={city.name}
                className="group flex items-center gap-2.5 lg:gap-3.5 px-3 py-2.5 lg:px-4 lg:py-3.5 rounded-2xl text-left w-full border transition-all duration-200"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(52,211,153,0.18), rgba(5,150,105,0.10))"
                    : "rgba(255,255,255,0.04)",
                  borderColor: isActive ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.06)",
                  transform: isActive ? "translateX(2px)" : "none",
                }}
                onMouseEnter={() => muni && setHovered(muni.shapeName)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleClick(city.name)}
              >
                {/* Icon */}
                <div
                  className="w-7 h-7 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #34d399, #059669)"
                      : "rgba(52,211,153,0.1)",
                  }}
                >
                  <MapPin
                    className="w-3.5 h-3.5 lg:w-4 lg:h-4 transition-colors duration-200"
                    style={{ color: isActive ? "#ffffff" : "#34d399" }}
                  />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold text-xs lg:text-sm truncate transition-colors duration-200"
                    style={{ color: isActive ? "#a7f3d0" : "#e2e8f0" }}
                  >
                    {city.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Scissors className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-emerald-500/70 flex-shrink-0" />
                    <span className="text-[10px] text-white/35 font-medium whitespace-nowrap">
                      {city.shops}+ berberë
                    </span>
                  </div>
                </div>

                {/* Arrow — desktop only */}
                <ArrowRight
                  className="w-4 h-4 flex-shrink-0 transition-all duration-200 hidden lg:block"
                  style={{
                    color: isActive ? "#34d399" : "rgba(255,255,255,0.15)",
                    transform: isActive ? "translateX(2px)" : "none",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Stats footer */}
        <div
          className="mt-4 px-4 py-3 rounded-2xl border border-emerald-500/15"
          style={{ background: "rgba(52,211,153,0.06)" }}
        >
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xl lg:text-2xl font-extrabold text-emerald-400">7</p>
              <p className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">Qytete</p>
            </div>
            <div>
              <p className="text-xl lg:text-2xl font-extrabold text-emerald-400">42+</p>
              <p className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">Berberë</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
