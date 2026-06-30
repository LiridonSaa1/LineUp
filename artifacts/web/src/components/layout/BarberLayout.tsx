import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Calendar, Users, Clock, BarChart2, Star, LogOut } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";

interface BarberLayoutProps {
  children: React.ReactNode;
}

export function BarberLayout({ children }: BarberLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();

  if (!user || user.role !== "barber") {
    setLocation("/");
    return null;
  }

  const handleLogout = async () => {
    try { await logoutMutation.mutateAsync(); } finally {
      logout(); setLocation("/");
    }
  };

  const navItems = [
    { href: "/barber", label: "Pasqyra", icon: LayoutDashboard },
    { href: "/barber/appointments", label: "Takimet", icon: Calendar },
    { href: "/barber/clients", label: "Klientët", icon: Users },
    { href: "/barber/availability", label: "Disponueshmëria", icon: Clock },
    { href: "/barber/stats", label: "Statistikat", icon: BarChart2 },
    { href: "/barber/reviews", label: "Vlerësimet", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="hidden md:flex md:w-64 bg-card border-r border-border shrink-0 flex-col sticky top-0 md:h-screen z-20">
        <div className="p-6">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold tracking-tighter text-primary">Line UP</span>
            <span className="ml-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">Berber</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 pb-4 overflow-y-auto space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/barber" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium cursor-pointer transition-colors ${
                  isActive ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}>
                  <Icon className="w-5 h-5" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 mt-auto border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Dil
          </Button>
        </div>
      </aside>

      <div className="md:hidden sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="inline-block">
            <span className="text-lg font-bold tracking-tighter text-primary">Line UP</span>
            <span className="ml-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Berber</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg h-8 px-2" onClick={handleLogout}>
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <nav className="flex overflow-x-auto gap-1 px-3 pb-3 scrollbar-hide">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/barber" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl font-medium text-xs cursor-pointer transition-colors whitespace-nowrap ${
                  isActive ? "bg-primary text-white" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
