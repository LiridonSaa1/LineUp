import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  User, Crown, Award, Star, Scissors, Calendar, Bell, Shield,
  Settings, LogOut, ChevronRight, Sparkles, Tag, Heart, HelpCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MobileProfile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <div className="px-4 py-4 space-y-5">
      {/* User Header Profile Card */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-16 w-16 ring-2 ring-blue-500/40 shadow-sm">
            <AvatarImage src={user?.avatarUrl || undefined} />
            <AvatarFallback className="bg-blue-50 text-blue-600 font-black text-xl">
              {user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold text-slate-900 truncate">{user?.name || "Klient VIP"}</h1>
              <Crown className="w-4 h-4 text-amber-500 shrink-0" />
            </div>
            <p className="text-xs text-slate-500 truncate">{user?.email || "klient@lineup.com"}</p>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-wider mt-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Anëtar Gold Club
            </span>
          </div>
        </div>

        {/* Loyalty Counter Stats */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-sm font-black text-blue-600">120</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Pikë Loyalty</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-sm font-black text-slate-800">8</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Qethje të Kryera</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-sm font-black text-emerald-600">20%</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Zbritje Aktivë</p>
          </div>
        </div>
      </div>

      {/* Quick Menu Options */}
      <div className="space-y-2">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">Paneli Im</h2>

        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {[
            { label: "Takimet e Mia", href: "/appointments", icon: Calendar, color: "text-blue-600" },
            { label: "Ofertat & Kuponat", href: "/offers", icon: Tag, color: "text-amber-500" },
            { label: "Njoftimet", href: "/notifications", icon: Bell, color: "text-purple-600" },
            { label: "Cilësimet", href: "/settings", icon: Settings, color: "text-emerald-600" },
          ].map((item) => (
            <Link key={item.label} href={item.href}>
              <div className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
                  <span className="text-xs font-bold text-slate-800">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Logout Action Button */}
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={handleLogout}
        className="w-full py-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 font-bold text-xs flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Dil nga Llogaria
      </motion.button>
    </div>
  );
}
