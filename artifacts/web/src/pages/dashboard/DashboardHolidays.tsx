import { useMemo, useState } from "react";
import { useListBarbers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, CalendarOff, Plus, Trash2, User, Building2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOwnerShop } from "@/hooks/use-owner-shop";

async function fetchHolidays(shopId: number) {
  const r = await fetch(`/api/barbershops/${shopId}/holidays`, { credentials: "include" });
  if (!r.ok) throw new Error("Pushimet nuk u ngarkuan.");
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
  const r = await fetch(`/api/barbershops/${shopId}/holidays/${holidayId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error("Pushimi nuk u fshi.");
}

export default function DashboardHolidays() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: ownerShop, isLoading: shopLoading } = useOwnerShop();
  const shopId = ownerShop?.id ?? 0;
  const [form, setForm] = useState({ date: "", reason: "", barberId: "shop", isFullDay: true, startTime: "", endTime: "" });
  const [showForm, setShowForm] = useState(false);

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ["holidays", shopId],
    queryFn: () => fetchHolidays(shopId),
    enabled: !!ownerShop,
  });

  const { data: barbersRes, isLoading: barbersLoading } = useListBarbers(shopId, {
    query: { enabled: !!ownerShop } as any,
  });

  const barbers = Array.isArray(barbersRes) ? barbersRes : [];
  const holidayItems = Array.isArray(holidays) ? holidays : [];
  const barberById = useMemo(() => {
    return new Map(barbers.map((barber: any) => [Number(barber.id), barber]));
  }, [barbers]);
  const shopHolidayCount = holidayItems.filter((holiday: any) => !holiday.barberId).length;
  const barberHolidayCount = holidayItems.filter((holiday: any) => holiday.barberId).length;

  const createMut = useMutation({
    mutationFn: (payload: any) => createHoliday(shopId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays", shopId] });
      setForm({ date: "", reason: "", barberId: "shop", isFullDay: true, startTime: "", endTime: "" });
      setShowForm(false);
      toast({ title: "Pushimi u shtua" });
    },
    onError: (e: any) => toast({ title: "Gabim", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteHoliday(shopId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays", shopId] }),
    onError: (e: any) => toast({ title: "Gabim", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({
      date: form.date,
      reason: form.reason || null,
      barberId: form.barberId === "shop" ? null : parseInt(form.barberId),
      isFullDay: form.isFullDay,
      startTime: form.isFullDay ? null : form.startTime,
      endTime: form.isFullDay ? null : form.endTime,
    });
  };

  const grouped = holidayItems.reduce((acc: any, h: any) => {
    const month = h.date.slice(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(h);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pushimet & Ditet Jo-Pune</h1>
          <p className="text-muted-foreground">Blloko ditet per te gjithe dyqanin ose vetem per nje barber.</p>
        </div>
        <Button onClick={() => setShowForm(s => !s)} className="rounded-full gap-2">
          <Plus className="w-4 h-4" /> Shto Pushim
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-border bg-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">Total berbere</p>
              <p className="text-3xl font-black">{barbers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border bg-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">Pushime dyqani</p>
              <p className="text-3xl font-black">{shopHolidayCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border bg-card">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">Pushime barberesh</p>
              <p className="text-3xl font-black">{barberHolidayCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="bg-card border-border">
          <CardHeader><CardTitle>Pushim / Dite Jo-Pune e Re</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Data *</label>
                <Input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Arsyeja</label>
                <Input placeholder="p.sh. Feste kombetare" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Aplikohet per</label>
                <Select value={form.barberId} onValueChange={value => setForm(f => ({ ...f, barberId: value }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Zgjidh dyqanin ose barberin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shop">I gjithe dyqani</SelectItem>
                    {barbers.map((barber: any) => (
                      <SelectItem key={barber.id} value={String(barber.id)}>
                        {barber.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Lloji</label>
                <div className="flex gap-3 pt-2">
                  {[{ v: true, l: "Dite e plote" }, { v: false, l: "Ore te caktuara" }].map(({ v, l }) => (
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

      {shopLoading || isLoading || barbersLoading ? (
        <div className="text-muted-foreground text-sm">Duke ngarkuar...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarOff className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold">Nuk ka pushime te regjistruara</p>
            <p className="text-sm text-muted-foreground mt-1">Shto ditet kur dyqani ose nje barber nuk punon.</p>
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
                  <Card key={h.id} className="bg-card border-border rounded-2xl">
                    <CardContent className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <CalendarOff className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-sm">{h.date}</p>
                            <Badge variant="outline" className="text-xs">
                              {h.isFullDay ? "Dite e plote" : `${h.startTime} - ${h.endTime}`}
                            </Badge>
                            {h.barberId ? (
                              <Badge variant="secondary" className="text-xs gap-1">
                                <User className="w-3 h-3" />
                                {barberById.get(Number(h.barberId))?.name ?? `Barber #${h.barberId}`}
                              </Badge>
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
