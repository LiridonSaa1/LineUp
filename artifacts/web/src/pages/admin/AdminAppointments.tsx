import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Search, CheckCircle2, XCircle, Clock, User, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function AdminAppointments() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ["supa-admin-appointments"],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("appointments")
          .select("*, users(name, phone, email), barbershops(name, city)")
          .order("id", { ascending: false });
        return data || [];
      } catch (e) {
        console.error("Error fetching appointments:", e);
        return [];
      }
    }
  });

  const handleUpdateStatus = async (apptId: number | string, newStatus: string) => {
    try {
      await supabase.from("appointments").update({ status: newStatus }).eq("id", apptId);
      toast({
        title: "Takimi u përditësua!",
        description: `Statusi tani është "${newStatus.toUpperCase()}".`
      });
      refetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Dështoi ndryshimi i statusit të takimit." });
    }
  };

  const filteredAppointments = appointments.filter((app: any) =>
    (app.users?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.users?.phone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.barbershops?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.service_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "confirmed":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">KONFIRMUAR</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/40 font-bold">PËRFUNDUAR</Badge>;
      case "cancelled":
      case "canceled":
        return <Badge variant="destructive">ANULUAR</Badge>;
      default:
        return <Badge variant="outline" className="text-amber-500 border-amber-500/60 font-bold">NË PRITJE</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Takimet & Rezervimet Globale</h1>
          <p className="text-muted-foreground">Monitorimi dhe menaxhimi i të gjitha rezervimeve në platformën LineUP.</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 text-xs font-bold">
          {filteredAppointments.length} Rezervime në total
        </Badge>
      </div>

      {/* Filter Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Kërko klientin, berberinë ose shërbimin..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Klienti</TableHead>
              <TableHead>Salloni & Shërbimi</TableHead>
              <TableHead>Data & Ora</TableHead>
              <TableHead>Çmimi</TableHead>
              <TableHead>Statusi</TableHead>
              <TableHead className="text-right">Veprimet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
            ) : !filteredAppointments.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Nuk u gjet asnjë rezervim në bazën e të dhënave.
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map((app: any) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="font-bold text-foreground">{app.users?.name || "Klient i LineUp"}</div>
                        <div className="text-xs text-muted-foreground font-mono">{app.users?.phone || "N/A"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-primary" />
                        {app.barbershops?.name || "Barbershop"}
                      </div>
                      <div className="text-xs text-muted-foreground">{app.service_name || "Qethje & Stilim"}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold">{app.date || "Sot"}</div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {app.time || app.start_time || "12:00"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-emerald-500 text-xs">
                    €{app.price || 15}
                  </TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {app.status !== "completed" && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs font-bold"
                          onClick={() => handleUpdateStatus(app.id, "completed")}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Përfundo
                        </Button>
                      )}
                      {app.status !== "cancelled" && app.status !== "canceled" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 text-xs font-bold"
                          onClick={() => handleUpdateStatus(app.id, "cancelled")}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Anulo
                        </Button>
                      )}
                    </div>
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
