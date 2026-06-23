import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useUpdateUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, User } from "lucide-react";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const updateMutation = useUpdateUser();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");

  const handleSave = async () => {
    if (!user) return;
    try {
      const updated = await updateMutation.mutateAsync({
        id: user.id,
        data: { name, phone, avatarUrl }
      });
      updateUser(updated);
      toast({ title: "Profile updated", description: "Your details have been saved." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update failed", description: error.message });
    }
  };

  if (!user) return null;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <User className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
      </div>

      <div className="bg-card border border-border shadow-xl rounded-3xl p-8 space-y-8">
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg bg-muted">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-3xl font-bold text-muted-foreground">{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 w-full space-y-4">
            <div className="space-y-2">
              <Label>Avatar URL (optional)</Label>
              <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>

          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+383 4X XXX XXX" />
          </div>
          
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="h-10 px-3 py-2 bg-muted rounded-md text-sm flex items-center capitalize font-medium text-muted-foreground">
              {user.role}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="h-12 px-8 rounded-xl font-bold">
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
