import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useListUsers } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users as UsersIcon, Shield, Store, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: usersRes, isLoading: apiLoading } = useListUsers({ limit: 100 });

  const { data: supaUsers = [], isLoading: supaLoading } = useQuery({
    queryKey: ["supa-admin-users"],
    queryFn: async () => {
      try {
        const { data } = await supabase.from("users").select("*").order("id", { ascending: false });
        return data || [];
      } catch (e) {
        return [];
      }
    }
  });

  const getRoleBadge = (role?: string) => {
    const r = (role || "").toLowerCase();
    switch (r) {
      case "admin":
      case "super_admin":
        return (
          <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold gap-1">
            <Shield className="w-3 h-3" /> Admin
          </Badge>
        );
      case "owner":
        return (
          <Badge className="bg-primary/20 text-primary border border-primary/40 font-bold gap-1">
            <Store className="w-3 h-3" /> Pronar Biznesi
          </Badge>
        );
      case "employee":
      case "barber":
      case "staf":
      case "staff":
        return (
          <Badge variant="outline" className="text-blue-400 border-blue-500/40 bg-blue-500/10 font-bold">
            Punëtor / Berber
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="font-medium gap-1">
            <User className="w-3 h-3 opacity-60" /> Klient
          </Badge>
        );
    }
  };

  const rawApiUsers = Array.isArray(usersRes?.data) ? usersRes.data : [];
  const users = supaUsers.length > 0 ? supaUsers : rawApiUsers;
  const isLoading = apiLoading && supaLoading;

  const filteredUsers = users.filter((u: any) =>
    (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Përdoruesit në DB</h1>
          <p className="text-muted-foreground">Listimi i të gjithë përdoruesve të regjistruar në platformë.</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 text-xs font-bold">
          {filteredUsers.length} Përdorues në total
        </Badge>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Kërko sipas emrit, email-it ose rolit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Përdoruesi</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roli</TableHead>
              <TableHead>Data e Regjistrimit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
            ) : !filteredUsers.length ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  <UsersIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Nuk u gjet asnjë përdorues.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={u.avatarUrl || u.avatar_url || undefined} />
                      <AvatarFallback className="font-bold bg-primary/10 text-primary">
                        {(u.name || u.email || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-foreground">{u.name || "Përdorues i LineUp"}</div>
                      <div className="text-xs text-muted-foreground font-mono">ID: #{u.id}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground">{u.email}</TableCell>
                  <TableCell>{getRoleBadge(u.role)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.createdAt || u.created_at ? new Date(u.createdAt || u.created_at).toLocaleDateString() : "Sot"}
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
