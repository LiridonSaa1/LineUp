import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useGetOwnerStats, useGetRecentActivity } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useOwnerShop } from "@/hooks/use-owner-shop";
import { useShopPlan } from "@/hooks/use-shop-plan";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  Calendar,
  ChevronRight,
  Euro,
  Package,
  Scissors,
  Settings,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Zap,
  Target,
  Image as ImageIcon,
  Sparkles,
  Phone,
  User as UserIcon,
  Flag
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const KOSOVO_HOLIDAYS_2026 = [
  { date: "1 Janar", name: "Viti i Ri", icon: "🎆" },
  { date: "7 Janar", name: "Krishtlindjet Ortodokse", icon: "⛪" },
  { date: "17 Shkurt", name: "Dita e Pavarësisë", icon: "🇽🇰" },
  { date: "30 Mars", name: "Fitër Bajrami*", icon: "🌙" },
  { date: "5 Prill", name: "Pashkët Katolike", icon: "✝️" },
  { date: "9 Prill", name: "Dita e Kushtetutës", icon: "📜" },
  { date: "12 Prill", name: "Pashkët Ortodokse", icon: "☦️" },
  { date: "1 Maj", name: "Dita Ndërkombëtare e Punës", icon: "🛠️" },
  { date: "9 Maj", name: "Dita e Evropës", icon: "🇪🇺" },
  { date: "6 Qershor", name: "Kurban Bajrami*", icon: "🐑" },
  { date: "25 Dhjetor", name: "Krishtlindjet Katolike", icon: "🎄" },
];

const quickActions = [
  { href: "/dashboard/appointments", label: "Menaxho takimet", icon: Calendar },
  { href: "/dashboard/barbers", label: "Shto berber", icon: Scissors },
  { href: "/dashboard/services", label: "Shërbimet", icon: Settings },
  { href: "/dashboard/subscription", label: "Abonimi", icon: Zap },
];

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: ownerShop, isLoading: shopLoading, refetch: refetchShop } = useOwnerShop();
  const { data: planDetails, isLoading: planLoading } = useShopPlan();
  const shopId = ownerShop?.id ?? 0;

  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split("T")[0]);
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string | null>(null);

  // Next 14 days generator (matching RN app)
  const next14Days = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const { data: stats, isLoading: statsLoading } = useGetOwnerStats(
    { shopId },
    { query: { enabled: !!user && !!ownerShop } as any },
  );

  const { data: activity } = useGetRecentActivity(
    { shopId, limit: 6 },
    { query: { enabled: !!user && !!ownerShop } as any },
  );

  // Fetch shop barbers directly from Supabase
  const { data: barbers = [] } = useQuery({
    queryKey: ["supa-shop-barbers", shopId],
    queryFn: async () => {
      if (!shopId) return [];
      const { data } = await supabase.from("barbers").select("*").eq("shop_id", shopId);
      return data || [];
    },
    enabled: !!shopId,
  });

  // Fetch shop appointments directly from Supabase for selected date
  const { data: dateAppointments = [], isLoading: apptsLoading, refetch: refetchAppts } = useQuery({
    queryKey: ["supa-shop-appts-date", shopId, selectedDateStr],
    queryFn: async () => {
      if (!shopId) return [];
      const { data } = await supabase
        .from("appointments")
        .select("*, users(name, phone, email)")
        .eq("shop_id", shopId)
        .eq("date", selectedDateStr)
        .order("time", { ascending: true });
      return data || [];
    },
    enabled: !!shopId,
  });

  const handleUpdateApptStatus = async (apptId: number | string, newStatus: string) => {
    try {
      await supabase.from("appointments").update({ status: newStatus }).eq("id", apptId);
      toast({ title: "Statusi i takimit u përditësua me sukses!" });
      refetchAppts();
    } catch (e) {
      toast({ variant: "destructive", title: "Dështoi përditësimi i takimit." });
    }
  };

  const filteredAppointments = dateAppointments.filter((app: any) => {
    if (selectedBarberFilter && String(app.barber_id) !== String(selectedBarberFilter)) {
      return false;
    }
    return true;
  });

  const rawMax = planDetails?.maxBarbers || 1;
  const targetRevenue = 500;
  const todayRevenue = stats?.totalRevenue ?? 0;
  const revenueProgress = Math.min((todayRevenue / targetRevenue) * 100, 100);

  if (shopLoading || statsLoading || planLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-48 rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Takime sot", value: stats?.todayAppointments ?? 0, icon: Calendar, tone: "text-blue-500" },
    { label: "Të ardhura", value: `€${Number(stats?.totalRevenue ?? 0).toFixed(0)}`, icon: Euro, tone: "text-emerald-500" },
    { label: "Berberë në staf", value: `${barbers.length}/${rawMax}`, icon: Users, tone: "text-primary" },
    { label: "Produkte", value: stats?.totalProducts ?? 0, icon: Package, tone: "text-amber-500" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl shadow-slate-950/10 border border-slate-800">
        <div className="relative p-6 sm:p-8">
          <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:30px_30px]" />
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
            <div>
              <Badge className="bg-primary/20 text-primary border border-primary/30 text-[10px] font-black uppercase tracking-widest mb-2">
                OWNER WORKSPACE
              </Badge>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Mirë se erdhe, {user?.name?.split(" ")[0] ?? "Pronar"}!
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                {ownerShop?.name
                  ? `Këtu menaxhon dyqanin ${ownerShop.name}: takimet në kohë reale, ekipin, shërbimet dhe abonimin tuaj.`
                  : "Këtu menaxhon takimet, ekipin, shërbimet dhe produktet e dyqanit."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild className="rounded-2xl font-bold">
                  <Link href="/dashboard/appointments">Shiko Takimet</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl border-white/20 bg-white/10 font-bold text-white hover:bg-white/15">
                  <Link href="/dashboard/barbers">Menaxho Berberët</Link>
                </Button>
              </div>
            </div>

            {/* Target Revenue & Capacity Card */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Objektivi i të Hyrave</span>
                </div>
                <span className="text-xs font-black text-emerald-400">€{todayRevenue} / €{targetRevenue}</span>
              </div>
              <Progress value={revenueProgress} className="h-2.5 bg-slate-800" />

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Kapaciteti i Stafit:</span>
                <span className="font-bold text-white">{barbers.length} nga {rawMax} punëtorë</span>
              </div>
              {barbers.length >= rawMax && (
                <Link href="/dashboard/subscription">
                  <Button size="sm" variant="link" className="px-0 h-auto text-xs text-[#4f8ef7] font-bold mt-1">
                    Kërkohet Upgrade i Abonimit →
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="rounded-2xl border-border/80 bg-card/60 backdrop-blur shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interactive Date Picker & Daily Appointments Section */}
      <Card className="rounded-3xl border-border bg-card shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-black flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Takimet Ditore
              </h3>
              <p className="text-sm text-muted-foreground">Zgjidhni datën për të parë dhe menaxhuar rezervimet e dyqanit.</p>
            </div>

            {/* Barber Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
              <Button
                size="sm"
                variant={selectedBarberFilter === null ? "default" : "outline"}
                className="rounded-full text-xs font-bold shrink-0"
                onClick={() => setSelectedBarberFilter(null)}
              >
                Të gjithë berberët
              </Button>
              {barbers.map((b: any) => (
                <Button
                  key={b.id}
                  size="sm"
                  variant={selectedBarberFilter === String(b.id) ? "default" : "outline"}
                  className="rounded-full text-xs font-bold shrink-0"
                  onClick={() => setSelectedBarberFilter(String(b.id))}
                >
                  {b.name}
                </Button>
              ))}
            </div>
          </div>

          {/* 14 Days Selector Bar (matching RN App) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {next14Days.map((dateObj) => {
              const dateStr = dateObj.toISOString().split("T")[0];
              const isSelected = dateStr === selectedDateStr;
              const dayName = dateObj.toLocaleDateString("sq-AL", { weekday: "short" });
              const dayNum = dateObj.getDate();

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`flex flex-col items-center justify-center min-w-[64px] py-3 px-3 rounded-2xl border transition-all ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/25 font-bold scale-105"
                      : "bg-secondary/60 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <span className="text-[10px] font-black uppercase">{dayName}</span>
                  <span className="text-lg font-black">{dayNum}</span>
                </button>
              );
            })}
          </div>

          {/* Daily Appointments List */}
          <div className="space-y-3 pt-2">
            {apptsLoading ? (
              <Skeleton className="h-20 w-full rounded-2xl" />
            ) : filteredAppointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nuk ka rezervime të regjistruara për këtë datë.
              </div>
            ) : (
              filteredAppointments.map((app: any) => (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-background/80 p-4 transition hover:border-primary/40 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-2">
                        <span>{app.users?.name || "Klient i LineUp"}</span>
                        <span className="text-xs text-muted-foreground font-mono">({app.time || app.start_time || "12:00"})</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{app.users?.phone || "N/A"}</span>
                        <span>• {app.service_name || "Qethje"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="font-bold text-emerald-500 text-sm">€{app.price || 15}</span>
                    <Badge variant={app.status === "confirmed" ? "default" : app.status === "completed" ? "secondary" : "outline"}>
                      {(app.status || "confirmed").toUpperCase()}
                    </Badge>

                    {app.status !== "completed" && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs font-bold"
                        onClick={() => handleUpdateApptStatus(app.id, "completed")}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Përfundo
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid: Activity, Quick Actions & Kosovo Holidays */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Activity & Kosovo Holidays */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black">Aktiviteti i Fundit</h3>
                  <p className="text-sm text-muted-foreground">Ndryshimet dhe rezervimet më të reja në dyqan.</p>
                </div>
              </div>

              <div className="space-y-4">
                {!activity || activity.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Nuk ka aktivitet të fundit.
                  </div>
                ) : (
                  activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                      <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">{item.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Kosovo Holidays Widget */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-xl font-black">Shkurtore</h3>
              <p className="mt-1 text-sm text-muted-foreground">Veprimet që përdoren më shpesh.</p>
              <div className="mt-5 space-y-2">
                {quickActions.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href}>
                    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 transition hover:border-primary/40 hover:shadow-sm cursor-pointer">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="flex-1 text-sm font-black">{label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Kosovo Public Holidays Card */}
          <Card className="rounded-3xl border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-black flex items-center gap-2 mb-1">
                <Flag className="w-5 h-5 text-amber-500" /> Pushimet Zyrtare në Kosovë (2026)
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Ditët e pushimit zyrtar ku rezervimet duhet të menaxhohen.</p>
              <div className="space-y-2">
                {KOSOVO_HOLIDAYS_2026.slice(0, 5).map((h) => (
                  <div key={h.name} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-muted/40 border border-border/40">
                    <span className="font-bold text-foreground flex items-center gap-2">
                      <span>{h.icon}</span> {h.name}
                    </span>
                    <span className="text-muted-foreground font-mono font-medium">{h.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}