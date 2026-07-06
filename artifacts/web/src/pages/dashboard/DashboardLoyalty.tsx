import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, Save, Award, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const SHOP_ID = 1;
const token = () => localStorage.getItem("barber_token");

const api = {
  getProgram: async () => {
    const r = await fetch(`/api/barbershops/${SHOP_ID}/loyalty/program`);
    return r.json();
  },
  upsertProgram: async (payload: any) => {
    const r = await fetch(`/api/barbershops/${SHOP_ID}/loyalty/program`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error((await r.json()).error);
    return r.json();
  },
};

export default function DashboardLoyalty() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: program, isLoading } = useQuery({ queryKey: ["loyalty-program", SHOP_ID], queryFn: api.getProgram });
  const [form, setForm] = useState({ pointsPerEuro: 10, pointsToRedeem: 100, minPointsRedeem: 100, isActive: true });
  const [initialized, setInitialized] = useState(false);

  if (program && !initialized) {
    setForm({ pointsPerEuro: program.pointsPerEuro, pointsToRedeem: program.pointsToRedeem, minPointsRedeem: program.minPointsRedeem, isActive: program.isActive === 1 });
    setInitialized(true);
  }

  const saveMut = useMutation({
    mutationFn: api.upsertProgram,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["loyalty-program"] }); toast({ title: "Programi i besnikërisë u ruajt!" }); },
    onError: (e: any) => toast({ title: "Gabim", description: e.message, variant: "destructive" }),
  });

  // Earned per booking example
  const exampleEarned = Math.floor(15 * form.pointsPerEuro);
  const exampleRedeem = parseFloat((form.minPointsRedeem / form.pointsToRedeem).toFixed(2));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Programi i Besnikërisë</h1>
        <p className="text-muted-foreground">Shpërblejini klientët tuaj besnikë me pikë që mund të shpërblihen.</p>
      </div>

      {/* Preview cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <Star className="w-8 h-8 text-primary mb-3" />
            <p className="text-2xl font-bold">{form.pointsPerEuro} pikë</p>
            <p className="text-sm text-muted-foreground mt-1">për çdo €1 të shpenzuar</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <Award className="w-8 h-8 text-emerald-400 mb-3" />
            <p className="text-2xl font-bold">{form.pointsToRedeem} pikë</p>
            <p className="text-sm text-muted-foreground mt-1">= €1 zbritje</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-6">
            <TrendingUp className="w-8 h-8 text-amber-400 mb-3" />
            <p className="text-2xl font-bold">{exampleEarned} pikë</p>
            <p className="text-sm text-muted-foreground mt-1">nga një takim €15</p>
          </CardContent>
        </Card>
      </div>

      {/* Config */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Konfigurimi i Programit
            {program ? (
              <Badge className={program.isActive ? "bg-emerald-500/10 text-emerald-400 border-0" : "bg-zinc-500/10 text-zinc-400 border-0"}>
                {program.isActive ? "Aktiv" : "Joaktiv"}
              </Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Duke ngarkuar...</div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pikë / Euro</label>
                  <Input type="number" min="1" value={form.pointsPerEuro} onChange={e => setForm(f => ({ ...f, pointsPerEuro: parseInt(e.target.value) || 1 }))} />
                  <p className="text-xs text-muted-foreground">Sa pikë fiton klienti për çdo €1 të shpenzuar</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pikë → €1</label>
                  <Input type="number" min="1" value={form.pointsToRedeem} onChange={e => setForm(f => ({ ...f, pointsToRedeem: parseInt(e.target.value) || 1 }))} />
                  <p className="text-xs text-muted-foreground">Sa pikë nevojiten për €1 zbritje</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Min. Pikë / Shpërbliim</label>
                  <Input type="number" min="1" value={form.minPointsRedeem} onChange={e => setForm(f => ({ ...f, minPointsRedeem: parseInt(e.target.value) || 1 }))} />
                  <p className="text-xs text-muted-foreground">Minimumi i pikëve për shpërbliim</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold">Programi Aktiv</label>
                <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-primary" : "bg-zinc-600"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <div className="bg-muted/30 border border-border/50 rounded-xl p-4 text-sm">
                <p className="font-semibold mb-1">Shembull</p>
                <p className="text-muted-foreground">
                  Klienti shpenzon <strong className="text-foreground">€15</strong> → fiton <strong className="text-primary">{exampleEarned} pikë</strong>.
                  Me {form.minPointsRedeem} pikë minimale, mund të shpërblejë <strong className="text-emerald-400">€{exampleRedeem}</strong>.
                </p>
              </div>

              <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending} className="rounded-xl gap-2">
                <Save className="w-4 h-4" />
                {saveMut.isPending ? "Duke ruajtur..." : "Ruaj Konfigurimet"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
