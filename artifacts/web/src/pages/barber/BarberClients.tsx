import { useMemo } from "react";
import { useListAppointments } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, Scissors } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function BarberClients() {
  const { user } = useAuth();

  const { data: apptRes, isLoading } = useListAppointments(
    { limit: 200 },
    { query: { enabled: !!user } }
  );

  const appointments = Array.isArray(apptRes) ? apptRes : apptRes?.data ?? [];

  const clients = useMemo(() => {
    const map = new Map<number, { name: string; visits: number; lastVisit: string; services: string[] }>();
    for (const apt of appointments) {
      const u = (apt as any).user;
      if (!u) continue;
      const existing = map.get(u.id);
      const svc = (apt as any).service?.name;
      if (existing) {
        existing.visits++;
        if (new Date(apt.scheduledAt) > new Date(existing.lastVisit)) existing.lastVisit = apt.scheduledAt;
        if (svc && !existing.services.includes(svc)) existing.services.push(svc);
      } else {
        map.set(u.id, { name: u.name ?? "Klient", visits: 1, lastVisit: apt.scheduledAt, services: svc ? [svc] : [] });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.visits - a.visits);
  }, [appointments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Klientët e Mi</h1>
        <p className="text-muted-foreground mt-1">Historiku i klientëve që keni shërbyer</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-2">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{clients.length}</p>
            <p className="text-xs text-muted-foreground">Klientë unik</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{appointments.length}</p>
            <p className="text-xs text-muted-foreground">Takime gjithsej</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Scissors className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {clients.length > 0 ? (appointments.length / clients.length).toFixed(1) : 0}
            </p>
            <p className="text-xs text-muted-foreground">Mesatare vizita</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl">
          <Users className="w-14 h-14 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="font-semibold">Ende nuk keni klientë</p>
          <p className="text-muted-foreground text-sm mt-1">Klientët do të shfaqen pasi të keni takime.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((c, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-base font-bold text-primary shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{c.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                  <span className="text-xs text-muted-foreground">{c.visits} vizita</span>
                  <span className="text-xs text-muted-foreground">
                    Vizita e fundit: {format(parseISO(c.lastVisit), "dd MMM yyyy")}
                  </span>
                </div>
                {c.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {c.services.slice(0, 3).map(s => (
                      <span key={s} className="text-[11px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-primary">{c.visits}</p>
                <p className="text-xs text-muted-foreground">vizita</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
