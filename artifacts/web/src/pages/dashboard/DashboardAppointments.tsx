import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useListAppointments, useUpdateAppointment } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useOwnerShop } from "@/hooks/use-owner-shop";
import { supabase } from "@/lib/supabase";

export default function DashboardAppointments() {
  const { data: ownerShop, isLoading: shopLoading } = useOwnerShop();
  const shopId = ownerShop?.id ?? 0;
  const [status, setStatus] = useState<string>("all");
  
  const { data: appointmentsRes, isLoading: apiLoading, refetch } = useListAppointments({ 
    shopId,
    status: status !== "all" ? status : undefined,
    limit: 50 
  }, {
    query: { enabled: !!ownerShop } as any,
  });

  const { data: supaAppts, isLoading: supaLoading } = useQuery({
    queryKey: ["supa-appointments", shopId, status],
    queryFn: async () => {
      try {
        let q = supabase.from('appointments').select('*, users(name, phone, email)').eq('shop_id', shopId);
        if (status !== "all") {
          q = q.eq('status', status);
        }
        const { data } = await q.order('id', { ascending: false });
        if (data && data.length > 0) {
          return data.map((a: any) => ({
            id: a.id,
            status: a.status,
            scheduledAt: a.date ? `${a.date}T${a.time || '09:00:00'}` : new Date().toISOString(),
            user: { name: a.users?.name || a.user_name || "Klient i LineUp" },
            service: { name: a.service || "Shërbim i përgjithshëm" },
            barber: { name: a.barber_name || "Berber" }
          }));
        }
      } catch (e) {}
      return [];
    },
    enabled: !!shopId,
  });

  const rawApiAppts = Array.isArray(appointmentsRes?.data) ? appointmentsRes.data : [];
  const appointments = rawApiAppts.length > 0 ? rawApiAppts : (supaAppts || []);
  const isLoading = apiLoading && supaLoading;
  
  const updateMutation = useUpdateAppointment();

  const handleUpdateStatus = async (id: number, newStatus: any) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status: newStatus } });
      refetch();
    } catch (e) {
      // Handle error
    }
  };

  const getStatusBadge = (s: string) => {
    switch(s) {
      case 'confirmed': return <Badge className="bg-primary hover:bg-primary">Confirmed</Badge>;
      case 'pending_otp': return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pending</Badge>;
      case 'completed': return <Badge variant="secondary">Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      case 'no_show': return <Badge variant="destructive">No Show</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black tracking-tight">Rezervimet</h1>
        <div className="w-48">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Filtro sipas statusit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Të gjitha rezervimet</SelectItem>
              <SelectItem value="confirmed">Të konfirmuara</SelectItem>
              <SelectItem value="pending_otp">Në pritje (OTP)</SelectItem>
              <SelectItem value="completed">Të përfunduara</SelectItem>
              <SelectItem value="cancelled">Të anuluara</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-[32px] overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="font-black text-[11px] uppercase tracking-widest text-muted-foreground">Klienti</TableHead>
              <TableHead className="font-black text-[11px] uppercase tracking-widest text-muted-foreground">Shërbimi</TableHead>
              <TableHead className="font-black text-[11px] uppercase tracking-widest text-muted-foreground">Berberi</TableHead>
              <TableHead className="font-black text-[11px] uppercase tracking-widest text-muted-foreground">Data & Ora</TableHead>
              <TableHead className="font-black text-[11px] uppercase tracking-widest text-muted-foreground">Statusi</TableHead>
              <TableHead className="text-right font-black text-[11px] uppercase tracking-widest text-muted-foreground px-6">Veprimet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shopLoading || isLoading ? (
              <TableRow><TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
            ) : !appointments.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-bold">Nuk u gjet asnjë rezervim.</TableCell>
              </TableRow>
            ) : (
              appointments.map(apt => (
                <TableRow key={apt.id} className="hover:bg-secondary/20 transition-colors">
                  <TableCell className="font-bold text-foreground py-4">{apt.user?.name || "Klient"}</TableCell>
                  <TableCell className="font-medium text-muted-foreground">{apt.service?.name || "Shërbim"}</TableCell>
                  <TableCell className="font-medium text-muted-foreground">{apt.barber?.name || "-"}</TableCell>
                  <TableCell className="font-black text-foreground">{format(new Date(apt.scheduledAt || Date.now()), "dd MMM, HH:mm")}</TableCell>
                  <TableCell>{getStatusBadge(apt.status)}</TableCell>
                  <TableCell className="text-right px-6">
                    {['confirmed', 'pending_otp', 'pending'].includes(apt.status) && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="rounded-xl h-8 font-bold" onClick={() => handleUpdateStatus(apt.id, "completed")}>Përfundo</Button>
                        <Button size="sm" variant="destructive" className="rounded-xl h-8 font-bold" onClick={() => handleUpdateStatus(apt.id, "no_show")}>Nuk erdhi</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
