import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListBarbershops } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Search, Star, SlidersHorizontal, Scissors } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BarbershopsList() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialCity = searchParams.get("city") || "all";

  const [city, setCity] = useState(initialCity);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: shopsResponse, isLoading } = useListBarbershops({
    city: city !== "all" ? city : undefined,
    search: debouncedSearch || undefined,
    status: "active",
    limit: 20
  });

  const cities = ["Prishtina", "Prizren", "Peja", "Gjakova", "Mitrovica", "Ferizaj", "Gjilan"];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
      {/* Left side: List */}
      <div className="w-full md:w-[60%] lg:w-[50%] xl:w-[40%] flex flex-col border-r border-border bg-background">
        <div className="p-4 border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Kërko dyqane, berberë..."
                className="pl-9 h-10 bg-background rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setDebouncedSearch(search)}
                onBlur={() => setDebouncedSearch(search)}
              />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={city === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setCity("all")}
              className="rounded-full shrink-0"
            >
              Kudo
            </Button>
            {cities.map(c => (
              <Button
                key={c}
                variant={city === c ? "default" : "outline"}
                size="sm"
                onClick={() => setCity(c)}
                className="rounded-full shrink-0"
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="font-bold text-xl">Berbertë e Disponueshëm</h2>
            <span className="text-sm text-muted-foreground">
              {shopsResponse?.total || 0} gjetur
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-4 p-4 border border-border rounded-2xl">
                  <Skeleton className="h-24 w-24 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : shopsResponse?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 px-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Scissors className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-2">Nuk u gjetën dyqane</h3>
              <p className="text-muted-foreground">Provoni të ndryshoni filtrat ose kërkoni në qytet tjetër.</p>
              <Button
                variant="outline"
                className="mt-6 rounded-full"
                onClick={() => { setCity("all"); setDebouncedSearch(""); setSearch(""); }}
              >
                Fshij të gjithë filtrat
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {shopsResponse?.data.map(shop => (
                <Link key={shop.id} href={`/barbershops/${shop.id}`}>
                  <div className="group cursor-pointer flex gap-4 p-4 border border-border bg-card rounded-2xl hover:border-primary/50 hover:shadow-md transition-all">
                    <div className="h-24 w-24 rounded-xl bg-muted overflow-hidden shrink-0 relative">
                      {shop.imageUrl ? (
                        <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Scissors className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg leading-tight truncate pr-2">{shop.name}</h3>
                          {shop.rating && (
                            <div className="flex items-center gap-1 text-sm font-bold shrink-0">
                              <Star className="w-3 h-3 text-primary fill-primary" />
                              {shop.rating.toFixed(1)}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{shop.address}, {shop.city}</span>
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-medium px-2.5 py-1 bg-secondary text-secondary-foreground rounded-full">
                          {shop.openTime} - {shop.closeTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Map Placeholder */}
      <div className="hidden md:flex flex-1 bg-muted relative items-center justify-center">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}></div>
        <div className="relative z-10 flex flex-col items-center p-6 bg-white/80 backdrop-blur border border-border rounded-3xl shadow-xl max-w-sm text-center">
          <MapPin className="w-12 h-12 text-primary mb-4" />
          <h3 className="text-xl font-bold mb-2">Hartë Interaktive</h3>
          <p className="text-muted-foreground text-sm">
            Pamja e hartës do të integrohet me Google Maps për t'ju ndihmuar të gjeni berberin më të afërt.
          </p>
        </div>
      </div>
    </div>
  );
}
