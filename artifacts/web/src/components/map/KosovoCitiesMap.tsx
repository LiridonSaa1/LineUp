import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MapPin, ArrowRight, Scissors } from "lucide-react";
import { MUNICIPALITIES } from "./kosovo-paths";

// ── Blue palette matching theme --primary (hsl 217 91% 65%) ──────────────────
const BLUE = {
  light:       "#60a5fa", // blue-400
  mid:         "#3b82f6", // blue-500
  dark:        "#2563eb", // blue-600
  darker:      "#1d4ed8", // blue-700
  stroke:      "#1e3a8a", // blue-950
  textLight:   "#dbeafe", // blue-100
  textMid:     "#93c5fd", // blue-300
  glowBg:      "rgba(96,165,250,0.10)",
  activeCardBg:"linear-gradient(135deg, rgba(96,165,250,0.18), rgba(37,99,235,0.10))",
  activeBorder:"rgba(96,165,250,0.40)",
  iconBg:      "rgba(96,165,250,0.10)",
  iconGrad:    "linear-gradient(135deg, #60a5fa, #2563eb)",
  statsFooter: "rgba(96,165,250,0.06)",
  statsBorder: "rgba(96,165,250,0.15)",
};

interface CityStats {
  city: string;
  shopCount: number;
  barberCount: number;
}

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
  const [cityStats, setCityStats] = useState<CityStats[]>([]);

  useEffect(() => {
    fetch("/api/barbershops/city-stats")
      .then((r) => r.json())
      .then((data: CityStats[]) => {
        if (Array.isArray(data) && data.length > 0) setCityStats(data);
      })
      .catch(() => {});
  }, []);

  // Cities with active accounts in DB drive everything — no hardcoded "covered" list
  const activeCityNames = new Set(cityStats.map(s => s.city.toLowerCase()));
  const isCoveredFromDB = (displayName: string | null) =>
    displayName ? activeCityNames.has(displayName.toLowerCase()) : false;

  // Sidebar: show only cities that have active accounts, sorted by barber count
  const displayCities = cityStats
    .map(s => ({ name: s.city, barberCount: s.barberCount, shopCount: s.shopCount }))
    .sort((a, b) => b.barberCount - a.barberCount);

  const totalBarbers = cityStats.reduce((s, c) => s + c.barberCount, 0);
  const totalCities  = cityStats.length;

  const hoveredCity = displayCities.find((c) => {
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
        {/* Ambient glow */}
        <div
          className="absolute inset-0 -m-8 rounded-full blur-3xl pointer-events-none"
          style={{ background: BLUE.glowBg }}
        />

        <svg
          viewBox="0 0 600 520"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-auto drop-shadow-2xl"
          aria-label="Harta e Komunave të Kosovës"
        >
          <defs>
            <linearGradient id="coveredGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor={BLUE.light} />
              <stop offset="100%" stopColor={BLUE.dark} />
            </linearGradient>
            <linearGradient id="hoveredGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor={BLUE.textMid} />
              <stop offset="100%" stopColor={BLUE.mid} />
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
          </defs>

          <g filter="url(#mapShadow)">
            {MUNICIPALITIES.map((m) => {
              const isHovered = hovered === m.shapeName;
              const isCovered = isCoveredFromDB(m.displayName);
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
                  stroke={isCovered ? BLUE.stroke : "#0f172a"}
                  strokeWidth={isHovered ? 1.8 : 0.8}
                  strokeLinejoin="round"
                  className={isCovered ? "cursor-pointer" : "cursor-default"}
                  style={{ transition: "fill 0.2s, stroke-width 0.2s" }}
                  onMouseEnter={() => setHovered(m.shapeName)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => isCovered ? handleClick(m.displayName) : undefined}
                  filter={isHovered && isCovered ? "url(#hoverGlow)" : undefined}
                />
              );
            })}
          </g>

          {MUNICIPALITIES.filter(m => isCoveredFromDB(m.displayName)).map((m, i) => {
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
                {/* Pulse ring */}
                <circle cx={m.cx} cy={m.cy} r="8" fill={BLUE.light} opacity="0">
                  <animate attributeName="r"       values="6;18;6"    dur="2.6s" repeatCount="indefinite" begin={`${i * 0.37}s`} />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="2.6s" repeatCount="indefinite" begin={`${i * 0.37}s`} />
                </circle>
                {/* Outer halo */}
                <circle cx={m.cx} cy={m.cy} r={isHov ? 9 : 7} fill="white" opacity="0.15"
                  style={{ transition: "r 0.15s" }} />
                {/* Inner dot */}
                <circle
                  cx={m.cx} cy={m.cy} r={isHov ? 5.5 : 4}
                  fill={isHov ? "#ffffff" : BLUE.textMid}
                  stroke={isHov ? BLUE.dark : BLUE.darker}
                  strokeWidth="1.5"
                  filter="url(#hoverGlow)"
                  style={{ transition: "r 0.15s" }}
                />
                <text
                  x={m.cx + dx} y={m.cy + dy}
                  textAnchor={anchor}
                  fontSize={isHov ? "13" : "11"}
                  fontWeight="800"
                  fill={isHov ? "#ffffff" : BLUE.textLight}
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
              style={{ background: `linear-gradient(135deg, ${BLUE.light}, ${BLUE.dark})` }} />
            <span className="text-xs text-white/40 font-medium">
              {totalCities > 0 ? `${totalCities} qytete aktive` : "Qytete aktive"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-slate-700 border border-slate-600" />
            <span className="text-xs text-white/40 font-medium">Duke ardhur</span>
          </div>
        </div>
      </div>

      {/* ── CITY LIST PANEL ── */}
      <div className="w-full lg:w-72 flex-shrink-0">
        <p className="text-xs font-bold tracking-widest uppercase mb-3"
          style={{ color: `${BLUE.light}b3` }}
        >
          Qytetet e mbuluara
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
          {displayCities.length === 0 && (
            <div className="col-span-2 text-center py-6 text-white/30 text-xs">
              Ende nuk ka biznese aktive të regjistruara.
            </div>
          )}
          {displayCities.map((city) => {
            const muni     = MUNICIPALITIES.find(m => m.displayName === city.name);
            const isActive = hovered === muni?.shapeName;

            return (
              <button
                key={city.name}
                className="group flex items-center gap-2.5 lg:gap-3.5 px-3 py-2.5 lg:px-4 lg:py-3.5 rounded-2xl text-left w-full border transition-all duration-200"
                style={{
                  background: isActive ? BLUE.activeCardBg : "rgba(255,255,255,0.04)",
                  borderColor: isActive ? BLUE.activeBorder : "rgba(255,255,255,0.06)",
                  transform: isActive ? "translateX(2px)" : "none",
                }}
                onMouseEnter={() => muni && setHovered(muni.shapeName)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleClick(city.name)}
              >
                {/* Icon */}
                <div
                  className="w-7 h-7 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
                  style={{ background: isActive ? BLUE.iconGrad : BLUE.iconBg }}
                >
                  <MapPin
                    className="w-3.5 h-3.5 lg:w-4 lg:h-4 transition-colors duration-200"
                    style={{ color: isActive ? "#ffffff" : BLUE.light }}
                  />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold text-xs lg:text-sm truncate transition-colors duration-200"
                    style={{ color: isActive ? BLUE.textMid : "#e2e8f0" }}
                  >
                    {city.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Scissors
                      className="w-2.5 h-2.5 lg:w-3 lg:h-3 flex-shrink-0"
                      style={{ color: `${BLUE.mid}b3` }}
                    />
                    <span className="text-[10px] text-white/35 font-medium whitespace-nowrap">
                      {city.barberCount !== null ? `${city.barberCount}+ berberë` : "—"}
                    </span>
                  </div>
                </div>

                {/* Arrow — desktop only */}
                <ArrowRight
                  className="w-4 h-4 flex-shrink-0 transition-all duration-200 hidden lg:block"
                  style={{
                    color: isActive ? BLUE.light : "rgba(255,255,255,0.15)",
                    transform: isActive ? "translateX(2px)" : "none",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* Stats footer */}
        <div
          className="mt-4 px-4 py-3 rounded-2xl border"
          style={{ background: BLUE.statsFooter, borderColor: BLUE.statsBorder }}
        >
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xl lg:text-2xl font-extrabold" style={{ color: BLUE.light }}>
                {totalCities > 0 ? totalCities : "—"}
              </p>
              <p className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">Qytete</p>
            </div>
            <div>
              <p className="text-xl lg:text-2xl font-extrabold" style={{ color: BLUE.light }}>
                {totalBarbers > 0 ? `${totalBarbers}+` : "—"}
              </p>
              <p className="text-[10px] text-white/35 uppercase tracking-wider mt-0.5">Berberë</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
