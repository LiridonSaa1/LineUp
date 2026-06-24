import { useState } from "react";
import { useListServices, useCreateService, useDeleteService } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

export default function DashboardServices() {
  const shopId = 1;
  const { toast } = useToast();
  const { data: servicesRes, isLoading, refetch } = useListServices(shopId);
  const createMutation = useCreateService();
  const deleteMutation = useDeleteService();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({ 
        data: { 
          name, 
          price: parseFloat(price), 
          durationMinutes: parseInt(duration) 
        } 
      });
      toast({ title: "Service added" });
      setIsOpen(false);
      setName(""); setPrice(""); setDuration("");
      refetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Error adding service" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this service?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Service deleted" });
      refetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Error deleting service" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Services</h1>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Service</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Service Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Haircut & Beard" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (€)</Label>
                  <Input type="number" value={price} onChange={e => setPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending || !name || !price || !duration} className="w-full">
                {createMutation.isPending ? "Adding..." : "Add Service"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service Name</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell></TableRow>
            ) : !servicesRes?.data.length ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No services found.</TableCell></TableRow>
            ) : (
              servicesRes.data.map(service => (
                <TableRow key={service.id}>
                  <TableCell className="font-bold">{service.name}</TableCell>
                  <TableCell>{service.durationMinutes} min</TableCell>
                  <TableCell className="text-primary font-bold">€{service.price}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(service.id)}>
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
