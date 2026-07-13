import { useEffect, useMemo, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  getGetBarbershopQueryKey,
  useCreateAppointment,
  useGetAvailableSlots,
  useGetBarbershop,
  useListBarbers,
  useListServices,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Scissors,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { addDays, format, startOfToday } from "date-fns";

interface HolidayItem {
  id: number;
  shopId: number;
  barberId?: number | null;
  date: string;
  reason?: string | null;
  isFullDay?: boolean;
  startTime?: string | null;
  endTime?: string | null;
}

async function fetchBookingHolidays(shopId: number): Promise<HolidayItem[]> {
  const response = await fetch(`/api/barbershops/${shopId}/holidays`);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

function getDateHoliday(date: string, barberId: number | null, holidays: HolidayItem[]) {
  return holidays.find((holiday) =>
    holiday.date === date &&
    holiday.isFullDay !== false &&
    (!holiday.barberId || (!!barberId && Number(holiday.barberId) === barberId))
  );
}

export default function BookingWizard() {
  const [, params] = useRoute("/book/:shopId");
  const shopId = params?.shopId ? Number(params.shopId) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const today = startOfToday();
  const dates = useMemo(() => Array.from({ length: 21 }, (_, i) => addDays(today, i)), [today]);
  const datesScrollerRef = useRef<HTMLDivElement | null>(null);

  const [selectedBarberId, setSelectedBarberId] = useState<number | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  const { data: shop, isLoading: shopLoading } = useGetBarbershop(shopId, {
    query: { enabled: !!shopId, queryKey: getGetBarbershopQueryKey(shopId) } as any,
  });
  const { data: barbersRes, isLoading: barbersLoading } = useListBarbers(shopId);
  const { data: servicesRes, isLoading: servicesLoading } = useListServices(shopId);
  const { data: holidays = [] } = useQuery({
    queryKey: ["booking-holidays", shopId],
    queryFn: () => fetchBookingHolidays(shopId),
    enabled: !!shopId,
  });
  const selectedDayHoliday = getDateHoliday(formattedDate, selectedBarberId, holidays);
  const selectedDayBlocked = !!selectedDayHoliday;
  const { data: slotsRes, isLoading: slotsLoading } = useGetAvailableSlots(
    { shopId, barberId: selectedBarberId ?? 0, date: formattedDate },
    {
      query: {
        enabled: !!shopId && !!selectedBarberId && selectedServiceIds.length > 0 && !selectedDayBlocked,
      } as any,
    },
  );

  const createAppointment = useCreateAppointment();

  const barbers = Array.isArray(barbersRes) ? barbersRes.filter((barber) => barber.isActive !== false) : [];
  const services = Array.isArray(servicesRes) ? servicesRes : [];
  const servicesForBarber = (barberId: number) =>
    services.filter((service) => {
      const serviceBarberId = (service as any).barberId;
      return !serviceBarberId || Number(serviceBarberId) === barberId;
    });
  const availableServices = selectedBarberId ? servicesForBarber(selectedBarberId) : [];
  const slots = Array.isArray(slotsRes?.slots) ? slotsRes.slots : [];
  const selectedBarber = barbers.find((barber) => barber.id === selectedBarberId);
  const selectedServices = selectedServiceIds
    .map((serviceId) => availableServices.find((service) => service.id === serviceId))
    .filter(Boolean) as typeof services;
  const selectedServicesLabel = selectedServices.length > 0
    ? selectedServices.map((service) => service.name).join(", ")
    : "Nuk eshte zgjedhur";
  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const totalDuration = selectedServices.reduce((sum, service) => sum + service.durationMinutes, 0);
  const canConfirm = !!selectedBarberId && selectedServiceIds.length > 0 && !!selectedSlot;

  const handleSelectDate = (date: Date) => {
    if (getDateHoliday(format(date, "yyyy-MM-dd"), selectedBarberId, holidays)) return;
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const scrollDates = (direction: "left" | "right") => {
    datesScrollerRef.current?.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const scroller = datesScrollerRef.current;
    if (!scroller) return;
    const activeDate = scroller.querySelector<HTMLElement>(`[data-date="${formattedDate}"]`);
    activeDate?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [formattedDate]);

  const handleSelectBarber = (barberId: number) => {
    setSelectedBarberId(barberId);
    setSelectedServiceIds([]);
    setSelectedSlot(null);
  };

  const handleToggleService = (serviceId: number) => {
    setSelectedServiceIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
    setSelectedSlot(null);
  };

  const handleConfirm = async () => {
    if (!canConfirm || !selectedBarberId || selectedServiceIds.length === 0 || !selectedSlot) return;

    if (!user) {
      toast({
        variant: "destructive",
        title: "Duhet te kycesh",
        description: "Kycu ose krijo llogari per te bere rezervimin.",
      });
      setLocation("/login");
      return;
    }

    try {
      const scheduledAt = `${formattedDate}T${selectedSlot}:00Z`;

      await createAppointment.mutateAsync({
        data: {
          shopId,
          barberId: selectedBarberId,
          serviceId: selectedServiceIds[0],
          serviceIds: selectedServiceIds,
          scheduledAt,
        } as any,
      });

      toast({
        title: "Rezervimi u krijua",
        description: "Sherbimet u ruajten ne te njejtin rezervim.",
      });
      setLocation("/appointments");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Rezervimi deshtoi",
        description: error?.message || "Nuk u krijua takimi. Provo perseri.",
      });
    }
  };

  if (!shopId) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 px-4 py-12">
        <div className="container mx-auto max-w-3xl">
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <h1 className="text-2xl font-bold">Dyqani nuk u gjet</h1>
              <p className="mt-2 text-muted-foreground">Linku i rezervimit nuk eshte valid.</p>
              <Button className="mt-6" onClick={() => setLocation("/barbershops")}>
                Shko te dyqanet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative h-[330px] overflow-hidden border-b border-white/10 bg-slate-950 text-white md:h-[350px]">
        <div className="absolute inset-0 opacity-70">
          {shop?.imageUrl ? (
            <img src={shop.imageUrl} alt={shop.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.25),_transparent_34%),linear-gradient(135deg,_#18181b,_#020617)]" />
          )}
        </div>
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />

        <div className="container relative mx-auto flex h-full max-w-7xl flex-col px-4 pb-6 pt-24 md:pb-8 md:pt-28">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/barbershops/${shopId}`)}
            className="mb-auto w-fit rounded-full text-white/75 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kthehu te dyqani
          </Button>

          <div className="mt-auto">
            {shopLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-72 bg-white/20" />
                <Skeleton className="h-6 w-96 max-w-full bg-white/20" />
              </div>
            ) : (
              <>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 backdrop-blur">
                  <Sparkles className="h-4 w-4 text-blue-300" />
                  Rezervo takimin ne pak hapa
                </div>
                <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-5xl">
                  {shop?.name ? `Rezervo te ${shop.name}` : "Rezervo takim"}
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-white/75">
                  {shop?.description ||
                    "Zgjidh sherbimin, berberin dhe oren qe te pershtatet. Rezervimi konfirmohet menjehere nga platforma."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-white/80">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                    <MapPin className="h-4 w-4" />
                    {shop?.city || "Qyteti"}{shop?.address ? `, ${shop.address}` : ""}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                    <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                    {shop?.rating ? `${shop.rating.toFixed(1)} vleresim` : "Dyqan aktiv"}
                  </span>
                  {shop?.openTime && shop?.closeTime ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                      <Clock className="h-4 w-4" />
                      {shop.openTime} - {shop.closeTime}
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <main className="container mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <BookingSection
              icon={<UserRound className="h-5 w-5" />}
              step="01"
              title="Zgjidh berberin"
              description="Pasi zgjedh berberin, shfaqen cmimorja, datat dhe oraret e tij."
            >
              {barbersLoading || servicesLoading ? (
                <CardGridSkeleton />
              ) : barbers.length === 0 ? (
                <EmptyState title="Nuk ka berbere aktive" description="Ky dyqan ende nuk ka punetore aktive per rezervim." />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {barbers.map((barber) => {
                    const barberServices = servicesForBarber(barber.id);
                    const minPrice = barberServices.length > 0 ? Math.min(...barberServices.map((service) => service.price)) : null;

                    return (
                    <button
                      key={barber.id}
                      onClick={() => handleSelectBarber(barber.id)}
                      className={`flex items-center gap-4 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md ${
                        selectedBarberId === barber.id ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200"
                      }`}
                    >
                      <Avatar className="h-14 w-14 border border-slate-200">
                        <AvatarImage src={barber.avatarUrl || undefined} />
                        <AvatarFallback className="bg-blue-50 font-bold text-blue-700">
                          {barber.name.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-bold text-slate-950">{barber.name}</span>
                          {selectedBarberId === barber.id ? <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" /> : null}
                        </div>
                        <p className="mt-1 truncate text-sm text-slate-500">{barber.specialties || "Berber profesional"}</p>
                        <div className="mt-2 text-xs font-semibold text-blue-700">
                          {barberServices.length > 0
                            ? `${barberServices.length} sherbime${minPrice != null ? ` - nga ${minPrice} EUR` : ""}`
                            : "Pa cmimore"}
                        </div>
                      </div>
                    </button>
                    );
                  })}
                </div>
              )}
            </BookingSection>

            <BookingSection
              icon={<Scissors className="h-5 w-5" />}
              step="02"
              title={selectedBarber ? `Cmimorja e ${selectedBarber.name}` : "Zgjidh sherbimin"}
              description="Mund te zgjedhesh nje ose me shume sherbime nga cmimorja e berberit."
            >
              {!selectedBarberId ? (
                <EmptyState title="Zgjidh nje berber" description="Cmimorja shfaqet menjehere pasi te zgjedhesh punetorin." />
              ) : servicesLoading ? (
                <CardGridSkeleton />
              ) : availableServices.length === 0 ? (
                <EmptyState title="Nuk ka sherbime per kete berber" description="Shto sherbime ne dashboard per gjithe dyqanin ose per kete berber." />
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {availableServices.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleToggleService(service.id)}
                      className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md ${
                        selectedServiceIds.includes(service.id) ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-bold text-slate-950">{service.name}</div>
                          {service.description ? (
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{service.description}</p>
                          ) : null}
                          {(service as any).barberId ? (
                            <div className="mt-2 text-xs font-semibold text-blue-700">Specifike per {selectedBarber?.name}</div>
                          ) : (
                            <div className="mt-2 text-xs font-semibold text-slate-400">Sherbim i dyqanit</div>
                          )}
                        </div>
                        {selectedServiceIds.includes(service.id) ? <CheckCircle2 className="h-5 w-5 text-blue-600" /> : null}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-1.5 text-slate-500">
                          <Clock className="h-4 w-4" />
                          {service.durationMinutes} min
                        </span>
                        <span className="text-lg font-black text-blue-600">{service.price} EUR</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </BookingSection>

            <BookingSection
              icon={<Calendar className="h-5 w-5" />}
              step="03"
              title="Zgjidh daten"
              description="Leviz me shigjeta dhe zgjidh nje date te lire per berberin."
            >
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-3 shadow-inner">
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                      {format(selectedDate, "MMMM yyyy")}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedDayBlocked ? "Kjo dite eshte pushim" : "Zgjidh daten nga slider-i"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-full bg-white shadow-sm"
                      onClick={() => scrollDates("left")}
                      aria-label="Datat e meparshme"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-full bg-white shadow-sm"
                      onClick={() => scrollDates("right")}
                      aria-label="Datat e ardhshme"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute bottom-2 left-0 top-0 z-10 w-8 bg-gradient-to-r from-slate-50 to-transparent" />
                  <div className="pointer-events-none absolute bottom-2 right-0 top-0 z-10 w-8 bg-gradient-to-l from-slate-50 to-transparent" />
                  <div
                    ref={datesScrollerRef}
                    className="date-slider flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-7 pb-2"
                  >
                    {dates.map((date) => {
                      const dateKey = format(date, "yyyy-MM-dd");
                      const active = formattedDate === dateKey;
                      const holiday = getDateHoliday(dateKey, selectedBarberId, holidays);
                      const disabled = !!holiday;

                      return (
                        <button
                          key={date.toISOString()}
                          data-date={dateKey}
                          onClick={() => handleSelectDate(date)}
                          disabled={disabled}
                          title={holiday?.reason || (disabled ? "Pushim" : undefined)}
                          className={`min-w-[88px] snap-center rounded-2xl border p-3 text-center shadow-sm transition sm:min-w-[104px] sm:p-4 ${
                            active
                              ? "scale-[1.02] border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                              : disabled
                                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-70"
                                : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:shadow-md"
                          }`}
                        >
                          <div className={`text-xs font-bold uppercase ${active ? "text-blue-100" : "text-slate-400"}`}>
                            {format(date, "EEE")}
                          </div>
                          <div className="mt-1 text-2xl font-black">{format(date, "d")}</div>
                          <div className={`text-xs font-semibold ${active ? "text-blue-100" : "text-slate-500"}`}>
                            {format(date, "MMM")}
                          </div>
                          {disabled ? (
                            <div className="mt-2 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                              Pushim
                            </div>
                          ) : (
                            <div className={`mt-2 h-1 rounded-full ${active ? "bg-white/80" : "bg-blue-100"}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </BookingSection>

            <BookingSection
              icon={<Clock className="h-5 w-5" />}
              step="04"
              title="Zgjidh oren"
              description="Oret shfaqen pasi te zgjedhesh sherbimin dhe berberin."
            >
              {selectedDayBlocked ? (
                <EmptyState title="Dita eshte pushim" description={selectedDayHoliday?.reason || "Zgjidh nje date tjeter per kete berber."} />
              ) : selectedServiceIds.length === 0 || !selectedBarberId ? (
                <EmptyState title="Zgjidh sherbime dhe berber" description="Pastaj do te shfaqen oraret e lira per daten e zgjedhur." />
              ) : slotsLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} className="h-12 rounded-xl" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <EmptyState title="Nuk ka orare te lira" description={(slotsRes as any)?.unavailableReason || "Provo nje date tjeter ose zgjidh nje berber tjeter."} />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-xl border px-4 py-3 text-sm font-bold shadow-sm transition hover:border-blue-300 ${
                        selectedSlot === slot ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100" : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </BookingSection>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="overflow-hidden border-slate-200 shadow-lg">
              <div className="bg-slate-950 p-6 text-white">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">Konfirmo</div>
                <h2 className="mt-2 text-2xl font-black">Detajet e rezervimit</h2>
              </div>
              <CardContent className="space-y-5 p-6">
                <SummaryRow label="Dyqani" value={shop?.name || "Duke u ngarkuar"} dark />
                <SummaryRow label="Sherbimet" value={selectedServicesLabel} dark />
                <SummaryRow label="Berberi" value={selectedBarber?.name || "Nuk eshte zgjedhur"} dark />
                <SummaryRow label="Koha" value={selectedSlot ? `${format(selectedDate, "dd MMM yyyy")} ne ${selectedSlot}` : "Nuk eshte zgjedhur"} dark />
                <SummaryRow label="Kohezgjatja" value={totalDuration ? `${totalDuration} min` : "Nuk eshte zgjedhur"} dark />

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Per pagese</div>
                  <div className="mt-1 text-3xl font-black text-slate-950">
                    {selectedServices.length > 0 ? `${totalPrice} EUR` : "--"}
                  </div>
                </div>

                <Button
                  className="h-12 w-full rounded-full text-base font-bold"
                  disabled={!canConfirm || createAppointment.isPending}
                  onClick={handleConfirm}
                >
                  {createAppointment.isPending ? "Duke rezervuar..." : user ? "Konfirmo rezervimin" : "Kycu per te rezervuar"}
                </Button>
                <p className="text-center text-xs leading-5 text-slate-500">
                  Pas konfirmimit, takimi shfaqet ne profilin tend tek rezervimet.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

function BookingSection({
  icon,
  step,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-5 md:p-6">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Hapi {step}</div>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 pb-4 last:border-0 last:pb-0">
      <div className={dark ? "text-sm text-slate-500" : "text-sm text-white/65"}>{label}</div>
      <div className={`max-w-[190px] text-right text-sm font-bold ${dark ? "text-slate-950" : "text-white"}`}>{value}</div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        <Scissors className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-bold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function CardGridSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-28 rounded-2xl" />
      ))}
    </div>
  );
}
