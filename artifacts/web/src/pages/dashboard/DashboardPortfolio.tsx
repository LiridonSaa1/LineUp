import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useOwnerShop } from "@/hooks/use-owner-shop";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Star,
  Upload,
  Loader2,
  XCircle,
  Filter
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent } from "@radix-ui/react-tabs";

const PORTFOLIO_CATEGORIES = [
  "Flokë & Stilim",
  "Mjekër & Estetikë",
  "Thonjtë",
  "Grim & Bukuri",
  "Kujdesi i Lëkurës",
  "Spa & Relaks",
  "Depilim",
  "Raste të Veçanta"
];

export default function DashboardPortfolio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: ownerShop, isLoading: shopLoading, refetch } = useOwnerShop();
  const shopId = ownerShop?.id ?? 0;

  const [portfolioPhotos, setPortfolioPhotos] = useState<any[]>([]);
  const [shopImageUrl, setShopImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(PORTFOLIO_CATEGORIES[0]);
  const [activeFilter, setActiveFilter] = useState("Të gjitha");

  useEffect(() => {
    if (ownerShop) {
      setPortfolioPhotos((ownerShop as any).portfolio_urls || []);
      const img = (ownerShop as any).image_card || (ownerShop as any).card_image || (ownerShop as any).image_url || "";
      setShopImageUrl(img || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1000&auto=format&fit=crop&q=80");
    }
  }, [ownerShop]);

  const uploadToSupabase = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `portfolio/${shopId}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleCardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const publicUrl = await uploadToSupabase(file);

      // Update DB
      const { error } = await supabase
        .from("barbershops")
        .update({
          image_card: publicUrl,
          card_image: publicUrl,
          image_url: publicUrl
        })
        .eq("id", shopId);

      if (error) throw error;

      setShopImageUrl(publicUrl);
      toast({ title: "Fotoja e kartelës u përditësua!" });
      refetch();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gabim gjatë ngarkimit", description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const publicUrl = await uploadToSupabase(file);
      const newPhoto = { url: publicUrl, category: selectedCategory };
      const updatedPortfolio = [...portfolioPhotos, newPhoto];

      const { error } = await supabase
        .from("barbershops")
        .update({ portfolio_urls: updatedPortfolio })
        .eq("id", shopId);

      if (error) throw error;

      setPortfolioPhotos(updatedPortfolio);
      toast({ title: "Fotoja u shtua në portofol!" });
      refetch();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gabim gjatë ngarkimit", description: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (index: number) => {
    const updated = portfolioPhotos.filter((_, i) => i !== index);
    try {
      const { error } = await supabase
        .from("barbershops")
        .update({ portfolio_urls: updated })
        .eq("id", shopId);

      if (error) throw error;

      setPortfolioPhotos(updated);
      toast({ title: "Fotoja u fshi." });
      refetch();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gabim gjatë fshirjes", description: err.message });
    }
  };

  if (shopLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  const filteredPhotos = activeFilter === "Të gjitha"
    ? portfolioPhotos
    : portfolioPhotos.filter(p => p.category === activeFilter);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Portfolio & Galeria</h1>
        <p className="text-muted-foreground mt-1">Menaxhoni imazhet që shfaqen për klientët tuaj.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Main Card Image Section */}
        <Card className="rounded-3xl border-border bg-card shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Fotoja Kryesore
            </CardTitle>
            <CardDescription>Kjo foto shfaqet në kartelën e dyqanit në faqen kryesore.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-border">
              {shopImageUrl && (
                <img
                  src={shopImageUrl}
                  alt="Shop Preview"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                 <Button variant="secondary" className="rounded-full" asChild>
                    <label className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" /> Ndrysho Foton
                      <input type="file" className="hidden" accept="image/*" onChange={handleCardImageUpload} disabled={isUploading} />
                    </label>
                 </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground bg-secondary/50 p-3 rounded-xl">
               <p>Rekomandohet raporti 16:9 për pamje më të mirë.</p>
               {isUploading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            </div>
          </CardContent>
        </Card>

        {/* Add Portfolio Photo Section */}
        <Card className="rounded-3xl border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Shto në Portofol
            </CardTitle>
            <CardDescription>Ngarkoni punët tuaja më të mira dhe kategorizojini ato.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Zgjidh Kategorinë</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Kategoria" />
                </SelectTrigger>
                <SelectContent>
                  {PORTFOLIO_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center gap-4 bg-slate-50/50">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-bold">Zgjidhni një foto për të ngarkuar</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG deri në 5MB</p>
              </div>
              <Button disabled={isUploading} asChild>
                <label className="cursor-pointer">
                  {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Ngarko Punën
                  <input type="file" className="hidden" accept="image/*" onChange={handlePortfolioUpload} />
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Gallery */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-2xl font-black">Galeria e Punëve</h3>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <Button
              size="sm"
              variant={activeFilter === "Të gjitha" ? "default" : "outline"}
              className="rounded-full px-4"
              onClick={() => setActiveFilter("Të gjitha")}
            >
              Të gjitha
            </Button>
            {PORTFOLIO_CATEGORIES.map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={activeFilter === cat ? "default" : "outline"}
                className="rounded-full px-4 whitespace-nowrap"
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {filteredPhotos.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-border bg-card">
            <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-bold text-muted-foreground">Nuk u gjet asnjë foto në këtë kategori.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {portfolioPhotos.map((photo, i) => {
              const url = typeof photo === 'string' ? photo : photo.url;
              const category = typeof photo === 'string' ? "Të tjera" : photo.category;

              if (activeFilter !== "Të gjitha" && category !== activeFilter) return null;

              return (
                <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden border border-border shadow-sm">
                  <img src={url} alt={category} className="w-full h-full object-cover transition group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <div className="flex items-center justify-between gap-2">
                       <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-md border-none text-[10px] font-black uppercase">
                         {category}
                       </Badge>
                       <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 rounded-xl"
                        onClick={() => handleDeletePhoto(i)}
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
