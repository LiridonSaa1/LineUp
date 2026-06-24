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
  User,
  Building2,
  MapPin,
  Image,
  CreditCard,
  Plus,
  Trash2,
} from "lucide-react";
import logoImg from "@assets/LINE_1782305856031.png";

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
  stripeConnectAccountId: z.string().optional(),
  iban: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;
type OwnerStep1Values = z.infer<typeof ownerStep1Schema>;
type OwnerStep2Values = z.infer<typeof ownerStep2Schema>;
type OwnerStep3Values = z.infer<typeof ownerStep3Schema>;

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
      const response = await registerMutation.mutateAsync({
        data: {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          password: data.password,
          role: "user",
          phone: data.phone,
        },
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
                Lokacioni &amp; Detajet
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form2.control}
                name="city"
                render={({ field }) => (
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
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-1 pt-1"
                      >
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
                    <Input placeholder="Rruga Garibaldi, Nr. 12" {...field} className="h-11 bg-card" />
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
                    <FormLabel>
                      Gjerësia (lat){" "}
                      <span className="text-muted-foreground font-normal">(opsionale)</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="42.6629" type="number" step="any" {...field} className="h-11 bg-card" />
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
                      <Input placeholder="21.1655" type="number" step="any" {...field} className="h-11 bg-card" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
              <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setStep(0)}>
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
                Logo &amp; Foto
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
                    <Input placeholder="https://shembull.com/logo.png" {...field} className="h-11 bg-card" />
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
              <Button type="button" variant="outline" size="sm" onClick={addPhotoInput} className="mt-1">
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
                    <Input placeholder="acct_1234567890" {...field} className="h-11 bg-card font-mono text-sm" />
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
                    <Input placeholder="XK05 1212 0123 4567 8906" {...field} className="h-11 bg-card font-mono text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kthehu
              </Button>
              <Button type="submit" className="flex-1 h-11 font-semibold" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Duke regjistruar..." : "Regjistro biznesin"}
                {!registerMutation.isPending && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}

const OWNER_PHOTO = "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1200&q=80";
const USER_PHOTO  = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&q=80";

export default function Register() {
  const [role, setRole] = useState<"user" | "owner">("user");
  const isOwner = role === "owner";
  const photo = isOwner ? OWNER_PHOTO : USER_PHOTO;

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Left photo panel ── */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden">
        <img
          src={photo}
          alt="Barbershop"
          key={photo}
          className="absolute inset-0 w-full h-full object-cover animate-bg-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/55 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Floating decorative particles */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 rounded-full bg-primary/60 animate-particle-1" />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 rounded-full bg-white/30 animate-particle-2" />
        <div className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 rounded-full bg-primary/40 animate-particle-3" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="inline-flex items-center gap-2 animate-fade-in">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/40">
              <img src={logoImg} alt="TRIM" className="w-5 h-5 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              TRIM<span className="text-primary">.</span>
            </span>
          </Link>

          <div className="space-y-7 animate-fade-up delay-100">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">
                — {isOwner ? "Për pronarë biznesi" : "Platforma #1 në Kosovë"}
              </p>
              <h2 className="text-4xl font-bold text-white leading-tight mb-3">
                {isOwner ? (
                  <>Rrit biznesin<br /><span className="text-shimmer">me TRIM.</span></>
                ) : (
                  <>Prerje precize,<br /><span className="text-shimmer">pa asnjë pritje.</span></>
                )}
              </h2>
              <p className="text-white/55 text-base leading-relaxed">
                {isOwner
                  ? "Menaxho terminet, shes produkte dhe monitoro statistikat — gjithçka nga një vend."
                  : "Rezervo berberët kryesorë të qytetit tënd me vetëm disa klikime."}
              </p>
            </div>

            <ul className="space-y-3">
              {(isOwner
                ? ["Menaxhoni terminet me lehtësi", "Shesni produkte drejtpërdrejt online", "Statistika & raporte në kohë reale"]
                : ["Rezervo barberat kryesorë", "Konfirmim me OTP — menjëherë", "Zbulo produkte ekskluzive grooming"]
              ).map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/25 flex items-center justify-center shrink-0 border border-primary/30">
                    <span className="text-primary text-xs font-bold">✓</span>
                  </div>
                  <span className="text-white/75 text-sm">{item}</span>
                </li>
              ))}
            </ul>

            <div className="glass rounded-2xl p-4 border-white/10 bg-white/6 backdrop-blur-md animate-fade-up delay-300">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0 ring-2 ring-primary/25">
                  {isOwner ? "A" : "B"}
                </div>
                <div>
                  <p className="text-white/80 text-xs italic leading-relaxed">
                    {isOwner
                      ? '"TRIM e bëri menaxhimin e dyqanit tim shumë më të lehtë."'
                      : '"Rezervoj terminin brenda 30 sekondash. Fantastike!"'}
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    {isOwner ? "Artan B. — Pronar, Prishtinë" : "Besim G. — Klient i rregullt"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div className="flex-1 flex items-start justify-center p-8 overflow-y-auto relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary/4 rounded-full blur-3xl animate-glow-pulse" />
        </div>

        <div className="w-full max-w-md py-8 space-y-6 relative z-10">
          <div className="space-y-1 animate-fade-up">
            <Link href="/" className="inline-flex items-center gap-2 mb-5 lg:hidden">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <img src={logoImg} alt="TRIM" className="w-4 h-4 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
              </div>
              <span className="text-xl font-bold tracking-tight">TRIM<span className="text-primary">.</span></span>
            </Link>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">— Regjistrim</p>
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
                  role === "user" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/40"
                }`}
              >
                <User className={`mb-2 h-6 w-6 ${role === "user" ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`font-semibold text-sm ${role === "user" ? "text-primary" : ""}`}>
                  Rezervoj termin
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRole("owner")}
                className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all cursor-pointer ${
                  role === "owner" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/40"
                }`}
              >
                <Scissors className={`mb-2 h-6 w-6 ${role === "owner" ? "text-primary" : "text-muted-foreground"}`} />
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
              Kyçu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
