import { useMemo, useState } from "react";
import { useListBarbers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, CalendarOff, Plus, Trash2, User, Building2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
          <h1 className="text-3xl font-black tracking-tight">Orari & Festat</h1>
          <p className="text-muted-foreground">Bllokoni ditët e pushimit për të gjithë sallonin ose për një berber specifik.</p>
        </div>
        <Button onClick={() => setShowForm(s => !s)} className="rounded-full gap-2 font-bold">
          <Plus className="w-4 h-4" /> Shto Pushim
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Stafi</p>
              <p className="text-3xl font-black">{barbers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pushime Salloni</p>
              <p className="text-3xl font-black">{shopHolidayCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-border bg-card shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pushime Stafi</p>
              <p className="text-3xl font-black">{barberHolidayCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="bg-card border-border rounded-3xl shadow-lg">
          <CardHeader><CardTitle className="text-xl font-black">Pushim i Ri</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Data *</label>
                <Input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="rounded-xl h-12" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Arsyeja</label>
                <Input placeholder="p.sh. Festë kombëtare" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="rounded-xl h-12" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Aplikohet për</label>
                <Select value={form.barberId} onValueChange={value => setForm(f => ({ ...f, barberId: value }))}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Zgjidhni" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="shop">I gjithë salloni</SelectItem>
                    {barbers.map((barber: any) => (
                      <SelectItem key={barber.id} value={String(barber.id)}>
                        {barber.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Lloji i pushimit</label>
                <div className="flex gap-3 pt-1">
                  {[{ v: true, l: "Ditë e plotë" }, { v: false, l: "Orë të caktuara" }].map(({ v, l }) => (
                    <button key={l} type="button" onClick={() => setForm(f => ({ ...f, isFullDay: v }))}
                      className={`flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${form.isFullDay === v ? "bg-primary text-white border-primary" : "border-border text-muted-foreground bg-secondary/30"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {!form.isFullDay && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Ora e Fillimit</label>
                    <Input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="rounded-xl h-12" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Ora e Mbarimit</label>
                    <Input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="rounded-xl h-12" />
                  </div>
                </>
              )}
              <div className="sm:col-span-2 flex gap-3 pt-2">
                <Button type="submit" disabled={createMut.isPending} className="flex-1 rounded-xl h-12 font-black">
                  {createMut.isPending ? "Duke ruajtur..." : "Ruaj Pushimin"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl h-12 font-bold px-8">Anulo</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {shopLoading || isLoading || barbersLoading ? (
        <div className="grid gap-4">
           <Skeleton className="h-20 rounded-2xl" />
           <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="bg-card border-border rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <CalendarOff className="w-16 h-16 text-muted-foreground/20 mb-4" />
            <p className="font-black text-xl text-muted-foreground">Nuk ka pushime të regjistruara</p>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Shto ditët kur salloni ose një berber nuk punon.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, items]: [string, any]) => (
            <div key={month}>
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 ml-1">{month}</h3>
              <div className="space-y-3">
                {items.map((h: any) => (
                  <Card key={h.id} className="bg-card border-border rounded-[24px] shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/80 flex items-center justify-center shrink-0">
                          <CalendarOff className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black text-base text-foreground">{h.date}</p>
                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5">
                              {h.isFullDay ? "Ditë e plotë" : `${h.startTime} - ${h.endTime}`}
                            </Badge>
                            {h.barberId ? (
                              <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest gap-1 bg-indigo-50 text-indigo-600 border-indigo-100">
                                <User className="w-3 h-3" />
                                {barberById.get(Number(h.barberId))?.name ?? `Barber #${h.barberId}`}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest gap-1 bg-amber-50 text-amber-600 border-amber-100"><Building2 className="w-3 h-3" />Salloni</Badge>
                            )}
                          </div>
                          {h.reason && <p className="text-xs text-muted-foreground mt-1 font-medium italic">"{h.reason}"</p>}
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 shrink-0 h-10 w-10 rounded-xl"
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
