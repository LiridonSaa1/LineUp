import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useGetBarbershop } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Clock, MapPin, Phone, Save } from "lucide-react";

export default function DashboardSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const shopId = 1;
  const [saving, setSaving] = useState(false);

  const { data: shop, isLoading } = useGetBarbershop(
    { id: shopId },
    { query: { enabled: !!user } }
  );

  const [form, setForm] = useState({
    name: "", city: "", address: "", phone: "", description: "",
    openTime: "09:00", closeTime: "18:00", gender: "both",
  });

  const [initialized, setInitialized] = useState(false);
  if (shop && !initialized) {
    setForm({
      name: shop.name ?? "",
      city: shop.city ?? "",
      address: shop.address ?? "",
      phone: shop.phone ?? "",
      description: shop.description ?? "",
      openTime: shop.openTime ?? "09:00",
      closeTime: shop.closeTime ?? "18:00",
      gender: shop.gender ?? "both",
    });
    setInitialized(true);
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/barbershops/${shopId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("barber_token")}`,
        },
        body: JSON.stringify(form),
      });
      toast({ title: "Cilësimet u ruajtën", description: "Të dhënat e dyqanit u përditësuan me sukses." });
    } catch {
      toast({ variant: "destructive", title: "Gabim", description: "Nuk u ruajtën ndryshimet." });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cilësimet e Dyqanit</h1>
        <p className="text-muted-foreground mt-1">Përditësoni informacionin e sallonit tuaj</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" /> Informacioni bazë
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Emri i sallonit</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="p.sh. The Barber Lab" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Përshkrimi</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Përshkruani sallonin tuaj..." rows={3} className="rounded-xl resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gjinia e shërbyer</Label>
              <Select value={form.gender} onValueChange={v => set("gender", v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Meshkuj</SelectItem>
                  <SelectItem value="female">Femra</SelectItem>
                  <SelectItem value="both">Të dyja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Vendndodhja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Qyteti</Label>
            <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="p.sh. Prishtinë" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Adresa e plotë</Label>
            <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="Rruga, numri..." className="rounded-xl" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" /> Kontakti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Numri i telefonit</Label>
            <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+383 4X XXX XXX" className="rounded-xl" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Orari i punës
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-2 flex-1">
              <Label>Hapet</Label>
              <Input type="time" value={form.openTime} onChange={e => set("openTime", e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2 flex-1">
              <Label>Mbyllet</Label>
              <Input type="time" value={form.closeTime} onChange={e => set("closeTime", e.target.value)} className="rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="rounded-xl px-6">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Duke ruajtur..." : "Ruaj Ndryshimet"}
        </Button>
      </div>
    </div>
  );
}
