import { useState } from "react";
import { useListProducts, useCreateProduct, useDeleteProduct } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Package } from "lucide-react";

export default function DashboardProducts() {
  const shopId = 1;
  const { toast } = useToast();
  const { data: productsRes, isLoading, refetch } = useListProducts(shopId);
  const createMutation = useCreateProduct();
  const deleteMutation = useDeleteProduct();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({ 
        data: { 
          name, 
          price: parseFloat(price), 
          stock: parseInt(stock) 
        } 
      });
      toast({ title: "Product added" });
      setIsOpen(false);
      setName(""); setPrice("");
      refetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Error adding product" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Product deleted" });
      refetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Error deleting product" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Matte Clay Pomade" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (€)</Label>
                  <Input type="number" value={price} onChange={e => setPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Initial Stock</Label>
                  <Input type="number" value={stock} onChange={e => setStock(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending || !name || !price} className="w-full">
                {createMutation.isPending ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <Card key={i} className="h-48 bg-muted animate-pulse" />)
        ) : !productsRes?.data.length ? (
          <div className="col-span-full text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
            No products listed yet.
          </div>
        ) : (
          productsRes.data.map(product => (
            <Card key={product.id} className="overflow-hidden group">
              <div className="h-32 bg-muted flex items-center justify-center relative">
                {product.imageUrl ? (
                  <img src={product.imageUrl} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-muted-foreground/30" />
                )}
                <Button 
                  size="icon" 
                  variant="destructive" 
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4">
                <h3 className="font-bold truncate">{product.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-primary font-bold">€{product.price}</span>
                  <span className="text-xs text-muted-foreground">{product.stock} in stock</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
