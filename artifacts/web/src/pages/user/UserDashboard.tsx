import { useAuth } from "@/lib/auth";
import { useListAppointments } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Scissors, Bell, ShoppingBag, ArrowRight, Clock, MapPin } from "lucide-react";
import { format, parseISO, isAfter } from "date-fns";

export default function UserDashboard() {
  const { user } = useAuth();

  const { data: apptRes, isLoading } = useListAppointments(
    { limit: 20 },
    { query: { enabled: !!user } }
  );

  const appointments = Array.isArray(apptRes) ? apptRes : apptRes?.data ?? [];

  const nextApt = appointments
    .filter(a => ["confirmed", "pending_otp"].includes(a.status) && isAfter(parseISO(a.scheduledAt), new Date()))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const recentApts = appointments
    .filter(a => a.status === "completed")
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 3);

  const quickLinks = [
    { href: "/barbershops", icon: Scissors, label: "Rezervo Termin", desc: "Gjej berberin tënd", color: "bg-primary/10 text-primary" },
    { href: "/appointments", icon: Calendar, label: "Takimet e Mia", desc: "Shiko historikun", color: "bg-blue-500/10 text-blue-500" },
    { href: "/notifications", icon: Bell, label: "Njoftimet", desc: "Mesazhet e fundit", color: "bg-amber-500/10 text-amber-500" },
    { href: "/marketplace", icon: ShoppingBag, label: "Grooming Shop", desc: "Produktet tona", color: "bg-emerald-500/10 text-emerald-500" },
  ];

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mirësevini, {user?.name?.split(" ")[0]}! 👋</h1>
        <p className="text-muted-foreground mt-1">Ja çfarë keni planifikuar.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-36 rounded-3xl" />
      ) : nextApt ? (
        <div className="relative bg-primary rounded-3xl p-6 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-semibold text-white/80 uppercase tracking-widest">Termini i ardhshëm</span>
            </div>
            <h2 className="text-2xl font-bold mb-3">
              {(nextApt as any).barbershop?.name ?? "Berber"}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {format(parseISO(nextApt.scheduledAt), "EEEE, dd MMMM yyyy")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {format(parseISO(nextApt.scheduledAt), "HH:mm")}
              </span>
              {(nextApt as any).barbershop?.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {(nextApt as any).barbershop.address}
                </span>
              )}
            </div>
            {(nextApt as any).barber?.name && (
              <p className="mt-2 text-white/70 text-sm">Berberi: {(nextApt as any).barber.name}</p>
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
            <p className="text-muted-foreground text-sm mt-0.5">Rezervoni prerjen tuaj të radhës tani!</p>
          </div>
          <Button asChild className="rounded-full shrink-0">
            <Link href="/barbershops">Rezervo tani</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickLinks.map(q => (
          <Link key={q.href} href={q.href}>
            <div className="bg-card border border-border rounded-2xl p-4 hover:border-primary/50 transition-colors cursor-pointer group h-full">
              <div className={`w-10 h-10 rounded-xl ${q.color} flex items-center justify-center mb-3`}>
                <q.icon className="w-5 h-5" />
              </div>
              <p className="font-semibold text-sm">{q.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{q.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {recentApts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Vizitat e fundit</CardTitle>
            <Button variant="ghost" size="sm" asChild className="rounded-full text-xs">
              <Link href="/appointments">
                Shiko të gjitha <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentApts.map(apt => (
              <div key={apt.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Scissors className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{(apt as any).barbershop?.name ?? "Berber"}</p>
                  <p className="text-xs text-muted-foreground">{format(parseISO(apt.scheduledAt), "dd MMM yyyy")}</p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">Përfunduar</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
