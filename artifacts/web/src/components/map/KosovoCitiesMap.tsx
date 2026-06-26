import { Link } from "wouter";

interface City {
  name: string;
  // center coords in image coordinate space (415 x 432)
  cx: number;
  cy: number;
  rx: number; // ellipse x-radius covering municipality
  ry: number; // ellipse y-radius covering municipality
  labelDx?: number;
  labelDy?: number;
  anchor?: "start" | "middle" | "end";
}

// Coordinates derived from geographic position mapped to the Kosovo map image (415×432 px).
// Each ellipse is sized to roughly cover the municipality area visible in the image.
const CITIES: City[] = [
  {
    name: "Mitrovica",
    cx: 208, cy: 118,
    rx: 52,  ry: 36,
    labelDy: -44, anchor: "middle",
  },
  {
    name: "Peja",
    cx: 68,  cy: 185,
    rx: 56,  ry: 48,
    labelDx: -4, labelDy: -56, anchor: "middle",
  },
  {
    name: "Prishtina",
    cx: 275, cy: 192,
    rx: 56,  ry: 44,
    labelDx: 8, labelDy: -52, anchor: "middle",
  },
  {
    name: "Gjakova",
    cx: 98,  cy: 278,
    rx: 52,  ry: 52,
    labelDx: -4, labelDy: 62, anchor: "middle",
  },
  {
    name: "Gjilan",
    cx: 348, cy: 255,
    rx: 48,  ry: 40,
    labelDx: 8, labelDy: -48, anchor: "middle",
  },
  {
    name: "Ferizaj",
    cx: 272, cy: 280,
    rx: 44,  ry: 38,
    labelDx: 4, labelDy: 50, anchor: "middle",
  },
  {
    name: "Prizren",
    cx: 168, cy: 340,
    rx: 58,  ry: 44,
    labelDx: -4, labelDy: 54, anchor: "middle",
  },
];

export default function KosovoCitiesMap() {
  // We render the map in its natural 415×432 coordinate space.
  // The image is placed as an SVG <image>; overlays are drawn on top.
  const W = 415;
  const H = 432;

  return (
    <div className="relative w-full max-w-xl mx-auto select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
        aria-label="Harta e Komunave të Kosovës"
      >
        <defs>
          {/* Soft green radial gradient for municipality highlight */}
          {CITIES.map((c) => (
            <radialGradient
              key={`g-${c.name}`}
              id={`grad-${c.name}`}
              cx="50%" cy="50%" r="50%"
            >
              <stop offset="0%"   stopColor="#16a34a" stopOpacity="0.55" />
              <stop offset="60%"  stopColor="#22c55e" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#4ade80" stopOpacity="0"    />
            </radialGradient>
          ))}

          {/* Glow filter for markers */}
          <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft drop shadow for labels */}
          <filter id="textShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.7" />
          </filter>
        </defs>

        {/* ── Base map image ── */}
        <image
          href="/kosovo-map.png"
          x="0" y="0"
          width={W} height={H}
          preserveAspectRatio="xMidYMid meet"
        />

        {/* ── Semi-transparent dark overlay to desaturate non-covered areas ── */}
        <rect x="0" y="0" width={W} height={H} fill="#0f172a" opacity="0.35" />

        {/* ── Green ellipse overlays for covered municipalities ── */}
        {CITIES.map((c, i) => (
          <Link key={c.name} href={`/barbershops?city=${c.name}`}>
            <g className="cursor-pointer" role="link" aria-label={c.name}>

              {/* Ellipse glow background */}
              <ellipse
                cx={c.cx} cy={c.cy}
                rx={c.rx + 12} ry={c.ry + 12}
                fill={`url(#grad-${c.name})`}
                opacity="0.6"
              />

              {/* Main green ellipse */}
              <ellipse
                cx={c.cx} cy={c.cy}
                rx={c.rx} ry={c.ry}
                fill={`url(#grad-${c.name})`}
                stroke="#22c55e"
                strokeWidth="1.4"
                strokeOpacity="0.7"
              />

              {/* Pulse ring */}
              <circle cx={c.cx} cy={c.cy} r="10" fill="#22c55e" opacity="0.15">
                <animate
                  attributeName="r"
                  values="8;18;8"
                  dur="2.4s"
                  repeatCount="indefinite"
                  begin={`${i * 0.34}s`}
                />
                <animate
                  attributeName="opacity"
                  values="0.2;0;0.2"
                  dur="2.4s"
                  repeatCount="indefinite"
                  begin={`${i * 0.34}s`}
                />
              </circle>

              {/* Core dot */}
              <circle
                cx={c.cx} cy={c.cy}
                r="5"
                fill="#4ade80"
                stroke="#ffffff"
                strokeWidth="1.5"
                filter="url(#glow)"
              />

              {/* City label */}
              <text
                x={c.cx + (c.labelDx ?? 0)}
                y={c.cy + (c.labelDy ?? 0)}
                textAnchor={c.anchor ?? "middle"}
                fontSize="12"
                fontWeight="800"
                fill="#ffffff"
                filter="url(#textShadow)"
                letterSpacing="0.2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {c.name}
              </text>
            </g>
          </Link>
        ))}
      </svg>

      {/* ── Legend ── */}
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.6)]" />
          <span className="text-xs text-muted-foreground font-medium">
            Qytete të mbuluara (7)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-slate-600/70 border border-slate-500" />
          <span className="text-xs text-muted-foreground font-medium">
            Duke ardhur së shpejti
          </span>
        </div>
      </div>
    </div>
  );
}
