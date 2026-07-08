import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Ticket, Plus, Trash2, ToggleLeft, ToggleRight, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOwnerShop } from "@/hooks/use-owner-shop";

const token = () => localStorage.getItem("barber_token");

const api = {
  list: async (shopId: number) => {
    const r = await fetch(`/api/coupons?shopId=${shopId}`, { headers: { Authorization: `Bearer ${token()}` } });
    return r.json();
  },
  create: async (payload: any) => {
    const r = await fetch("/api/coupons", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify(payload) });
    if (!r.ok) throw new Error((await r.json()).error);
    return r.json();
  },
  toggle: async (id: number, isActive: boolean) => {
    const r = await fetch(`/api/coupons/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: JSON.stringify({ isActive }) });
    return r.json();
  },
  remove: async (id: number) => {
    await fetch(`/api/coupons/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
  },
};

const EMPTY_FORM = { code: "", description: "", discountType: "percentage" as "percentage" | "fixed", discountValue: "", minAmount: "", maxUses: "", expiresAt: "" };

export default function DashboardCoupons() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: ownerShop, isLoading: shopLoading } = useOwnerShop();
  const shopId = ownerShop?.id ?? 0;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["coupons", shopId],
    queryFn: () => api.list(shopId),
    enabled: !!ownerShop,
  });

  const createMut = useMutation({
    mutationFn: api.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coupons", shopId] }); setForm(EMPTY_FORM); setShowForm(false); toast({ title: "Kuponi u krijua!" }); },
    onError: (e: any) => toast({ title: "Gabim", description: e.message, variant: "destructive" }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: any) => api.toggle(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons", shopId] }),
  });

  const removeMut = useMutation({
    mutationFn: api.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons", shopId] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({
      shopId,
      code: form.code,
      description: form.description || null,
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      minAmount: form.minAmount ? parseFloat(form.minAmount) : 0,
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      expiresAt: form.expiresAt || null,
    });
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast({ title: "Kodi u kopjua!" }); };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kuponat & Zbritjet</h1>
          <p className="text-muted-foreground">Krijo dhe menaxho kuponat e zbritjes për klientët tuaj.</p>
        </div>
        <Button onClick={() => setShowForm(s => !s)} className="rounded-full gap-2">
          <Plus className="w-4 h-4" /> Kupon i Ri
        </Button>
      </div>

      {showForm && (
        <Card className="bg-card border-border">
          <CardHeader><CardTitle>Kupon i Ri</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Kodi *</label>
                <Input placeholder="p.sh. SUMMER20" required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Përshkrimi</label>
                <Input placeholder="Përshkrimi i kuponit" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Lloji i Zbritjes</label>
                <div className="flex gap-2">
                  {[{ v: "percentage", l: "Përqindje (%)" }, { v: "fixed", l: "Shumë Fikse (€)" }].map(({ v, l }) => (
                    <button key={v} type="button" onClick={() => setForm(f => ({ ...f, discountType: v as any }))}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${form.discountType === v ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Vlera e Zbritjes *</label>
                <Input type="number" min="0" step="0.01" required placeholder={form.discountType === "percentage" ? "p.sh. 20" : "p.sh. 5.00"} value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Shuma Minimale (€)</label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.minAmount} onChange={e => setForm(f => ({ ...f, minAmount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Maks. Përdorime</label>
                <Input type="number" min="1" placeholder="Pa limit" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Data e Skadimit</label>
                <Input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 flex gap-3 pt-2">
                <Button type="submit" disabled={createMut.isPending} className="rounded-xl">
                  {createMut.isPending ? "Duke krijuar..." : "Krijo Kuponin"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Anulo</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {shopLoading || isLoading ? (
        <div className="text-muted-foreground text-sm">Duke ngarkuar...</div>
      ) : !Array.isArray(coupons) || coupons.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Ticket className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold">Nuk ka kupona ende</p>
            <p className="text-sm text-muted-foreground mt-1">Krijo kuponin e parë të zbritjes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c: any) => {
            const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
            const isFull = c.maxUses && c.usedCount >= c.maxUses;
            return (
              <Card key={c.id} className={`bg-card border-border transition-opacity ${!c.isActive ? "opacity-60" : ""}`}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Ticket className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <button onClick={() => copyCode(c.code)} className="flex items-center gap-1 group">
                          <span className="font-mono font-bold text-sm truncate">{c.code}</span>
                          <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        {c.description && <p className="text-xs text-muted-foreground truncate">{c.description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => toggleMut.mutate({ id: c.id, isActive: !c.isActive })}>
                        {c.isActive ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                      </button>
                      <button onClick={() => removeMut.mutate(c.id)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge className="text-xs bg-primary/10 text-primary border-0">
                      {c.discountType === "percentage" ? `${c.discountValue}% zbritje` : `€${c.discountValue} zbritje`}
                    </Badge>
                    {c.minAmount > 0 && <Badge variant="outline" className="text-xs">Min €{c.minAmount}</Badge>}
                    {c.maxUses && <Badge variant="outline" className="text-xs">{c.usedCount}/{c.maxUses} herë</Badge>}
                    {isExpired && <Badge variant="destructive" className="text-xs">Skaduar</Badge>}
                    {isFull && <Badge variant="destructive" className="text-xs">Limit arritur</Badge>}
                    {!c.isActive && <Badge variant="secondary" className="text-xs">Çaktivizuar</Badge>}
                  </div>
                  {c.expiresAt && (
                    <p className="text-xs text-muted-foreground">Skadon: {new Date(c.expiresAt).toLocaleDateString("sq-AL")}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
