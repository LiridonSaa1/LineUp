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
  const { data: barbersRes, isLoading: barbersLoading } = useListBarbers(shopId, { query: { enabled: !!shopId } });
  const { data: servicesRes, isLoading: servicesLoading } = useListServices(shopId, { query: { enabled: !!shopId } });

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const { data: slotsRes, isLoading: slotsLoading } = useGetAvailableSlots(
    { shopId, barberId: selectedBarberId || 0, date: formattedDate },
    { query: { enabled: !!shopId && !!selectedBarberId && step === 2 } }
  );

  const createAppointment = useCreateAppointment();

  const handleNextStep1 = () => {
    if (selectedBarberId && selectedServiceId) setStep(2);
  };

  const handleNextStep2 = () => {
    if (selectedSlot) setStep(3);
  };

  const handleConfirm = async () => {
    if (!selectedBarberId || !selectedServiceId || !selectedSlot) return;

    try {
      const scheduledAt = `${formattedDate}T${selectedSlot}:00Z`;

      await createAppointment.mutateAsync({
        data: {
          shopId,
          barberId: selectedBarberId,
          serviceId: selectedServiceId,
          scheduledAt
        }
      });

      toast({
        title: "Takimi u kërkua!",
        description: "Kontrolloni listën e takimeve tuaja për statusin.",
      });
      setLocation("/appointments");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Rezervimi dështoi",
        description: error.message || "Nuk u krijua takimi.",
      });
    }
  };

  if (!shopId) return <div>Dyqani nuk u gjet</div>;

  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const barbersList = Array.isArray(barbersRes) ? barbersRes : (barbersRes as any)?.data ?? [];
  const servicesList = Array.isArray(servicesRes) ? servicesRes : (servicesRes as any)?.data ?? [];
  const selectedBarber = barbersList.find((b: any) => b.id === selectedBarberId);
  const selectedService = servicesList.find((s: any) => s.id === selectedServiceId);

  const stepLabels = ['Shërbimi & Berberi', 'Data & Ora', 'Konfirmo'];

  return (
    <div className="bg-background min-h-screen pb-8">
      {/* Dark hero — matches /barbershops so the floating nav stays readable at the top and collapses into its pill on scroll */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 pb-10 pt-32 px-4">
        {shop?.imageUrl && (
          <img
            src={shop.imageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/70 to-zinc-900/40" />
        <div className="container relative z-10 max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step > 1 ? setStep(step - 1) : setLocation(`/barbershops/${shopId}`)}
            className="mb-4 text-white/70 hover:bg-white/10 hover:text-white rounded-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Kthehu
          </Button>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-white">Rezervo Takim</h1>
            <div className="text-sm font-medium text-white/70">{shop?.name}</div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1">
                <div className={`h-1.5 rounded-full transition-all ${step >= i ? 'bg-primary' : 'bg-white/15'}`} />
                <div className={`text-xs mt-2 font-medium ${step >= i ? 'text-primary' : 'text-white/50'}`}>
                  {stepLabels[i - 1]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container max-w-3xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-card border border-border shadow-xl rounded-3xl p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-primary" /> Zgjidhni Shërbimin
                </h3>
                {servicesLoading ? <Skeleton className="h-24 w-full" /> : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {servicesList.map((service: any) => (
                      <Card
                        key={service.id}
                        className={`p-4 cursor-pointer transition-all rounded-2xl ${selectedServiceId === service.id ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:border-primary/50 hover:shadow-md'}`}
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
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-primary" /> Zgjidhni Berberin
                </h3>
                {barbersLoading ? <Skeleton className="h-24 w-full" /> : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {barbersList.filter((b: any) => b.isActive).map((barber: any) => (
                      <Card
                        key={barber.id}
                        className={`p-4 cursor-pointer transition-all rounded-2xl flex items-center gap-4 ${selectedBarberId === barber.id ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:border-primary/50 hover:shadow-md'}`}
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
                className="w-full h-14 text-base font-bold rounded-full mt-8"
                disabled={!selectedBarberId || !selectedServiceId}
                onClick={handleNextStep1}
              >
                Vazhdo te Data & Ora
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Zgjidhni Datën
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {dates.map((date, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl min-w-[80px] shrink-0 border transition-all ${
                        formattedDate === format(date, 'yyyy-MM-dd')
                          ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
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
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> Zgjidhni Orën
                </h3>
                {slotsLoading ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                ) : !slotsRes?.slots || slotsRes.slots.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-border rounded-2xl text-muted-foreground">
                    Nuk ka vende të disponueshme për këtë datë.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {slotsRes.slots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 rounded-2xl font-medium text-sm border transition-all ${
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
                className="w-full h-14 text-base font-bold rounded-full mt-8"
                disabled={!selectedSlot}
                onClick={handleNextStep2}
              >
                Shiko Rezervimin
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Shqyrto Detajet</h3>
                <p className="text-muted-foreground">Ju lutem konfirmoni detajet e takimit tuaj.</p>
              </div>

              <div className="bg-secondary/30 rounded-2xl p-6 border border-border space-y-6">
                <div className="flex justify-between items-center pb-6 border-b border-border/50">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Shërbimi</div>
                    <div className="font-bold text-lg">{selectedService?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Çmimi</div>
                    <div className="font-bold text-lg text-primary">€{selectedService?.price}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-6 border-b border-border/50">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Berberi</div>
                    <div className="font-bold text-lg">{selectedBarber?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Kohëzgjatja</div>
                    <div className="font-bold text-lg">{selectedService?.durationMinutes} min</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Data & Ora</div>
                    <div className="font-bold text-lg">{format(selectedDate, 'd MMMM yyyy')} në {selectedSlot}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Vendndodhja</div>
                    <div className="font-bold text-lg">{shop?.city}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted text-sm text-muted-foreground rounded-2xl text-center border border-border">
                Do të merrni një konfirmim menjëherë pas rezervimit.
              </div>

              <Button
                className="w-full h-14 text-base font-bold rounded-full mt-4"
                onClick={handleConfirm}
                disabled={createAppointment.isPending}
              >
                {createAppointment.isPending ? "Duke konfirmuar..." : "Konfirmo Rezervimin"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
