import { useMemo, useState } from "react";
import { useListAppointments } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Users, Calendar, Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useOwnerShop } from "@/hooks/use-owner-shop";

export default function DashboardClients() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const { data: ownerShop, isLoading: shopLoading } = useOwnerShop();
  const shopId = ownerShop?.id ?? 0;

  const { data: apptRes, isLoading } = useListAppointments(
    { shopId, limit: 500 },
    { query: { enabled: !!user && !!ownerShop } as any }
  );

  const appointments = Array.isArray(apptRes) ? apptRes : apptRes?.data ?? [];

  const clients = useMemo(() => {
    const map = new Map<number, {
      id: number; name: string; phone?: string;
      visits: number; lastVisit: string; totalSpent: number; status: string;
    }>();
    for (const apt of appointments) {
      const u = (apt as any).user;
      if (!u) continue;
      const existing = map.get(u.id);
      const price = apt.totalPrice ? parseFloat(apt.totalPrice as string) : 0;
      if (existing) {
        existing.visits++;
        existing.totalSpent += price;
        if (new Date(apt.scheduledAt) > new Date(existing.lastVisit)) {
          existing.lastVisit = apt.scheduledAt;
          existing.status = apt.status;
        }
      } else {
        map.set(u.id, {
          id: u.id, name: u.name ?? "Klient", phone: u.phone,
          visits: 1, lastVisit: apt.scheduledAt, totalSpent: price, status: apt.status,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.visits - a.visits);
  }, [appointments]);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  const totalRevenue = clients.reduce((s, c) => s + c.totalSpent, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Klientët</h1>
        <p className="text-muted-foreground mt-1">Lista e klientëve të dyqanit tuaj</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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
            <span className="text-blue-500 font-bold text-sm">€</span>
          </div>
          <div>
            <p className="text-2xl font-bold">€{totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Të ardhura totale</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Kërko klient sipas emrit ose telefonit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {shopLoading || isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl">
          <Users className="w-14 h-14 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="font-semibold">Nuk u gjet asnjë klient</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-base font-bold text-primary shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{c.name}</p>
                  {c.visits >= 5 && <Badge className="bg-amber-500/10 text-amber-600 border-amber-300 text-[10px] px-1.5">VIP</Badge>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                  {c.phone && <span className="text-xs text-muted-foreground">{c.phone}</span>}
                  <span className="text-xs text-muted-foreground">{c.visits} vizita</span>
                  <span className="text-xs text-muted-foreground">
                    E fundit: {format(parseISO(c.lastVisit), "dd MMM yyyy")}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-primary">€{c.totalSpent.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">shpenzuar</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
