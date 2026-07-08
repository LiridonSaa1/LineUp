import { useState } from "react";
import { useListAppointments, useUpdateAppointment } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useOwnerShop } from "@/hooks/use-owner-shop";

export default function DashboardAppointments() {
  const { data: ownerShop, isLoading: shopLoading } = useOwnerShop();
  const shopId = ownerShop?.id ?? 0;
  const [status, setStatus] = useState<string>("all");
  
  const { data: appointmentsRes, isLoading, refetch } = useListAppointments({ 
    shopId,
    status: status !== "all" ? status : undefined,
    limit: 50 
  }, {
    query: { enabled: !!ownerShop } as any,
  });
  
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
        <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
        <div className="w-48">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Appointments</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending_otp">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Barber</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shopLoading || isLoading ? (
              <TableRow><TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
            ) : !appointmentsRes?.data.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No appointments found.</TableCell>
              </TableRow>
            ) : (
              appointmentsRes.data.map(apt => (
                <TableRow key={apt.id}>
                  <TableCell className="font-medium">{apt.user?.name}</TableCell>
                  <TableCell>{apt.service?.name}</TableCell>
                  <TableCell>{apt.barber?.name}</TableCell>
                  <TableCell>{format(new Date(apt.scheduledAt), "MMM d, h:mm a")}</TableCell>
                  <TableCell>{getStatusBadge(apt.status)}</TableCell>
                  <TableCell className="text-right">
                    {['confirmed', 'pending_otp'].includes(apt.status) && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(apt.id, "completed")}>Complete</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(apt.id, "no_show")}>No Show</Button>
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
