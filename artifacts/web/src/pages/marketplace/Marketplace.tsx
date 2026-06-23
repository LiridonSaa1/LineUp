import { useState } from "react";
import { useListProducts } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Marketplace() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const { data: productsRes, isLoading } = useListProducts({
    search: debouncedSearch || undefined,
    limit: 50
  });

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Grooming Market</h1>
          <p className="text-muted-foreground text-lg">Premium products from top barbershops.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-9 h-12 bg-card border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setDebouncedSearch(search)}
              onBlur={() => setDebouncedSearch(search)}
            />
          </div>
          <Button variant="outline" className="h-12 w-12 shrink-0">
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      ) : !productsRes?.data || productsRes.data.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border mt-8">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h2 className="text-2xl font-bold mb-2">No products found</h2>
          <p className="text-muted-foreground">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productsRes.data.map(product => (
            <div key={product.id} className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all">
              <div className="h-64 bg-muted relative overflow-hidden p-6 flex items-center justify-center">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-multiply" />
                ) : (
                  <ShoppingBag className="w-16 h-16 text-muted-foreground/20" />
                )}
                {!product.isAvailable && (
                  <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">Out of Stock</div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-xs text-primary font-bold mb-1 uppercase tracking-wider">{product.category || "General"}</div>
                <h3 className="font-bold text-lg leading-tight mb-2 flex-1">{product.name}</h3>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                  <span className="text-xl font-bold text-foreground">€{product.price}</span>
                  <Button size="sm" variant="secondary" disabled={!product.isAvailable} className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors rounded-full px-4">
                    Add
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
