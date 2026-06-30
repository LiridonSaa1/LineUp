import { useState, Suspense, lazy, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useListBarbershops, useListTopBarbershops, useListProducts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { KOSOVO_CITIES } from "@/lib/kosovo-cities";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  MapPin, Search, Star, Scissors, Clock, ChevronLeft, ChevronRight,
  ArrowRight, Phone, Mail, MessageSquare, User, Send, CheckCircle,
  ShoppingBag, Package,
} from "lucide-react";

const KosovoMap = lazy(() => import("@/components/map/KosovoMap"));

/* ─────────────────────────────────────────────────────── */
/* Featured Carousel                                       */
/* ─────────────────────────────────────────────────────── */
function FeaturedCarousel({ shops }: { shops: any[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    if (ref.current) ref.current.scrollBy({ left: dir * 320, behavior: "smooth" });
  };
  if (!shops.length) return null;
  return (
    <div className="relative group/carousel">
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {shops.map((shop, i) => (
          <Link key={shop.id} href={`/barbershops/${shop.id}`}>
            <div
              className="shrink-0 w-[290px] rounded-2xl overflow-hidden border border-border/50 bg-card cursor-pointer hover:border-primary/40 hover:shadow-xl hover:shadow-primary/8 transition-all duration-300 group"
              style={{ scrollSnapAlign: "start" }}
            >
              <div className="relative h-44 overflow-hidden bg-muted">
                {shop.imageUrl ? (
                  <img
                    src={shop.imageUrl}
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                    <Scissors className="w-12 h-12 text-muted-foreground/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {i < 3 && (
                  <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black shadow-lg">
                    #{i + 1}
                  </div>
                )}
                {shop.rating != null && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                    <Star className="w-3 h-3 text-primary fill-primary" />
                    <span className="text-white text-xs font-bold">{Number(shop.rating).toFixed(1)}</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-bold text-sm leading-tight truncate">{shop.name}</p>
                  <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 shrink-0" />{shop.city}
                  </p>
                </div>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {shop.openTime && shop.closeTime ? `${shop.openTime} – ${shop.closeTime}` : "Hapur"}
                </div>
                <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                  Rezervo <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {shops.length > 3 && (
        <>
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-8 h-8 rounded-full bg-card border border-border shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10 hover:border-primary/40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-8 h-8 rounded-full bg-card border border-border shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10 hover:border-primary/40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Products Section                                        */
/* ─────────────────────────────────────────────────────── */
function ProductsSection() {
  const { data: productsRes, isLoading } = useListProducts({ limit: 8 });
  const products: any[] = Array.isArray(productsRes)
    ? productsRes
    : Array.isArray((productsRes as any)?.data)
      ? (productsRes as any).data
      : [];

  if (!isLoading && !products.length) return null;

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-[2px] bg-primary rounded-full" />
              <span className="text-xs font-bold text-primary tracking-widest uppercase">Dyqani</span>
            </div>
            <h2 className="text-2xl font-extrabold">Produkte grooming të zgjedhura</h2>
            <p className="text-muted-foreground text-sm mt-1">Pompade, vajra, aksesorë premium</p>
          </div>
          <Link href="/marketplace" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 group shrink-0">
            Shiko të gjitha <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                <Skeleton className="h-44 w-full rounded-none" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p: any) => (
              <Link key={p.id} href="/marketplace">
                <div className="group rounded-2xl border border-border/50 bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/8 transition-all duration-300 cursor-pointer">
                  <div className="h-44 bg-muted overflow-hidden relative">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                        <Package className="w-10 h-10 text-muted-foreground/20" />
                      </div>
                    )}
                    {p.stock === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">I shitur</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-sm leading-tight truncate mb-1">{p.name}</p>
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold text-primary text-base">€{Number(p.price).toFixed(2)}</p>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" /> Shto
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Shiko të gjitha produktet <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Contact Section                                         */
/* ─────────────────────────────────────────────────────── */
function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, subject: "Pyetje nga faqja Barbershops" }),
      });
      if (res.ok) { setStatus("done"); setForm({ name: "", email: "", phone: "", message: "" }); }
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  return (
    <section className="py-20 border-t border-border/40 bg-gradient-to-b from-background to-zinc-950/50">
      <div className="container px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left — info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-[2px] bg-primary rounded-full" />
              <span className="text-xs font-bold text-primary tracking-widest uppercase">Kontakti</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">
              Keni pyetje?<br />
              <span className="text-primary">Jemi këtu.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Nëse dëshironi të regjistroni dyqanin tuaj, keni pyetje rreth platformës, ose nevojitet ndihmë — na kontaktoni drejtpërdrejt.
            </p>
            <div className="space-y-4">
              {[
                { icon: Mail, label: "Email", value: "info@trimkosova.com" },
                { icon: Phone, label: "Telefon", value: "+383 44 000 000" },
                { icon: MapPin, label: "Adresa", value: "Prishtinë, Kosovë" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4 group">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
                    <p className="font-semibold text-sm mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-card border border-border/50 rounded-3xl p-8">
            {status === "done" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="font-extrabold text-xl mb-2">Mesazhi u dërgua!</h3>
                <p className="text-muted-foreground text-sm">Do t'ju kontaktojmë sa më shpejt.</p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-6 text-sm text-primary font-semibold hover:underline"
                >
                  Dërgoni mesazh tjetër
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Emri *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        required
                        placeholder="Emri juaj"
                        className="pl-9 rounded-xl bg-background"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        required
                        type="email"
                        placeholder="email@juaj.com"
                        className="pl-9 rounded-xl bg-background"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Telefon</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="+383 ..."
                      className="pl-9 rounded-xl bg-background"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mesazhi *</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                    <textarea
                      required
                      rows={4}
                      placeholder="Shkruani mesazhin tuaj..."
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-background border border-input text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 transition-colors placeholder:text-muted-foreground"
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    />
                  </div>
                </div>
                {status === "error" && (
                  <p className="text-destructive text-sm">Gabim! Provoni përsëri.</p>
                )}
                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full rounded-xl h-11 font-bold gap-2"
                >
                  {status === "loading" ? "Duke dërguar..." : (
                    <><Send className="w-4 h-4" /> Dërgo Mesazhin</>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── */
/* Main Page                                               */
/* ─────────────────────────────────────────────────────── */
export default function BarbershopsList() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialCity = searchParams.get("city") || "all";

  const [city, setCity] = useState(initialCity);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [, setLocation] = useLocation();

  const { data: shopsResponse, isLoading } = useListBarbershops({ status: "active", limit: 100 });
  const { data: topShopsData } = useListTopBarbershops({ limit: 8 });

  const shops = shopsResponse?.data ?? [];
  const topShops: any[] = Array.isArray(topShopsData) ? topShopsData : [];

  const filtered = shops.filter((s) => {
    const matchCity = city === "all" || s.city === city;
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
    return matchCity && matchSearch;
  });

  const handleSearch = () => setDebouncedSearch(search);

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Hero search bar ─────────────────────────────────── */}
      <div className="sticky top-[64px] z-30 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="container px-4 max-w-7xl mx-auto py-3">
          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Kërko dyqane, berberë, adresë..."
                className="pl-9 h-10 rounded-xl bg-card"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                onBlur={handleSearch}
              />
            </div>
            {/* City filter */}
            <div className="relative w-[200px]">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="pl-9 h-10 rounded-xl bg-card">
                  <SelectValue placeholder="Kudo në Kosovë" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  <SelectItem value="all">Kudo në Kosovë</SelectItem>
                  {KOSOVO_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch} className="h-10 px-5 rounded-xl gap-2 shrink-0">
              <Search className="w-4 h-4" /> Kërko
            </Button>
            <span className="text-sm text-muted-foreground shrink-0">
              {isLoading ? "…" : `${filtered.length} dyqane`}
            </span>
          </div>
        </div>
      </div>

      {/* ── Featured Carousel ─────────────────────────────── */}
      {topShops.length > 0 && (
        <section className="py-10 border-b border-border/30">
          <div className="container px-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-[2px] bg-primary rounded-full" />
                <span className="text-xs font-bold text-primary tracking-widest uppercase">Të vlerësuarat</span>
              </div>
              <h2 className="text-xl font-extrabold">Dyqanet Top</h2>
            </div>
            <FeaturedCarousel shops={topShops} />
          </div>
        </section>
      )}

      {/* ── Map + List ─────────────────────────────────────── */}
      <section className="flex-1">
        {/* On mobile: map top, list below. On lg+: side by side */}
        <div className="flex flex-col lg:flex-row" style={{ minHeight: "640px" }}>

          {/* Map — mobile: full width 420px tall; desktop: flex-1 min-w-[500px] */}
          <div className="order-1 lg:order-2 lg:flex-1 lg:min-w-[500px] h-[420px] lg:h-auto border-b lg:border-b-0 lg:border-l border-border/40 relative">
            <Suspense
              fallback={
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
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
                onShopClick={id => setLocation(`/barbershops/${id}`)}
              />
            </Suspense>
          </div>

          {/* List — mobile: full width; desktop: fixed w-[400px] shrink-0, scrollable */}
          <div className="order-2 lg:order-1 w-full lg:w-[400px] xl:w-[440px] lg:shrink-0 flex flex-col bg-background border-r-0 lg:border-r border-border/40 lg:overflow-y-auto lg:max-h-[calc(100vh-180px)] lg:sticky lg:top-[120px]">
            <div className="p-4 border-b border-border/30 bg-card/50 backdrop-blur">
              <h2 className="font-bold text-base">
                {city === "all" ? "Të gjitha dyqanet" : `Dyqanet në ${city}`}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} gjetur</p>
            </div>

            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex gap-3 p-3 border border-border rounded-2xl">
                    <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Scissors className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <h3 className="text-base font-bold mb-2">Nuk u gjetën dyqane</h3>
                <p className="text-muted-foreground text-sm">Provoni të ndryshoni filtrat.</p>
                <Button variant="outline" size="sm" className="mt-5 rounded-full" onClick={() => { setCity("all"); setDebouncedSearch(""); setSearch(""); }}>
                  Fshij filtrat
                </Button>
              </div>
            ) : (
              <div className="p-3 space-y-2.5">
                {filtered.map((shop) => (
                  <Link key={shop.id} href={`/barbershops/${shop.id}`}>
                    <div className="group flex gap-3 p-3 border border-border/50 bg-card rounded-2xl hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                      <div className="h-[72px] w-[72px] rounded-xl bg-muted overflow-hidden shrink-0">
                        {shop.imageUrl ? (
                          <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                            <Scissors className="w-6 h-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h3 className="font-bold text-sm leading-tight truncate">{shop.name}</h3>
                            {shop.rating != null && (
                              <div className="flex items-center gap-0.5 text-xs font-bold shrink-0 text-primary">
                                <Star className="w-3 h-3 fill-primary" />
                                {Number(shop.rating).toFixed(1)}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{shop.address}, {shop.city}</span>
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          {shop.openTime && (
                            <span className="text-[11px] font-medium flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {shop.openTime} – {shop.closeTime}
                            </span>
                          )}
                          <span className="text-[11px] font-semibold text-primary ml-auto">Rezervo →</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Products ─────────────────────────────────────── */}
      <ProductsSection />

      {/* ── Contact ──────────────────────────────────────── */}
      <ContactSection />
    </div>
  );
}
