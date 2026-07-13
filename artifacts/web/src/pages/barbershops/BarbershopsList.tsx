import { Suspense, lazy, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useListProducts } from "@workspace/api-client-react";
import ContactSection from "@/components/ContactSection";
import type { BarberMapItem } from "@/components/map/GoogleBarbershopMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { KOSOVO_CITIES } from "@/lib/kosovo-cities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowRight,
  Clock,
  MapPin,
  Navigation,
  Package,
  Search,
  Scissors,
  ShoppingBag,
  SlidersHorizontal,
  Star,
} from "lucide-react";

const BarberDirectoryMap = lazy(() => import("@/components/map/GoogleBarbershopMap"));

interface BarbershopListItem {
  id: number;
  name: string;
  city: string;
  address: string;
  description?: string | null;
  phone?: string | null;
  imageUrl?: string | null;
  rating?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  openTime?: string | null;
  closeTime?: string | null;
}

async function fetchBarbershops(): Promise<BarbershopListItem[]> {
  const response = await fetch("/api/barbershops?status=active&limit=200");
  if (!response.ok) throw new Error("Could not load barbershops");
  const data = await response.json();
  return Array.isArray(data?.data) ? data.data : [];
}

function ProductsStrip() {
  const { data: productsRes, isLoading } = useListProducts({ limit: 4 });
  const products = Array.isArray(productsRes)
    ? productsRes
    : Array.isArray((productsRes as any)?.data)
      ? (productsRes as any).data
      : [];

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="border-t border-border bg-background py-10">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Marketplace</p>
            <h2 className="mt-1 text-xl font-extrabold">Produkte grooming te zgjedhura</h2>
          </div>
          <Link href="/marketplace" className="hidden items-center gap-1 text-sm font-bold text-primary sm:flex">
            Shiko te gjitha <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {isLoading
            ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)
            : products.map((product: any) => (
                <Link key={product.id} href="/marketplace">
                  <div className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg">
                    <div className="flex h-32 items-center justify-center overflow-hidden bg-muted">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-bold">{product.name}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="font-extrabold text-primary">EUR {Number(product.price).toFixed(2)}</span>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}

export default function BarbershopsList() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialCity = searchParams.get("city") || "all";
  const [, setLocation] = useLocation();
  const [city, setCity] = useState(initialCity);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);

  const { data: shops = [], isLoading } = useQuery({
    queryKey: ["public-barbershops"],
    queryFn: fetchBarbershops,
  });

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return shops.filter((shop) => {
      const matchCity = city === "all" || shop.city === city;
      const matchSearch =
        !q ||
        shop.name.toLowerCase().includes(q) ||
        shop.city.toLowerCase().includes(q) ||
        shop.address.toLowerCase().includes(q) ||
        (shop.description ?? "").toLowerCase().includes(q);
      return matchCity && matchSearch;
    });
  }, [shops, city, debouncedSearch]);

  const citiesWithShops = useMemo(
    () => Array.from(new Set(shops.map((shop) => shop.city).filter(Boolean))).sort(),
    [shops],
  );

  const topRated = useMemo(
    () => [...filtered].sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0)).slice(0, 3),
    [filtered],
  );

  const mapItems = useMemo<BarberMapItem[]>(() => filtered.map((shop) => ({
    id: shop.id,
    name: shop.name,
    avatarUrl: shop.imageUrl,
    specialties: shop.description,
    rating: shop.rating,
    shop: {
      id: shop.id,
      name: shop.name,
      city: shop.city,
      address: shop.address,
      imageUrl: shop.imageUrl,
      rating: shop.rating,
      latitude: shop.latitude,
      longitude: shop.longitude,
      openTime: shop.openTime,
      closeTime: shop.closeTime,
    },
  })), [filtered]);

  const selectedShop = filtered.find((shop) => shop.id === selectedShopId) ?? null;
  const runSearch = () => setDebouncedSearch(search);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-background">
      <section className="border-b border-border bg-background">
        <div className="container mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Navigation className="h-3.5 w-3.5" />
              Barber shop map directory
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Zgjidh barber shop dhe shiko vendndodhjen</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Shfleto barber shop-et aktive, kliko nje dyqan dhe brenda tij shiko punetoret/berberet.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-3">
            <div>
              <p className="text-2xl font-extrabold">{isLoading ? "..." : shops.length}</p>
              <p className="text-[11px] font-medium text-muted-foreground">Dyqane</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">{isLoading ? "..." : citiesWithShops.length}</p>
              <p className="text-[11px] font-medium text-muted-foreground">Qytete</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold">{isLoading ? "..." : filtered.length}</p>
              <p className="text-[11px] font-medium text-muted-foreground">Rezultate</p>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-[64px] z-30 border-b border-border/60 bg-background/95 shadow-sm backdrop-blur-xl">
        <div className="container mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold sm:flex">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Filtrat
            </div>
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Kerko barber shop, qytet ose adrese..."
                className="h-10 rounded-xl bg-card pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onBlur={runSearch}
                onKeyDown={(event) => event.key === "Enter" && runSearch()}
              />
            </div>
            <div className="relative w-[210px]">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="h-10 rounded-xl bg-card pl-9">
                  <SelectValue placeholder="Kudo ne Kosove" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  <SelectItem value="all">Kudo ne Kosove</SelectItem>
                  {KOSOVO_CITIES.map((cityName) => (
                    <SelectItem key={cityName} value={cityName}>
                      {cityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={runSearch} className="h-10 shrink-0 rounded-xl px-5 font-bold">
              Kerko
            </Button>
          </div>
        </div>
      </div>

      <section className="px-0 py-0 lg:px-6 lg:py-6">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 lg:flex-row">
          <div className="order-1 h-[430px] overflow-hidden border-b border-border bg-muted shadow-sm lg:sticky lg:top-[136px] lg:order-2 lg:h-[calc(100vh-210px)] lg:min-w-[520px] lg:flex-1 lg:rounded-3xl lg:border">
            <div className="relative h-full w-full">
              <Suspense
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <MapPin className="h-10 w-10 animate-bounce" />
                      <p className="text-sm font-medium">Po ngarkohet harta...</p>
                    </div>
                  </div>
                }
              >
                <BarberDirectoryMap
                  barbers={mapItems}
                  selectedBarberId={selectedShopId}
                  onSelectBarber={setSelectedShopId}
                  onBookBarber={(shopId) => setLocation(`/book/${shopId}`)}
                />
              </Suspense>
            </div>
          </div>

          <div className="order-2 flex w-full flex-col bg-background shadow-sm lg:sticky lg:top-[136px] lg:order-1 lg:max-h-[calc(100vh-210px)] lg:w-[460px] lg:shrink-0 lg:overflow-y-auto lg:rounded-3xl lg:border lg:border-border">
            <div className="border-b border-border/40 bg-card/70 p-4 backdrop-blur lg:rounded-t-3xl">
              <h2 className="text-base font-extrabold">{city === "all" ? "Te gjitha barber shop-et" : `Barber shop-et ne ${city}`}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {selectedShop ? `${selectedShop.name} eshte zgjedhur ne harte` : `${filtered.length} dyqane gjetur`}
              </p>
              {topRated.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {topRated.map((shop) => (
                    <button
                      key={shop.id}
                      onClick={() => setSelectedShopId(shop.id)}
                      className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary hover:bg-primary/15"
                    >
                      * {shop.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3 rounded-2xl border border-border p-3">
                    <Skeleton className="h-20 w-20 shrink-0 rounded-2xl" />
                    <div className="flex-1 space-y-2 py-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Scissors className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <h3 className="mb-2 text-base font-bold">Nuk u gjet asnje barber shop</h3>
                <p className="text-sm text-muted-foreground">Provoni te ndryshoni filtrat.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-5 rounded-full"
                  onClick={() => {
                    setCity("all");
                    setDebouncedSearch("");
                    setSearch("");
                    setSelectedShopId(null);
                  }}
                >
                  Fshij filtrat
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5 p-3">
                {filtered.map((shop) => {
                  const selected = shop.id === selectedShopId;
                  return (
                    <div
                      key={shop.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setLocation(`/book/${shop.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setLocation(`/book/${shop.id}`);
                        }
                      }}
                      className={`group flex w-full cursor-pointer gap-3 rounded-2xl border bg-card p-3 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 ${
                        selected ? "border-primary shadow-lg shadow-primary/10" : "border-border/50"
                      }`}
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-primary/10">
                        {shop.imageUrl ? (
                          <img src={shop.imageUrl} alt={shop.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-extrabold text-primary">
                            {shop.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-extrabold leading-tight">{shop.name}</h3>
                            <p className="mt-0.5 truncate text-xs font-semibold text-primary">{shop.city}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5 text-xs font-extrabold text-primary">
                            <Star className="h-3 w-3 fill-primary" />
                            {shop.rating != null ? Number(shop.rating).toFixed(1) : "New"}
                          </div>
                        </div>

                        {shop.description ? (
                          <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">{shop.description}</p>
                        ) : null}

                        <p className="mt-2 flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{shop.address}, {shop.city}</span>
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          {shop.openTime ? (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {shop.openTime} - {shop.closeTime}
                            </span>
                          ) : <span />}
                          <Link
                            href={`/book/${shop.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary hover:bg-primary/15"
                          >
                            Rezervo
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <ProductsStrip />
      <ContactSection />
    </div>
  );
}
