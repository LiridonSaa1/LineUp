import { Link, useRoute } from "wouter";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getListServicesQueryKey, useListServices } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { BarberMapItem } from "@/components/map/GoogleBarbershopMap";
import {
  ArrowLeft,
  CalendarCheck,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

async function fetchBarbers(): Promise<BarberMapItem[]> {
  const response = await fetch("/api/barbers");
  if (!response.ok) throw new Error("Could not load barber");
  return response.json();
}

function splitSpecialties(value?: string | null) {
  if (!value) return [];
  return value
    .split(/[,|]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export default function BarberDetail() {
  const [, params] = useRoute("/barbers/:id");
  const barberId = params?.id ? Number(params.id) : 0;

  const { data: barbers = [], isLoading } = useQuery({
    queryKey: ["public-barbers"],
    queryFn: fetchBarbers,
  });

  const barber = useMemo(
    () => barbers.find((item) => item.id === barberId) ?? null,
    [barberId, barbers],
  );

  const shopId = barber?.shop.id ?? 0;
  const { data: servicesRes, isLoading: servicesLoading } = useListServices(shopId, {
    query: { enabled: !!shopId, queryKey: getListServicesQueryKey(shopId) },
  });

  const services = Array.isArray(servicesRes) ? servicesRes : [];
  const specialties = splitSpecialties(barber?.specialties);
  const rating = barber?.rating ?? barber?.shop.rating ?? null;
  const gmapsUrl = barber
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${barber.shop.address}, ${barber.shop.city}`)}`
    : "#";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/70">
        <div className="h-80 bg-muted" />
        <div className="container mx-auto max-w-6xl px-4">
          <div className="-mt-24 grid gap-5 lg:grid-cols-[360px_1fr]">
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Scissors className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <h1 className="text-2xl font-extrabold">Barberi nuk u gjet</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Ky profil mund te jete hequr ose nuk eshte aktiv per momentin.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/barbershops">Kthehu te berberet</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16 dark:bg-background">
      <section className="relative min-h-[420px] overflow-hidden bg-slate-950 text-white">
        {barber.shop.imageUrl ? (
          <img
            src={barber.shop.imageUrl}
            alt={barber.shop.name}
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
        ) : (
          <div className="absolute inset-0 hero-grid opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/20" />

        <div className="container relative z-10 mx-auto flex min-h-[420px] max-w-6xl flex-col justify-between px-4 py-6 sm:px-6">
          <Button variant="ghost" size="sm" asChild className="w-fit rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Link href="/barbershops">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Mbrapa
            </Link>
          </Button>

          <div className="pb-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-white text-slate-950 hover:bg-white">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Barber profil
              </Badge>
              {rating != null ? (
                <Badge className="rounded-full bg-primary text-primary-foreground">
                  <Star className="mr-1 h-3.5 w-3.5 fill-current" />
                  {Number(rating).toFixed(1)}
                </Badge>
              ) : null}
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">{barber.name}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/80">
              <span>{barber.shop.name}</span>
              <span className="text-white/35">/</span>
              <MapPin className="h-4 w-4" />
              <span>{barber.shop.address}, {barber.shop.city}</span>
            </p>
          </div>
        </div>
      </section>

      <main className="container mx-auto -mt-20 grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[360px_1fr]">
        <aside className="relative z-20">
          <div className="sticky top-24 overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-slate-950/10">
            <div className="p-6 text-center">
              <Avatar className="mx-auto h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={barber.avatarUrl || undefined} alt={barber.name} />
                <AvatarFallback className="bg-primary text-4xl font-black text-primary-foreground">
                  {barber.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <h2 className="mt-5 text-2xl font-black">{barber.name}</h2>
              <p className="mt-1 text-sm font-semibold text-primary">{barber.shop.name}</p>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-border bg-background p-3">
                  <p className="text-xl font-black">{rating != null ? Number(rating).toFixed(1) : "New"}</p>
                  <p className="text-[11px] font-medium text-muted-foreground">Rating</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-3">
                  <p className="text-xl font-black">{services.length || "-"}</p>
                  <p className="text-[11px] font-medium text-muted-foreground">Sherbime</p>
                </div>
              </div>

              <Button asChild size="lg" className="mt-6 h-12 w-full rounded-2xl font-extrabold">
                <Link href={`/book/${barber.shop.id}`}>
                  <CalendarCheck className="mr-2 h-5 w-5" />
                  Rezervo tani
                </Link>
              </Button>
              <Button asChild variant="outline" className="mt-2 h-11 w-full rounded-2xl font-bold">
                <a href={gmapsUrl} target="_blank" rel="noopener noreferrer">
                  <Navigation className="mr-2 h-4 w-4" />
                  Hap ne harte
                </a>
              </Button>
            </div>
          </div>
        </aside>

        <div className="relative z-20 space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-slate-950/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary">Rreth barberit</p>
                <h2 className="mt-2 text-2xl font-black">Detaje profesionale</h2>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            <p className="mt-5 leading-7 text-muted-foreground">
              {barber.bio ||
                `${barber.name} eshte barber aktiv te ${barber.shop.name}, me fokus ne prerje te pastra, stil te kujdesshem dhe pervoje te qete rezervimi.`}
            </p>

            {specialties.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {specialties.map((specialty) => (
                  <span key={specialty} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    {specialty}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-slate-950/5">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary">Sherbimet</p>
                <h2 className="mt-2 text-2xl font-black">Zgjidh trajtimin</h2>
              </div>
              <Button asChild variant="outline" size="sm" className="hidden rounded-full font-bold sm:inline-flex">
                <Link href={`/book/${barber.shop.id}`}>Rezervo</Link>
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {servicesLoading ? (
                [1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-24 rounded-2xl" />)
              ) : services.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground md:col-span-2">
                  Nuk ka sherbime te listuara ende per kete dyqan.
                </div>
              ) : (
                services.slice(0, 6).map((service: any) => (
                  <div key={service.id} className="rounded-2xl border border-border bg-background p-4 transition hover:border-primary/40 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">{service.name}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {service.durationMinutes} min
                        </p>
                      </div>
                      <p className="shrink-0 text-lg font-black text-primary">EUR {Number(service.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-slate-950/5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black">Lokacioni</h2>
              <p className="mt-2 text-sm text-muted-foreground">{barber.shop.address}, {barber.shop.city}</p>
              <Button asChild variant="link" className="mt-3 h-auto p-0 font-bold">
                <a href={gmapsUrl} target="_blank" rel="noopener noreferrer">Merr drejtim</a>
              </Button>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-slate-950/5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black">Orari</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {barber.shop.openTime ? `${barber.shop.openTime} - ${barber.shop.closeTime}` : "Orari nuk eshte vendosur ende."}
              </p>
              {"phone" in barber.shop && (barber.shop as any).phone ? (
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold">
                  <Phone className="h-4 w-4 text-primary" />
                  {(barber.shop as any).phone}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
