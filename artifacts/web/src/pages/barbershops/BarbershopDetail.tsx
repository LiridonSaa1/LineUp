import { useRoute, Link } from "wouter";
import { Suspense, lazy } from "react";
import { useGetBarbershop, getGetBarbershopQueryKey, useListBarbers, useListServices } from "@workspace/api-client-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Star, Clock, Phone, Scissors, ArrowLeft, Navigation } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Lazy-load Leaflet — same pattern as BarbershopsList
const KosovoMap = lazy(() => import("@/components/map/KosovoMap"));

// Kosovo city centre fallback coords
const CITY_COORDS: Record<string, [number, number]> = {
  Prishtina:  [42.6629, 21.1655],
  Prizren:    [42.2139, 20.7397],
  Peja:       [42.6597, 20.2880],
  Gjakova:    [42.3803, 20.4308],
  Mitrovica:  [42.8914, 20.8660],
  Ferizaj:    [42.3703, 21.1553],
  Gjilan:     [42.4635, 21.4694],
};

export default function BarbershopDetail() {
  const [, params] = useRoute("/barbershops/:id");
  const shopId = params?.id ? parseInt(params.id) : 0;

  const { data: shop, isLoading: shopLoading } = useGetBarbershop(shopId, {
    query: { enabled: !!shopId, queryKey: getGetBarbershopQueryKey(shopId) }
  });

  const { data: barbersRes, isLoading: barbersLoading } = useListBarbers(shopId);
  const { data: servicesRes, isLoading: servicesLoading } = useListServices(shopId);

  if (shopLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-[40vh] bg-muted w-full" />
        <div className="container max-w-4xl mx-auto px-4 -mt-16 relative z-10">
          <div className="bg-card p-8 rounded-3xl border border-border shadow-xl">
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton className="h-4 w-1/3 mb-8" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-32 rounded-xl" />
              <Skeleton className="h-12 w-32 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Berberia nuk u gjet</h2>
        <Button asChild className="rounded-full">
          <Link href="/barbershops">Kthehu te zbulimi</Link>
        </Button>
      </div>
    );
  }

  // Build Google Maps directions URL
  const lat = shop.latitude != null ? Number(shop.latitude) : null;
  const lng = shop.longitude != null ? Number(shop.longitude) : null;
  const cityCoords = CITY_COORDS[shop.city] ?? [42.6629, 21.1655];
  const mapLat = lat ?? cityCoords[0];
  const mapLng = lng ?? cityCoords[1];
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mapLat},${mapLng}`;

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Hero Image */}
      <div className="h-[40vh] md:h-[50vh] w-full relative bg-muted">
        {shop.imageUrl ? (
          <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-card">
            <Scissors className="w-24 h-24 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        <Button variant="ghost" size="icon" asChild className="absolute top-6 left-6 bg-white/70 backdrop-blur hover:bg-white/90 rounded-full shadow-md">
          <Link href="/barbershops"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
      </div>

      {/* Info Card */}
      <div className="container max-w-5xl mx-auto px-4 -mt-24 relative z-10">
        <div className="bg-white/90 backdrop-blur border border-border p-6 md:p-8 rounded-3xl shadow-xl">
          <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{shop.name}</h1>
                {shop.rating != null && (
                  <span className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
                    <Star className="w-4 h-4 fill-primary" /> {Number(shop.rating).toFixed(1)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1 text-sm"><MapPin className="w-4 h-4" /> {shop.address}, {shop.city}</span>
                {shop.phone && <span className="flex items-center gap-1 text-sm"><Phone className="w-4 h-4" /> {shop.phone}</span>}
                <span className="flex items-center gap-1 text-sm"><Clock className="w-4 h-4" /> {shop.openTime} - {shop.closeTime}</span>
              </div>
            </div>
            <Button size="lg" className="w-full md:w-auto h-14 px-8 text-lg font-bold rounded-full shadow-md shadow-primary/20" asChild>
              <Link href={`/book/${shop.id}`}>Rezervo Tani</Link>
            </Button>
          </div>

          {shop.description && (
            <p className="text-muted-foreground border-t border-border pt-6 mt-6 leading-relaxed">
              {shop.description}
            </p>
          )}
        </div>

        {/* Content Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="w-full max-w-md grid grid-cols-2 bg-card p-1 rounded-2xl h-14 mb-8 border border-border">
              <TabsTrigger value="services" className="rounded-xl text-base h-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Shërbimet</TabsTrigger>
              <TabsTrigger value="barbers" className="rounded-xl text-base h-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Ekipi</TabsTrigger>
            </TabsList>

            <TabsContent value="services" className="mt-0">
              <div className="grid md:grid-cols-2 gap-4">
                {servicesLoading ? (
                  [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
                ) : !Array.isArray(servicesRes) || servicesRes.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">Nuk ka shërbime të listuara ende.</div>
                ) : (
                  servicesRes.map(service => (
                    <div key={service.id} className="p-5 bg-card border border-border rounded-2xl flex justify-between items-center group hover:border-primary/50 hover:shadow-md transition-all">
                      <div>
                        <h3 className="font-bold text-lg">{service.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3" /> {service.durationMinutes} min
                        </p>
                      </div>
                      <div className="text-xl font-bold text-primary">€{service.price}</div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="barbers" className="mt-0">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {barbersLoading ? (
                  [1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)
                ) : !Array.isArray(barbersRes) || barbersRes.length === 0 ? (
                  <div className="col-span-3 text-center py-12 text-muted-foreground">Nuk ka berberë të listuar ende.</div>
                ) : (
                  barbersRes.filter(b => b.isActive).map(barber => (
                    <div key={barber.id} className="p-6 bg-card border border-border rounded-2xl flex flex-col items-center text-center group hover:border-primary/50 hover:shadow-md transition-all">
                      <Avatar className="h-20 w-20 mb-4 border-2 border-primary/20">
                        <AvatarImage src={barber.avatarUrl || undefined} alt={barber.name} />
                        <AvatarFallback className="text-2xl bg-secondary text-secondary-foreground">{barber.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-bold text-xl">{barber.name}</h3>
                      {barber.specialties && (
                        <p className="text-sm text-primary font-medium mt-1">{barber.specialties}</p>
                      )}
                      {barber.bio && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{barber.bio}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Location Map ── */}
        <div className="mt-8">
          <div className="bg-card border border-border rounded-3xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Lokacioni</h2>
                  <p className="text-sm text-muted-foreground">{shop.address}, {shop.city}</p>
                </div>
              </div>
              <a
                href={gmapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <Navigation className="w-4 h-4" />
                Drejtim
              </a>
            </div>

            {/* Map */}
            <div className="h-72 md:h-96 w-full">
              <ErrorBoundary
                fallback={
                  <div className="h-full flex items-center justify-center bg-muted rounded-b-3xl">
                    <p className="text-sm text-muted-foreground">Harta nuk mund të ngarkohet.</p>
                  </div>
                }
              >
                <Suspense
                  fallback={
                    <div className="h-full flex items-center justify-center bg-muted">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <MapPin className="w-8 h-8 animate-bounce" />
                        <p className="text-sm">Po ngarkohet harta…</p>
                      </div>
                    </div>
                  }
                >
                  <KosovoMap
                    shops={[shop]}
                    selectedCity="all"
                    searchQuery=""
                  />
                </Suspense>
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
