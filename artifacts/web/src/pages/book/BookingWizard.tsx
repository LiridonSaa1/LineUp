import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { 
  useGetBarbershop, getGetBarbershopQueryKey, 
  useListBarbers, 
  useListServices,
  useGetAvailableSlots,
  useCreateAppointment
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Clock, Scissors, Calendar, CheckCircle2 } from "lucide-react";
import { format, addDays, startOfToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function BookingWizard() {
  const [, params] = useRoute("/book/:shopId");
  const shopId = params?.shopId ? parseInt(params.shopId) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  
  const today = startOfToday();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { data: shop } = useGetBarbershop(shopId, {
    query: { enabled: !!shopId, queryKey: getGetBarbershopQueryKey(shopId) }
  });
  const { data: barbersRes, isLoading: barbersLoading } = useListBarbers({ shopId });
  const { data: servicesRes, isLoading: servicesLoading } = useListServices({ shopId });
  
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const { data: slotsRes, isLoading: slotsLoading } = useGetAvailableSlots(
    { shopId, barberId: selectedBarberId || 0, date: formattedDate },
    { query: { enabled: !!shopId && !!selectedBarberId && step === 2 } }
  );

  const createAppointment = useCreateAppointment();

  const handleNextStep1 = () => {
    if (selectedBarberId && selectedServiceId) {
      setStep(2);
    }
  };

  const handleNextStep2 = () => {
    if (selectedSlot) {
      setStep(3);
    }
  };

  const handleConfirm = async () => {
    if (!selectedBarberId || !selectedServiceId || !selectedSlot) return;
    
    try {
      // scheduledAt format expects ISO string or similar, combining date + slot
      // Basic format for API: "2024-05-15T14:30:00Z"
      const scheduledAt = `${formattedDate}T${selectedSlot}:00Z`;
      
      const res = await createAppointment.mutateAsync({
        data: {
          shopId,
          barberId: selectedBarberId,
          serviceId: selectedServiceId,
          scheduledAt
        }
      });
      
      toast({
        title: "Appointment requested!",
        description: "Please check your appointments list for status.",
      });
      setLocation("/appointments");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Booking failed",
        description: error.message || "Failed to create appointment.",
      });
    }
  };

  if (!shopId) return <div>Invalid shop</div>;

  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const selectedBarber = barbersRes?.data.find(b => b.id === selectedBarberId);
  const selectedService = servicesRes?.data.find(s => s.id === selectedServiceId);

  return (
    <div className="bg-background min-h-[calc(100vh-64px)] py-8 px-4">
      <div className="container max-w-3xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => step > 1 ? setStep(step - 1) : setLocation(`/barbershops/${shopId}`)} className="mb-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold tracking-tight">Book Appointment</h1>
            <div className="text-sm font-medium text-muted-foreground">{shop?.name}</div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1">
                <div className={`h-2 rounded-full ${step >= i ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`text-xs mt-2 font-medium ${step >= i ? 'text-primary' : 'text-muted-foreground'}`}>
                  {i === 1 ? 'Service & Barber' : i === 2 ? 'Date & Time' : 'Confirm'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border shadow-xl rounded-3xl p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Scissors className="w-5 h-5 text-primary" /> Select Service</h3>
                {servicesLoading ? <Skeleton className="h-24 w-full" /> : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {servicesRes?.data.map(service => (
                      <Card 
                        key={service.id} 
                        className={`p-4 cursor-pointer transition-all ${selectedServiceId === service.id ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:border-primary/50'}`}
                        onClick={() => setSelectedServiceId(service.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold">{service.name}</div>
                          <div className="font-bold text-primary">€{service.price}</div>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {service.durationMinutes} min
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Scissors className="w-5 h-5 text-primary" /> Select Barber</h3>
                {barbersLoading ? <Skeleton className="h-24 w-full" /> : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {barbersRes?.data.filter(b => b.isActive).map(barber => (
                      <Card 
                        key={barber.id} 
                        className={`p-4 cursor-pointer transition-all flex items-center gap-4 ${selectedBarberId === barber.id ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:border-primary/50'}`}
                        onClick={() => setSelectedBarberId(barber.id)}
                      >
                        <Avatar className="h-12 w-12 border border-primary/20">
                          <AvatarImage src={barber.avatarUrl || undefined} />
                          <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold">{barber.name}</div>
                          {barber.specialties && <div className="text-xs text-muted-foreground mt-0.5">{barber.specialties}</div>}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                className="w-full h-14 text-lg font-bold rounded-xl mt-8" 
                disabled={!selectedBarberId || !selectedServiceId}
                onClick={handleNextStep1}
              >
                Continue to Date & Time
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Select Date</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {dates.map((date, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl min-w-[80px] shrink-0 border transition-all ${
                        formattedDate === format(date, 'yyyy-MM-dd') 
                          ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <span className="text-xs font-medium opacity-80">{format(date, 'EEE')}</span>
                      <span className="text-xl font-bold mt-1">{format(date, 'd')}</span>
                      <span className="text-xs mt-0.5 opacity-80">{format(date, 'MMM')}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Select Time</h3>
                {slotsLoading ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                ) : !slotsRes?.slots || slotsRes.slots.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground">
                    No available slots for this date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {slotsRes.slots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 rounded-xl font-medium text-sm border transition-all ${
                          selectedSlot === slot 
                            ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' 
                            : 'border-border bg-card hover:border-primary/50 hover:bg-secondary/50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                className="w-full h-14 text-lg font-bold rounded-xl mt-8" 
                disabled={!selectedSlot}
                onClick={handleNextStep2}
              >
                Review Booking
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Review Details</h3>
                <p className="text-muted-foreground">Please confirm your appointment details.</p>
              </div>

              <div className="bg-secondary/30 rounded-2xl p-6 border border-border space-y-6">
                <div className="flex justify-between items-center pb-6 border-b border-border/50">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Service</div>
                    <div className="font-bold text-lg">{selectedService?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Price</div>
                    <div className="font-bold text-lg text-primary">€{selectedService?.price}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-6 border-b border-border/50">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Barber</div>
                    <div className="font-bold text-lg">{selectedBarber?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Duration</div>
                    <div className="font-bold text-lg">{selectedService?.durationMinutes} min</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Date & Time</div>
                    <div className="font-bold text-lg">{format(selectedDate, 'MMMM d, yyyy')} at {selectedSlot}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Location</div>
                    <div className="font-bold text-lg">{shop?.city}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted text-sm text-muted-foreground rounded-xl text-center border border-border">
                You will receive a confirmation shortly after booking.
              </div>

              <Button 
                className="w-full h-14 text-lg font-bold rounded-xl mt-4" 
                onClick={handleConfirm}
                disabled={createAppointment.isPending}
              >
                {createAppointment.isPending ? "Confirming..." : "Confirm Booking"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
