import { useState } from "react";
import { useListProducts } from "@workspace/api-client-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ShoppingCart, Search, Filter, Plus, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function ProductCard({ product, index }: { product: any; index: number }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (!product.isAvailable) return;
    addItem({
      id: product.id,
      name: product.name,
      price: String(product.price),
      imageUrl: product.imageUrl,
    });
    setAdded(true);
    toast({ title: "Shtuar në shportë!", description: product.name });
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div
      className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      style={{
        animationDelay: `${index * 40}ms`,
      }}
    >
      <div className="h-64 bg-muted relative overflow-hidden p-6 flex items-center justify-center">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
            style={{ mixBlendMode: "multiply" }}
          />
        ) : (
          <ShoppingBag className="w-16 h-16 text-muted-foreground/20" />
        )}
        {!product.isAvailable && (
          <div className="absolute top-4 left-4 bg-destructive text-white text-xs font-bold px-3 py-1 rounded-full">Pa stok</div>
        )}
        {product.category && (
          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {product.category}
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-lg leading-tight mb-1 flex-1">{product.name}</h3>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
          <span className="text-xl font-bold text-foreground">€{product.price}</span>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!product.isAvailable}
            className={`rounded-full px-5 gap-1.5 transition-all duration-200 active:scale-95 ${
              added
                ? "bg-emerald-500 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {added ? (
              <><Check className="w-3.5 h-3.5" /> Shtuar!</>
            ) : (
              <><Plus className="w-3.5 h-3.5" /> Shto</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { count: cartCount } = useCart();

  const { data: productsRes, isLoading } = useListProducts({
    search: debouncedSearch || undefined,
    limit: 50,
  });

  const products = Array.isArray(productsRes)
    ? productsRes
    : Array.isArray(productsRes?.data)
      ? productsRes.data
      : [];

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Dyqani i Kozmetikës</h1>
          <p className="text-muted-foreground text-lg">Produkte premium nga berbertë më të mirë.</p>
        </div>

        <div className="flex w-full md:w-auto gap-2 items-center">
          {cartCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm font-semibold text-primary">
              <ShoppingCart className="w-4 h-4" />
              {cartCount} {cartCount === 1 ? "produkt" : "produkte"}
            </div>
          )}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Kërko produkte..."
              className="pl-9 h-12 bg-card border-border rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setDebouncedSearch(search)}
              onBlur={() => setDebouncedSearch(search)}
            />
          </div>
          <Button variant="outline" className="h-12 w-12 shrink-0 rounded-xl">
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      ) : !products.length ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border mt-8">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h2 className="text-2xl font-bold mb-2">Nuk u gjetën produkte</h2>
          <p className="text-muted-foreground">Provoni një kërkim tjetër.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product: any, i: number) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
