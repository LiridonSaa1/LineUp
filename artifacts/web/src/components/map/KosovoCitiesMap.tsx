import { useState } from "react";
import { useLocation } from "wouter";
import { MUNICIPALITIES } from "./kosovo-paths";

// Label offsets to avoid overlap for covered cities
const LABEL_OFFSETS: Record<string, { dx?: number; dy?: number; anchor?: "start" | "middle" | "end" }> = {
  Prishtina:  { dy: -14, anchor: "middle" },
  Prizren:    { dy:  14, anchor: "middle" },
  Peja:       { dx: -6,  dy: -12, anchor: "end" },
  Gjakova:    { dx: -4,  dy:  14, anchor: "middle" },
  Mitrovica:  { dy: -12, anchor: "middle" },
  Ferizaj:    { dy:  14, anchor: "middle" },
  Gjilan:     { dx:  6,  dy: -12, anchor: "start" },
};

export default function KosovoCitiesMap() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const handleClick = (displayName: string | null) => {
    if (displayName) setLocation(`/barbershops?city=${displayName}`);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-2xl mx-auto">
        <svg
          viewBox="0 0 600 520"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto drop-shadow-lg"
          aria-label="Harta e Komunave të Kosovës"
        >
          <defs>
            {/* Shadow / depth for whole map */}
            <filter id="mapShadow" x="-5%" y="-5%" width="115%" height="115%">
              <feDropShadow dx="2" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.25" />
            </filter>
            {/* Glow for hovered covered city */}
            <filter id="hoverGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Text shadow for labels */}
            <filter id="textShadow">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.8" />
            </filter>
            {/* Pulse animation gradient */}
            <radialGradient id="pulseGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#4ade80" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0"   />
            </radialGradient>
          </defs>

          {/* ── All municipality paths ── */}
          <g filter="url(#mapShadow)">
            {MUNICIPALITIES.map((m) => {
              const isHovered   = hovered === m.shapeName;
              const isCovered   = m.isCovered;
              const fill = isCovered
                ? isHovered ? "#16a34a" : "#22c55e"
                : isHovered ? "#94a3b8" : "#cbd5e1";
              const stroke = "#fff";

              return (
                <path
                  key={m.shapeName}
                  d={m.d}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isHovered ? 1.8 : 1}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className={isCovered ? "cursor-pointer" : "cursor-default"}
                  style={{ transition: "fill 0.18s, stroke-width 0.18s" }}
                  onMouseEnter={() => setHovered(m.shapeName)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleClick(m.displayName)}
                  filter={isHovered && isCovered ? "url(#hoverGlow)" : undefined}
                  aria-label={m.displayName ?? m.shapeName}
                />
              );
            })}
          </g>

          {/* ── Covered city markers + labels ── */}
          {MUNICIPALITIES.filter((m) => m.isCovered).map((m, i) => {
            const off   = LABEL_OFFSETS[m.displayName!] ?? {};
            const dx    = off.dx ?? 0;
            const dy    = off.dy ?? 0;
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
                <circle cx={m.cx} cy={m.cy} r="10" fill="#22c55e" opacity="0">
                  <animate
                    attributeName="r"
                    values="6;16;6"
                    dur="2.5s"
                    repeatCount="indefinite"
                    begin={`${i * 0.36}s`}
                  />
                  <animate
                    attributeName="opacity"
                    values="0.35;0;0.35"
                    dur="2.5s"
                    repeatCount="indefinite"
                    begin={`${i * 0.36}s`}
                  />
                </circle>

                {/* Outer ring */}
                <circle
                  cx={m.cx} cy={m.cy} r={isHov ? 9 : 7}
                  fill="white"
                  opacity="0.35"
                  style={{ transition: "r 0.15s" }}
                />
                {/* Core dot */}
                <circle
                  cx={m.cx} cy={m.cy} r={isHov ? 5.5 : 4}
                  fill={isHov ? "#ffffff" : "#dcfce7"}
                  stroke={isHov ? "#16a34a" : "#166534"}
                  strokeWidth="1.5"
                  style={{ transition: "r 0.15s" }}
                />

                {/* Label */}
                <text
                  x={m.cx + dx}
                  y={m.cy + dy}
                  textAnchor={anchor}
                  fontSize={isHov ? "13" : "11.5"}
                  fontWeight="800"
                  fill="#ffffff"
                  filter="url(#textShadow)"
                  letterSpacing="0.3"
                  style={{ fontFamily: "Inter, sans-serif", transition: "font-size 0.15s" }}
                >
                  {m.displayName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Tooltip for hovered covered city ── */}
      {hovered && MUNICIPALITIES.find(m => m.shapeName === hovered)?.isCovered && (
        <div className="mt-2 px-4 py-1.5 rounded-full bg-green-600 text-white text-sm font-semibold shadow-lg animate-in fade-in duration-150">
          Klikoni për berberët në{" "}
          {MUNICIPALITIES.find(m => m.shapeName === hovered)?.displayName}
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-green-500 border border-green-400" />
          <span className="text-xs text-muted-foreground font-medium">
            Qytete të mbuluara (7)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-slate-300 border border-slate-400" />
          <span className="text-xs text-muted-foreground font-medium">
            Duke ardhur së shpejti
          </span>
        </div>
      </div>
    </div>
  );
}
