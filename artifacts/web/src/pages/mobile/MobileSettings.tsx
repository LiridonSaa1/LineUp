import { useState } from "react";
import { Bell, Lock, Globe, Moon, ShieldCheck, Phone, HelpCircle } from "lucide-react";

export default function MobileSettings() {
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
          Cilësimet
        </span>
        <h1 className="text-lg font-black text-slate-900 leading-tight">
          Preferencat e Aplikacionit
        </h1>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-4.5 h-4.5 text-blue-600" />
            <div>
              <p className="text-xs font-bold text-slate-900">Njoftimet Push</p>
              <p className="text-[10px] text-slate-500">Rikujtues për takimet & ofertat</p>
            </div>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              notifications ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                notifications ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-4.5 h-4.5 text-amber-500" />
            <div>
              <p className="text-xs font-bold text-slate-900">Gjuha</p>
              <p className="text-[10px] text-slate-500">Shqip (Kosovë)</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500">Sq</span>
        </div>

        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-4.5 h-4.5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-slate-900">Ndihma & Mbështetja</p>
              <p className="text-[10px] text-slate-500">Qendra e kontaktit 24/7</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500">Kontakt</span>
        </div>
      </div>
    </div>
  );
}
