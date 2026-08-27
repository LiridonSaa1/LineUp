import { Link, useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getListServicesQueryKey, useListServices } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useFavorites } from "@/hooks/useFavorites";
import {
  ArrowLeft,
  CalendarCheck,
  Clock,
  Globe,
  Heart,
  Instagram,
  MapPin,
  Navigation,
  Phone,
  Scissors,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  User as UserIcon,
} from "lucide-react";

async function fetchShopWithBarbers(shopId: number) {
  let shopData: any = null;
  let barbersData: any[] = [];

  // 1. Fetch Barbershop from Supabase
  try {
    const { data: supaShop } = await supabase
      .from("barbershops")
      .select("*")
      .eq("id", shopId)
      .maybeSingle();

    if (supaShop) {
      shopData = supaShop;
    }
  } catch (e) {
    console.warn("Supabase shop fetch error:", e);
  }

  // Fallback shop fetch from API
  if (!shopData) {
    try {
      const res = await fetch(`/api/barbershops/${shopId}`);
      if (res.ok) shopData = await res.json();
    } catch (e) {}
  }

  // 2. Fetch specific barbers for this barbershop from Supabase
  try {
    const { data: supaBarbers } = await supabase
      .from("barbers")
      .select("*")
      .eq("shop_id", shopId);

    if (supaBarbers && supaBarbers.length > 0) {
      barbersData = supaBarbers;
    }
  } catch (e) {
    console.warn("Supabase barbers fetch error:", e);
  }

  // Fallback barbers fetch from API
  if (barbersData.length === 0) {
    try {
      const res = await fetch(`/api/barbershops/${shopId}/barbers`);
      if (res.ok) {
        const apiBarbers = await res.json();
        if (Array.isArray(apiBarbers)) {
          barbersData = apiBarbers.map((item: any) => item.barber || item);
        }
      }
    } catch (e) {}
  }

  return {
    shop: shopData,
    barbers: barbersData,
  };
}

export default function BarberDetail() {
  const [, setLocation] = useLocation();
  const [, paramsShop] = useRoute("/barbershops/:id");
  const [, paramsBarber] = useRoute("/barbers/:id");
  const shopId = Number(paramsShop?.id || paramsBarber?.id || 0);

  const { data, isLoading } = useQuery({
    queryKey: ["shop-detail-with-barbers", shopId],
    queryFn: () => fetchShopWithBarbers(shopId),
    enabled: !!shopId,
  });

  const shop = data?.shop;
  const barbers = data?.barbers || [];

  const { isFavorite, toggleFavorite } = useFavorites();

  const { data: servicesRes, isLoading: servicesLoading } = useListServices(shopId, {
    query: { enabled: !!shopId, queryKey: getListServicesQueryKey(shopId) },
  });

  const { data: supaServicesRes } = useQuery({
    queryKey: ["supa-services-detail", shopId],
    queryFn: async () => {
      if (!shopId) return [];
      try {
        const { data: sData } = await supabase
          .from('services')
          .select('*, subcategories(name, duration_minutes)')
          .eq('shop_id', shopId);

        if (sData && sData.length > 0) {
          return sData.map((s: any) => ({
            id: s.id,
            name: s.name || s.title || s.subcategories?.name || "Shërbim",
            price: parseFloat(String(s.price)) || 10,
            durationMinutes: s.duration_minutes || s.subcategories?.duration_minutes || 30
          }));
        }

        const { data: bsData } = await supabase
          .from('barber_services')
          .select('id, shop_id, subcategory_id, price, duration_minutes, subcategories(id, name, duration_minutes)')
          .eq('shop_id', shopId);

        if (bsData && bsData.length > 0) {
          return bsData.map((s: any, idx: number) => ({
            id: s.id || s.subcategories?.id || (idx + 1),
            name: s.subcategories?.name || "Shërbim",
            price: parseFloat(String(s.price)) || 10,
            durationMinutes: s.duration_minutes || s.subcategories?.duration_minutes || 30
          }));
        }
      } catch (err) {}
      return [];
    },
    enabled: !!shopId,
  });

  const apiServices = Array.isArray(servicesRes) ? servicesRes : [];
  const supaServices = Array.isArray(supaServicesRes) ? supaServicesRes : [];
  const services = apiServices.length > 0 ? apiServices : supaServices;

  const rating = shop?.rating ? Number(shop.rating).toFixed(1) : "0.0";
  const gmapsUrl = shop
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.address || ""}, ${shop.city || ""}`)}`
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

  if (!shop) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Scissors className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <h1 className="text-2xl font-extrabold">Salloni nuk u gjet</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Ky profil mund të jetë hequr ose nuk është aktiv për momentin.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/barbershops">Kthehu te berberët</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16 dark:bg-background">
      {/* Header Hero Section */}
      <section className="relative min-h-[420px] overflow-hidden bg-slate-950 text-white">
        {shop.image_url || shop.cover_image || shop.image || shop.avatar || shop.imageUrl || (Array.isArray(shop.photos) && shop.photos[0] ? shop.photos[0] : null) || (Array.isArray(shop.portfolio_urls) && shop.portfolio_urls[0] ? (typeof shop.portfolio_urls[0] === 'string' ? shop.portfolio_urls[0] : shop.portfolio_urls[0].url) : null) ? (
          <img
            src={shop.image_url || shop.cover_image || shop.image || shop.avatar || shop.imageUrl || (Array.isArray(shop.photos) && shop.photos[0] ? shop.photos[0] : null) || (Array.isArray(shop.portfolio_urls) && shop.portfolio_urls[0] ? (typeof shop.portfolio_urls[0] === 'string' ? shop.portfolio_urls[0] : shop.portfolio_urls[0].url) : null)}
            alt={shop.name}
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
        ) : (
          <div className="absolute inset-0 hero-grid opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/20" />

        <div className="container relative z-10 mx-auto flex min-h-[420px] max-w-6xl flex-col justify-between px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="w-fit rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <Link href="/barbershops">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Mbrapa
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => toggleFavorite(shop, e)}
              className="rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
              title="Ruaj në të ruajtura"
            >
              <Heart className={`h-5 w-5 ${isFavorite(shop.id) ? "fill-rose-500 text-rose-500" : "text-white"}`} />
            </Button>
          </div>

          <div className="pb-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-white text-slate-950 hover:bg-white">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Sallon Berberie
              </Badge>
              <Badge className="rounded-full bg-primary text-primary-foreground">
                <Star className="mr-1 h-3.5 w-3.5 fill-current" />
                {rating}
              </Badge>
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">{shop.name}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-white/80">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{shop.address || "Qendra"}, {shop.city || "Prishtinë"}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <main className="container mx-auto -mt-20 grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[360px_1fr]">
        <aside className="relative z-20">
          <div className="sticky top-24 overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-slate-950/10">
            <div className="p-6 text-center">
              <Avatar className="mx-auto h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={shop.image_url || shop.cover_image || shop.image || shop.avatar || shop.imageUrl || (Array.isArray(shop.photos) && shop.photos[0] ? shop.photos[0] : undefined)} alt={shop.name} />
                <AvatarFallback className="bg-primary text-4xl font-black text-primary-foreground">
                  {shop.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <h2 className="mt-5 text-2xl font-black">{shop.name}</h2>
              <p className="mt-1 text-sm font-semibold text-primary">{shop.city || "Kosovë"}</p>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-border bg-background p-3">
                  <p className="text-xl font-black">{barbers.length}</p>
                  <p className="text-[11px] font-medium text-muted-foreground">Berberë Aktivë</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-3">
                  <p className="text-xl font-black">{services.length || "-"}</p>
                  <p className="text-[11px] font-medium text-muted-foreground">Shërbime</p>
                </div>
              </div>

              <Button asChild size="lg" className="mt-6 h-12 w-full rounded-2xl font-extrabold">
                <Link href={`/book/${shop.id}`}>
                  <CalendarCheck className="mr-2 h-5 w-5" />
                  Rezervo Tani
                </Link>
              </Button>

              <div className="mt-4 space-y-2 pt-2 border-t border-border">
                {(shop.phone || shop.phone_number || shop.contact_phone) && (
                  <Button asChild variant="outline" className="w-full justify-start rounded-xl text-xs font-bold">
                    <a href={`tel:${(shop.phone || shop.phone_number || shop.contact_phone).replace(/\s+/g, '')}`}>
                      <Phone className="mr-2 h-4 w-4 text-emerald-500" />
                      <span>{shop.phone || shop.phone_number || shop.contact_phone}</span>
                    </a>
                  </Button>
                )}

                {(shop.instagram || shop.instagram_url) && (
                  <Button asChild variant="outline" className="w-full justify-start rounded-xl text-xs font-bold">
                    <a
                      href={`https://instagram.com/${String(shop.instagram || shop.instagram_url).replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="mr-2 h-4 w-4 text-pink-500" />
                      <span>@{String(shop.instagram || shop.instagram_url).replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace('@', '')}</span>
                    </a>
                  </Button>
                )}

                {(shop.website || shop.website_url) && (
                  <Button asChild variant="outline" className="w-full justify-start rounded-xl text-xs font-bold">
                    <a
                      href={String(shop.website || shop.website_url).startsWith('http') ? (shop.website || shop.website_url) : `https://${shop.website || shop.website_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="mr-2 h-4 w-4 text-indigo-500" />
                      <span className="truncate">{String(shop.website || shop.website_url).replace(/^https?:\/\//, '')}</span>
                    </a>
                  </Button>
                )}

                {(shop.address || shop.location || shop.city) && (
                  <Button asChild variant="outline" className="w-full justify-start rounded-xl text-xs font-bold">
                    <a href={gmapsUrl} target="_blank" rel="noopener noreferrer">
                      <Navigation className="mr-2 h-4 w-4 text-blue-500" />
                      <span className="truncate">{shop.address || shop.location || shop.city}</span>
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </aside>

        <div className="relative z-20 space-y-6">
          {/* Section: Rreth Sallonit */}
          <section className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-slate-950/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary">Informata</p>
                <h2 className="mt-2 text-2xl font-black">Rreth sallonit</h2>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            <p className="mt-5 leading-7 text-muted-foreground">
              {shop.description ||
                `${shop.name} është sallon i verifikuar në ${shop.city || "Kosovë"}, që ofron shërbime profesionale të prerjes dhe stilimit me staf të kualifikuar.`}
            </p>
          </section>

          {/* Section: Ekipi i Berberëve / Stafi */}
          <section className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-slate-950/5">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary">Stafi i Sallonit</p>
                <h2 className="mt-1 text-2xl font-black">Berberët tanë ({barbers.length})</h2>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>

            {barbers.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {barbers.map((barber: any) => (
                  <div
                    key={barber.id}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                  >
                    <Avatar className="h-14 w-14 border border-border">
                      <AvatarImage src={barber.avatar_url || barber.avatarUrl || undefined} alt={barber.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-black">
                        {barber.name ? barber.name.charAt(0).toUpperCase() : <UserIcon className="h-6 w-6" />}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 overflow-hidden">
                      <h3 className="truncate text-base font-black">{barber.name}</h3>
                      <p className="truncate text-xs font-semibold text-muted-foreground">
                        {barber.role || barber.specialties || "Berber Profesionist"}
                      </p>
                    </div>

                    <Button asChild size="sm" className="rounded-xl font-bold">
                      <Link href={`/book/${shop.id}?barberId=${barber.id}`}>Rezervo</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Salloni ka 1 profil kryesor të aktivizuar për rezervime.
              </div>
            )}
          </section>

          {/* Section: Shërbimet */}
          <section className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-slate-950/5">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary">Shërbimet</p>
                <h2 className="mt-2 text-2xl font-black">Zgjidh trajtimin</h2>
              </div>
              <Button asChild variant="outline" size="sm" className="hidden rounded-full font-bold sm:inline-flex">
                <Link href={`/book/${shop.id}`}>Rezervo</Link>
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {servicesLoading ? (
                [1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-24 rounded-2xl" />)
              ) : services.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground md:col-span-2">
                  Nuk ka shërbime të listuara ende për këtë dyqan.
                </div>
              ) : (
                services.slice(0, 6).map((service: any) => (
                  <div
                    key={service.id}
                    onClick={() => setLocation(`/book/${shop.id}?serviceId=${service.id}`)}
                    className="cursor-pointer rounded-2xl border border-border bg-background p-4 transition hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">{service.name}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {service.durationMinutes || 30} min
                        </p>
                      </div>
                      <p className="shrink-0 text-lg font-black text-primary">EUR {Number(service.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section: Lokacioni & Orari */}
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-slate-950/5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black">Lokacioni</h2>
              <p className="mt-2 text-sm text-muted-foreground">{shop.address || "Qendra"}, {shop.city || "Prishtinë"}</p>
              <Button asChild variant="link" className="mt-3 h-auto p-0 font-bold">
                <a href={gmapsUrl} target="_blank" rel="noopener noreferrer">Merr drejtim</a>
              </Button>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-slate-950/5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black">Orari i punës</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {shop.openTime || shop.open_time ? `${shop.openTime || shop.open_time} - ${shop.closeTime || shop.close_time}` : "09:00 - 20:00"}
              </p>
              {shop.phone ? (
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold">
                  <Phone className="h-4 w-4 text-primary" />
                  {shop.phone}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
