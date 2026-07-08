import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Bell, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useOwnerShop } from "@/hooks/use-owner-shop";

const token = () => localStorage.getItem("barber_token");

const statusColors: Record<string, string> = {
  waiting: "bg-amber-500/10 text-amber-400 border-0",
  notified: "bg-blue-500/10 text-blue-400 border-0",
  booked: "bg-emerald-500/10 text-emerald-400 border-0",
  expired: "bg-zinc-500/10 text-zinc-400 border-0",
};
const statusLabels: Record<string, string> = {
  waiting: "Në pritje",
  notified: "Njoftuar",
  booked: "Rezervuar",
  expired: "Skaduar",
};

const api = {
  list: async (shopId: number) => {
    const r = await fetch(`/api/waiting-list?shopId=${shopId}`, { headers: { Authorization: `Bearer ${token()}` } });
    return r.json();
  },
  notify: async (shopId: number, preferredDate: string) => {
    const r = await fetch("/api/waiting-list/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ shopId, preferredDate }),
    });
    return r.json();
  },
  remove: async (id: number) => {
    await fetch(`/api/waiting-list/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
  },
};

export default function DashboardWaitingList() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: ownerShop, isLoading: shopLoading } = useOwnerShop();
  const shopId = ownerShop?.id ?? 0;

  const { data = [], isLoading } = useQuery({
    queryKey: ["waiting-list", shopId],
    queryFn: () => api.list(shopId),
    enabled: !!ownerShop,
  });
  const entries = Array.isArray(data) ? data : [];

  const notifyMut = useMutation({
    mutationFn: (preferredDate: string) => api.notify(shopId, preferredDate),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["waiting-list", shopId] }); toast({ title: `${res.notified} klientë u njoftuan!` }); },
  });

  const removeMut = useMutation({
    mutationFn: api.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["waiting-list", shopId] }),
  });

  // Group by preferredDate
  const grouped = entries.reduce((acc: any, e: any) => {
    if (!acc[e.preferredDate]) acc[e.preferredDate] = [];
    acc[e.preferredDate].push(e);
    return acc;
  }, {});

  const waitingCount = entries.filter((e: any) => e.status === "waiting").length;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lista e Pritjes</h1>
          <p className="text-muted-foreground">Klientët që presin vend të lirë për rezervim.</p>
        </div>
        {waitingCount > 0 && (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-sm px-3 py-1">
            {waitingCount} në pritje
          </Badge>
        )}
      </div>

      {shopLoading || isLoading ? (
        <div className="text-sm text-muted-foreground">Duke ngarkuar...</div>
      ) : entries.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold">Lista e pritjes është bosh</p>
            <p className="text-sm text-muted-foreground mt-1">Klientët mund t'u bashkohen listës kur oraret janë të zëna.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, items]: [string, any]) => {
            const dateWaiting = items.filter((i: any) => i.status === "waiting");
            return (
              <Card key={date} className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">{date}</CardTitle>
                    <Badge variant="outline" className="text-xs">{items.length} total</Badge>
                  </div>
                  {dateWaiting.length > 0 && (
                    <Button size="sm" variant="outline" className="rounded-xl gap-2 text-xs"
                      onClick={() => notifyMut.mutate(date)} disabled={notifyMut.isPending}>
                      <Bell className="w-3.5 h-3.5" />
                      Njofto të {dateWaiting.length} klientët
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">#{entry.userId}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">Klient #{entry.userId}</p>
                          {entry.notes && <p className="text-xs text-muted-foreground truncate">{entry.notes}</p>}
                          <p className="text-xs text-muted-foreground">Shtuar: {new Date(entry.createdAt).toLocaleDateString("sq-AL")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`text-xs ${statusColors[entry.status] || ""}`}>{statusLabels[entry.status] || entry.status}</Badge>
                        <button onClick={() => removeMut.mutate(entry.id)} className="text-destructive hover:text-destructive/80">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })
      )}
    </div>
  );
}
