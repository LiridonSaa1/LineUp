import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Search, ShieldCheck, Euro, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminSubscriptions() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["supa-admin-subscriptions"],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("subscriptions")
          .select("*")
          .order("id", { ascending: false });
        return data || [];
      } catch (e) {
        console.error("Error fetching subscriptions:", e);
        return [];
      }
    }
  });

  const getPlanPrice = (productId?: string) => {
    const p = (productId || "").toLowerCase();
    if (p.includes("team")) return 25;
    if (p.includes("solo")) return 15;
    return 20; // default / duo
  };

  const totalRevenue = subscriptions.reduce((acc: number, sub: any) => acc + getPlanPrice(sub.product_id), 0);
  const activeSubs = subscriptions.filter((s: any) => s.status !== "canceled");

  const filteredSubs = subscriptions.filter((sub: any) => 
    (sub.customer_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sub.subscription_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sub.product_id || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Abonimet & Transaksionet Paddle</h1>
        <p className="text-muted-foreground">Monitorimi i të gjitha abonimeve të salloneve në platformë.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/60 backdrop-blur border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Të Hyrat nga Paddle</CardTitle>
            <Euro className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">€{totalRevenue}</div>
            <p className="text-xs text-muted-foreground mt-1">Gjithsej nga të gjitha abonimet</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Abonime Aktive</CardTitle>
            <ShieldCheck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeSubs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Abonime me status aktiv</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Planet Më të Përdorura</CardTitle>
            <Zap className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">
              {subscriptions.length > 0 ? "SOLO / DUO" : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Planet e spikatura nga klientët</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Kërko sipas Customer ID, Subscription ID ose Planit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Subscriptions Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer ID</TableHead>
              <TableHead>Subscription ID</TableHead>
              <TableHead>Plani (Product)</TableHead>
              <TableHead>Vlera / Muaj</TableHead>
              <TableHead>Statusi</TableHead>
              <TableHead>Data e Regjistrimit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell>
              </TableRow>
            ) : filteredSubs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Nuk u gjet asnjë abonim Paddle në bazën e të dhënave.
                </TableCell>
              </TableRow>
            ) : (
              filteredSubs.map((sub: any) => (
                <TableRow key={sub.id || sub.subscription_id}>
                  <TableCell className="font-mono text-xs">{sub.customer_id || "ctm_01..."}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{sub.subscription_id || "sub_01..."}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold uppercase tracking-wider">
                      {sub.product_id ? sub.product_id.toUpperCase() : "DUO"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-emerald-500">
                    €{getPlanPrice(sub.product_id)}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30">
                      PADDLE ACTIVE
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : "Sot"}
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
