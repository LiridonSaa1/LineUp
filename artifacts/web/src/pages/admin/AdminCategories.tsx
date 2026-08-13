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
import { Tag, Plus, Trash2, Scissors } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function AdminCategories() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("scissors");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: ["supa-admin-categories"],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("categories")
          .select("*")
          .order("id", { ascending: true });
        return data || [];
      } catch (e) {
        console.error("Error fetching categories:", e);
        return [];
      }
    }
  });

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast({ variant: "destructive", title: "Ju lutem shkruani emrin e kategorisë." });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("categories").insert({
        name: categoryName,
        icon: categoryIcon || "scissors"
      });

      if (error) throw error;

      toast({ title: "Kategoria u krijua me sukses!" });
      setIsAddModalOpen(false);
      setCategoryName("");
      refetch();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gabim me krijimin e kategorisë", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (catId: number | string) => {
    try {
      await supabase.from("categories").delete().eq("id", catId);
      toast({ title: "Kategoria u fshi me sukses." });
      refetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Dështoi fshirja e kategorisë." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kategoritë e Shërbimeve</h1>
          <p className="text-muted-foreground">Menaxhimi i kategorive për shërbimet e berberëve në platformë.</p>
        </div>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold gap-2">
              <Plus className="w-4 h-4" /> Shto Kategori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" /> Shto Kategori Shërbimi
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCategory} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Emri i Kategorisë</label>
                <Input
                  placeholder="p.sh. Qethje, Mjekërr, Larje Flokësh..."
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Ikona</label>
                <Input
                  placeholder="scissors"
                  value={categoryIcon}
                  onChange={(e) => setCategoryIcon(e.target.value)}
                  className="mt-1"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Anulo
                </Button>
                <Button type="submit" disabled={isSubmitting} className="font-bold">
                  {isSubmitting ? "Po ruhet..." : "Krijo Kategorinë"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Kategoria</TableHead>
              <TableHead>Ikona</TableHead>
              <TableHead className="text-right">Veprimet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
            ) : !categories.length ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Nuk u gjet asnjë kategori.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat: any) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-mono text-xs font-bold">#{cat.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-bold">
                      <Scissors className="w-4 h-4 text-primary" />
                      {cat.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {cat.icon || "scissors"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteCategory(cat.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
