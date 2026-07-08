import { useState } from "react";
import { useListBarbers } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useOwnerShop } from "@/hooks/use-owner-shop";
import { Lock, Mail, Scissors, Trash2, UserPlus, Users } from "lucide-react";

async function authedJson(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("barber_token");
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("API server nuk po pergjigjet. Kontrollo qe backend-i ne portin 8080 eshte ndezur.");
  }

  const raw = await response.text();
  const data = raw ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : null;
  if (!response.ok) {
    const message = response.status === 401
      ? "Session-i ka skaduar. Ju lutem kyçuni përsëri."
      : data?.error ?? raw ?? `HTTP ${response.status} ${response.statusText}`;
    throw new Error(message);
  }
  return data;
}

export default function DashboardBarbers() {
  const { data: ownerShop, isLoading: shopLoading } = useOwnerShop();
  const shopId = ownerShop?.id ?? 0;
  const maxBarbers = (ownerShop as any)?.maxBarbers ?? 2;
  const { toast } = useToast();
  const { data: barbersRes, isLoading, refetch } = useListBarbers(shopId, {
    query: { enabled: !!ownerShop } as any,
  });
  const barbers = Array.isArray(barbersRes) ? barbersRes : [];
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [accountBarber, setAccountBarber] = useState<any | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const limitReached = barbers.length >= maxBarbers;
  const canSubmit = firstName.trim() && lastName.trim() && email.trim() && password.length >= 6 && !limitReached;

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setSpecialties("");
  };

  const handleCreate = async () => {
    if (!canSubmit) return;
    setIsCreating(true);
    try {
      await authedJson(`/api/barbershops/${shopId}/barbers`, {
        method: "POST",
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim(),
          password,
          specialties: specialties.trim() || undefined,
        }),
      });
      toast({ title: "Barberi u krijua", description: "U shtua si user dhe ne ekipin e dyqanit." });
      setIsOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Nuk u krijua barber-i",
        description: error?.message ?? "Provoni perseri.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("A deshironi ta largoni kete barber? User-i i lidhur do te fshihet gjithashtu.")) return;
    setDeletingId(id);
    try {
      await authedJson(`/api/barbershops/${shopId}/barbers/${id}`, { method: "DELETE" });
      toast({ title: "Barberi u largua" });
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gabim",
        description: error?.message ?? "Barberi nuk u largua.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateAccount = async () => {
    if (!accountBarber || !accountEmail.trim() || accountPassword.length < 6) return;
    setIsCreatingAccount(true);
    try {
      await authedJson(`/api/barbershops/${shopId}/barbers/${accountBarber.id}/user`, {
        method: "POST",
        body: JSON.stringify({
          email: accountEmail.trim(),
          password: accountPassword,
        }),
      });
      toast({ title: "Llogaria u krijua", description: `${accountBarber.name} tani mund te kyçet si barber.` });
      setAccountBarber(null);
      setAccountEmail("");
      setAccountPassword("");
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Nuk u krijua llogaria",
        description: error?.message ?? "Provoni perseri.",
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden rounded-3xl border-border bg-slate-950 text-white shadow-xl shadow-slate-950/10">
          <CardContent className="relative p-6">
            <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/25 blur-3xl" />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Ekipi</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Menaxho barberet</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
                Cdo barber krijohet si user per login dhe ruhet edhe ne tabelen e barber-eve per rezervime.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border bg-card shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground">Limiti i paketes</p>
                <p className="text-3xl font-black">{barbers.length}/{maxBarbers}</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (barbers.length / maxBarbers) * 100)}%` }}
              />
            </div>
            {limitReached ? (
              <p className="mt-3 text-sm font-semibold text-destructive">
                Keni arritur limitin. Beni upgrade te Abonimi per te shtuar me shume barber.
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Mund te shtoni edhe {maxBarbers - barbers.length} barber.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-black">Barberet e dyqanit</h3>
          <p className="text-sm text-muted-foreground">Keta usera mund te perdorin panelin e barber-it.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button disabled={limitReached} className="rounded-2xl font-bold">
              <UserPlus className="mr-2 h-4 w-4" />
              Shto barber
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Shto barber te ri</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Emri</Label>
                  <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="p.sh. Ardian" />
                </div>
                <div className="space-y-2">
                  <Label>Mbiemri</Label>
                  <Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="p.sh. Krasniqi" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</Label>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="barber@email.com" />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Lock className="h-4 w-4" /> Password</Label>
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 6 karaktere" />
              </div>

              <div className="space-y-2">
                <Label>Specialitetet</Label>
                <Input value={specialties} onChange={(event) => setSpecialties(event.target.value)} placeholder="Fade, Beard, Classic cut" />
              </div>

              <Button onClick={handleCreate} disabled={isCreating || !canSubmit} className="h-11 rounded-2xl font-black">
                {isCreating ? "Duke krijuar..." : "Krijo barber"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!accountBarber} onOpenChange={(open) => !open && setAccountBarber(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Krijo llogari per {accountBarber?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={accountEmail} onChange={(event) => setAccountEmail(event.target.value)} placeholder="barber@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} placeholder="Minimum 6 karaktere" />
            </div>
            <Button
              onClick={handleCreateAccount}
              disabled={isCreatingAccount || !accountEmail.trim() || accountPassword.length < 6}
              className="h-11 w-full rounded-2xl font-black"
            >
              {isCreatingAccount ? "Duke krijuar..." : "Krijo llogari"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shopLoading || isLoading ? (
          [1, 2, 3].map((item) => <Skeleton key={item} className="h-32 rounded-3xl" />)
        ) : barbers.length === 0 ? (
          <Card className="rounded-3xl border-dashed md:col-span-2 xl:col-span-3">
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
              <Scissors className="mb-4 h-10 w-10 text-muted-foreground/40" />
              <h4 className="font-black">Ende nuk ka barber</h4>
              <p className="mt-1 text-sm text-muted-foreground">Shtoni barber-in e pare per te filluar rezervimet.</p>
            </CardContent>
          </Card>
        ) : (
          barbers.map((barber: any) => (
            <Card key={barber.id} className="group rounded-3xl border-border bg-card shadow-sm">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="flex min-w-0 items-center gap-4">
                  <Avatar className="h-14 w-14 border border-primary/20">
                    <AvatarImage src={barber.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 font-black text-primary">{barber.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="truncate font-black">{barber.name}</h3>
                    <p className="truncate text-sm text-muted-foreground">{barber.specialties || "General Barber"}</p>
                    {barber.user?.email ? (
                      <p className="mt-1 truncate text-xs font-bold text-primary">{barber.user.email}</p>
                    ) : barber.userId ? (
                      <p className="mt-1 text-xs font-bold text-primary">User login aktiv</p>
                    ) : (
                      <p className="mt-1 text-xs font-bold text-amber-600">Pa llogari login</p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!barber.user?.email && !barber.userId ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs font-bold"
                      onClick={() => {
                        setAccountBarber(barber);
                        setAccountEmail("");
                        setAccountPassword("");
                      }}
                    >
                      Krijo llogari
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive opacity-100 hover:bg-destructive/10 lg:opacity-0 lg:group-hover:opacity-100"
                    disabled={deletingId === barber.id}
                    onClick={() => handleDelete(barber.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
