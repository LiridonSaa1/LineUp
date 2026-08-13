import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useListBarbershops, useApproveBarbershop, useRejectBarbershop } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Check,
  X,
  Search,
  Power,
  Trash2,
  Store,
  Phone,
  MapPin,
  Eye,
  Users,
  Crown,
  Scissors,
  CalendarOff,
  Flag,
  CreditCard,
  Tag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const KOSOVO_HOLIDAYS_2026 = [
  { date: "1 Janar", name: "Viti i Ri", icon: "🎆" },
  { date: "7 Janar", name: "Krishtlindjet Ortodokse", icon: "⛪" },
  { date: "17 Shkurt", name: "Dita e Pavarësisë", icon: "🇽🇰" },
  { date: "30 Mars", name: "Fitër Bajrami*", icon: "🌙" },
  { date: "5 Prill", name: "Pashkët Katolike", icon: "✝️" },
  { date: "9 Prill", name: "Dita e Kushtetutës", icon: "📜" },
  { date: "12 Prill", name: "Pashkët Ortodokse", icon: "☦️" },
  { date: "1 Maj", name: "Dita Ndërkombëtare e Punës", icon: "🛠️" },
  { date: "9 Maj", name: "Dita e Evropës", icon: "🇪🇺" },
  { date: "6 Qershor", name: "Kurban Bajrami*", icon: "🐑" },
  { date: "25 Dhjetor", name: "Krishtlindjet Katolike", icon: "🎄" },
];

export default function AdminBarbershops() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShopForDetail, setSelectedShopForDetail] = useState<any | null>(null);

  const { data: shopsRes, isLoading: apiLoading, refetch } = useListBarbershops({ limit: 100 });

  const { data: supaShops = [], isLoading: supaLoading, refetch: supaRefetch } = useQuery({
    queryKey: ["supa-admin-barbershops"],
    queryFn: async () => {
      try {
        const { data } = await supabase.from("barbershops").select("*").order("id", { ascending: false });
        return data || [];
      } catch (e) {
        return [];
      }
    }
  });

  // Query barbers for selected shop in modal
  const { data: shopBarbers = [], isLoading: barbersLoading } = useQuery({
    queryKey: ["supa-shop-detail-barbers", selectedShopForDetail?.id],
    queryFn: async () => {
      if (!selectedShopForDetail?.id) return [];
      try {
        const { data } = await supabase
          .from("barbers")
          .select("*")
          .eq("shop_id", selectedShopForDetail.id);
        return data || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!selectedShopForDetail?.id,
  });

  // Query subscription for selected shop in modal
  const { data: shopSub } = useQuery({
    queryKey: ["supa-shop-detail-sub", selectedShopForDetail?.id],
    queryFn: async () => {
      if (!selectedShopForDetail?.id) return null;
      try {
        const { data } = await supabase
          .from("subscriptions")
          .select("*")
          .or(`shop_id.eq.${selectedShopForDetail.id},customer_id.eq.${selectedShopForDetail.owner_id || selectedShopForDetail.id}`)
          .order("id", { ascending: false })
          .maybeSingle();
        return data;
      } catch (e) {
        return null;
      }
    },
    enabled: !!selectedShopForDetail?.id,
  });

  // Query services for selected shop in modal
  const { data: shopServices = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["supa-shop-detail-services", selectedShopForDetail?.id],
    queryFn: async () => {
      if (!selectedShopForDetail?.id) return [];
      try {
        const { data } = await supabase
          .from("barber_services")
          .select("*")
          .eq("shop_id", selectedShopForDetail.id);
        if (data && data.length > 0) return data;

        const { data: altServices } = await supabase
          .from("services")
          .select("*")
          .eq("shop_id", selectedShopForDetail.id);
        return altServices || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!selectedShopForDetail?.id,
  });

  const approveMutation = useApproveBarbershop();
  const rejectMutation = useRejectBarbershop();

  const handleAction = async (id: number | string, action: "approve" | "reject") => {
    try {
      const numericId = typeof id === "number" ? id : parseInt(id as string, 10) || 0;
      if (action === "approve") {
        if (numericId) await approveMutation.mutateAsync({ id: numericId });
        await supabase.from("barbershops").update({ status: "active", subscription_status: "active" }).eq("id", id);
        toast({ title: "Dyqani u miratua me sukses!" });
      } else {
        if (numericId) await rejectMutation.mutateAsync({ id: numericId });
        await supabase.from("barbershops").update({ status: "rejected" }).eq("id", id);
        toast({ title: "Dyqani u refuzua." });
      }
      refetch();
      supaRefetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Veprimi dështoi" });
    }
  };

  const handleToggleStatus = async (shopId: number | string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await supabase.from("barbershops").update({ status: newStatus }).eq("id", shopId);
      toast({
        title: "Statusi u përditësua",
        description: `Salloni tani është ${newStatus === "active" ? "Aktiv" : "I Pezulluar"}.`
      });
      refetch();
      supaRefetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Nuk u mundësua ndryshimi i statusit." });
    }
  };

  const handleDeleteShop = async (shopId: number | string) => {
    try {
      await supabase.from("barbershops").delete().eq("id", shopId);
      toast({ title: "Dyqani u fshi me sukses." });
      setSelectedShopForDetail(null);
      refetch();
      supaRefetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Dështoi fshirja e dyqanit." });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">Aktiv</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-amber-500 border-amber-500/60 font-bold">Në pritje</Badge>;
      case "rejected":
        return <Badge variant="destructive">I refuzuar</Badge>;
      case "suspended":
        return <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold">I pezulluar</Badge>;
      default:
        return <Badge variant="outline">{status || "Aktiv"}</Badge>;
    }
  };

  const getPlanLabel = (shop: any, sub: any) => {
    const rawPlan = (sub?.product_id || shop?.subscription_plan || shop?.plan || "").toLowerCase();
    if (rawPlan.includes("team")) return { name: "Team", price: "25€+", limit: shop?.max_employees || shop?.maxBarbers || 3 };
    if (rawPlan.includes("solo")) return { name: "Solo", price: "15€", limit: 1 };
    return { name: "Duo", price: "20€", limit: shop?.max_employees || shop?.maxBarbers || 2 };
  };

  const rawApiShops = Array.isArray(shopsRes?.data) ? shopsRes.data : [];
  const shops = supaShops.length > 0 ? supaShops : rawApiShops;
  const isLoading = apiLoading && supaLoading;

  const filteredShops = shops.filter((shop: any) =>
    (shop.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (shop.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (shop.phone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (shop.address || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menaxhimi i Barberive</h1>
          <p className="text-muted-foreground">Shiko detajet e plota, berberët, paketën e abonimit, shërbimet dhe pushimet zyrtare.</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 text-xs font-bold">
          {filteredShops.length} Sallone në total
        </Badge>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Kërko berberinë sipas emrit, qytetit ose telefonit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Emri i Sallonit</TableHead>
              <TableHead>Vendndodhja & Kontakti</TableHead>
              <TableHead>Plani i Abonimit</TableHead>
              <TableHead>Statusi</TableHead>
              <TableHead className="text-right">Veprimet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
            ) : !filteredShops.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <Store className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Nuk u gjet asnjë berberi.
                </TableCell>
              </TableRow>
            ) : (
              filteredShops.map((shop: any) => {
                const planDetails = getPlanLabel(shop, null);

                return (
                  <TableRow key={shop.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 font-bold">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-foreground hover:underline cursor-pointer flex items-center gap-1.5" onClick={() => setSelectedShopForDetail(shop)}>
                            {shop.name}
                            <Eye className="w-3.5 h-3.5 text-primary opacity-70" />
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">ID: #{shop.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          {shop.city || "Prishtinë"} {shop.address ? `• ${shop.address}` : ""}
                        </div>
                        {shop.phone && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                            {shop.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold text-xs gap-1 border-primary/40 text-primary">
                        <Crown className="w-3 h-3 text-amber-500" />
                        LineUp {planDetails.name} ({planDetails.price})
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(shop.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 text-xs font-bold gap-1"
                          onClick={() => setSelectedShopForDetail(shop)}
                        >
                          <Eye className="w-3.5 h-3.5" /> Shiko Detajet
                        </Button>

                        {shop.status === "pending" && (
                          <>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs font-bold" onClick={() => handleAction(shop.id, "approve")}>
                              <Check className="w-3.5 h-3.5 mr-1" /> Mirato
                            </Button>
                            <Button size="sm" variant="destructive" className="h-8 text-xs font-bold" onClick={() => handleAction(shop.id, "reject")}>
                              <X className="w-3.5 h-3.5 mr-1" /> Refuzo
                            </Button>
                          </>
                        )}

                        <Button
                          size="sm"
                          variant={shop.status === "active" ? "outline" : "default"}
                          className={`h-8 text-xs font-bold ${
                            shop.status === "active"
                              ? "text-amber-500 border-amber-500/40 hover:bg-amber-500/10"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                          onClick={() => handleToggleStatus(shop.id, shop.status)}
                        >
                          <Power className="w-3.5 h-3.5 mr-1" />
                          {shop.status === "active" ? "Pezullo" : "Aktivizo"}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Fshi Berberinë</AlertDialogTitle>
                              <AlertDialogDescription>
                                A jeni të sigurt që dëshironi të fshini dyqanin <strong>"{shop.name}"</strong>? Ky veprim nuk mund të kthehet mbrapa.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Anulo</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteShop(shop.id)}>
                                Fshi
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Comprehensive Shop Details Inspector Modal */}
      {selectedShopForDetail && (
        <Dialog open={!!selectedShopForDetail} onOpenChange={(open) => { if (!open) setSelectedShopForDetail(null); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black">{selectedShopForDetail.name}</DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    {selectedShopForDetail.city || "Prishtinë"} • {selectedShopForDetail.address || "Qendra"} • Tel: {selectedShopForDetail.phone || "N/A"}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {/* 1. Selected Package Plan Card */}
              <div className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-sm">Paketa e Abonimit e Zgjedhur</span>
                  </div>
                  {getStatusBadge(selectedShopForDetail.status)}
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-background border border-border/60">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Plani Aktiv</span>
                    <p className="text-lg font-black text-primary">
                      LineUp {getPlanLabel(selectedShopForDetail, shopSub).name}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-background border border-border/60">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Vlera / Muaj</span>
                    <p className="text-lg font-black text-emerald-500">
                      {getPlanLabel(selectedShopForDetail, shopSub).price}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-background border border-border/60">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Limiti i Berberëve</span>
                    <p className="text-lg font-black text-foreground">
                      {getPlanLabel(selectedShopForDetail, shopSub).limit} Punëtorë
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Shop Barbers / Staff Section */}
              <div className="space-y-3">
                <h3 className="text-base font-black flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Stafi & Berberët e Dyqanit ({shopBarbers.length})
                </h3>

                {barbersLoading ? (
                  <Skeleton className="h-16 w-full rounded-xl" />
                ) : shopBarbers.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                    Ky dyqan nuk ka shtuar ende berberë në staf.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {shopBarbers.map((b: any) => (
                      <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {(b.name || "B").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{b.name}</div>
                          <div className="text-xs text-muted-foreground">{b.title || "Berber Professional"}</div>
                        </div>
                        <Badge className="ml-auto bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                          AKTIV
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Selected Service Categories & Services Section */}
              <div className="space-y-3">
                <h3 className="text-base font-black flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-primary" /> Kategoritë & Shërbimet e Zgjedhura ({shopServices.length})
                </h3>

                {servicesLoading ? (
                  <Skeleton className="h-16 w-full rounded-xl" />
                ) : shopServices.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                    Ky dyqan nuk ka zgjedhur ende shërbime specifike.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {shopServices.map((s: any, idx: number) => (
                      <div key={s.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-primary" />
                          <div>
                            <div className="font-bold text-xs">{s.name || s.title}</div>
                            {s.duration && <div className="text-[10px] text-muted-foreground">{s.duration} min</div>}
                          </div>
                        </div>
                        <span className="font-black text-xs text-emerald-500">€{s.price || 15}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. State & Public Holidays Section */}
              <div className="space-y-3">
                <h3 className="text-base font-black flex items-center gap-2">
                  <Flag className="w-4 h-4 text-amber-500" /> Pushimet Zyrtare & Shtetërore (Kosovë 2026)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {KOSOVO_HOLIDAYS_2026.map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 border text-[11px]">
                      <span className="truncate">{h.icon} {h.name}</span>
                      <Badge variant="outline" className="text-[9px] font-mono shrink-0 ml-1">{h.date}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
