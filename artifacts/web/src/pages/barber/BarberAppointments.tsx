import { useMemo, useState } from "react";
import { useListAppointments, useUpdateAppointment } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  X,
  Calendar,
  Clock,
  User,
  Scissors,
} from "lucide-react";
import {
  format,
  parseISO,
  addMinutes,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachHourOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameDay,
  isSameMonth,
  isToday,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
  startOfDay,
} from "date-fns";
import { sq } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────
type ViewMode = "month" | "week" | "day";
type Apt = {
  id: number;
  scheduledAt: string;
  status: string;
  otpCode?: string | null;
  user?: { name?: string; phone?: string };
  service?: { name?: string; duration?: number; durationMinutes?: number };
  [key: string]: any;
};

/** One calendar block = one or more appointments merged by shared otpCode */
type GroupedApt = {
  id: number;           // id of the anchor (first) appointment
  ids: number[];        // all apt ids in the group
  scheduledAt: string;  // start time of the first apt
  status: string;
  user?: Apt["user"];
  totalDuration: number;       // sum of every service duration (minutes)
  services: Array<{ name?: string; duration?: number }>;
  serviceLabel: string;        // "Haircut, Beard trim"
  raw: Apt[];                  // original apt objects (for status updates)
};

// ── Constants ──────────────────────────────────────────────────────────
const HOUR_START = 7;
const HOUR_END = 21;
const HOUR_HEIGHT = 64; // px per hour in week/day view
const DAY_NAMES_SHORT = ["Hën", "Mar", "Mër", "Enj", "Pre", "Sht", "Die"];
const DAY_NAMES = ["E Hënë", "E Martë", "E Mërkurë", "E Enjte", "E Premte", "E Shtunë", "E Diel"];

const STATUS_CFG: Record<string, { label: string; dot: string; badge: string }> = {
  confirmed:   { label: "Konfirmuar",      dot: "bg-primary",     badge: "bg-primary hover:bg-primary text-white" },
  pending_otp: { label: "Në pritje",       dot: "bg-amber-400",   badge: "border-amber-500 text-amber-600" },
  completed:   { label: "Përfunduar",      dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  cancelled:   { label: "Anuluar",         dot: "bg-red-400",     badge: "bg-red-100 text-red-600" },
  no_show:     { label: "Nuk u paraqit",   dot: "bg-slate-400",   badge: "bg-slate-100 text-slate-600" },
};

function statusCfg(s: string) {
  return STATUS_CFG[s] ?? { label: s, dot: "bg-muted", badge: "" };
}

// ── Helpers ────────────────────────────────────────────────────────────

/** Merge appointments that share the same otpCode into one GroupedApt. */
function groupApts(apts: Apt[]): GroupedApt[] {
  const buckets = new Map<string, Apt[]>();
  for (const apt of apts) {
    // Key: shared otpCode when present, otherwise unique per apt
    const key = apt.otpCode ? `otp:${apt.otpCode}` : `id:${apt.id}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(apt);
  }

  const groups: GroupedApt[] = [];
  for (const bucket of buckets.values()) {
    // Sort by scheduledAt so the first entry is the start time
    bucket.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    const first = bucket[0];
    const services = bucket.map((a) => ({
      name: a.service?.name,
      duration: a.service?.durationMinutes ?? a.service?.duration ?? 30,
    }));
    const totalDuration = services.reduce((sum, s) => sum + (s.duration ?? 30), 0);
    groups.push({
      id: first.id,
      ids: bucket.map((a) => a.id),
      scheduledAt: first.scheduledAt,
      status: first.status,
      user: first.user,
      totalDuration,
      services,
      serviceLabel: services.map((s) => s.name).filter(Boolean).join(", "),
      raw: bucket,
    });
  }
  return groups;
}

function groupsForDay(groups: GroupedApt[], day: Date) {
  return groups.filter((g) => isSameDay(parseISO(g.scheduledAt), day));
}

function groupTopPercent(g: GroupedApt) {
  const d = parseISO(g.scheduledAt);
  const mins = (getHours(d) - HOUR_START) * 60 + getMinutes(d);
  return (mins / ((HOUR_END - HOUR_START) * 60)) * 100;
}

function groupHeightPercent(g: GroupedApt) {
  return (g.totalDuration / ((HOUR_END - HOUR_START) * 60)) * 100;
}

function endTimeLabel(g: GroupedApt) {
  return format(addMinutes(parseISO(g.scheduledAt), g.totalDuration), "HH:mm");
}

// ── Sub-components ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const c = statusCfg(status);
  return <Badge className={`text-xs ${c.badge}`}>{c.label}</Badge>;
}

/** Appointment detail side panel — works with a GroupedApt */
function DetailPanel({
  group,
  onClose,
  onStatusChange,
  busy,
}: {
  group: GroupedApt;
  onClose: () => void;
  onStatusChange: (ids: number[], status: string) => void;
  busy: boolean;
}) {
  const d = parseISO(group.scheduledAt);
  const endLabel = endTimeLabel(group);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
              {(group.user?.name ?? "K").charAt(0)}
            </div>
            <div>
              <p className="font-bold text-base leading-tight">{group.user?.name ?? "Klient"}</p>
              <StatusBadge status={group.status} />
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info rows */}
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Calendar className="w-4 h-4 shrink-0 text-primary" />
            <span>{format(d, "EEEE, dd MMMM yyyy", { locale: sq })}</span>
          </div>
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0 text-primary" />
            <span>
              {format(d, "HH:mm")} – {endLabel}
              <span className="ml-1.5 text-xs opacity-60">({group.totalDuration} min)</span>
            </span>
          </div>
          {/* Services list */}
          {group.services.length > 0 && (
            <div className="flex items-start gap-2.5 text-muted-foreground">
              <Scissors className="w-4 h-4 shrink-0 text-primary mt-0.5" />
              <div className="space-y-1">
                {group.services.map((s, i) => (
                  <p key={i}>
                    {s.name ?? "Shërbim"}
                    {s.duration ? <span className="opacity-50 ml-1 text-xs">({s.duration} min)</span> : null}
                  </p>
                ))}
              </div>
            </div>
          )}
          {group.user?.phone && (
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <User className="w-4 h-4 shrink-0 text-primary" />
              <span>{group.user.phone}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {["confirmed", "pending_otp"].includes(group.status) && (
          <div className="flex gap-2 pt-1">
            {group.status === "confirmed" && (
              <Button
                size="sm"
                className="flex-1 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={busy}
                onClick={() => onStatusChange(group.ids, "completed")}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Përfundo
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="flex-1 rounded-xl text-xs text-red-500 border-red-300 hover:bg-red-50"
              disabled={busy}
              onClick={() => onStatusChange(group.ids, "no_show")}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" /> Nuk erdhi
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Month view ─────────────────────────────────────────────────────────
function MonthView({
  current,
  groups,
  onSelectDay,
  onSelectGroup,
}: {
  current: Date;
  groups: GroupedApt[];
  onSelectDay: (d: Date) => void;
  onSelectGroup: (g: GroupedApt) => void;
}) {
  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(current), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(current), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    const ws: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) ws.push(days.slice(i, i + 7));
    return ws;
  }, [current]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Day name header */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_NAMES_SHORT.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-bold text-muted-foreground uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="flex-1 grid" style={{ gridTemplateRows: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-border last:border-0">
            {week.map((day) => {
              const dayGroups = groupsForDay(groups, day);
              const inMonth = isSameMonth(day, current);
              const today = isToday(day);
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => onSelectDay(day)}
                  className={`border-r border-border last:border-0 p-1.5 cursor-pointer hover:bg-secondary/50 transition-colors min-h-[90px] flex flex-col gap-1 ${
                    !inMonth ? "opacity-35" : ""
                  }`}
                >
                  <div className="flex justify-end">
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${today ? "bg-primary text-white" : "text-foreground"}`}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 min-h-0">
                    {dayGroups.slice(0, 3).map((g) => {
                      const cfg = statusCfg(g.status);
                      return (
                        <div
                          key={g.id}
                          onClick={(e) => { e.stopPropagation(); onSelectGroup(g); }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 cursor-pointer transition-colors"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                          <span className="text-[10px] font-semibold truncate leading-tight">
                            {format(parseISO(g.scheduledAt), "HH:mm")} {g.user?.name ?? "Klient"}
                          </span>
                        </div>
                      );
                    })}
                    {dayGroups.length > 3 && (
                      <div className="text-[10px] font-bold text-muted-foreground px-1.5">
                        +{dayGroups.length - 3} të tjera
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Week view ──────────────────────────────────────────────────────────
function WeekView({
  current,
  groups,
  onSelectGroup,
}: {
  current: Date;
  groups: GroupedApt[];
  onSelectGroup: (g: GroupedApt) => void;
}) {
  const days = useMemo(
    () => eachDayOfInterval({
      start: startOfWeek(current, { weekStartsOn: 1 }),
      end: endOfWeek(current, { weekStartsOn: 1 }),
    }),
    [current],
  );

  const hours = useMemo(
    () =>
      eachHourOfInterval({
        start: setHours(setMinutes(startOfDay(current), 0), HOUR_START),
        end: setHours(setMinutes(startOfDay(current), 0), HOUR_END - 1),
      }),
    [current],
  );

  const totalHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="shrink-0 w-14 border-r border-border flex flex-col pt-10 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {hours.map((h) => (
          <div key={h.toISOString()} className="shrink-0 text-right pr-2 text-xs text-muted-foreground font-medium" style={{ height: HOUR_HEIGHT }}>
            {format(h, "HH:mm")}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {/* Day headers */}
        <div className="sticky top-0 z-10 grid bg-card border-b border-border" style={{ gridTemplateColumns: `repeat(7, minmax(0, 1fr))` }}>
          {days.map((d, i) => (
            <div key={i} className={`py-2 text-center border-r border-border last:border-0 ${isToday(d) ? "bg-primary/5" : ""}`}>
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">{DAY_NAMES_SHORT[i]}</p>
              <p className={`text-sm font-bold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${isToday(d) ? "bg-primary text-white" : ""}`}>
                {format(d, "d")}
              </p>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="relative grid" style={{ gridTemplateColumns: `repeat(7, minmax(0, 1fr))`, height: totalHeight }}>
          {hours.map((h, hi) => (
            <div key={h.toISOString()} className="absolute left-0 right-0 border-t border-border/50" style={{ top: hi * HOUR_HEIGHT }} />
          ))}
          {days.map((day, di) => {
            const dayGroups = groupsForDay(groups, day).filter(
              (g) => getHours(parseISO(g.scheduledAt)) >= HOUR_START && getHours(parseISO(g.scheduledAt)) < HOUR_END,
            );
            return (
              <div key={di} className={`relative border-r border-border last:border-0 ${isToday(day) ? "bg-primary/[0.025]" : ""}`}>
                {dayGroups.map((g) => {
                  const topPx = groupTopPercent(g) * totalHeight / 100;
                  const heightPx = Math.max(groupHeightPercent(g) * totalHeight / 100, 24);
                  return (
                    <div
                      key={g.id}
                      onClick={() => onSelectGroup(g)}
                      className="absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 cursor-pointer overflow-hidden bg-primary hover:brightness-110 transition-all shadow-sm"
                      style={{ top: topPx, height: heightPx }}
                    >
                      <p className="text-[10px] font-bold leading-tight truncate text-white">
                        {format(parseISO(g.scheduledAt), "HH:mm")} – {endTimeLabel(g)}
                      </p>
                      <p className="text-[10px] leading-tight truncate text-white/80">
                        {g.user?.name ?? "Klient"}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Day view ───────────────────────────────────────────────────────────
function DayView({
  current,
  groups,
  onSelectGroup,
}: {
  current: Date;
  groups: GroupedApt[];
  onSelectGroup: (g: GroupedApt) => void;
}) {
  const hours = useMemo(
    () =>
      eachHourOfInterval({
        start: setHours(setMinutes(startOfDay(current), 0), HOUR_START),
        end: setHours(setMinutes(startOfDay(current), 0), HOUR_END - 1),
      }),
    [current],
  );

  const dayGroups = groupsForDay(groups, current).filter(
    (g) => getHours(parseISO(g.scheduledAt)) >= HOUR_START && getHours(parseISO(g.scheduledAt)) < HOUR_END,
  );

  const totalHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT;

  return (
    <div className="flex flex-1 min-h-0 overflow-auto">
      <div className="shrink-0 w-14 flex flex-col border-r border-border">
        {hours.map((h) => (
          <div key={h.toISOString()} className="shrink-0 text-right pr-2 text-xs text-muted-foreground font-medium" style={{ height: HOUR_HEIGHT }}>
            {format(h, "HH:mm")}
          </div>
        ))}
      </div>

      <div className="flex-1 relative" style={{ height: totalHeight }}>
        {hours.map((_, hi) => (
          <div key={hi} className="absolute left-0 right-0 border-t border-border/50" style={{ top: hi * HOUR_HEIGHT }} />
        ))}
        {dayGroups.map((g) => {
          const topPx = groupTopPercent(g) * totalHeight / 100;
          const heightPx = Math.max(groupHeightPercent(g) * totalHeight / 100, 36);
          return (
            <div
              key={g.id}
              onClick={() => onSelectGroup(g)}
              className="absolute left-2 right-2 rounded-xl px-3 py-2 cursor-pointer bg-primary hover:brightness-110 transition-all shadow-md"
              style={{ top: topPx, height: heightPx }}
            >
              <p className="text-sm font-bold text-white leading-tight truncate">
                {format(parseISO(g.scheduledAt), "HH:mm")} – {endTimeLabel(g)}
              </p>
              <p className="text-xs text-white/80 truncate mt-0.5">
                {g.user?.name ?? "Klient"}
              </p>
              {g.serviceLabel && heightPx > 52 && (
                <p className="text-[10px] text-white/60 truncate mt-0.5">{g.serviceLabel}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────
export default function BarberAppointments() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [view, setView] = useState<ViewMode>("week");
  const [current, setCurrent] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState<GroupedApt | null>(null);

  const { data: apptRes, isLoading, refetch } = useListAppointments(
    { limit: 200 },
    { query: { enabled: !!user } as any },
  );
  const updateMutation = useUpdateAppointment();

  const apts: Apt[] = useMemo(() => {
    const raw = Array.isArray(apptRes) ? apptRes : (apptRes as any)?.data ?? [];
    return raw;
  }, [apptRes]);

  const groups = useMemo(() => groupApts(apts), [apts]);

  // Navigation
  const goBack = () => {
    if (view === "month") setCurrent((d) => subMonths(d, 1));
    else if (view === "week") setCurrent((d) => subWeeks(d, 1));
    else setCurrent((d) => subDays(d, 1));
  };
  const goForward = () => {
    if (view === "month") setCurrent((d) => addMonths(d, 1));
    else if (view === "week") setCurrent((d) => addWeeks(d, 1));
    else setCurrent((d) => addDays(d, 1));
  };

  const periodLabel = useMemo(() => {
    if (view === "month") return format(current, "MMMM yyyy", { locale: sq });
    if (view === "week") {
      const s = startOfWeek(current, { weekStartsOn: 1 });
      const e = endOfWeek(current, { weekStartsOn: 1 });
      return `${format(s, "dd MMM")} – ${format(e, "dd MMM yyyy", { locale: sq })}`;
    }
    return format(current, "EEEE, dd MMMM yyyy", { locale: sq });
  }, [view, current]);

  // Update all appointments in the group at once
  const handleStatusChange = async (ids: number[], status: string) => {
    try {
      await Promise.all(
        ids.map((id) => updateMutation.mutateAsync({ id, data: { status: status as any } }))
      );
      toast({ title: "Statusi u përditësua" });
      setSelectedGroup(null);
      refetch();
    } catch {
      toast({ variant: "destructive", title: "Gabim", description: "Nuk u përditësua statusi" });
    }
  };

  const todayCount = groupsForDay(groups, new Date()).filter(
    (g) => ["confirmed", "pending_otp"].includes(g.status),
  ).length;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-0 -m-4 md:-m-8">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 md:px-8 py-4 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => { setCurrent(new Date()); setView("day"); }}
          >
            Sot
            {todayCount > 0 && (
              <span className="ml-1.5 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {todayCount}
              </span>
            )}
          </Button>
          <div className="flex items-center">
            <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="min-w-[180px] text-center text-sm font-bold capitalize px-2">
              {periodLabel}
            </span>
            <button onClick={goForward} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-secondary/50 p-1 self-start sm:self-auto">
          {(["month", "week", "day"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors capitalize ${
                view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "month" ? "Muaji" : v === "week" ? "Java" : "Dita"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Calendar body ── */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="space-y-3 w-full max-w-lg px-8">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
          {view === "month" && (
            <MonthView
              current={current}
              groups={groups}
              onSelectDay={(d) => { setCurrent(d); setView("day"); }}
              onSelectGroup={setSelectedGroup}
            />
          )}
          {view === "week" && (
            <WeekView current={current} groups={groups} onSelectGroup={setSelectedGroup} />
          )}
          {view === "day" && (
            <DayView current={current} groups={groups} onSelectGroup={setSelectedGroup} />
          )}
        </div>
      )}

      {/* ── Detail panel ── */}
      {selectedGroup && (
        <DetailPanel
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onStatusChange={handleStatusChange}
          busy={updateMutation.isPending}
        />
      )}
    </div>
  );
}
