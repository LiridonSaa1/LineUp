import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Scissors, Calendar, Package, CreditCard, LogOut, Settings } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();

  if (!user || user.role !== "owner") {
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

  const navItems = [
    { href: "/dashboard", label: "Pasqyra", icon: LayoutDashboard },
    { href: "/dashboard/appointments", label: "Takimet", icon: Calendar },
    { href: "/dashboard/barbers", label: "Ekipi", icon: Scissors },
    { href: "/dashboard/services", label: "Shërbimet", icon: Settings },
    { href: "/dashboard/products", label: "Produktet", icon: Package },
    { href: "/dashboard/subscription", label: "Abonimi", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex md:w-64 bg-card border-r border-border shrink-0 flex-col sticky top-0 md:h-screen z-20">
        <div className="p-6">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold tracking-tighter text-primary">Line UP</span>
            <span className="ml-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">Biznes</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 pb-4 overflow-y-auto space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
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

      {/* ── Mobile Top Bar ── */}
      <div className="md:hidden sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="inline-block">
            <span className="text-lg font-bold tracking-tighter text-primary">Line UP</span>
            <span className="ml-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Biznes</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
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
            const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
