import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useListAppointments } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Scissors,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { format, parseISO, isToday, isTomorrow, isAfter } from "date-fns";
import { sq } from "date-fns/locale";

const STATUS_BADGE: Record<string, JSX.Element> = {
  confirmed: (
    <Badge className="bg-primary hover:bg-primary text-white text-xs">
      Konfirmuar
    </Badge>
  ),
  pending_otp: (
    <Badge variant="outline" className="text-yellow-600 border-yellow-500 text-xs">
      Në pritje
    </Badge>
  ),
  completed: (
    <Badge variant="secondary" className="text-xs">
      Përfunduar
    </Badge>
  ),
  cancelled: (
    <Badge variant="destructive" className="text-xs">
      Anuluar
    </Badge>
  ),
  no_show: (
    <Badge variant="destructive" className="text-xs">
      Nuk u paraqit
    </Badge>
  ),
};

function statusBadge(s: string) {
  return STATUS_BADGE[s] ?? (
    <Badge variant="outline" className="text-xs">{s}</Badge>
  );
}

function dayLabel(date: Date) {
  if (isToday(date)) return "Sot";
  if (isTomorrow(date)) return "Nesër";
  return format(date, "dd MMM", { locale: sq });
}

export default function UserDashboard() {
  const { user } = useAuth();

  const { data: apptRes, isLoading } = useListAppointments(
    { limit: 50 },
    { query: { enabled: !!user } },
  );

  const appointments = useMemo(() => {
    const raw = Array.isArray(apptRes) ? apptRes : (apptRes as any)?.data ?? [];
    return raw as any[];
  }, [apptRes]);

  const now = new Date();

  const todayApts = useMemo(
    () =>
      appointments.filter(
        (a) =>
          ["confirmed", "pending_otp"].includes(a.status) &&
          isToday(parseISO(a.scheduledAt)),
      ),
    [appointments],
  );

  const upcoming = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            ["confirmed", "pending_otp"].includes(a.status) &&
            isAfter(parseISO(a.scheduledAt), now),
        )
        .sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
        )
        .slice(0, 5),
    [appointments],
  );

  const completedTotal = useMemo(
    () => appointments.filter((a) => a.status === "completed").length,
    [appointments],
  );

  const cancelledTotal = useMemo(
    () =>
      appointments.filter((a) =>
        ["cancelled", "no_show"].includes(a.status),
      ).length,
    [appointments],
  );

  const nextApt = upcoming[0] ?? null;

  const statCards = [
    {
      label: "Sot",
      value: todayApts.length,
      sub: "takime",
      icon: Calendar,
      color: "text-primary",
    },
    {
      label: "Ardhshme",
      value: upcoming.length,
      sub: "planifikuar",
      icon: Clock,
      color: "text-blue-500",
    },
    {
      label: "Përfunduara",
      value: completedTotal,
      sub: "gjithsej",
      icon: CheckCircle,
      color: "text-emerald-500",
    },
    {
      label: "Anuluar",
      value: cancelledTotal,
      sub: "gjithsej",
      icon: XCircle,
      color: "text-rose-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Mirësevini, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Ja çfarë keni planifikuar.</p>
        </div>
        <Button asChild className="rounded-full shrink-0 self-start sm:self-auto">
          <Link href="/barbershops">
            <Scissors className="w-4 h-4 mr-2" /> Rezervo tani
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {s.label}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{s.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Next appointment hero */}
      {!isLoading && (
        nextApt ? (
          <div className="relative bg-primary rounded-3xl p-6 text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                  Termini i ardhshëm
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-3">
                {nextApt.barbershop?.name ?? nextApt.barber?.shop?.name ?? "Berber"}
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(parseISO(nextApt.scheduledAt), "EEEE, dd MMMM yyyy", { locale: sq })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {format(parseISO(nextApt.scheduledAt), "HH:mm")}
                </span>
                {nextApt.barbershop?.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {nextApt.barbershop.address}
                  </span>
                )}
              </div>
              {nextApt.barber?.name && (
                <p className="mt-2 text-white/70 text-sm">
                  Berberi: {nextApt.barber.name}
                </p>
              )}
              {nextApt.service?.name && (
                <p className="mt-1 text-white/60 text-sm">
                  Shërbimi: {nextApt.service.name}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Scissors className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-bold text-lg">Nuk keni termin të planifikuar</h3>
              <p className="text-muted-foreground text-sm mt-0.5">
                Rezervoni prerjen tuaj të radhës tani!
              </p>
            </div>
            <Button asChild className="rounded-full shrink-0">
              <Link href="/barbershops">Rezervo tani</Link>
            </Button>
          </div>
        )
      )}

      {/* Two-column: upcoming list + today agenda */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Takimet e ardhshme</CardTitle>
            <Button variant="outline" size="sm" asChild className="rounded-full">
              <Link href="/appointments">
                Shiko të gjitha <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nuk keni takime të ardhshme</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Scissors className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {apt.barbershop?.name ?? "Berber"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dayLabel(parseISO(apt.scheduledAt))},{" "}
                          {format(parseISO(apt.scheduledAt), "HH:mm")}
                          {apt.service?.name ? ` · ${apt.service.name}` : ""}
                        </p>
                      </div>
                    </div>
                    {statusBadge(apt.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today agenda */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Sot — {format(new Date(), "dd MMMM yyyy", { locale: sq })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : todayApts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nuk keni takime sot</p>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="mt-3 rounded-full text-primary"
                >
                  <Link href="/barbershops">Rezervo tani →</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {todayApts
                  .sort(
                    (a, b) =>
                      new Date(a.scheduledAt).getTime() -
                      new Date(b.scheduledAt).getTime(),
                  )
                  .map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40"
                    >
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarImage src={apt.barbershop?.imageUrl} />
                        <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                          {(apt.barbershop?.name ?? "B").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {apt.barbershop?.name ?? "Berber"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(apt.scheduledAt), "HH:mm")}
                          {apt.service?.name ? ` · ${apt.service.name}` : ""}
                        </p>
                      </div>
                      {statusBadge(apt.status)}
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
