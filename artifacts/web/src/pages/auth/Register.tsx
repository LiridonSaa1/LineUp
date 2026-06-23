import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useRegister } from "@workspace/api-client-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Scissors, User } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Emri duhet të ketë të paktën 2 karaktere"),
  email: z.string().email("Ju lutem vendosni një email të vlefshëm"),
  password: z.string().min(6, "Fjalëkalimi duhet të ketë të paktën 6 karaktere"),
  role: z.enum(["user", "owner"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "user",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    try {
      const response = await registerMutation.mutateAsync({ data });
      login(response.token, response.user);

      toast({
        title: "Llogaria u krijua!",
        description: "Mirë se erdhe në TRIM.",
      });

      if (response.user.role === "owner") {
        setLocation("/dashboard");
      } else {
        setLocation("/");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Regjistrimi dështoi",
        description: error.message || "Kontrolloni të dhënat dhe provoni përsëri.",
      });
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex flex-col justify-between bg-card p-12 relative overflow-hidden border-r border-border">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-background/50 z-0"></div>
        <div className="relative z-10">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold tracking-tighter text-primary">TRIM.</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-bold mb-6 tracking-tight">Pamje të shkëlqyera, zero pritje.</h2>
          <ul className="space-y-4 text-lg text-muted-foreground">
            <li className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold">✓</div>
              Rezervo berberët më të mirë në qytetin tënd
            </li>
            <li className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold">✓</div>
              Pa radhë, pa pritje
            </li>
            <li className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold">✓</div>
              Zbulo produkte ekskluzive kozmetike
            </li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center md:text-left">
            <Link href="/" className="inline-block mb-6 md:hidden">
              <span className="text-2xl font-bold tracking-tighter text-primary">TRIM.</span>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Krijo një llogari</h1>
            <p className="text-muted-foreground">Bashkohu me rrjetin më të mirë të berberive në Kosovë</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Dëshiroj të...</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <FormItem>
                          <FormControl>
                            <RadioGroupItem value="user" className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-transparent p-4 hover:bg-card peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                            <User className="mb-2 h-6 w-6" />
                            <span className="font-semibold">Rezervo Prerje</span>
                          </FormLabel>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <RadioGroupItem value="owner" className="peer sr-only" />
                          </FormControl>
                          <FormLabel className="flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-transparent p-4 hover:bg-card peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                            <Scissors className="mb-2 h-6 w-6" />
                            <span className="font-semibold">Menaxho Dyqanin</span>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emri i Plotë</FormLabel>
                    <FormControl>
                      <Input placeholder="Artan Berisha" {...field} className="h-12 bg-card rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <FormLabel>Fjalëkalimi</FormLabel>
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
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Duke krijuar llogarinë..." : "Regjistrohu"}
                {!registerMutation.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm text-muted-foreground">
            Keni tashmë një llogari?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Hyr
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
