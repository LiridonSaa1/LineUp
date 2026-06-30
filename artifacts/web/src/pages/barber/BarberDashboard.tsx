import { useAuth } from "@/lib/auth";
import { useListAppointments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, CheckCircle, Clock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function BarberDashboard() {
  const { user } = useAuth();

  const { data: apptRes, isLoading } = useListAppointments(
    { limit: 50 },
    { query: { enabled: !!user } }
  );

  const appointments = Array.isArray(apptRes) ? apptRes : apptRes?.data ?? [];

  type Apt = typeof appointments[number];

  const todayApts = appointments.filter((a: Apt) =>
    ["confirmed", "pending_otp"].includes(a.status) && isToday(parseISO(a.scheduledAt))
  );
  const tomorrowApts = appointments.filter((a: Apt) =>
    ["confirmed", "pending_otp"].includes(a.status) && isTomorrow(parseISO(a.scheduledAt))
  );
  const completedTotal = appointments.filter((a: Apt) => a.status === "completed").length;
  const uniqueClients = new Set(appointments.map((a: Apt) => a.userId)).size;

  const upcoming = appointments
    .filter((a: Apt) => ["confirmed", "pending_otp"].includes(a.status) && new Date(a.scheduledAt) >= new Date())
    .sort((a: Apt, b: Apt) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  const statusLabel = (s: string) => {
    if (s === "confirmed") return <Badge className="bg-primary hover:bg-primary text-white text-xs">Konfirmuar</Badge>;
    if (s === "pending_otp") return <Badge variant="outline" className="text-yellow-600 border-yellow-500 text-xs">Në pritje</Badge>;
    if (s === "completed") return <Badge variant="secondary" className="text-xs">Përfunduar</Badge>;
    return <Badge variant="outline" className="text-xs">{s}</Badge>;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mirësevini, {user?.name?.split(" ")[0]}!</h1>
        <p className="text-muted-foreground mt-1">Ja çfarë ju pret sot.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sot</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{todayApts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">takime</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Nesër</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{tomorrowApts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">takime</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Klientë unik</CardTitle>
              <Users className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{uniqueClients}</div>
              <p className="text-xs text-muted-foreground mt-1">gjithsej</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Përfunduara</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{completedTotal}</div>
              <p className="text-xs text-muted-foreground mt-1">shërbime</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Takimet e ardhshme</CardTitle>
            <Button variant="outline" size="sm" asChild className="rounded-full">
              <Link href="/barber/appointments">Shiko të gjitha</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nuk keni takime të ardhshme</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((apt: Apt) => (
                  <div key={apt.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">{(apt as any).user?.name ?? "Klient"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(apt.scheduledAt), "dd MMM, HH:mm")}
                        {(apt as any).service?.name ? ` · ${(apt as any).service.name}` : ""}
                      </p>
                    </div>
                    {statusLabel(apt.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sot — {format(new Date(), "dd MMMM yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            {todayApts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nuk keni takime sot</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayApts
                  .sort((a: Apt, b: Apt) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                  .map((apt: Apt) => (
                    <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {((apt as any).user?.name ?? "K").charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{(apt as any).user?.name ?? "Klient"}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(apt.scheduledAt), "HH:mm")}</p>
                      </div>
                      {statusLabel(apt.status)}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
