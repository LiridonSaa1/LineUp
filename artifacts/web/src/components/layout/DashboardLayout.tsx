import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import logoImg from "@assets/LINE_(2)_1782421072087.png";
import {
  Calendar,
  CalendarOff,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Scissors,
  Settings,
  Store,
  Users,
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navGroups = [
  {
    label: "Kryesore",
    items: [
      { href: "/dashboard", label: "Pasqyra", icon: LayoutDashboard },
      { href: "/dashboard/appointments", label: "Takimet", icon: Calendar },
      { href: "/dashboard/barbers", label: "Berberet", icon: Scissors },
      { href: "/dashboard/services", label: "Sherbimet", icon: Settings },
    ],
  },
  {
    label: "Dyqani",
    items: [
      { href: "/dashboard/clients", label: "Klientet", icon: Users },
      { href: "/dashboard/holidays", label: "Pushimet", icon: CalendarOff },
      { href: "/dashboard/subscription", label: "Abonimi", icon: CreditCard },
      { href: "/dashboard/settings", label: "Cilesimet", icon: Settings },
    ],
  },
];

const navItems = navGroups.flatMap((group) => group.items);
const hiddenNavItems = [
  { href: "/dashboard/stats", label: "Statistikat" },
  { href: "/dashboard/waiting-list", label: "Lista e pritjes" },
  { href: "/dashboard/recurring", label: "Rezervimet periodike" },
  { href: "/dashboard/products", label: "Produktet" },
  { href: "/dashboard/payments", label: "Financat" },
  { href: "/dashboard/coupons", label: "Kuponat" },
];
const allNavItems = [...navItems, ...hiddenNavItems];

function isActiveRoute(location: string, href: string) {
  return location === href || (href !== "/dashboard" && location.startsWith(href));
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();

  if (!user || user.role !== "owner") {
    setLocation("/");
    return null;
  }

  const activeItem =
    [...allNavItems]
      .sort((a, b) => b.href.length - a.href.length)
      .find((item) => isActiveRoute(location, item.href)) ?? navItems[0];

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      logout();
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-foreground dark:bg-background">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-white/10 bg-slate-950 text-white lg:flex">
          <div className="border-b border-white/10 p-5">
            <Link href="/" className="flex items-center gap-3">
              <img
                src={logoImg}
                alt="Line UP"
                className="h-14 w-auto object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <span>
                <span className="block text-xl font-black tracking-tight">Line UP</span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Biznes</span>
              </span>
            </Link>
          </div>

          <div className="p-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <Store className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{user.name}</p>
                  <p className="truncate text-xs text-white/45">{user.email}</p>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActiveRoute(location, item.href);
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all ${
                            active
                              ? "bg-primary text-white shadow-lg shadow-primary/25"
                              : "text-white/65 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="flex-1">{item.label}</span>
                          <ChevronRight className={`h-4 w-4 transition ${active ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <Button
              variant="ghost"
              className="h-11 w-full justify-start rounded-2xl text-red-300 hover:bg-red-500/10 hover:text-red-200"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Dil
            </Button>
          </div>
        </aside>

        <div className="sticky top-0 z-30 border-b border-border bg-background/95 shadow-sm backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <img src={logoImg} alt="Line UP" className="h-10 w-auto object-contain" />
              <span>
                <span className="block text-base font-black leading-tight">Line UP</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Biznes</span>
              </span>
            </Link>
            <Button variant="ghost" size="icon" className="rounded-xl text-destructive hover:text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-3 pb-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(location, item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      active ? "bg-primary text-white shadow-sm" : "bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <main className="min-w-0 flex-1">
          <div className="border-b border-border bg-background">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
              <div>
                <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Dashboard</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="text-primary">{activeItem.label}</span>
                </div>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{activeItem.label}</h1>
              </div>
              <Button asChild className="hidden rounded-2xl font-bold sm:inline-flex">
                <Link href="/dashboard/appointments">Menaxho takimet</Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
