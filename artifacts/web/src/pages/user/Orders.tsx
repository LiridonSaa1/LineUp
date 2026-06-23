import { useListOrders } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { ShoppingBag, Package, Truck, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Orders() {
  const { user } = useAuth();
  const { data: ordersRes, isLoading } = useListOrders({ userId: user?.id, limit: 50 });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'paid': return <Badge className="bg-primary hover:bg-primary">Paid</Badge>;
      case 'shipped': return <Badge className="bg-blue-500 hover:bg-blue-600">Shipped</Badge>;
      case 'delivered': return <Badge variant="secondary">Delivered</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'paid': return <Package className="w-5 h-5 text-primary" />;
      case 'shipped': return <Truck className="w-5 h-5 text-blue-500" />;
      case 'delivered': return <CheckCircle className="w-5 h-5 text-secondary-foreground" />;
      default: return <ShoppingBag className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">My Orders</h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : !ordersRes?.data || ordersRes.data.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center flex flex-col items-center shadow-xl">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
          <p className="text-muted-foreground">You haven't ordered any products yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ordersRes.data.map(order => (
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
              
              <div className="space-y-3">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-muted-foreground">{item.quantity}x</span>
                      <span>{item.product?.name || `Product #${item.productId}`}</span>
                    </div>
                    <span className="font-medium">€{(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
                <span className="font-medium text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-primary">€{order.totalAmount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
