import { useEffect, useMemo, useState } from "react";
import { useGetOwnerStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useOwnerShop } from "@/hooks/use-owner-shop";
import { Check, Crown, Loader2, ShieldCheck, Users, Zap } from "lucide-react";

interface Plan {
  id: string;
  label: string;
  workers: number;
  price: number;
  color: string;
  popular?: boolean;
  features: string[];
}

const PACKAGES: Plan[] = [
  {
    id: "2",
    label: "Starter",
    workers: 2,
    price: 5,
    color: "#4f8ef7",
    features: ["Deri 2 punetore", "Profil biznesi", "Rezervime online", "Panel menaxhimi"],
  },
  {
    id: "4",
    label: "Standard",
    workers: 4,
    price: 10,
    color: "#7c3aed",
    popular: true,
    features: ["Deri 4 punetore", "Sherbime dhe ekip", "Kliente dhe takime", "Raporte baze"],
  },
  {
    id: "6",
    label: "Pro",
    workers: 6,
    price: 15,
    color: "#059669",
    features: ["Deri 6 punetore", "Produkte marketplace", "Statistika me te plota", "Kupona dhe besnikeri"],
  },
  {
    id: "8",
    label: "Business",
    workers: 8,
    price: 20,
    color: "#d97706",
    features: ["Deri 8 punetore", "Dyqan me volum te larte", "Mjete rritjeje", "Kontroll i plote operacional"],
  },
];

async function postJson(path: string, body: unknown) {
  const token = localStorage.getItem("barber_token");
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? "Veprimi deshtoi");
  return data;
}

export default function DashboardSubscription() {
  const { toast } = useToast();
  const { data: ownerShop, isLoading: shopLoading, refetch: refetchShop } = useOwnerShop();
  const shopId = ownerShop?.id ?? 0;
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [confirmingSession, setConfirmingSession] = useState(false);
  const [confirmAttempted, setConfirmAttempted] = useState(false);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetOwnerStats(
    { shopId },
    { query: { enabled: !!ownerShop } as any },
  );

  const currentPlan = useMemo(() => {
    const workers = (ownerShop as any)?.maxBarbers ?? 2;
    return PACKAGES.find((plan) => plan.workers === workers) ?? PACKAGES[0];
  }, [(ownerShop as any)?.maxBarbers]);

  const isSubscribed = stats?.subscriptionActive;
  const rawSubscriptionStatus = String((ownerShop as any)?.subscriptionStatus ?? "inactive");
  const subscriptionStatusLabel = isSubscribed
    ? "Aktive"
    : ["past_due", "unpaid", "canceled", "cancelled"].includes(rawSubscriptionStatus)
      ? "I ndalur"
      : "Ne pritje";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const success = params.get("success");
    if (!sessionId || success !== "true" || confirmingSession || confirmAttempted) return;

    setConfirmAttempted(true);
    setConfirmingSession(true);
    postJson("/api/payments/confirm-subscription-session", { sessionId })
      .then(async () => {
        toast({ title: "Abonimi u aktivizua", description: "Pagesa u konfirmua me sukses." });
        await Promise.all([refetchShop(), refetchStats()]);
        window.history.replaceState({}, "", window.location.pathname);
      })
      .catch((error: any) => {
        toast({
          variant: "destructive",
          title: "Abonimi nuk u konfirmua",
          description: error.message,
        });
      })
      .finally(() => setConfirmingSession(false));
  }, [confirmAttempted, confirmingSession, refetchShop, refetchStats, toast]);

  async function handlePlan(plan: Plan) {
    if (!ownerShop) return;
    if (plan.id === currentPlan.id) return;

    setBusyPlan(plan.id);
    try {
      if (isSubscribed) {
        await postJson("/api/payments/change-subscription", {
          shopId: ownerShop.id,
          packageId: plan.id,
        });
        toast({
          title: "Plani u ndryshua",
          description: `Tani jeni ne LineUp ${plan.label}.`,
        });
        await Promise.all([refetchShop(), refetchStats()]);
      } else {
        const data = await postJson("/api/payments/create-subscription", {
          shopId: ownerShop.id,
          packageId: plan.id,
        });
        if (data?.url) window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gabim",
        description: error.message,
      });
    } finally {
      setBusyPlan(null);
    }
  }

  if (shopLoading || statsLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-44 rounded-3xl" />
        <div className="grid gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-80 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl shadow-slate-950/10">
        <div className="relative p-6 sm:p-8">
          <div className="absolute inset-0 hero-grid opacity-10" />
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Abonimi</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Menaxho paketat Line UP</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                Shiko paketat e njejta si te regjistrimi, kontrollo planin aktual dhe bej upgrade ose downgrade sipas numrit te punetoreve ne dyqan.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold">Plani aktual</p>
                  <p className="text-2xl font-black">LineUp {currentPlan.label}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/[0.06] p-3">
                  <p className="text-xl font-black">{currentPlan.workers}</p>
                  <p className="text-xs text-white/45">Punetore</p>
                </div>
                <div className="rounded-xl bg-white/[0.06] p-3">
                  <p className={`text-xl font-black ${isSubscribed ? "text-emerald-300" : "text-amber-200"}`}>
                    {confirmingSession ? "Duke konfirmuar..." : subscriptionStatusLabel}
                  </p>
                  <p className="text-xs text-white/45">Statusi</p>
                </div>
              </div>
              {!isSubscribed ? (
                <p className="mt-3 text-xs leading-5 text-white/50">
                  {subscriptionStatusLabel === "I ndalur"
                    ? "Pagesa mujore nuk eshte aktive, prandaj rezervimet jane ndalur."
                    : "Plani eshte zgjedhur, por aktivizohet pasi Stripe e konfirmon pagesen."}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-4">
        {PACKAGES.map((plan) => {
          const isCurrent = plan.id === currentPlan.id;
          const isSubscribedPlan = isCurrent;
          const isBusy = busyPlan === plan.id;

          return (
            <Card
              key={plan.id}
              className={`relative overflow-hidden rounded-3xl border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                isSubscribedPlan ? "border-emerald-500 shadow-emerald-500/10" : "border-border"
              }`}
            >
              {plan.popular ? (
                <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                  Top
                </div>
              ) : null}
              {isCurrent ? (
                <div className="absolute left-4 top-4 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                  Plani yt
                </div>
              ) : null}

              <CardContent className="flex h-full flex-col p-5 pt-14">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${plan.color}1a`, color: plan.color }}>
                  <Users className="h-6 w-6" />
                </div>

                <h3 className="text-xl font-black">LineUp {plan.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Deri {plan.workers} punetore</p>

                <div className="my-6">
                  <span className="text-4xl font-black" style={{ color: plan.color }}>{plan.price}€</span>
                  <span className="ml-1 text-sm font-medium text-muted-foreground">/muaj</span>
                </div>

                <ul className="mb-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <Button
                    className="h-11 w-full rounded-2xl font-black"
                    variant={isSubscribedPlan ? "outline" : "default"}
                    disabled={isBusy || isSubscribedPlan}
                    onClick={() => handlePlan(plan)}
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Duke procesuar
                      </>
                    ) : isSubscribedPlan ? (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Abonuar
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Upgrade
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Ndryshimi i planit aplikohet ne Stripe me prorata automatike. Kufiri i punetoreve ne Line UP perditesohet sapo veprimi te kryhet me sukses.
      </div>
    </div>
  );
}
