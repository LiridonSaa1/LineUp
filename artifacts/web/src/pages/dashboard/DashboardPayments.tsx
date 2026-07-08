import { useAuth } from "@/lib/auth";
import { useGetRevenueByMonth, useGetOwnerStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Euro, TrendingUp, Calendar, BarChart2 } from "lucide-react";
import { useOwnerShop } from "@/hooks/use-owner-shop";

export default function DashboardPayments() {
  const { user } = useAuth();
  const { data: ownerShop, isLoading: shopLoading } = useOwnerShop();
  const shopId = ownerShop?.id ?? 0;

  const { data: stats, isLoading: statsLoading } = useGetOwnerStats(
    { shopId },
    { query: { enabled: !!user && !!ownerShop } as any }
  );

  const { data: monthlyRev, isLoading: revLoading } = useGetRevenueByMonth(
    { shopId, months: 6 },
    { query: { enabled: !!user && !!ownerShop } as any }
  );

  const isLoading = shopLoading || statsLoading || revLoading;
  const months = Array.isArray(monthlyRev) ? monthlyRev : [];
  const maxRev = Math.max(...months.map(m => m.revenue ?? 0), 1);

  const thisMonth = months[months.length - 1]?.revenue ?? 0;
  const lastMonth = months[months.length - 2]?.revenue ?? 0;
  const trend = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(0) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pagesat & Financat</h1>
        <p className="text-muted-foreground mt-1">Raport financiar i dyqanit tuaj</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Të ardhurat totale</CardTitle>
              <Euro className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">€{(stats?.totalRevenue ?? 0).toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">gjithë kohës</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ky muaj</CardTitle>
              <Calendar className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">€{thisMonth.toFixed(0)}</div>
              {trend !== null && (
                <p className={`text-xs mt-1 ${parseFloat(trend) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {parseFloat(trend) >= 0 ? "↑" : "↓"} {Math.abs(parseFloat(trend))}% nga muaji i kaluar
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Takime sot</CardTitle>
              <BarChart2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.todayAppointments ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">rezervime</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Norma anulimit</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.totalAppointments
                  ? `${Math.round(((stats.cancelledAppointments ?? 0) / stats.totalAppointments) * 100)}%`
                  : "0%"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">anulime</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Të ardhurat mujore (6 muajt e fundit)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {months.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Euro className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nuk ka të dhëna financiare ende</p>
            </div>
          ) : (
            <div className="flex items-end gap-3 h-40 mt-2">
              {months.map(m => {
                const pct = ((m.revenue ?? 0) / maxRev) * 100;
                const label = m.month ? m.month.slice(0, 7) : "";
                return (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-primary">€{(m.revenue ?? 0).toFixed(0)}</span>
                    <div className="w-full flex items-end" style={{ height: "80px" }}>
                      <div
                        className="w-full rounded-t-lg bg-primary/80 transition-all"
                        style={{ height: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Përmbledhje e performancës</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Takime totale", value: stats?.totalAppointments ?? 0 },
              { label: "Të konfirmuara", value: stats?.confirmedAppointments ?? 0 },
              { label: "Berberë aktivë", value: stats?.totalBarbers ?? 0 },
            ].map(item => (
              <div key={item.label} className="text-center p-4 bg-secondary/40 rounded-2xl">
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
