import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Home, Search, CalendarPlus, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function MobileBottomNavbar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { label: "Ballina", href: "/", icon: Home },
    { label: "Kërko", href: "/barbershops", icon: Search },
    { label: "Rezervo", href: "/barbershops", icon: CalendarPlus, isPrimary: true },
    { label: "Market", href: "/marketplace", icon: ShoppingBag },
    { label: "Profili", href: user ? "/profile" : "/login", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-5 pt-1 pointer-events-none md:hidden">
      <div className="mx-auto max-w-md pointer-events-auto">
        <div className="relative flex items-center justify-between px-3 py-2 rounded-full bg-white/80 backdrop-blur-3xl border border-slate-200/80 shadow-[0_16px_36px_rgba(0,0,0,0.08)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));

            if (item.isPrimary) {
              return (
                <Link key={item.label} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    className="relative -top-4 flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 text-white shadow-lg shadow-slate-950/25 border border-white/30 active:scale-95 cursor-pointer"
                  >
                    <Icon className="w-5.5 h-5.5" />
                  </motion.div>
                </Link>
              );
            }

            return (
              <Link key={item.label} href={item.href} className="relative flex-1">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.92 }}
                  className={`flex flex-col items-center justify-center py-1 rounded-full transition-all cursor-pointer ${
                    isActive ? "text-slate-950 font-black" : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavActivePill"
                      className="absolute inset-0 rounded-full bg-slate-100 border border-slate-200/60 shadow-xs"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <Icon className="w-5 h-5 relative z-10 mb-0.5" />
                  <span className="text-[10px] tracking-tight relative z-10 font-semibold">
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
