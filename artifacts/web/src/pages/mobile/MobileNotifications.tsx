import { Bell, Calendar, Sparkles, ShieldCheck, Tag } from "lucide-react";

const NOTIFICATIONS = [
  {
    id: 1,
    title: "Takimi u Konfirmua me Sukses! ✂️",
    time: "Para 10 minutash",
    desc: "Takimi juaj te Barber Shop Prishtina nesër në ora 14:00 është konfirmuar.",
    type: "booking",
  },
  {
    id: 2,
    title: "Kupon i Ri Zbritjeje 🏷️",
    time: "Dje",
    desc: "Ju keni fituar 20% zbritje me kodin LINEUPVIP20 për shërbimet grooming.",
    type: "promo",
  },
];

export default function MobileNotifications() {
  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
          Njoftimet
        </span>
        <h1 className="text-lg font-black text-slate-900 leading-tight">
          Qendra e Njoftimeve
        </h1>
      </div>

      <div className="space-y-2.5">
        {NOTIFICATIONS.map((n) => (
          <div key={n.id} className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex gap-3 items-start shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-600">
              {n.type === "booking" ? <Calendar className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 truncate">{n.title}</h3>
                <span className="text-[9px] text-slate-400 shrink-0">{n.time}</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
