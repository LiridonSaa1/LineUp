import { Link } from "wouter";

interface City {
  name: string;
  cx: number;
  cy: number;
  labelDx?: number;
  labelDy?: number;
  anchor?: "start" | "middle" | "end";
}

const CITIES: City[] = [
  { name: "Mitrovica",  cx: 285, cy: 90,  labelDy: -14, anchor: "middle" },
  { name: "Peja",       cx: 88,  cy: 158, labelDx: -12, anchor: "end"    },
  { name: "Prishtina",  cx: 390, cy: 168, labelDx: 14,  anchor: "start"  },
  { name: "Gjakova",    cx: 130, cy: 248, labelDx: -12, anchor: "end"    },
  { name: "Gjilan",     cx: 498, cy: 238, labelDx: 14,  anchor: "start"  },
  { name: "Ferizaj",    cx: 370, cy: 272, labelDy: 18,  anchor: "middle" },
  { name: "Prizren",    cx: 220, cy: 320, labelDy: 18,  anchor: "middle" },
];

// Approximate Kosovo outline polygon (simplified geographic tracing)
const KOSOVO_OUTLINE = `
  M 22,118
  C 28,102 38,92 52,85
  L 72,76 95,58 118,44 148,32 182,22 218,18
  C 248,14 268,12 290,16
  L 330,22 368,32 400,26 428,34
  C 452,44 468,58 480,74
  L 492,90 500,108 504,126 506,146
  C 508,164 505,182 498,198
  L 488,216 480,234 474,252 468,270 458,288 444,304
  C 430,318 414,330 396,340
  L 374,350 352,358 328,362 304,364
  C 282,366 260,364 240,358
  L 220,350 200,340 180,328 162,316
  C 148,306 136,294 124,282
  L 110,268 96,254 82,238 68,220 54,200 40,182
  C 30,166 22,148 20,130 Z
`;

// Approximate municipality region polygons (simplified Voronoi-like)
const MUNICIPALITY_REGIONS: { name: string; path: string }[] = [
  {
    name: "Mitrovica",
    path: "M 140,12 L 330,22 L 340,90 L 285,90 L 240,80 L 180,80 L 120,70 L 100,50 Z",
  },
  {
    name: "Peja",
    path: "M 22,118 C 28,102 38,92 52,85 L 100,58 L 120,70 L 180,80 L 240,80 L 240,160 L 180,200 L 80,200 L 30,180 Z",
  },
  {
    name: "Prishtina",
    path: "M 340,90 L 506,146 C 508,164 505,182 498,198 L 488,216 L 420,230 L 360,220 L 290,200 L 240,160 L 240,80 Z",
  },
  {
    name: "Gjakova",
    path: "M 22,118 L 80,200 L 180,200 L 180,300 L 140,320 L 80,290 L 40,250 C 30,230 22,200 20,180 Z",
  },
  {
    name: "Gjilan",
    path: "M 420,230 L 488,216 L 498,238 L 490,260 L 474,280 L 458,300 L 440,318 L 410,330 L 380,330 L 360,290 L 360,250 Z",
  },
  {
    name: "Ferizaj",
    path: "M 290,200 L 360,220 L 360,290 L 380,330 L 340,350 L 304,360 L 270,300 L 260,250 Z",
  },
  {
    name: "Prizren",
    path: "M 80,290 L 140,320 L 180,300 L 260,250 L 270,300 L 240,360 C 220,366 200,364 180,356 L 160,344 L 120,320 L 80,298 Z",
  },
];

export default function KosovoCitiesMap() {
  return (
    <div className="relative w-full max-w-2xl mx-auto select-none">
      <svg
        viewBox="0 0 528 390"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-xl"
        aria-label="Harta e Kosovës — qytetet e mbuluara"
      >
        <defs>
          {/* Green glow for covered cities */}
          <filter id="cityGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtle inner glow for regions */}
          <filter id="regionGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Green gradient for covered regions */}
          <radialGradient id="greenRegion" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.15" />
          </radialGradient>

          {/* Clip path — Kosovo outline */}
          <clipPath id="kosovoClip">
            <path d={KOSOVO_OUTLINE} />
          </clipPath>

          {/* Pulse animation gradient */}
          <radialGradient id="pulseGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── Background glow behind the map ── */}
        <ellipse cx="264" cy="200" rx="230" ry="170" fill="#22c55e" opacity="0.04" />

        {/* ── Kosovo background fill ── */}
        <path d={KOSOVO_OUTLINE} fill="#0f172a" stroke="none" />

        {/* ── Subtle grid texture (clipped inside Kosovo) ── */}
        <g clipPath="url(#kosovoClip)" opacity="0.06">
          {Array.from({ length: 30 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1="0" y1={i * 14}
              x2="528" y2={i * 14}
              stroke="#94a3b8" strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 40 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 14} y1="0"
              x2={i * 14} y2="390"
              stroke="#94a3b8" strokeWidth="0.5"
            />
          ))}
        </g>

        {/* ── Municipality regions (covered = green) ── */}
        <g clipPath="url(#kosovoClip)">
          {MUNICIPALITY_REGIONS.map((r) => (
            <path
              key={r.name}
              d={r.path}
              fill="url(#greenRegion)"
              stroke="#22c55e"
              strokeWidth="0.6"
              strokeOpacity="0.4"
              filter="url(#regionGlow)"
            />
          ))}
        </g>

        {/* ── Kosovo border outline ── */}
        <path
          d={KOSOVO_OUTLINE}
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.8"
          strokeOpacity="0.7"
          strokeLinejoin="round"
        />

        {/* ── City markers + labels ── */}
        {CITIES.map((city) => (
          <Link key={city.name} href={`/barbershops?city=${city.name}`}>
            <g
              className="cursor-pointer"
              style={{ transition: "opacity 0.2s" }}
            >
              {/* Outer pulse ring */}
              <circle
                cx={city.cx}
                cy={city.cy}
                r="18"
                fill="#22c55e"
                opacity="0.12"
              >
                <animate
                  attributeName="r"
                  values="12;22;12"
                  dur="2.5s"
                  repeatCount="indefinite"
                  begin={`${CITIES.indexOf(city) * 0.35}s`}
                />
                <animate
                  attributeName="opacity"
                  values="0.18;0;0.18"
                  dur="2.5s"
                  repeatCount="indefinite"
                  begin={`${CITIES.indexOf(city) * 0.35}s`}
                />
              </circle>

              {/* Mid ring */}
              <circle
                cx={city.cx}
                cy={city.cy}
                r="9"
                fill="#22c55e"
                opacity="0.25"
                filter="url(#cityGlow)"
              />

              {/* Core dot */}
              <circle
                cx={city.cx}
                cy={city.cy}
                r="5"
                fill="#4ade80"
                stroke="#ffffff"
                strokeWidth="1.5"
                filter="url(#cityGlow)"
              />

              {/* City label */}
              <text
                x={city.cx + (city.labelDx ?? 0)}
                y={city.cy + (city.labelDy ?? 0)}
                textAnchor={city.anchor ?? "middle"}
                fontSize="11"
                fontWeight="700"
                fill="#ffffff"
                letterSpacing="0.3"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {city.name}
              </text>
            </g>
          </Link>
        ))}

        {/* ── "Kosovë" label in center ── */}
        <text
          x="264"
          y="210"
          textAnchor="middle"
          fontSize="13"
          fontWeight="400"
          fill="#ffffff"
          opacity="0.12"
          letterSpacing="4"
          style={{ fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}
        >
          KOSOVË
        </text>
      </svg>

      {/* ── Legend ── */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.5)]" />
          <span className="text-xs text-muted-foreground font-medium">Qytete të mbuluara (7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-600 border border-slate-500" />
          <span className="text-xs text-muted-foreground font-medium">Duke ardhur së shpejti</span>
        </div>
      </div>
    </div>
  );
}
