import { useState, Suspense, lazy } from "react";
import { Link, useLocation } from "wouter";
import { useListBarbershops } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Star, SlidersHorizontal, Scissors, Map } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy-load Leaflet so it doesn't bloat the initial bundle
const KosovoMap = lazy(() => import("@/components/map/KosovoMap"));

const CITIES = ["Prishtina", "Prizren", "Peja", "Gjakova", "Mitrovica", "Ferizaj", "Gjilan"];

export default function BarbershopsList() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialCity = searchParams.get("city") || "all";

  const [city, setCity] = useState(initialCity);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showMap, setShowMap] = useState(true);
  const [, setLocation] = useLocation();

  const { data: shopsResponse, isLoading } = useListBarbershops({
    status: "active",
    limit: 100, // load more so map has full dataset
  });

  const shops = shopsResponse?.data ?? [];

  // Client-side filter for list (map filters internally)
  const filtered = shops.filter((s) => {
    const matchCity = city === "all" || s.city === city;
    const q = debouncedSearch.toLowerCase();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q);
    return matchCity && matchSearch;
  });

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
      {/* ── Left panel: list ── */}
      <div className="w-full md:w-[400px] lg:w-[420px] xl:w-[440px] shrink-0 flex flex-col border-r border-border bg-background">
        {/* Search + filters */}
        <div className="p-4 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Kërko dyqane, berberë..."
                className="pl-9 h-10 bg-background rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setDebouncedSearch(search)}
                onBlur={() => setDebouncedSearch(search)}
              />
            </div>
            {/* Toggle map on mobile */}
            <Button
              variant={showMap ? "default" : "outline"}
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl md:hidden"
              onClick={() => setShowMap((p) => !p)}
              title="Shfaq hartën"
            >
              <Map className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl hidden md:flex">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>

          {/* City pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Button
              variant={city === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setCity("all")}
              className="rounded-full shrink-0 text-xs"
            >
              Kudo
            </Button>
            {CITIES.map((c) => (
              <Button
                key={c}
                variant={city === c ? "default" : "outline"}
                size="sm"
                onClick={() => setCity(c)}
                className="rounded-full shrink-0 text-xs"
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="font-bold text-lg">Berbertë e Disponueshëm</h2>
            <span className="text-sm text-muted-foreground">
              {isLoading ? "…" : `${filtered.length} gjetur`}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 p-4 border border-border rounded-2xl">
                  <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 px-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Scissors className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-2">Nuk u gjetën dyqane</h3>
              <p className="text-muted-foreground text-sm">
                Provoni të ndryshoni filtrat ose kërkoni në qytet tjetër.
              </p>
              <Button
                variant="outline"
                className="mt-6 rounded-full"
                onClick={() => {
                  setCity("all");
                  setDebouncedSearch("");
                  setSearch("");
                }}
              >
                Fshij filtrat
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((shop) => (
                <Link key={shop.id} href={`/barbershops/${shop.id}`}>
                  <div className="group cursor-pointer flex gap-3 p-3.5 border border-border bg-card rounded-2xl hover:border-primary/50 hover:shadow-md transition-all">
                    <div className="h-20 w-20 rounded-xl bg-muted overflow-hidden shrink-0 relative">
                      {shop.imageUrl ? (
                        <img
                          src={shop.imageUrl}
                          alt={shop.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Scissors className="w-7 h-7 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="font-bold text-sm leading-tight truncate">{shop.name}</h3>
                          {shop.rating != null && (
                            <div className="flex items-center gap-0.5 text-xs font-bold shrink-0">
                              <Star className="w-3 h-3 text-primary fill-primary" />
                              {Number(shop.rating).toFixed(1)}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{shop.address}, {shop.city}</span>
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {shop.openTime && (
                          <span className="text-[11px] font-medium px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">
                            {shop.openTime} – {shop.closeTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: map ── */}
      <div
        className={`flex-1 relative ${
          showMap ? "flex" : "hidden md:flex"
        }`}
      >
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center bg-muted">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <MapPin className="w-10 h-10 animate-bounce" />
                <p className="text-sm font-medium">Po ngarkohet harta…</p>
              </div>
            </div>
          }
        >
          <KosovoMap
            shops={shops}
            selectedCity={city}
            searchQuery={debouncedSearch}
            onShopClick={(id) => setLocation(`/barbershops/${id}`)}
          />
        </Suspense>
      </div>
    </div>
  );
}
