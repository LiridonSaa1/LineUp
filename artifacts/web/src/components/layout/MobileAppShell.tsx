import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import MobileBottomNavbar from "./MobileBottomNavbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Sparkles, MapPin, Tag } from "lucide-react";
import logoImg from "@assets/LINE_(2)_1782421072087.png";

export default function MobileAppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500/20 pb-24">
      {/* ── Top Mobile App Header ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-2xl border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/profile">
            <div className="relative cursor-pointer">
              <Avatar className="h-10 w-10 ring-2 ring-blue-500/30 shadow-sm">
                <AvatarImage src={user?.avatarUrl || undefined} />
                <AvatarFallback className="bg-blue-50 text-blue-600 font-extrabold text-sm">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>
          </Link>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                LineUP VIP
              </span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </div>
            <h2 className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
              {user ? `Përshëndetje, ${user.name.split(" ")[0]}` : "Mirëseerdhe në LineUP"}
            </h2>
          </div>
        </div>

        {/* Right action icons */}
        <div className="flex items-center gap-2">
          <Link href="/offers">
            <button className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-extrabold text-blue-600 active:scale-95 transition-all shadow-sm">
              <Tag className="w-3 h-3" />
              Oferta
            </button>
          </Link>
          <Link href="/notifications">
            <button className="relative w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-all">
              <Bell className="w-4.5 h-4.5" />
              {user && <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />}
            </button>
          </Link>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="pt-14">
        {children}
      </main>

      {/* ── Floating Mobile Bottom Bar ── */}
      <MobileBottomNavbar />
    </div>
  );
}
