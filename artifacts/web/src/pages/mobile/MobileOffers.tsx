import { useState } from "react";
import { motion } from "framer-motion";
import { Tag, Sparkles, Copy, Check, Flame, Gift, Scissors } from "lucide-react";

const OFFERS = [
  {
    id: 1,
    code: "LINEUPVIP20",
    title: "20% Zbritje në Rezervimin e Parë",
    desc: "Vlefshme për të gjitha berberitë partnere në Prishtinë, Pejë, Prizren & Mitrovicë.",
    discount: "20% OFF",
    bg: "from-amber-600/30 to-amber-900/20",
    border: "border-amber-500/40",
  },
  {
    id: 2,
    code: "VIPGROOM5",
    title: "€5 Kthim me Pako Kombo",
    desc: "Rezervo Qethje + Mjekërr + Trajtim me Peshqir të Nxehtë dhe fito 5€ bonus në shportë.",
    discount: "€5 BONUS",
    bg: "from-blue-600/30 to-indigo-900/20",
    border: "border-blue-500/40",
  },
];

export default function MobileOffers() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
          Promovimet e Fundit
        </span>
        <h1 className="text-lg font-black text-slate-900 leading-tight">
          Ofertat & Kuponat Zbritës
        </h1>
      </div>

      <div className="space-y-3">
        {OFFERS.map((offer) => (
          <div
            key={offer.id}
            className="p-4 rounded-3xl bg-white border border-slate-200/80 space-y-3 shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Ekskluzive
              </span>
              <span className="text-xs font-black text-white bg-blue-600 px-2 py-0.5 rounded-lg">
                {offer.discount}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-slate-900">{offer.title}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{offer.desc}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="font-mono text-xs font-black text-blue-700 tracking-wider">
                {offer.code}
              </span>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => handleCopy(offer.code)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1"
              >
                {copiedCode === offer.code ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> U Kopjua!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Kopjo Kodin
                  </>
                )}
              </motion.button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Barber Shop Packages ── */}
      <div className="pt-4 space-y-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
            Për Pronarët e Berberive
          </span>
          <h2 className="text-base font-black text-slate-900 leading-tight">
            Zhvillo dyqanin tënd me LineUP
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Menaxhoni rezervimet, me ekipin, produktet dhe të ardhura — të gjitha në një panel.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { name: "Starter", price: "5€", period: "/muaj", limit: "Deri 2 punëtorë", popular: false },
            { name: "Standard", price: "10€", period: "/muaj", limit: "Deri 4 punëtorë", popular: true, badge: "★ MË E KËRKUARA" },
            { name: "Pro", price: "15€", period: "/muaj", limit: "Deri 6 punëtorë", popular: false },
            { name: "Business", price: "20€", period: "/muaj", limit: "Deri 8 punëtorë", popular: false },
          ].map((pkg) => (
            <div
              key={pkg.name}
              className={`p-3.5 rounded-2xl border space-y-1.5 transition-all ${
                pkg.popular
                  ? "bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white border-purple-500/50 shadow-md"
                  : "bg-white border-slate-200 text-slate-900 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-extrabold ${pkg.popular ? "text-purple-300" : "text-slate-500"}`}>
                  {pkg.name}
                </span>
                {pkg.badge && (
                  <span className="text-[8px] font-black bg-purple-500 text-white px-1.5 py-0.5 rounded-full">
                    MË E KËRKUARA
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-extrabold">{pkg.price}</span>
                  <span className={`text-[10px] ${pkg.popular ? "text-slate-300" : "text-slate-500"}`}>{pkg.period}</span>
                </div>
                <p className={`text-[11px] font-medium ${pkg.popular ? "text-slate-200" : "text-slate-600"}`}>
                  {pkg.limit}
                </p>
              </div>
            </div>
          ))}
        </div>

        <a
          href="https://lineup-ks.com/partner"
          target="_blank"
          rel="noreferrer"
          className="block w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs text-center shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          ✨ Partnero me ne
        </a>
      </div>
    </div>
  );
}
