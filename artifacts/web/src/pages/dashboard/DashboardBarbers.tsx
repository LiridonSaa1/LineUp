import { useState } from "react";
import { useListBarbers, useCreateBarber, useDeleteBarber } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Scissors, Trash2 } from "lucide-react";

export default function DashboardBarbers() {
  const shopId = 1;
  const { toast } = useToast();
  const { data: barbersRes, isLoading, refetch } = useListBarbers(shopId);
  const createMutation = useCreateBarber();
  const deleteMutation = useDeleteBarber();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [specialties, setSpecialties] = useState("");

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({ data: { name, specialties } });
      toast({ title: "Barber added" });
      setIsOpen(false);
      setName("");
      setSpecialties("");
      refetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Error adding barber" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this barber?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Barber removed" });
      refetch();
    } catch (e) {
      toast({ variant: "destructive", title: "Error removing barber" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Scissors className="w-4 h-4 mr-2" /> Add Barber</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Barber</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Specialties</Label>
                <Input value={specialties} onChange={e => setSpecialties(e.target.value)} placeholder="e.g. Fades, Beards" />
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending || !name} className="w-full">
                {createMutation.isPending ? "Adding..." : "Add Barber"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <Card key={i} className="h-32 bg-muted animate-pulse" />)
        ) : (
          barbersRes?.data.map(barber => (
            <Card key={barber.id} className="p-6 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border border-primary/20">
                  <AvatarImage src={barber.avatarUrl || undefined} />
                  <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold">{barber.name}</h3>
                  <p className="text-sm text-muted-foreground">{barber.specialties || "General Barber"}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(barber.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
