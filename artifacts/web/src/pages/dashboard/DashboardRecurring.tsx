import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Plus, Trash2, Calendar, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const token = () => localStorage.getItem("barber_token");

const frequencyLabels: Record<string, string> = {
  weekly: "Çdo javë",
  biweekly: "Çdo 2 javë",
  monthly: "Çdo muaj",
};

const api = {
  list: async () => {
    const r = await fetch("/api/recurring", { headers: { Authorization: `Bearer ${token()}` } });
    return r.json();
  },
  create: async (payload: any) => {
    const r = await fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error((await r.json()).error);
    return r.json();
  },
  preview: async (id: number) => {
    const r = await fetch(`/api/recurring/${id}/preview`, { headers: { Authorization: `Bearer ${token()}` } });
    return r.json();
  },
  toggle: async (id: number, isActive: boolean) => {
    const r = await fetch(`/api/recurring/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ isActive }),
    });
    return r.json();
  },
  remove: async (id: number) => {
    await fetch(`/api/recurring/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
  },
};

const EMPTY_FORM = { shopId: "1", barberId: "", serviceId: "", frequency: "biweekly" as "weekly" | "biweekly" | "monthly", preferredTime: "10:00", startDate: "", endDate: "", notes: "" };

export default function DashboardRecurring() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [previewId, setPreviewId] = useState<number | null>(null);

  const { data: rules = [], isLoading } = useQuery({ queryKey: ["recurring"], queryFn: api.list });
  const { data: preview } = useQuery({
    queryKey: ["recurring-preview", previewId],
    queryFn: () => previewId ? api.preview(previewId) : null,
    enabled: !!previewId,
  });

  const createMut = useMutation({
    mutationFn: api.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["recurring"] }); setForm(EMPTY_FORM); setShowForm(false); toast({ title: "Rezervimi periodik u krijua!" }); },
    onError: (e: any) => toast({ title: "Gabim", description: e.message, variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: any) => api.toggle(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
  });

  const removeMut = useMutation({
    mutationFn: api.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["recurring"] }); if (previewId) setPreviewId(null); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ ...form, shopId: parseInt(form.shopId), barberId: parseInt(form.barberId), serviceId: parseInt(form.serviceId) });
  };

  const rulesList = Array.isArray(rules) ? rules : [];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rezervimet Periodike</h1>
          <p className="text-muted-foreground">Rezervimet që përsëriten automatikisht çdo javë, 2 javë ose muaj.</p>
        </div>
        <Button onClick={() => setShowForm(s => !s)} className="rounded-full gap-2">
          <Plus className="w-4 h-4" /> I Ri
        </Button>
      </div>

      {showForm && (
        <Card className="bg-card border-border">
          <CardHeader><CardTitle>Rezervim Periodik i Ri</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">ID Dyqanit *</label>
                <Input type="number" required value={form.shopId} onChange={e => setForm(f => ({ ...f, shopId: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">ID Berberit *</label>
                <Input type="number" required value={form.barberId} onChange={e => setForm(f => ({ ...f, barberId: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">ID Shërbimit *</label>
                <Input type="number" required value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Frekuenca *</label>
                <div className="flex gap-2">
                  {(["weekly", "biweekly", "monthly"] as const).map(v => (
                    <button key={v} type="button" onClick={() => setForm(f => ({ ...f, frequency: v }))}
                      className={`flex-1 px-2 py-2 rounded-xl text-xs font-semibold border transition-all ${form.frequency === v ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"}`}>
                      {frequencyLabels[v]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ora Preferuar</label>
                <Input type="time" value={form.preferredTime} onChange={e => setForm(f => ({ ...f, preferredTime: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Data e Fillimit *</label>
                <Input type="date" required value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Data e Mbarimit</label>
                <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Shënime</label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <Button type="submit" disabled={createMut.isPending} className="rounded-xl">
                  {createMut.isPending ? "Duke krijuar..." : "Krijo"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Anulo</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {previewId && preview && (
        <Card className="bg-card border-border border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Datat e ardhshme — {frequencyLabels[preview.rule?.frequency]}</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setPreviewId(null)}>✕</Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {preview.upcomingDates?.map((d: string) => (
                <Badge key={d} variant="outline" className="text-xs gap-1">
                  <Calendar className="w-3 h-3" />{d}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Duke ngarkuar...</div>
      ) : rulesList.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold">Nuk ka rezervime periodike</p>
            <p className="text-sm text-muted-foreground mt-1">Krijo rezervime që përsëriten automatikisht.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rulesList.map((rule: any) => (
            <Card key={rule.id} className={`bg-card border-border transition-opacity ${!rule.isActive ? "opacity-60" : ""}`}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{rule.barbershop?.name ?? `Dyqan #${rule.shopId}`}</p>
                      <Badge className="text-xs bg-primary/10 text-primary border-0">{frequencyLabels[rule.frequency]}</Badge>
                      {!rule.isActive && <Badge variant="secondary" className="text-xs">Joaktiv</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {rule.barber?.name} · {rule.service?.name} · ora {rule.preferredTime}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Nga {rule.startDate}{rule.endDate ? ` deri ${rule.endDate}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => setPreviewId(rule.id === previewId ? null : rule.id)} title="Shiko datat">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => toggleMut.mutate({ id: rule.id, isActive: !rule.isActive })}>
                    <RefreshCw className={`w-4 h-4 ${rule.isActive ? "text-primary" : "text-muted-foreground"}`} />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeMut.mutate(rule.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
