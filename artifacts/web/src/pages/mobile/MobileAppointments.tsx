import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Calendar, Clock, MapPin, CalendarPlus, CheckCircle2, AlertCircle,
  RotateCcw, Sparkles, ChevronRight, XCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function MobileAppointments() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["user-appointments", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const res = await fetch("/api/appointments/me");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const filtered = appointments.filter((app: any) => {
    const isPast = new Date(app.date) < new Date() || app.status === "completed" || app.status === "cancelled";
    return tab === "upcoming" ? !isPast : isPast;
  });

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
            Takimet e Mia
          </span>
          <h1 className="text-lg font-black text-slate-900 leading-tight">
            Historia & Statusi
          </h1>
        </div>

        <Link href="/barbershops">
          <button className="flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-3 py-1.5 rounded-full shadow-xs active:scale-95 transition-all">
            <CalendarPlus className="w-3.5 h-3.5 text-blue-600" /> Rezervo të ri
          </button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <button
          onClick={() => setTab("upcoming")}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
            tab === "upcoming"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Të ardhshme
        </button>
        <button
          onClick={() => setTab("past")}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
            tab === "past"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Të kaluara
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-white border border-slate-200/80 space-y-3 shadow-sm">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-slate-800">Nuk keni takime në këtë kategori</h3>
          <p className="text-xs text-slate-500">Rezervoni takimin tuaj të ardhshëm te berberët tanë me zë.</p>
          <Link href="/barbershops">
            <motion.button
              whileTap={{ scale: 0.94 }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-sm shadow-blue-500/20"
            >
              Kërko Barber
            </motion.button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item: any) => {
            const statusColor =
              item.status === "confirmed"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : item.status === "pending_otp"
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-slate-100 border-slate-200 text-slate-600";

            const statusText =
              item.status === "confirmed"
                ? "E Konfirmuar"
                : item.status === "pending_otp"
                ? "Në Pritje të OTP"
                : item.status === "completed"
                ? "Përfunduar"
                : "Anuluar";

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${statusColor}`}>
                    {statusText}
                  </span>
                  <span className="text-xs font-bold text-blue-600">€{item.price || "12.00"}</span>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{item.serviceName || "Qethje + Mjekërr"}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{item.barberName || "Master Barber"} • {item.shopName || "LineUp Barbershop"}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{item.time || "14:00"}</span>
                  </div>
                </div>

                {tab === "past" && (
                  <Link href={`/book/${item.shopId || 1}`}>
                    <button className="w-full py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-bold text-blue-600 flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Rezervo përsëri këtë shërbim
                    </button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
