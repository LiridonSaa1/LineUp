import { useGetOwnerStats, useGetAppointmentsByDay, useGetRevenueByMonth } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Euro, Calendar, Users } from "lucide-react";
import { useOwnerShop } from "@/hooks/use-owner-shop";

export default function DashboardStats() {
  const { user } = useAuth();
  const { data: ownerShop, isLoading: shopLoading } = useOwnerShop();
  const shopId = ownerShop?.id ?? 0;

  const { data: stats, isLoading: statsLoading } = useGetOwnerStats(
    { shopId },
    { query: { enabled: !!user && !!ownerShop } as any }
  );

  const { data: byDay } = useGetAppointmentsByDay(
    { days: 30, shopId },
    { query: { enabled: !!user && !!ownerShop } as any }
  );

  const { data: byMonth } = useGetRevenueByMonth(
    { months: 6, shopId },
    { query: { enabled: !!user && !!ownerShop } as any }
  );

  const dayData = Array.isArray(byDay) ? byDay : [];
  const monthData = Array.isArray(byMonth) ? byMonth : [];

  const kpis = [
    { label: "Takimet Sot", value: stats?.todayAppointments ?? 0, icon: Calendar, color: "text-primary" },
    { label: "Të Ardhurat Totale", value: `€${Number(stats?.totalRevenue ?? 0).toFixed(0)}`, icon: Euro, color: "text-emerald-400" },
    { label: "Takimet Totale", value: stats?.totalAppointments ?? 0, icon: TrendingUp, color: "text-blue-400" },
    { label: "Berberët Aktivë", value: stats?.totalBarbers ?? 0, icon: Users, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistikat</h1>
        <p className="text-muted-foreground">Grafiku i performancës së dyqanit tuaj.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {shopLoading || statsLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
          : kpis.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${color}`}>{value}</div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {/* Appointments by Day */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Takimet — 30 Ditët e Fundit</CardTitle>
        </CardHeader>
        <CardContent>
          {dayData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Nuk ka të dhëna</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dayData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAppts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#colorAppts)" strokeWidth={2} name="Takime" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Revenue by Month */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Të Ardhurat Mujore (€)</CardTitle>
        </CardHeader>
        <CardContent>
          {monthData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Nuk ka të dhëna</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: any) => [`€${Number(v).toFixed(2)}`, "Të ardhura"]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Të ardhura" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Summary row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Takime të Konfirmuara</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-400">{stats?.confirmedAppointments ?? 0}</div></CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Takime të Anuluara</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-400">{stats?.cancelledAppointments ?? 0}</div></CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">Vlerësimi Mesatar</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              {stats?.rating ? `⭐ ${Number(stats.rating).toFixed(1)}` : "—"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
