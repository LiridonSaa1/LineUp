import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Calendar,
  Bell,
  ShoppingBag,
  User,
  LogOut,
  Scissors,
} from "lucide-react";
import { useLogout, useListNotifications } from "@workspace/api-client-react";
import logoImg from "@assets/LINE_(2)_1782421072087.png";

interface UserLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/me", label: "Pasqyra", icon: LayoutDashboard, exact: true },
  { href: "/appointments", label: "Takimet", icon: Calendar },
  { href: "/notifications", label: "Njoftimet", icon: Bell },
  { href: "/orders", label: "Porositë", icon: ShoppingBag },
  { href: "/profile", label: "Profili", icon: User },
];

export function UserLayout({ children }: UserLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();
  const { data: notifRes } = useListNotifications({ limit: 1 });
  const unread = (notifRes as any)?.unreadCount ?? 0;

  if (!user) {
    setLocation("/");
    return null;
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      logout();
      setLocation("/");
    }
  };

  const isActive = (item: (typeof navItems)[0]) =>
    item.exact ? location === item.href : location.startsWith(item.href);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex md:w-64 bg-card border-r border-border shrink-0 flex-col sticky top-0 md:h-screen z-20">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3">
            <img src={logoImg} alt="Line UP" className="h-12 w-auto object-contain" />
            <span className="ml-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Profili
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 pb-4 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium cursor-pointer transition-colors ${
                    active
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/notifications" && unread > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-primary text-white"
                      }`}
                    >
                      {unread}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Quick-book shortcut */}
          <div className="pt-4">
            <Link href="/barbershops">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium cursor-pointer transition-colors bg-primary/10 text-primary hover:bg-primary/15">
                <Scissors className="w-5 h-5 shrink-0" />
                Rezervo tani
              </div>
            </Link>
          </div>
        </nav>

        <div className="p-4 mt-auto border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="text-sm font-bold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" /> Dil
          </Button>
        </div>
      </aside>

      {/* ── Mobile top bar + bottom nav ── */}
      <div className="md:hidden sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoImg} alt="Line UP" className="h-9 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs font-bold">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg h-8 px-2"
              onClick={handleLogout}
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <nav className="flex overflow-x-auto gap-1 px-3 pb-3 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`relative flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl font-medium text-xs cursor-pointer transition-colors whitespace-nowrap ${
                    active
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                  {item.href === "/notifications" && unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unread}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
