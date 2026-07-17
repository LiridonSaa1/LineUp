import { useEffect, useRef, useState } from "react";
import { useListOrders } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { ShoppingBag, Package, Truck, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

async function postJson(url: string, body: unknown) {
  const token = localStorage.getItem("barber_token");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "Request failed");
  return data;
}

export default function Orders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const confirmAttempted = useRef(false);
  const [confirming, setConfirming] = useState(false);

  const { data: ordersRes, isLoading, refetch } = useListOrders({ userId: user?.id, limit: 50 });

  // On redirect back from Stripe with ?success=true&session_id=..., confirm the order
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const success = params.get("success");
    if (!sessionId || success !== "true" || confirmAttempted.current) return;

    confirmAttempted.current = true;
    setConfirming(true);
    postJson("/api/payments/confirm-order-session", { sessionId })
      .then(async () => {
        toast({ title: "Porosia u konfirmua", description: "Pagesa u krye me sukses." });
        await refetch();
        queryClient.invalidateQueries();
        window.history.replaceState({}, "", window.location.pathname);
      })
      .catch((err: any) => {
        toast({ variant: "destructive", title: "Konfirmimi dështoi", description: err.message });
      })
      .finally(() => setConfirming(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":      return <Badge className="bg-primary hover:bg-primary">Paid</Badge>;
      case "shipped":   return <Badge className="bg-blue-500 hover:bg-blue-600">Shipped</Badge>;
      case "delivered": return <Badge variant="secondary">Delivered</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      default:          return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":      return <Package className="w-5 h-5 text-primary" />;
      case "shipped":   return <Truck className="w-5 h-5 text-blue-500" />;
      case "delivered": return <CheckCircle className="w-5 h-5 text-secondary-foreground" />;
      default:          return <ShoppingBag className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">My Orders</h1>

      {(isLoading || confirming) ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : !ordersRes?.data || ordersRes.data.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center flex flex-col items-center shadow-xl">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
          <p className="text-muted-foreground">You haven't ordered any products yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ordersRes.data.map((order) => (
            <div key={order.id} className="bg-card border border-border rounded-2xl p-6 shadow-md hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-4 border-b border-border/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    {getStatusIcon(order.status)}
                  </div>
                  <div>
                    <h3 className="font-bold">Order #{order.id}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {getStatusBadge(order.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
