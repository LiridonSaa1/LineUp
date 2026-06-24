import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Scissors, Star, Users, Calendar } from "lucide-react";
import logoImg from "@assets/LINE_1782305856031.png";

const loginSchema = z.object({
  email: z.string().email("Ju lutem vendosni një email të vlefshëm"),
  password: z.string().min(6, "Fjalëkalimi duhet të ketë të paktën 6 karaktere"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const stats = [
  { icon: Users, value: "12K+", label: "Klientë aktivë" },
  { icon: Scissors, value: "340+", label: "Berberë" },
  { icon: Calendar, value: "98%", label: "Rezervime sukses" },
  { icon: Star, value: "4.9", label: "Vlerësim mesatar" },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginFormValues) {
    try {
      const response = await loginMutation.mutateAsync({ data });
      login(response.token, response.user);
      toast({ title: "Mirë se u kthye!", description: "Keni hyrë me sukses." });
      if (response.user.role === "admin") setLocation("/admin");
      else if (response.user.role === "owner") setLocation("/dashboard");
      else setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hyrja dështoi",
        description: error.message || "Kontrolloni të dhënat dhe provoni përsëri.",
      });
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left: Photo panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1400&q=85"
          alt="Barbershop"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <Link href="/" className="inline-flex items-center gap-2.5 animate-fade-in">
            <img src={logoImg} alt="TRIM" className="h-9 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} />
            <span className="text-2xl font-bold tracking-tight text-white">
              TRIM<span className="text-primary">.</span>
            </span>
          </Link>

          <div className="space-y-8">
            <div className="animate-fade-up delay-100">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
                — Platforma #1 në Kosovë
              </p>
              <h2 className="text-5xl font-bold text-white leading-tight mb-4">
                Prerje precize,<br />
                <span className="text-shimmer">pa asnjë pritje.</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed max-w-sm">
                Rezervo berberët kryesorë të qytetit tënd me vetëm disa klikime.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 animate-fade-up delay-200">
              {stats.map(({ icon: Icon, value, label }, i) => (
                <div key={i} className="glass rounded-2xl p-4 border-white/10 bg-white/8 backdrop-blur-md">
                  <Icon className="w-4 h-4 text-primary mb-2" />
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="text-xs text-white/50 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl p-5 border-white/10 bg-white/8 backdrop-blur-md animate-fade-up delay-300">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0 ring-2 ring-primary/30">
                  D
                </div>
                <div>
                  <p className="text-white/80 text-sm leading-relaxed italic">
                    "Që kur u bashkuam me TRIM, dyqani ka parë 40% rritje në klientë të rinj."
                  </p>
                  <div className="mt-2.5">
                    <div className="font-semibold text-white text-sm">Dardan Krasniqi</div>
                    <div className="text-xs text-white/40">Pronar — Classic Cuts Prishtina</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-glow-pulse" />
          <div className="absolute bottom-1/3 left-1/4 w-48 h-48 bg-primary/4 rounded-full blur-3xl animate-glow-pulse delay-700" />
        </div>

        <div className="w-full max-w-sm relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 lg:hidden animate-fade-in">
            <img src={logoImg} alt="TRIM" className="h-7 w-auto object-contain" style={{ filter: "brightness(0)" }} />
            <span className="text-xl font-bold tracking-tight">TRIM<span className="text-primary">.</span></span>
          </Link>

          <div className="mb-8 animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary mb-2">
              — Mirë se u ktheve
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Hyr në llogari</h1>
            <p className="text-muted-foreground mt-1.5">Fut të dhënat tuaja për të vazhduar</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 animate-fade-up delay-100">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ti@shembull.com"
                        type="email"
                        {...field}
                        className="h-12 bg-card rounded-xl border-border/60 focus:border-primary/50 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Fjalëkalimi</FormLabel>
                      <Link href="#" className="text-xs text-primary hover:underline">
                        Keni harruar fjalëkalimin?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        {...field}
                        className="h-12 bg-card rounded-xl border-border/60 focus:border-primary/50 transition-colors"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-full shadow-md shadow-primary/20 hover:shadow-primary/30 transition-shadow"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Duke hyrë..." : "Hyr tani"}
                {!loginMutation.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-6 animate-fade-in delay-300">
            Nuk keni llogari?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Regjistrohu falas
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-border/40 animate-fade-in delay-400">
            <p className="text-xs text-muted-foreground text-center mb-3 font-medium">Demo accounts</p>
            <div className="space-y-2">
              {[
                { role: "Admin", email: "admin@trimkosova.com", pass: "admin123" },
                { role: "Owner", email: "artan@trimkosova.com", pass: "owner123" },
                { role: "Klient", email: "besim@gmail.com", pass: "user123" },
              ].map(({ role, email, pass }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => { form.setValue("email", email); form.setValue("password", pass); }}
                  className="w-full text-left px-3 py-2 rounded-lg border border-border/40 hover:border-primary/30 hover:bg-primary/3 transition-all group"
                >
                  <span className="text-xs font-semibold text-primary group-hover:text-primary">{role}</span>
                  <span className="text-xs text-muted-foreground ml-2">{email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
