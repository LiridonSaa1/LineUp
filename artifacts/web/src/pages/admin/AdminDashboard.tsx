import { useQuery } from "@tanstack/react-query";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Store, Calendar, Euro, CreditCard, Activity, ArrowRight, Shield } from "lucide-react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const { data: apiStats, isLoading: apiLoading } = useGetDashboardStats();

  const { data: supaStats, isLoading: supaLoading } = useQuery({
    queryKey: ["supa-admin-dashboard-stats"],
    queryFn: async () => {
      try {
        const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: shopsCount } = await supabase.from('barbershops').select('*', { count: 'exact', head: true });
        const { count: apptsCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true });
        const { count: activeShopsCount } = await supabase.from('barbershops').select('*', { count: 'exact', head: true }).eq('status', 'active');
        const { data: subsData } = await supabase.from('subscriptions').select('*');

        const totalPaddleRevenue = (subsData || []).reduce((acc: number, sub: any) => {
          const planCost = sub.product_id === 'team' ? 25 : sub.product_id === 'solo' ? 15 : 20;
          return acc + planCost;
        }, 0);

        return {
          totalUsers: usersCount || 0,
          totalBarbershops: shopsCount || 0,
          activeShops: activeShopsCount || shopsCount || 0,
          pendingApprovals: (shopsCount || 0) - (activeShopsCount || 0),
          totalAppointments: apptsCount || 0,
          totalRevenue: totalPaddleRevenue || (apptsCount || 0) * 15
        };
      } catch (e) {
        console.error("Dashboard stats query error:", e);
      }
      return null;
    }
  });

  const isLoading = apiLoading && supaLoading;
  const stats = apiStats || supaStats || {
    totalUsers: 0,
    totalBarbershops: 0,
    activeShops: 0,
    pendingApprovals: 0,
    totalAppointments: 0,
    totalRevenue: 0
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">Pasqyra e Platformës</h1>
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase font-black text-[10px]">
              SUPER ADMIN
            </Badge>
          </div>
          <p className="text-muted-foreground">Statistikat globale dhe statusi i LineUP në kohë reale.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/60 backdrop-blur border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Barberitë në Total</CardTitle>
            <Store className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalBarbershops || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeShops || 0} aktive, {stats.pendingApprovals || 0} në pritje
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Të Hyrat nga Paddle</CardTitle>
            <Euro className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">€{stats.totalRevenue || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Të hyrat nga abonimet aktive</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Përdoruesit në DB</CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">{stats.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Të gjithë përdoruesit e regjistruar</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gjithsej Takime</CardTitle>
            <Calendar className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">{stats.totalAppointments || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Rezervime përmes sistemit</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Modules */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-card/60 backdrop-blur border-border/80 hover:border-primary/50 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" /> Dyqanet & Aprovimi
            </CardTitle>
            <CardDescription>Menaxho dhe mirato dyqanet e reja të regjistruara.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/barbershops">
              <Button className="w-full justify-between" variant="outline">
                Shiko Barberitë <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border-border/80 hover:border-emerald-500/50 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-500" /> Abonimet Paddle
            </CardTitle>
            <CardDescription>Monitoro faturat, të hyrat dhe planet e salloneve.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/subscriptions">
              <Button className="w-full justify-between" variant="outline">
                Shiko Abonimet <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border-border/80 hover:border-purple-500/50 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" /> Statusi i Sistemit
            </CardTitle>
            <CardDescription>Kontrollo ambientin Sandbox dhe infrastrukturën.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/system">
              <Button className="w-full justify-between" variant="outline">
                Shiko Statusin <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
