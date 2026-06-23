import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  ArrowLeft,
  Scissors,
  User,
  Building2,
  MapPin,
  Image,
  CreditCard,
  Plus,
  Trash2,
} from "lucide-react";

<<<<<<< HEAD
const registerSchema = z.object({
  name: z.string().min(2, "Emri duhet të ketë të paktën 2 karaktere"),
  email: z.string().email("Ju lutem vendosni një email të vlefshëm"),
  password: z.string().min(6, "Fjalëkalimi duhet të ketë të paktën 6 karaktere"),
  role: z.enum(["user", "owner"]),
=======
const userSchema = z
  .object({
    firstName: z.string().min(1, "Emri është i detyrueshëm"),
    lastName: z.string().min(1, "Mbiemri është i detyrueshëm"),
    email: z.string().email("Email i pavlefshëm"),
    phone: z.string().min(5, "Numri i telefonit është i detyrueshëm"),
    password: z.string().min(6, "Fjalëkalimi duhet të ketë të paktën 6 karaktere"),
    confirmPassword: z.string().min(6, "Konfirmo fjalëkalimin"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Fjalëkalimet nuk përputhen",
    path: ["confirmPassword"],
  });

const ownerStep1Schema = z.object({
  ownerName: z.string().min(2, "Emri i pronarit është i detyrueshëm"),
  email: z.string().email("Email i pavlefshëm"),
  phone: z.string().min(5, "Numri i telefonit është i detyrueshëm"),
  password: z.string().min(6, "Fjalëkalimi duhet të ketë të paktën 6 karaktere"),
  businessName: z.string().min(2, "Emri i biznesit është i detyrueshëm"),
  businessNumber: z.string().optional(),
>>>>>>> b2078f7 (update register and login)
});

const ownerStep2Schema = z.object({
  city: z.string().min(1, "Qyteti është i detyrueshëm"),
  address: z.string().min(3, "Adresa është e detyrueshme"),
  latitude: z.coerce.number().optional().or(z.literal("")),
  longitude: z.coerce.number().optional().or(z.literal("")),
  description: z.string().optional(),
  gender: z.enum(["male", "female", "both"], {
    required_error: "Zgjidhni gjininë",
  }),
});

const ownerStep3Schema = z.object({
  imageUrl: z.string().optional(),
  photos: z.array(z.string()).optional(),
  stripeConnectAccountId: z.string().optional(),
  iban: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;
type OwnerStep1Values = z.infer<typeof ownerStep1Schema>;
type OwnerStep2Values = z.infer<typeof ownerStep2Schema>;
type OwnerStep3Values = z.infer<typeof ownerStep3Schema>;

const STEPS_OWNER = [
  { label: "Llogaria", icon: Building2 },
  { label: "Lokacioni", icon: MapPin },
  { label: "Media & Pagesa", icon: CreditCard },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              i < current
                ? "bg-primary text-primary-foreground"
                : i === current
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/30"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i < current ? "✓" : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={`h-0.5 w-8 transition-colors ${i < current ? "bg-primary" : "bg-muted"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function UserForm() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: UserFormValues) {
    try {
<<<<<<< HEAD
      const response = await registerMutation.mutateAsync({ data });
      login(response.token, response.user);

      toast({
        title: "Llogaria u krijua!",
        description: "Mirë se erdhe në TRIM.",
=======
      const response = await registerMutation.mutateAsync({
        data: {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          password: data.password,
          role: "user",
          phone: data.phone,
        },
>>>>>>> b2078f7 (update register and login)
      });
      login(response.token, response.user);
      toast({ title: "Llogaria u krijua!", description: "Mirë se vini në TRIM." });
      setLocation("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Regjistrimi dështoi",
        description: error.message || "Kontrolloni të dhënat dhe provoni përsëri.",
      });
    }
  }

  return (
<<<<<<< HEAD
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

=======
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emri</FormLabel>
                <FormControl>
                  <Input placeholder="Besim" {...field} className="h-11 bg-card" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mbiemri</FormLabel>
                <FormControl>
                  <Input placeholder="Gashi" {...field} className="h-11 bg-card" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="ju@shembull.com" type="email" {...field} className="h-11 bg-card" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numri i telefonit</FormLabel>
              <FormControl>
                <Input placeholder="+383 44 000 000" type="tel" {...field} className="h-11 bg-card" />
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
                <Input placeholder="••••••••" type="password" {...field} className="h-11 bg-card" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Konfirmo fjalëkalimin</FormLabel>
              <FormControl>
                <Input placeholder="••••••••" type="password" {...field} className="h-11 bg-card" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-11 text-base font-semibold"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Duke krijuar llogarinë..." : "Krijo llogarinë"}
          {!registerMutation.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </form>
    </Form>
  );
}

function OwnerForm() {
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const [step1Data, setStep1Data] = useState<OwnerStep1Values | null>(null);
  const [step2Data, setStep2Data] = useState<OwnerStep2Values | null>(null);
  const [photoInputs, setPhotoInputs] = useState<string[]>([""]);

  const form1 = useForm<OwnerStep1Values>({
    resolver: zodResolver(ownerStep1Schema),
    defaultValues: {
      ownerName: "",
      email: "",
      phone: "",
      password: "",
      businessName: "",
      businessNumber: "",
    },
  });

  const form2 = useForm<OwnerStep2Values>({
    resolver: zodResolver(ownerStep2Schema),
    defaultValues: {
      city: "",
      address: "",
      latitude: "",
      longitude: "",
      description: "",
      gender: undefined,
    },
  });

  const form3 = useForm<OwnerStep3Values>({
    resolver: zodResolver(ownerStep3Schema),
    defaultValues: {
      imageUrl: "",
      stripeConnectAccountId: "",
      iban: "",
    },
  });

  function handleStep1(data: OwnerStep1Values) {
    setStep1Data(data);
    setStep(1);
  }

  function handleStep2(data: OwnerStep2Values) {
    setStep2Data(data);
    setStep(2);
  }

  async function handleStep3(data: OwnerStep3Values) {
    if (!step1Data || !step2Data) return;

    try {
      const response = await registerMutation.mutateAsync({
        data: {
          name: step1Data.ownerName,
          email: step1Data.email,
          password: step1Data.password,
          role: "owner",
          phone: step1Data.phone,
        },
      });

      login(response.token, response.user);

      const photos = photoInputs.filter((p) => p.trim() !== "");

      await fetch("/api/barbershops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${response.token}`,
        },
        body: JSON.stringify({
          name: step1Data.businessName,
          city: step2Data.city,
          address: step2Data.address,
          description: step2Data.description || null,
          phone: step1Data.phone,
          latitude: step2Data.latitude !== "" ? Number(step2Data.latitude) : null,
          longitude: step2Data.longitude !== "" ? Number(step2Data.longitude) : null,
          gender: step2Data.gender,
          businessNumber: step1Data.businessNumber || null,
          imageUrl: data.imageUrl || null,
          photos: photos.length > 0 ? photos : null,
          stripeConnectAccountId: data.stripeConnectAccountId || null,
          iban: data.iban || null,
        }),
      });

      toast({
        title: "Biznesi u regjistrua!",
        description: "Profili juaj është dërguar për aprovim. Do njoftoheni me email.",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Regjistrimi dështoi",
        description: error.message || "Kontrolloni të dhënat dhe provoni përsëri.",
      });
    }
  }

  const addPhotoInput = () => setPhotoInputs((p) => [...p, ""]);
  const removePhotoInput = (i: number) =>
    setPhotoInputs((p) => p.filter((_, idx) => idx !== i));
  const updatePhotoInput = (i: number, val: string) =>
    setPhotoInputs((p) => p.map((v, idx) => (idx === i ? val : v)));

  return (
    <div>
      <StepIndicator current={step} total={3} />

      {step === 0 && (
        <Form {...form1}>
          <form onSubmit={form1.handleSubmit(handleStep1)} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Informatat bazë
              </span>
            </div>

            <FormField
              control={form1.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emri i biznesit</FormLabel>
                  <FormControl>
                    <Input placeholder="TRIM Prishtina" {...field} className="h-11 bg-card" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form1.control}
              name="businessNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Numri i biznesit{" "}
                    <span className="text-muted-foreground font-normal">(opsionale)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="70XXXXXXX" {...field} className="h-11 bg-card" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form1.control}
              name="ownerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pronari (emri i plotë)</FormLabel>
                  <FormControl>
                    <Input placeholder="Artan Berisha" {...field} className="h-11 bg-card" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form1.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="biznesi@shembull.com"
                      type="email"
                      {...field}
                      className="h-11 bg-card"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form1.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numri i telefonit</FormLabel>
                  <FormControl>
                    <Input placeholder="+383 44 000 000" type="tel" {...field} className="h-11 bg-card" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form1.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fjalëkalimi</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" {...field} className="h-11 bg-card" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-11 font-semibold">
              Vazhdo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      )}

      {step === 1 && (
        <Form {...form2}>
          <form onSubmit={form2.handleSubmit(handleStep2)} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Lokacioni & Detajet
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
>>>>>>> b2078f7 (update register and login)
              <FormField
                control={form2.control}
                name="city"
                render={({ field }) => (
<<<<<<< HEAD
                  <FormItem className="space-y-3">
                    <FormLabel>Dëshiroj të...</FormLabel>
=======
                  <FormItem>
                    <FormLabel>Qyteti</FormLabel>
                    <FormControl>
                      <Input placeholder="Prishtinë" {...field} className="h-11 bg-card" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form2.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gjinia</FormLabel>
>>>>>>> b2078f7 (update register and login)
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-2 pt-1"
                      >
<<<<<<< HEAD
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
=======
                        {(
                          [
                            { value: "male", label: "Mashkull" },
                            { value: "female", label: "Femër" },
                            { value: "both", label: "Të dyja" },
                          ] as const
                        ).map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex-1 text-center text-xs rounded-lg border-2 py-2 px-1 cursor-pointer transition-colors ${
                              field.value === opt.value
                                ? "border-primary bg-primary/5 text-primary font-semibold"
                                : "border-muted text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            <RadioGroupItem value={opt.value} className="sr-only" />
                            {opt.label}
                          </label>
                        ))}
>>>>>>> b2078f7 (update register and login)
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form2.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresa</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Rruga Garibaldi, Nr. 12"
                      {...field}
                      className="h-11 bg-card"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form2.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
<<<<<<< HEAD
                    <FormLabel>Emri i Plotë</FormLabel>
                    <FormControl>
                      <Input placeholder="Artan Berisha" {...field} className="h-12 bg-card rounded-xl" />
=======
                    <FormLabel>
                      Gjerësia (lat){" "}
                      <span className="text-muted-foreground font-normal">(opsionale)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="42.6629"
                        type="number"
                        step="any"
                        {...field}
                        className="h-11 bg-card"
                      />
>>>>>>> b2078f7 (update register and login)
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form2.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Gjatësia (lng){" "}
                      <span className="text-muted-foreground font-normal">(opsionale)</span>
                    </FormLabel>
                    <FormControl>
<<<<<<< HEAD
                      <Input placeholder="ti@shembull.com" type="email" {...field} className="h-12 bg-card rounded-xl" />
=======
                      <Input
                        placeholder="21.1655"
                        type="number"
                        step="any"
                        {...field}
                        className="h-11 bg-card"
                      />
>>>>>>> b2078f7 (update register and login)
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

<<<<<<< HEAD
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
=======
            <FormField
              control={form2.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Përshkrimi i biznesit{" "}
                    <span className="text-muted-foreground font-normal">(opsionale)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tregoni diçka për sallon tuaj..."
                      rows={3}
                      {...field}
                      className="bg-card resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setStep(0)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kthehu
              </Button>
              <Button type="submit" className="flex-1 h-11 font-semibold">
                Vazhdo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      )}

      {step === 2 && (
        <Form {...form3}>
          <form onSubmit={form3.handleSubmit(handleStep3)} className="space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Image className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Logo & Foto
              </span>
            </div>

            <FormField
              control={form3.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Logo (URL){" "}
                    <span className="text-muted-foreground font-normal">(opsionale)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://shembull.com/logo.png"
                      {...field}
                      className="h-11 bg-card"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>
                Fotot e sallonit{" "}
                <span className="text-muted-foreground font-normal">(opsionale)</span>
              </FormLabel>
              {photoInputs.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`https://shembull.com/foto-${i + 1}.jpg`}
                    value={url}
                    onChange={(e) => updatePhotoInput(i, e.target.value)}
                    className="h-11 bg-card"
                  />
                  {photoInputs.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 shrink-0 text-destructive"
                      onClick={() => removePhotoInput(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPhotoInput}
                className="mt-1"
              >
                <Plus className="mr-1 h-3 w-3" />
                Shto foto
              </Button>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Pagesat
              </span>
            </div>

            <FormField
              control={form3.control}
              name="stripeConnectAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Stripe Connect Account ID{" "}
                    <span className="text-muted-foreground font-normal">(opsionale)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="acct_1234567890"
                      {...field}
                      className="h-11 bg-card font-mono text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form3.control}
              name="iban"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    IBAN{" "}
                    <span className="text-muted-foreground font-normal">(opsionale)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="XK05 1212 0123 4567 8906"
                      {...field}
                      className="h-11 bg-card font-mono text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kthehu
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 font-semibold"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Duke regjistruar..." : "Regjistro biznesin"}
>>>>>>> b2078f7 (update register and login)
                {!registerMutation.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}

export default function Register() {
  const [role, setRole] = useState<"user" | "owner">("user");

  const isOwner = role === "owner";

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex flex-col justify-between bg-card p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-background/50 z-0" />
        <div className="relative z-10">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold tracking-tighter text-primary">TRIM.</span>
          </Link>
        </div>
        <div className="relative z-10 max-w-lg">
          {isOwner ? (
            <>
              <h2 className="text-4xl font-bold mb-6 tracking-tight">
                Rrit biznesin tuaj me TRIM.
              </h2>
              <ul className="space-y-4 text-lg text-muted-foreground">
                <li className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">✓</div>
                  Menaxhoni terminet me lehtësi
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">✓</div>
                  Shesni produkte drejtpërdrejt online
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">✓</div>
                  Statistika dhe raporte në kohë reale
                </li>
              </ul>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-bold mb-6 tracking-tight">
                Prerje precize, pa pritje.
              </h2>
              <ul className="space-y-4 text-lg text-muted-foreground">
                <li className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">✓</div>
                  Rezervo berberat kryesorë në qytetin tënd
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">✓</div>
                  Konfirmim me OTP — pa pritje
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">✓</div>
                  Zbulo produkte ekskluzive grooming
                </li>
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="flex items-start justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8 space-y-6">
          <div className="space-y-2 text-center md:text-left">
            <Link href="/" className="inline-block mb-4 md:hidden">
              <span className="text-2xl font-bold tracking-tighter text-primary">TRIM.</span>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Krijo llogarinë</h1>
            <p className="text-muted-foreground">Bashkohuni me rrjetin kryesor të berbernave në Kosovë</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-3 text-foreground">Dëshiroj të...</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all cursor-pointer ${
                  role === "user"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/40"
                }`}
              >
                <User
                  className={`mb-2 h-6 w-6 ${role === "user" ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className={`font-semibold text-sm ${role === "user" ? "text-primary" : ""}`}>
                  Rezervoj termin
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole("owner")}
                className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all cursor-pointer ${
                  role === "owner"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/40"
                }`}
              >
                <Scissors
                  className={`mb-2 h-6 w-6 ${role === "owner" ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className={`font-semibold text-sm ${role === "owner" ? "text-primary" : ""}`}>
                  Menaxhoj sallon
                </span>
              </button>
            </div>
          </div>

          {role === "user" ? <UserForm /> : <OwnerForm />}

          <div className="text-center text-sm text-muted-foreground">
            Keni tashmë një llogari?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
<<<<<<< HEAD
              Hyr
=======
              Kyçu
>>>>>>> b2078f7 (update register and login)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
