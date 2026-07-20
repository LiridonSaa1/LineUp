import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Star, MapPin, Clock, ShieldCheck, Calendar, ArrowLeft,
  CalendarPlus, Check, Phone, Share2, Heart, Award, ChevronRight, Sparkles
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MobileBarberProfile({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const barberId = parseInt(params.id);
  const [favorite, setFavorite] = useState(false);

  const { data: barber, isLoading } = useQuery({
    queryKey: ["barber-detail", barberId],
    queryFn: async () => {
      const res = await fetch(`/api/barbers/${barberId}`);
      if (!res.ok) throw new Error("Barber not found");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-48 rounded-3xl bg-white/5" />
        <div className="h-20 rounded-2xl bg-white/5" />
        <div className="h-32 rounded-2xl bg-white/5" />
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="p-8 text-center space-y-3">
        <Sparkles className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
        <p className="text-sm font-bold text-slate-700">Profil berberi nuk u gjet</p>
        <button
          onClick={() => setLocation("/barbershops")}
          className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
        >
          Kthehu te lista
        </button>
      </div>
    );
  }

  return (
    <div className="pb-8 space-y-6">
      {/* ── Top Cover & Action Bar ── */}
      <div className="relative h-64 bg-slate-900 overflow-hidden">
        {barber.shop?.imageUrl ? (
          <img src={barber.shop.imageUrl} alt={barber.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#121622] to-slate-900 flex items-center justify-center text-4xl">✂️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D13] via-[#0B0D13]/40 to-transparent" />

        {/* Header navigation controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <button
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-full bg-[#0B0D13]/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setFavorite(!favorite)}
              className="w-10 h-10 rounded-full bg-[#0B0D13]/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all"
            >
              <Heart className={`w-5 h-5 ${favorite ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Barber Info Card ── */}
      <div className="px-4 -mt-16 relative z-10 space-y-4">
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16 ring-2 ring-blue-500/40 shadow-sm">
              <AvatarImage src={barber.avatarUrl || undefined} />
              <AvatarFallback className="bg-blue-50 text-blue-600 font-black text-lg">
                {barber.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold text-slate-900 truncate">{barber.name}</h1>
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              </div>
              <p className="text-xs text-blue-600 font-semibold">{barber.specialties || "Master Barber & Stylist"}</p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                {barber.shop?.name}, {barber.shop?.city}
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-black text-amber-500 flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {barber.rating ? Number(barber.rating).toFixed(1) : "5.0"}
              </p>
              <p className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">Vlerësimi</p>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-black text-slate-800 flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                {barber.experienceYears || "5+"} Vjet
              </p>
              <p className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">Përvojë</p>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs font-black text-emerald-600 flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" /> 350+
              </p>
              <p className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">Takime</p>
            </div>
          </div>
        </div>

        {/* ── Bio & Specialty ── */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Rreth Barberit</h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            {barber.bio || "Stilist me përvojë të gjatë në qethje moderne, prerje mjekrre me përsosmëri dhe trajtim me peshqir të nxehtë."}
          </p>
        </div>

        {/* ── Book CTA Button ── */}
        <Link href={`/book/${barber.shop?.id || 1}`}>
          <motion.button
            whileTap={{ scale: 0.94 }}
            className="w-full py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 active:scale-96 transition-all"
          >
            <CalendarPlus className="w-4 h-4 text-white" />
            Rezervo Takim Tani
          </motion.button>
        </Link>
      </div>
    </div>
  );
}
