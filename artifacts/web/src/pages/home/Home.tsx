import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListTopBarbershops } from "@workspace/api-client-react";
import { MapPin, Star, Scissors, ArrowRight, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [, setLocation] = useLocation();
  const [city, setCity] = useState<string>("all");
  
  const { data: topShops, isLoading } = useListTopBarbershops({
    city: city !== "all" ? city : undefined,
    limit: 6
  });

  const handleSearch = () => {
    if (city !== "all") {
      setLocation(`/barbershops?city=${city}`);
    } else {
      setLocation("/barbershops");
    }
  };

  const cities = ["Prishtina", "Prizren", "Peja", "Gjakova", "Mitrovica", "Ferizaj", "Gjilan"];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card to-background z-0"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/4 z-0 pointer-events-none"></div>
        
        <div className="container px-4 md:px-8 max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.1]">
              Find your <span className="text-primary">barber</span>. <br />
              Book in seconds.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              The premium network of barbershops across Kosovo. Sharp cuts, no waiting.
            </p>
            
            <div className="bg-card p-4 rounded-2xl border border-border shadow-2xl flex flex-col md:flex-row gap-4 max-w-2xl">
              <div className="flex-1 flex items-center gap-2 bg-background rounded-xl px-4 py-2 border border-border">
                <MapPin className="text-primary w-5 h-5" />
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 px-0">
                    <SelectValue placeholder="Where are you looking?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Anywhere in Kosovo</SelectItem>
                    {cities.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSearch} size="lg" className="h-14 px-8 text-lg font-semibold rounded-xl w-full md:w-auto">
                <Search className="mr-2 w-5 h-5" />
                Search
              </Button>
            </div>
            
            <div className="flex items-center gap-6 pt-4 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2"><Scissors className="w-4 h-4 text-primary" /> 500+ Barbers</div>
              <div className="flex items-center gap-2"><Star className="w-4 h-4 text-primary" /> 50k+ Reviews</div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Shops Section */}
      <section className="py-24 bg-background">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Top Rated Shops</h2>
              <p className="text-muted-foreground">The best cuts in {city !== 'all' ? city : 'Kosovo'}, verified by real customers.</p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex">
              <Link href="/barbershops">View all <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[200px] w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(Array.isArray(topShops) ? topShops : []).map(shop => (
                <Link key={shop.id} href={`/barbershops/${shop.id}`}>
                  <div className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                    <div className="h-56 relative overflow-hidden bg-muted">
                      {shop.imageUrl ? (
                        <img 
                          src={shop.imageUrl} 
                          alt={shop.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-card">
                          <Scissors className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                        {shop.rating?.toFixed(1) || "New"}
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold truncate pr-4">{shop.name}</h3>
                      </div>
                      <p className="text-muted-foreground flex items-center gap-1.5 text-sm mb-4">
                        <MapPin className="w-4 h-4" />
                        {shop.address}, {shop.city}
                      </p>
                      <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        Book Now
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          <Button variant="outline" asChild className="w-full mt-8 md:hidden">
            <Link href="/barbershops">View all shops</Link>
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-card relative overflow-hidden border-t border-border">
        <div className="container px-4 md:px-8 max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold tracking-tight mb-6">Are you a shop owner?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join TRIM to manage your bookings, attract new clients, and grow your business with our powerful tools.
          </p>
          <Button size="lg" asChild className="h-14 px-8 text-lg rounded-xl">
            <Link href="/register">Partner with us</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
