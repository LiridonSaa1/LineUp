import { useMemo } from "react";
import { useListAppointments } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart2, TrendingUp, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import { format, parseISO, startOfMonth, isAfter } from "date-fns";

export default function BarberStats() {
  const { user } = useAuth();
  const { data: apptRes, isLoading } = useListAppointments({ limit: 500 }, { query: { enabled: !!user } as any });
  const appointments = Array.isArray(apptRes) ? apptRes : apptRes?.data ?? [];

  const stats = useMemo(() => {
    type Apt = typeof appointments[number];
    const total = appointments.length;
    const completed = appointments.filter((a: Apt) => a.status === "completed").length;
    const cancelled = appointments.filter((a: Apt) => a.status === "cancelled").length;
    const noShow = appointments.filter((a: Apt) => a.status === "no_show").length;
    const upcoming = appointments.filter((a: Apt) => ["confirmed", "pending_otp"].includes(a.status) && isAfter(parseISO(a.scheduledAt), new Date())).length;
    const uniqueClients = new Set(appointments.map((a: Apt) => a.userId)).size;

    const thisMonthStart = startOfMonth(new Date());
    const thisMonth = appointments.filter((a: Apt) => isAfter(parseISO(a.scheduledAt), thisMonthStart)).length;

    const byService: Record<string, number> = {};
    for (const apt of appointments) {
      const svc = (apt as any).service?.name ?? "Tjetër";
      byService[svc] = (byService[svc] ?? 0) + 1;
    }
    const topServices = Object.entries(byService)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const byMonth: Record<string, number> = {};
    for (const apt of appointments) {
      const m = format(parseISO(apt.scheduledAt), "MMM yyyy");
      byMonth[m] = (byMonth[m] ?? 0) + 1;
    }
    const lastSixMonths = Object.entries(byMonth)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-6);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, cancelled, noShow, upcoming, uniqueClients, thisMonth, topServices, lastSixMonths, completionRate };
  }, [appointments]);

  const maxMonthCount = Math.max(...stats.lastSixMonths.map(([, c]) => c), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistikat</h1>
        <p className="text-muted-foreground mt-1">Performanca juaj si berber</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Gjithsej takime", value: stats.total, icon: BarChart2, color: "text-primary", bg: "bg-primary/10" },
              { label: "Këtë muaj", value: stats.thisMonth, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Klientë unik", value: stats.uniqueClients, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Përfunduar", value: stats.completed, icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
              { label: "Anuluar", value: stats.cancelled + stats.noShow, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
              { label: "Shkalla e suksesit", value: `${stats.completionRate}%`, icon: Clock, color: "text-purple-500", bg: "bg-purple-500/10" },
            ].map((s, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{s.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Takimet sipas muajit</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.lastSixMonths.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">Nuk ka të dhëna</p>
                ) : (
                  <div className="space-y-3">
                    {stats.lastSixMonths.map(([month, count]) => (
                      <div key={month} className="flex items-center gap-3">
                        <span className="w-20 text-xs text-muted-foreground shrink-0">{month}</span>
                        <div className="flex-1 bg-secondary rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{ width: `${(count / maxMonthCount) * 100}%` }}
                          />
                        </div>
                        <span className="w-6 text-xs font-bold text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shërbimet më të bëra</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.topServices.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">Nuk ka të dhëna</p>
                ) : (
                  <div className="space-y-3">
                    {stats.topServices.map(([svc, count], i) => (
                      <div key={svc} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium">{svc}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">{count}x</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
