import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  DialogTrigger,
  DialogFooter
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
import { Megaphone, Search, Check, X, Trash2, Power, Plus, Image as ImageIcon, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function AdminAds() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Ad Form State
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("Prishtinë");
  const [address, setAddress] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState("20");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: ads = [], isLoading, refetch } = useQuery({
    queryKey: ["supa-admin-ads"],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("advertisements")
          .select("*")
          .order("id", { ascending: false });
        return data || [];
      } catch (e) {
        console.error("Error fetching advertisements:", e);
        return [];
      }
    }
  });

  const handleUpdateStatus = async (adId: number | string, newStatus: string) => {
    try {
      await supabase.from("advertisements").update({ status: newStatus }).eq("id", adId);
      toast({
        title: "Reklama u përditësua!",
        description: `Statusi tani është "${newStatus.toUpperCase()}".`
      });
      refetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Dështoi përditësimi i statusit." });
    }
  };

  const handleDeleteAd = async (adId: number | string) => {
    try {
      await supabase.from("advertisements").delete().eq("id", adId);
      toast({ title: "Reklama u fshi me sukses." });
      refetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Dështoi fshirja e reklamës." });
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      toast({ variant: "destructive", title: "Ju lutem shkruani emrin e biznesit." });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("advertisements").insert({
        business_name: businessName,
        city: city,
        address: address || "Qendra",
        price: parseFloat(price) || 20,
        image_url: imageUrl || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1000&auto=format&fit=crop",
        status: "active",
        plan_id: "banner_promo"
      });

      if (error) throw error;

      toast({ title: "Reklama u krijua me sukses!", description: "Ajo tani është aktive në aplikacion." });
      setIsAddModalOpen(false);
      setBusinessName("");
      setAddress("");
      setImageUrl("");
      refetch();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gabim me krijimin e reklamës", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAds = ads.filter((ad: any) =>
    (ad.business_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ad.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ad.address || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">AKTIVE</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-amber-500 border-amber-500/60 font-bold">NË PRITJE</Badge>;
      case "rejected":
        return <Badge variant="destructive">E REFUZUAR</Badge>;
      default:
        return <Badge variant="outline">{status || "AKTIVE"}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reklamat & Ofertat Promo</h1>
          <p className="text-muted-foreground">Menaxho bannert promocionale që shfaqen në faqen kryesore të aplikacionit mobile & web.</p>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold gap-2">
              <Plus className="w-4 h-4" /> Krijo Reklamë të Re
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" /> Shto Reklamë Promocionale
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAd} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Emri i Biznesit / Oferta</label>
                <Input
                  placeholder="p.sh. Barbershop Exclusive - 20% Zbritje"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Qyteti</label>
                  <Input
                    placeholder="Prishtinë"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Çmimi (€)</label>
                  <Input
                    type="number"
                    placeholder="20"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Adresa / Lokacioni</label>
                <Input
                  placeholder="Rruga B, Prishtinë"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Image URL (Foto e Bannerit)</label>
                <Input
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="mt-1"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Anulo
                </Button>
                <Button type="submit" disabled={isSubmitting} className="font-bold">
                  {isSubmitting ? "Po ruhet..." : "Krijo Reklamën"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Kërko reklamën sipas emrit ose qytetit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Biznesi / Oferta</TableHead>
              <TableHead>Lokacioni</TableHead>
              <TableHead>Çmimi</TableHead>
              <TableHead>Statusi</TableHead>
              <TableHead className="text-right">Veprimet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
            ) : !filteredAds.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Nuk u gjet asnjë reklamë në bazën e të dhënave.
                </TableCell>
              </TableRow>
            ) : (
              filteredAds.map((ad: any) => (
                <TableRow key={ad.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {ad.image_url ? (
                        <img src={ad.image_url} alt="" className="w-12 h-9 rounded-lg object-cover border border-border shrink-0" />
                      ) : (
                        <div className="w-12 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-foreground">{ad.business_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">ID: #{ad.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      {ad.city || "Prishtinë"} {ad.address ? `• ${ad.address}` : ""}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-emerald-500 text-xs">
                    €{ad.price || 20}
                  </TableCell>
                  <TableCell>{getStatusBadge(ad.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {ad.status === "pending" && (
                        <>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs font-bold" onClick={() => handleUpdateStatus(ad.id, "active")}>
                            <Check className="w-3.5 h-3.5 mr-1" /> Mirato
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8 text-xs font-bold" onClick={() => handleUpdateStatus(ad.id, "rejected")}>
                            <X className="w-3.5 h-3.5 mr-1" /> Refuzo
                          </Button>
                        </>
                      )}

                      <Button
                        size="sm"
                        variant={ad.status === "active" ? "outline" : "default"}
                        className={`h-8 text-xs font-bold ${
                          ad.status === "active"
                            ? "text-amber-500 border-amber-500/40 hover:bg-amber-500/10"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                        onClick={() => handleUpdateStatus(ad.id, ad.status === "active" ? "suspended" : "active")}
                      >
                        <Power className="w-3.5 h-3.5 mr-1" />
                        {ad.status === "active" ? "Pezullo" : "Aktivizo"}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Fshi Reklamën</AlertDialogTitle>
                            <AlertDialogDescription>
                              A jeni të sigurt që dëshironi të fshini reklamën <strong>"{ad.business_name}"</strong>?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anulo</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteAd(ad.id)}>
                              Fshi
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
