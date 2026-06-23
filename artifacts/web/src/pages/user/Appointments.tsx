import { Link } from "wouter";
import { useListAppointments, useCancelAppointment } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Appointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: appointmentsRes, isLoading, refetch } = useListAppointments({ userId: user?.id, limit: 50 });
  const cancelMutation = useCancelAppointment();

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await cancelMutation.mutateAsync({ id });
      toast({ title: "Appointment cancelled" });
      refetch();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to cancel", description: error.message });
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'confirmed': return <Badge className="bg-primary hover:bg-primary">Confirmed</Badge>;
      case 'pending_otp': return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pending</Badge>;
      case 'completed': return <Badge variant="secondary">Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      case 'no_show': return <Badge variant="destructive">No Show</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">My Appointments</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : !appointmentsRes?.data || appointmentsRes.data.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center flex flex-col items-center shadow-xl">
          <Calendar className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No appointments yet</h2>
          <p className="text-muted-foreground mb-6">You haven't booked any haircuts yet.</p>
          <Button asChild size="lg" className="rounded-xl">
            <Link href="/barbershops">Find a Barber</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {appointmentsRes.data.map(apt => {
            const date = parseISO(apt.scheduledAt);
            const isUpcoming = ['confirmed', 'pending_otp'].includes(apt.status);
            
            return (
              <div key={apt.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row gap-6 shadow-md hover:border-primary/30 transition-colors">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xl">{apt.service?.name || "Service"}</h3>
                    {getStatusBadge(apt.status)}
                  </div>
                  
                  <div className="space-y-2 text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      {format(date, 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      {format(date, 'h:mm a')}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      {apt.barbershop?.name} - {apt.barber?.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 md:w-32 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                  <div className="text-2xl font-bold text-primary">€{apt.totalPrice || apt.service?.price}</div>
                  
                  {isUpcoming && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleCancel(apt.id)}
                      disabled={cancelMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-2" /> Cancel
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
