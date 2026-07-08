import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarOff, Plus, Trash2, User, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOwnerShop } from "@/hooks/use-owner-shop";

async function fetchHolidays(shopId: number) {
  const r = await fetch(`/api/barbershops/${shopId}/holidays`, { credentials: "include" });
  return r.json();
}

async function createHoliday(shopId: number, payload: any) {
  const token = localStorage.getItem("barber_token");
  const r = await fetch(`/api/barbershops/${shopId}/holidays`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error((await r.json()).error);
  return r.json();
}

async function deleteHoliday(shopId: number, holidayId: number) {
  const token = localStorage.getItem("barber_token");
  await fetch(`/api/barbershops/${shopId}/holidays/${holidayId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default function DashboardHolidays() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: ownerShop, isLoading: shopLoading } = useOwnerShop();
  const shopId = ownerShop?.id ?? 0;
  const [form, setForm] = useState({ date: "", reason: "", barberId: "", isFullDay: true, startTime: "", endTime: "" });
  const [showForm, setShowForm] = useState(false);

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ["holidays", shopId],
    queryFn: () => fetchHolidays(shopId),
    enabled: !!ownerShop,
  });

  const createMut = useMutation({
    mutationFn: (payload: any) => createHoliday(shopId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays", shopId] });
      setForm({ date: "", reason: "", barberId: "", isFullDay: true, startTime: "", endTime: "" });
      setShowForm(false);
      toast({ title: "Pushimi u shtua" });
    },
    onError: (e: any) => toast({ title: "Gabim", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteHoliday(shopId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays", shopId] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({
      date: form.date,
      reason: form.reason || null,
      barberId: form.barberId ? parseInt(form.barberId) : null,
      isFullDay: form.isFullDay,
      startTime: form.isFullDay ? null : form.startTime,
      endTime: form.isFullDay ? null : form.endTime,
    });
  };

  const grouped = (Array.isArray(holidays) ? holidays : []).reduce((acc: any, h: any) => {
    const month = h.date.slice(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(h);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pushimet & Ditët Jo-Pune</h1>
          <p className="text-muted-foreground">Blloko ditët kur dyqani ose berberi nuk është i disponueshëm.</p>
        </div>
        <Button onClick={() => setShowForm(s => !s)} className="rounded-full gap-2">
          <Plus className="w-4 h-4" /> Shto Pushim
        </Button>
      </div>

      {showForm && (
        <Card className="bg-card border-border">
          <CardHeader><CardTitle>Pushim / Ditë Jo-Pune e Re</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Data *</label>
                <Input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Arsyeja</label>
                <Input placeholder="p.sh. Festë kombëtare" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">ID e Berberit (opsionale)</label>
                <Input type="number" placeholder="Lëre bosh = i gjithë dyqani" value={form.barberId} onChange={e => setForm(f => ({ ...f, barberId: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Lloji</label>
                <div className="flex gap-3 pt-2">
                  {[{ v: true, l: "Ditë e plotë" }, { v: false, l: "Orë të caktuara" }].map(({ v, l }) => (
                    <button key={l} type="button" onClick={() => setForm(f => ({ ...f, isFullDay: v }))}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${form.isFullDay === v ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {!form.isFullDay && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ora e Fillimit</label>
                    <Input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ora e Mbarimit</label>
                    <Input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                  </div>
                </>
              )}
              <div className="sm:col-span-2 flex gap-3">
                <Button type="submit" disabled={createMut.isPending} className="rounded-xl">
                  {createMut.isPending ? "Duke ruajtur..." : "Ruaj"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Anulo</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {shopLoading || isLoading ? (
        <div className="text-muted-foreground text-sm">Duke ngarkuar...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarOff className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold">Nuk ka pushime të regjistruara</p>
            <p className="text-sm text-muted-foreground mt-1">Shto ditët kur dyqani është i mbyllur.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, items]: [string, any]) => (
            <div key={month}>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">{month}</h3>
              <div className="space-y-2">
                {items.map((h: any) => (
                  <Card key={h.id} className="bg-card border-border">
                    <CardContent className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <CalendarOff className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{h.date}</p>
                            <Badge variant="outline" className="text-xs">
                              {h.isFullDay ? "Ditë e plotë" : `${h.startTime} – ${h.endTime}`}
                            </Badge>
                            {h.barberId ? (
                              <Badge variant="secondary" className="text-xs gap-1"><User className="w-3 h-3" />Barber #{h.barberId}</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs gap-1"><Building2 className="w-3 h-3" />Dyqani</Badge>
                            )}
                          </div>
                          {h.reason && <p className="text-xs text-muted-foreground mt-0.5">{h.reason}</p>}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive shrink-0"
                        onClick={() => deleteMut.mutate(h.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
