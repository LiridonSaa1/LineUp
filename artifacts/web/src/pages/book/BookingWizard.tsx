import { useState } from "react";
import { useRoute, useLocation } from "wouter";
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
import { ArrowLeft, Clock, Scissors, Calendar, CheckCircle2, MapPin, Star, Check } from "lucide-react";
import { format, addDays, startOfToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Shown when a barbershop has no imageUrl yet, so the booking header never looks empty.
const FALLBACK_SHOP_IMAGE =
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80";

export default function BookingWizard() {
  const [, params] = useRoute("/book/:shopId");
  const shopId = params?.shopId ? parseInt(params.shopId) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

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
    if (selectedBarberId && selectedServiceIds.length > 0) setStep(2);
  };

  const handleNextStep2 = () => {
    if (selectedSlot) setStep(3);
  };

  const toggleService = (serviceId: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleConfirm = async () => {
    if (!selectedBarberId || selectedServiceIds.length === 0 || !selectedSlot) return;

    try {
      const [hours, minutes] = selectedSlot.split(':').map(Number);
      let cursorMinutes = hours * 60 + minutes;

      // Backend appointments are one-service-each, so back-to-back slots are booked sequentially for every selected service.
      for (const service of selectedServices) {
        const slotHours = Math.floor(cursorMinutes / 60);
        const slotMins = cursorMinutes % 60;
        const scheduledAt = `${formattedDate}T${String(slotHours).padStart(2, '0')}:${String(slotMins).padStart(2, '0')}:00Z`;

        await createAppointment.mutateAsync({
          data: {
            shopId,
            barberId: selectedBarberId,
            serviceId: service.id,
            scheduledAt
          }
        });

        cursorMinutes += service.durationMinutes;
      }

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
  const selectedServices: any[] = servicesList.filter((s: any) => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum: number, s: any) => sum + Number(s.price), 0);
  const totalDuration = selectedServices.reduce((sum: number, s: any) => sum + Number(s.durationMinutes), 0);

  const stepLabels = ['Shërbimi & Berberi', 'Data & Ora', 'Konfirmo'];

  return (
    <div className="bg-background min-h-screen pb-8">
      {/* Dark hero with a large, sharp shop photo — matches /barbershops so the floating nav stays readable at the top */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 pb-24 pt-32 px-4">
        <img
          src={shop?.imageUrl || FALLBACK_SHOP_IMAGE}
          alt={shop?.name ?? ""}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/75 to-zinc-900/50" />
        <div className="container relative z-10 max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step > 1 ? setStep(step - 1) : setLocation(`/barbershops/${shopId}`)}
            className="mb-4 text-white/70 hover:bg-white/10 hover:text-white rounded-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Kthehu
          </Button>

          <div className="flex items-center gap-2 mb-3 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80 w-fit backdrop-blur-sm">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Rezervim online
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Rezervo Takim</h1>
          {shop && (
            <div className="mt-3 flex items-center gap-2 text-sm font-medium text-white/80">
              <span className="font-bold text-white">{shop.name}</span>
              {shop.rating != null && (
                <span className="flex items-center gap-0.5 text-primary">
                  <Star className="h-3.5 w-3.5 fill-primary" />
                  {Number(shop.rating).toFixed(1)}
                </span>
              )}
              {shop.address && (
                <span className="flex items-center gap-1 truncate text-white/60">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {shop.address}, {shop.city}
                </span>
              )}
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-8 flex items-center gap-2">
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

      <div className="container max-w-3xl mx-auto px-4 -mt-16 relative z-10">
        {/* Shop photo card, floating over the hero, gives the booking flow a clear visual anchor */}
        {shop && (
          <div className="mb-4 flex items-center gap-4 rounded-3xl border border-border bg-card p-3 shadow-xl">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
              <img src={shop.imageUrl || FALLBACK_SHOP_IMAGE} alt={shop.name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-extrabold">{shop.name}</div>
              <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                {shop.address}, {shop.city}
              </div>
            </div>
          </div>
        )}
        <div className="bg-card border border-border shadow-xl rounded-3xl p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-primary" /> Zgjidhni Berberin
                </h3>
                {barbersLoading ? <Skeleton className="h-24 w-full" /> : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {barbersList.filter((b: any) => b.isActive).map((barber: any) => {
                      const selected = selectedBarberId === barber.id;
                      return (
                        <Card
                          key={barber.id}
                          className={`relative p-4 cursor-pointer transition-all rounded-2xl flex items-center gap-4 ${selected ? 'border-primary ring-1 ring-primary bg-primary/5 shadow-md shadow-primary/10' : 'hover:border-primary/50 hover:shadow-md'}`}
                          onClick={() => setSelectedBarberId(barber.id)}
                        >
                          {selected && (
                            <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                          <Avatar className="h-12 w-12 border border-primary/20">
                            <AvatarImage src={barber.avatarUrl || undefined} />
                            <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 pr-4">
                            <div className="font-bold truncate">{barber.name}</div>
                            {barber.specialties && <div className="text-xs text-muted-foreground mt-0.5 truncate">{barber.specialties}</div>}
                            {barber.rating != null && (
                              <div className="mt-1 flex items-center gap-0.5 text-xs font-bold text-primary">
                                <Star className="h-3 w-3 fill-primary" /> {Number(barber.rating).toFixed(1)}
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedBarberId && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-primary" /> Zgjidhni Shërbimin
                    </h3>
                    <span className="text-xs font-medium text-muted-foreground">Mund të zgjidhni disa</span>
                  </div>
                  {servicesLoading ? <Skeleton className="h-24 w-full" /> : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {servicesList.map((service: any) => {
                        const selected = selectedServiceIds.includes(service.id);
                        return (
                          <Card
                            key={service.id}
                            className={`relative p-4 cursor-pointer transition-all rounded-2xl ${selected ? 'border-primary ring-1 ring-primary bg-primary/5 shadow-md shadow-primary/10' : 'hover:border-primary/50 hover:shadow-md'}`}
                            onClick={() => toggleService(service.id)}
                          >
                            <div className="flex justify-between items-start mb-2 pr-2">
                              <div className="font-bold">{service.name}</div>
                              <div
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}
                              >
                                {selected && <Check className="h-3.5 w-3.5" />}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {service.durationMinutes} min
                              </div>
                              <div className="font-extrabold text-primary">€{service.price}</div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {selectedServices.length > 0 && (
                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        {selectedServices.length} {selectedServices.length === 1 ? 'shërbim' : 'shërbime'} · {totalDuration} min
                      </div>
                      <div className="font-extrabold text-primary">€{totalPrice}</div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <Button
                  variant="outline"
                  className="h-14 rounded-full px-6 font-bold"
                  onClick={() => setLocation(`/barbershops/${shopId}`)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Kthehu
                </Button>
                <Button
                  className="flex-1 h-14 text-base font-bold rounded-full"
                  disabled={!selectedBarberId || selectedServiceIds.length === 0}
                  onClick={handleNextStep1}
                >
                  Vazhdo te Data & Ora
                </Button>
              </div>
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

              <div className="flex gap-3 mt-8">
                <Button
                  variant="outline"
                  className="h-14 rounded-full px-6 font-bold"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Kthehu
                </Button>
                <Button
                  className="flex-1 h-14 text-base font-bold rounded-full"
                  disabled={!selectedSlot}
                  onClick={handleNextStep2}
                >
                  Shiko Rezervimin
                </Button>
              </div>
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
                <div className="pb-6 border-b border-border/50">
                  <div className="text-sm text-muted-foreground mb-3">
                    Shërbimet ({selectedServices.length})
                  </div>
                  <div className="space-y-2">
                    {selectedServices.map((service: any) => (
                      <div key={service.id} className="flex justify-between items-center">
                        <div className="font-bold">{service.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {service.durationMinutes} min · <span className="font-bold text-primary">€{service.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50">
                    <div className="font-bold">Totali</div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-primary">€{totalPrice}</div>
                      <div className="text-xs text-muted-foreground">{totalDuration} min gjithsej</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-6 border-b border-border/50">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Berberi</div>
                    <div className="font-bold text-lg">{selectedBarber?.name}</div>
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

              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  className="h-14 rounded-full px-6 font-bold"
                  onClick={() => setStep(2)}
                  disabled={createAppointment.isPending}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Kthehu
                </Button>
                <Button
                  className="flex-1 h-14 text-base font-bold rounded-full"
                  onClick={handleConfirm}
                  disabled={createAppointment.isPending}
                >
                  {createAppointment.isPending ? "Duke konfirmuar..." : "Konfirmo Rezervimin"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
