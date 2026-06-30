import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Clock, Save } from "lucide-react";

const DAYS = [
  { key: "mon", label: "E Hënë" },
  { key: "tue", label: "E Martë" },
  { key: "wed", label: "E Mërkurë" },
  { key: "thu", label: "E Enjte" },
  { key: "fri", label: "E Premte" },
  { key: "sat", label: "E Shtunë" },
  { key: "sun", label: "E Diel" },
];

type DaySchedule = { active: boolean; start: string; end: string };

const defaultSchedule: Record<string, DaySchedule> = {
  mon: { active: true,  start: "09:00", end: "18:00" },
  tue: { active: true,  start: "09:00", end: "18:00" },
  wed: { active: true,  start: "09:00", end: "18:00" },
  thu: { active: true,  start: "09:00", end: "18:00" },
  fri: { active: true,  start: "09:00", end: "18:00" },
  sat: { active: true,  start: "09:00", end: "15:00" },
  sun: { active: false, start: "09:00", end: "13:00" },
};

export default function BarberAvailability() {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(defaultSchedule);
  const [saving, setSaving] = useState(false);

  const toggle = (day: string) =>
    setSchedule(s => ({ ...s, [day]: { ...s[day], active: !s[day].active } }));

  const setTime = (day: string, field: "start" | "end", val: string) =>
    setSchedule(s => ({ ...s, [day]: { ...s[day], [field]: val } }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    toast({ title: "Orari u ruajt", description: "Disponueshmëria juaj u përditësua me sukses." });
  };

  const activeDays = Object.values(schedule).filter(d => d.active).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Disponueshmëria</h1>
        <p className="text-muted-foreground mt-1">Caktoni orarin tuaj të punës dhe ditët e lira</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{activeDays}</p>
            <p className="text-xs text-muted-foreground">Ditë aktive / javë</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {Object.entries(schedule)
                .filter(([, d]) => d.active)
                .reduce((sum, [, d]) => {
                  const [sh, sm] = d.start.split(":").map(Number);
                  const [eh, em] = d.end.split(":").map(Number);
                  return sum + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
                }, 0).toFixed(0)}h
            </p>
            <p className="text-xs text-muted-foreground">Orë pune / javë</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Orari javor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS.map(({ key, label }) => {
            const d = schedule[key];
            return (
              <div key={key} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border transition-colors ${
                d.active ? "bg-secondary/30 border-border" : "border-border/40 opacity-60"
              }`}>
                <div className="flex items-center gap-3 w-36 shrink-0">
                  <Switch checked={d.active} onCheckedChange={() => toggle(key)} />
                  <Label className="font-medium cursor-pointer" onClick={() => toggle(key)}>{label}</Label>
                </div>
                {d.active ? (
                  <div className="flex items-center gap-2">
                    <Input type="time" value={d.start} onChange={e => setTime(key, "start", e.target.value)}
                      className="w-28 rounded-xl h-9 text-sm" />
                    <span className="text-muted-foreground text-sm">—</span>
                    <Input type="time" value={d.end} onChange={e => setTime(key, "end", e.target.value)}
                      className="w-28 rounded-xl h-9 text-sm" />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Pushim</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="rounded-xl px-6">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Duke ruajtur..." : "Ruaj Orarin"}
        </Button>
      </div>
    </div>
  );
}
