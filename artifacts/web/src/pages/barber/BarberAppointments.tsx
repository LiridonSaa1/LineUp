import { useState } from "react";
import { useListAppointments, useUpdateAppointment } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, User, CheckCircle, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Konfirmuar", color: "bg-primary hover:bg-primary text-white" },
  pending_otp: { label: "Në pritje", color: "outline text-yellow-600 border-yellow-500" },
  completed: { label: "Përfunduar", color: "secondary" },
  cancelled: { label: "Anuluar", color: "destructive" },
  no_show: { label: "Nuk u paraqit", color: "destructive" },
};

export default function BarberAppointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: apptRes, isLoading, refetch } = useListAppointments(
    { limit: 100, status: statusFilter !== "all" ? statusFilter : undefined },
    { query: { enabled: !!user } }
  );
  const updateMutation = useUpdateAppointment();

  const appointments = Array.isArray(apptRes) ? apptRes : apptRes?.data ?? [];

  const handleStatus = async (id: number, status: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status: status as any } });
      toast({ title: "Statusi u përditësua" });
      refetch();
    } catch {
      toast({ variant: "destructive", title: "Gabim", description: "Nuk u përditësua statusi" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Takimet e Mia</h1>
          <p className="text-muted-foreground mt-1">Menaxhoni dhe përditësoni takimet tuaja</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 rounded-xl">
            <SelectValue placeholder="Të gjitha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Të gjitha</SelectItem>
            <SelectItem value="confirmed">Konfirmuara</SelectItem>
            <SelectItem value="pending_otp">Në pritje</SelectItem>
            <SelectItem value="completed">Përfunduara</SelectItem>
            <SelectItem value="cancelled">Anuluara</SelectItem>
            <SelectItem value="no_show">Nuk u paraqit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl">
          <Calendar className="w-14 h-14 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-lg font-semibold">Nuk ka takime</p>
          <p className="text-muted-foreground text-sm">Nuk u gjetën takime me këtë filtër.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments
            .sort((a: typeof appointments[number], b: typeof appointments[number]) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
            .map((apt: typeof appointments[number]) => {
              const s = STATUS_LABELS[apt.status] ?? { label: apt.status, color: "outline" };
              const date = parseISO(apt.scheduledAt);
              return (
                <div key={apt.id} className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {((apt as any).user?.name ?? "K").charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{(apt as any).user?.name ?? "Klient"}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />{format(date, "dd MMM yyyy")}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />{format(date, "HH:mm")}
                        </span>
                        {(apt as any).service?.name && (
                          <span className="text-xs text-muted-foreground">· {(apt as any).service.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={s.color}>{s.label}</Badge>
                    {apt.status === "confirmed" && (
                      <Button size="sm" variant="outline" className="rounded-xl text-xs h-7 px-2 text-emerald-600 border-emerald-500 hover:bg-emerald-50"
                        onClick={() => handleStatus(apt.id, "completed")}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Përfundo
                      </Button>
                    )}
                    {["confirmed", "pending_otp"].includes(apt.status) && (
                      <Button size="sm" variant="outline" className="rounded-xl text-xs h-7 px-2 text-red-500 border-red-300 hover:bg-red-50"
                        onClick={() => handleStatus(apt.id, "no_show")}>
                        <XCircle className="w-3 h-3 mr-1" /> Nuk erdhi
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
