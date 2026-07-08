import { useGetOwnerStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, CreditCard } from "lucide-react";
import { useOwnerShop } from "@/hooks/use-owner-shop";

export default function DashboardSubscription() {
  const { data: ownerShop } = useOwnerShop();
  const shopId = ownerShop?.id ?? 0;
  const { data: stats } = useGetOwnerStats(
    { shopId },
    { query: { enabled: !!ownerShop } as any },
  );

  const isSubscribed = stats?.subscriptionActive;

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription Plan</h1>
        <p className="text-muted-foreground">Manage your Line UP Partner subscription.</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Current Status
          </CardTitle>
          <CardDescription>Your shop's visibility on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold mb-1">
                {isSubscribed ? "Pro Partner" : "Free Tier"}
              </div>
              <p className="text-sm text-muted-foreground">
                {isSubscribed ? "Your subscription is active." : "Upgrade to unlock more features."}
              </p>
            </div>
            {!isSubscribed && (
              <Button size="lg" className="font-bold">
                Upgrade Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Free Tier</CardTitle>
            <CardDescription>Basic visibility</CardDescription>
            <div className="text-3xl font-bold mt-4">€0<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-muted-foreground" /> Up to 50 appointments/mo</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-muted-foreground" /> Basic shop profile</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-muted-foreground" /> Max 2 barbers</li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="border-primary relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
          <CardHeader>
            <CardTitle>Pro Partner</CardTitle>
            <CardDescription>Full platform access</CardDescription>
            <div className="text-3xl font-bold mt-4 text-primary">€49<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Unlimited appointments</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Premium placement in search</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Unlimited barbers</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Sell products on Marketplace</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Advanced analytics</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
