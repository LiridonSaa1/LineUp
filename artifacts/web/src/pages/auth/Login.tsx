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
import { ArrowRight, Scissors } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Ju lutem vendosni një email të vlefshëm"),
  password: z.string().min(6, "Fjalëkalimi duhet të ketë të paktën 6 karaktere"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    try {
      const response = await loginMutation.mutateAsync({ data });
      login(response.token, response.user);

      toast({
        title: "Mirë se u kthye!",
        description: "Keni hyrë me sukses.",
      });

      if (response.user.role === "admin") {
        setLocation("/admin");
      } else if (response.user.role === "owner") {
        setLocation("/dashboard");
      } else {
        setLocation("/");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hyrja dështoi",
        description: error.message || "Kontrolloni të dhënat dhe provoni përsëri.",
      });
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center md:text-left">
            <Link href="/" className="inline-block mb-6 md:hidden">
              <span className="text-2xl font-bold tracking-tighter text-primary">TRIM.</span>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Mirë se u kthye</h1>
            <p className="text-muted-foreground">Fut të dhënat tuaja për të hyrë</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="ti@shembull.com" type="email" {...field} className="h-12 bg-card rounded-xl" />
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
                      <Input placeholder="••••••••" type="password" {...field} className="h-12 bg-card rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Duke hyrë..." : "Hyr"}
                {!loginMutation.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm text-muted-foreground">
            Nuk keni llogari?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Regjistrohu
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden md:flex flex-col justify-between bg-card p-12 relative overflow-hidden border-l border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background/50 z-0"></div>
        <div className="relative z-10">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold tracking-tighter text-primary">TRIM.</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-border/50 shadow-xl">
            <Scissors className="h-10 w-10 text-primary mb-6" />
            <h2 className="text-2xl font-bold mb-4">Mënyra më e lehtë për të rezervuar.</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              "Që kur u bashkuam me TRIM, dyqani im ka parë 40% rritje në klientë të rinj.
              Sistemi i rezervimit është i shkëlqyer dhe klientët e mi e duan."
            </p>
            <div className="mt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-lg">
                D
              </div>
              <div>
                <div className="font-bold">Dardan Krasniqi</div>
                <div className="text-sm text-muted-foreground">Pronar, Classic Cuts Prishtina</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
