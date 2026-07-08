import { Link } from "wouter";
import { useGetOwnerStats, useGetRecentActivity } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useOwnerShop } from "@/hooks/use-owner-shop";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar, ChevronRight, Euro, Package, Scissors, Settings, Users } from "lucide-react";

const quickActions = [
  { href: "/dashboard/appointments", label: "Menaxho takimet", icon: Calendar },
  { href: "/dashboard/barbers", label: "Shto berber", icon: Scissors },
  { href: "/dashboard/services", label: "Sherbimet", icon: Settings },
  { href: "/dashboard/products", label: "Produktet", icon: Package },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: ownerShop, isLoading: shopLoading } = useOwnerShop();
  const shopId = ownerShop?.id ?? 0;

  const { data: stats, isLoading } = useGetOwnerStats(
    { shopId },
    { query: { enabled: !!user && !!ownerShop } as any },
  );

  const { data: activity } = useGetRecentActivity(
    { shopId, limit: 6 },
    { query: { enabled: !!user && !!ownerShop } as any },
  );

  if (shopLoading || isLoading) {
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
    { label: "Takime sot", value: stats?.todayAppointments ?? 0, icon: Calendar, tone: "text-blue-600" },
    { label: "Te ardhura", value: `EUR ${Number(stats?.totalRevenue ?? 0).toFixed(0)}`, icon: Euro, tone: "text-emerald-600" },
    { label: "Berbere aktive", value: stats?.totalBarbers ?? 0, icon: Users, tone: "text-primary" },
    { label: "Produkte", value: stats?.totalProducts ?? 0, icon: Package, tone: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl shadow-slate-950/10">
        <div className="relative p-6 sm:p-8">
          <div className="absolute inset-0 hero-grid opacity-10" />
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Owner workspace</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
                Mire se erdhe, {user?.name?.split(" ")[0] ?? "Owner"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                {ownerShop?.name
                  ? `Ketu menaxhon ${ownerShop.name}: takimet, ekipin, sherbimet, produktet dhe financat.`
                  : "Ketu menaxhon takimet, ekipin, sherbimet, produktet dhe financat e dyqanit."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-2xl font-bold">
                  <Link href="/dashboard/appointments">Shiko takimet</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-2xl border-white/20 bg-white/10 font-bold text-white hover:bg-white/15 hover:text-white">
                  <Link href="/dashboard/stats">Shiko statistikat</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold">Statusi i dyqanit</p>
                  <p className="text-xs text-white/55">{ownerShop?.status ?? "active"}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-white/[0.06] p-3">
                  <p className="text-xl font-black">{stats?.confirmedAppointments ?? 0}</p>
                  <p className="text-xs text-white/45">Konfirmuar</p>
                </div>
                <div className="rounded-xl bg-white/[0.06] p-3">
                  <p className="text-xl font-black">{stats?.cancelledAppointments ?? 0}</p>
                  <p className="text-xs text-white/45">Anuluar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="rounded-2xl border-border bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-muted-foreground">{label}</p>
                  <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-background ${tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="rounded-3xl border-border bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black">Aktiviteti i fundit</h3>
                <p className="text-sm text-muted-foreground">Ndryshimet dhe rezervimet me te reja.</p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full font-bold">
                <Link href="/dashboard/stats">Detaje</Link>
              </Button>
            </div>

            <div className="space-y-4">
              {!activity || activity.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Nuk ka aktivitet te fundit.
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

        <Card className="rounded-3xl border-border bg-card shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-xl font-black">Shkurtore</h3>
            <p className="mt-1 text-sm text-muted-foreground">Veprimet qe perdoren me shpesh.</p>
            <div className="mt-5 space-y-2">
              {quickActions.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 transition hover:border-primary/40 hover:shadow-sm">
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
      </div>
    </div>
  );
}
