import {
  useGetOwnerStats, getGetOwnerStatsQueryKey,
  useGetRecentActivity,
  useGetBarbershop
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Euro, Users, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const shopId = 1;

  const { data: stats, isLoading } = useGetOwnerStats(
    { shopId },
    { query: { enabled: !!user } }
  );

  const { data: activity } = useGetRecentActivity(
    { shopId, limit: 5 },
    { query: { enabled: !!user } }
  );

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pasqyra</h1>
          <p className="text-muted-foreground">Ja çfarë po ndodh sot në dyqanin tuaj.</p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/dashboard/appointments">Menaxho Takimet</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Takimet e Sotme</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.todayAppointments || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Të Ardhurat Totale</CardTitle>
            <Euro className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">€{stats?.totalRevenue || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Berberët Aktivë</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalBarbers || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Produktet</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalProducts || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="col-span-1 bg-card border-border">
          <CardHeader>
            <CardTitle>Aktiviteti i Fundit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {!activity || activity.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">Nuk ka aktivitet të fundit</div>
              ) : (
                activity.map(act => (
                  <div key={act.id} className="flex items-start gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{act.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(act.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
