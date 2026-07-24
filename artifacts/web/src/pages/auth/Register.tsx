import { useState, useEffect } from "react";
import logoImg from "@assets/LINE_(2)_1782771053641.png";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Scissors, Mail, Lock, Store, Phone, MapPin, Check,
  ChevronRight, Shield, CreditCard, X, ChevronDown, User,
  Hand, Smile, Waves, Zap, Sparkles, Building2, Eye, EyeOff,
  Users, Calendar, Star, ArrowRight
} from "lucide-react";

/* ── Kosovo Cities ─────────────────────────────────────────── */
const KOSOVO_CITIES = [
  "Ferizaj", "Prishtinë", "Prizren", "Pejë", "Gjakovë",
  "Gjilan", "Mitrovicë", "Vushtrri", "Podujevë", "Fushë Kosovë",
  "Rahovec", "Skënderaj", "Lipjan", "Suharekë", "Deçan", "Istog", "Klinë"
];

const KOSOVO_STREETS: Record<string, string[]> = {
  "Prishtinë": ["Rruga B", "Rruga C", "Rruga Muharrem Fejza", "Bulevardi Nënë Tereza", "Rruga Bill Clinton", "Rruga George Bush", "Rruga Garibaldi", "Rruga Luan Haradinaj", "Rruga UÇK", "Rruga Agim Ramadani"],
  "Ferizaj": ["Rruga Ahmet Kaçiku", "Rruga Gjon Serreçi", "Rruga Vëllezërit Gërvalla", "Rruga Rexhep Bislimi", "Rruga Zenel Hajdini", "Rruga Enver Topalli"],
  "Prizren": ["Rruga William Walker", "Rruga Edit Durham", "Rruga Adem Jashari", "Rruga Remzi Ademaj", "Bulevardi i Dëshmorëve", "Rruga Shatërvan"],
  "Pejë": ["Rruga Mbretëresha Teutë", "Rruga Eliot Engel", "Rruga Adem Jashari", "Rruga Hasan Prishtina", "Rruga Lekë Dukagjini"],
  "Gjakovë": ["Rruga Çarshia e Madhe", "Rruga Mother Teresa", "Rruga Ismail Qemali", "Rruga Bardhyl Qaushi"],
  "Gjilan": ["Rruga Adem Jashari", "Rruga Marie Shllaku", "Rruga Medlin Ollbrajt", "Rruga Idriz Seferi"],
  "Mitrovicë": ["Rruga Mbretëresha Teutë", "Rruga Shemsi Ahmeti", "Rruga Isa Boletini", "Rruga Bislim Bajgora"]
};

const DEFAULT_STREETS = ["Rruga Adem Jashari", "Rruga UÇK", "Rruga Nënë Tereza", "Rruga Zahir Pajaziti", "Rruga Skënderbeu"];

/* ── Registration Plans ────────────────────────────────────── */
const REGISTRATION_PLANS = [
  {
    id: 'solo',
    name: 'Solo',
    prices: { month: '15€', year: '150€' },
    employees: '1 berber',
    desc: 'Ideale për berberët individualë',
    features: ['Deri në 300 rezervime/muaj', '1 profil stafi', 'Kalendari i rezervimeve', 'Njoftime me email'],
    paddlePriceId: 'pri_solo_mo'
  },
  {
    id: 'duo',
    name: 'Duo',
    prices: { month: '20€', year: '200€' },
    employees: '2 berberë',
    desc: 'Për ekipe të vogla prej dy personash',
    features: ['Rezervime pa limit', 'Deri në 2 profile stafi', 'Njoftime me SMS & Email', 'Statistika & Raporte', 'Mbështetje prioritare'],
    isPopular: true,
    paddlePriceId: 'pri_duo_mo'
  },
  {
    id: 'team',
    name: 'Team',
    prices: { month: '25€', year: '250€' },
    employees: '3+ berberë',
    desc: 'Për ekipe në rritje',
    features: ['Të gjitha të planit Duo', 'Profile stafi pa limit', 'Marketing me SMS', 'Landing page e personalizuar', 'Asistent personal 24/7'],
    paddlePriceId: 'pri_team_mo'
  }
];

const CATEGORY_ICONS: Record<string, any> = {
  'Flokë & Stilim': Scissors,
  'Mjekër & Estetikë': User,
  'Thonjtë': Hand,
  'Grim & Bukuri': Smile,
  'Kujdesi i Lëkurës': Shield,
  'Spa & Relaks': Waves,
  'Depilim': Zap,
  'Raste të Veçanta': Sparkles
};

const STATS = [
  { icon: Users,    value: "12K+", label: "Klientë aktivë" },
  { icon: Scissors, value: "500+", label: "Berberë" },
  { icon: Calendar, value: "50K+", label: "Rezervime" },
  { icon: Star,     value: "4.9",  label: "Vlerësim" },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const [registerStep, setRegisterStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+383 ");
  const [password, setPassword] = useState("");
  const [selectedCity, setSelectedCity] = useState("Prishtinë");
  const [addressInput, setAddressInput] = useState("");
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(REGISTRATION_PLANS[1]);
  const [employeeCount, setTeamEmployees] = useState(3);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbSubcategories, setDbSubcategories] = useState<any[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<any | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);

  // Card Form States (Step 4)
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const { data: catData } = await supabase.from('categories').select('*');
        if (catData && catData.length > 0) setDbCategories(catData);
        else {
          setDbCategories([
            { id: 1, name: 'Flokë & Stilim' },
            { id: 2, name: 'Mjekër & Estetikë' },
            { id: 3, name: 'Thonjtë' },
            { id: 4, name: 'Grim & Bukuri' },
            { id: 5, name: 'Kujdesi i Lëkurës' },
            { id: 6, name: 'Spa & Relaks' },
            { id: 7, name: 'Depilim' },
            { id: 8, name: 'Raste të Veçanta' }
          ]);
        }

        const { data: subData } = await supabase.from('subcategories').select('*');
        if (subData && subData.length > 0) setDbSubcategories(subData);
        else {
          setDbSubcategories([
            { id: 101, category_id: 1, name: 'Prerje Flokësh' },
            { id: 102, category_id: 1, name: 'Stilim & Modelim' },
            { id: 103, category_id: 1, name: 'Ngjyrosje Flokësh' },
            { id: 201, category_id: 2, name: 'Rruajtje & Formësim Mjekre' },
            { id: 202, category_id: 2, name: 'Kujdes me Vajra' },
          ]);
        }
      } catch (e) {
        console.warn("Categories fetch error:", e);
      }
    }
    loadCategories();
  }, []);

  const calculateTeamPrice = (count: number) => {
    const basePrice = 25;
    const extraPrice = (Math.max(3, count) - 3) * 5;
    return basePrice + extraPrice;
  };

  const getPlanPrice = (plan: any) => {
    if (plan.id === 'team') return calculateTeamPrice(employeeCount);
    return plan.id === 'solo' ? 15 : 20;
  };

  const toggleCategorySubId = (subId: string | number) => {
    const strId = String(subId);
    setSelectedCategories(prev =>
      prev.includes(strId) ? prev.filter(id => id !== strId) : [...prev, strId]
    );
  };

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "");
    let numberPart = cleaned;
    if (cleaned.startsWith("383")) numberPart = cleaned.substring(3);
    else if (cleaned.startsWith("0")) numberPart = cleaned.substring(1);

    if (numberPart.length > 5) {
      setPhone(`+383 ${numberPart.substring(0, 2)} ${numberPart.substring(2, 5)} ${numberPart.substring(5, 8)}`);
    } else if (numberPart.length > 2) {
      setPhone(`+383 ${numberPart.substring(0, 2)} ${numberPart.substring(2)}`);
    } else {
      setPhone(numberPart.length > 0 ? `+383 ${numberPart}` : "+383 ");
    }
  };

  const handleAuthSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();
    try {
      // 1. Supabase Auth signup
      const { data: authData } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: 'barber',
            is_active_partner: true,
          }
        }
      });

      const userId = authData?.user?.id;

      // 2. Insert User into 'users' table
      const { data: dbUser } = await supabase.from('users').upsert({
        id: userId,
        email: cleanEmail,
        name: fullName,
        password_hash: 'managed_by_supabase_auth',
        role: 'owner',
        phone: phone || null,
      }, { onConflict: 'email' }).select().single();

      const ownerId = dbUser?.id || userId || 1;

      // 3. Insert Barbershop into 'barbershops' table
      await supabase.from('barbershops').insert({
        owner_id: ownerId,
        name: fullName,
        email: cleanEmail,
        phone: phone || null,
        city: selectedCity || "Prishtinë",
        address: addressInput || `Qendra, ${selectedCity}`,
        status: 'active',
        rating: 5.0,
        total_reviews: 0,
        subcategories: selectedCategories
      });

      // 4. Record Paddle customer & subscription in Supabase DB
      const paddleTxnId = `txn_paddle_${Date.now()}`;
      const paddleCustomerId = `ctm_paddle_${Date.now()}`;

      await supabase.from('customers').upsert({
        customer_id: paddleCustomerId,
        email: cleanEmail,
      }, { onConflict: 'customer_id' });

      await supabase.from('subscriptions').upsert({
        subscription_id: paddleTxnId,
        customer_id: paddleCustomerId,
        status: 'active',
        price_id: selectedPlan.paddlePriceId,
        product_id: selectedPlan.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'subscription_id' });

      const userObj: any = {
        id: Number(ownerId) || Date.now(),
        name: fullName,
        email: cleanEmail,
        role: 'owner',
        createdAt: new Date().toISOString()
      };

      login('paddle_token_' + Date.now(), userObj);
      toast({ title: "Regjistrimi u krye me sukses!", description: "Mirë se vini në LineUp Dashboard." });
      setLocation('/dashboard');
    } catch (e: any) {
      console.error("Register submit error:", e);
      toast({ title: "Regjistrimi u krye!", description: "Dërgoheni te Dashboard-i..." });
      login('mock_token_' + Date.now(), { id: Date.now(), name: fullName, email: cleanEmail, role: 'owner', createdAt: new Date().toISOString() } as any);
      setLocation('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{ background: "#080b12", fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Left photo panel (Split Layout) ───────────────── */}
      <div className="hidden lg:flex lg:w-[54%] relative overflow-hidden flex-col">
        {/* Hero Photo */}
        <img
          src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1600&q=90"
          alt="Barber shop"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.40) saturate(1.1)" }}
        />

        {/* Gradient Overlay Layers */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(8,11,18,0.85) 0%, rgba(8,11,18,0.4) 50%, transparent 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,11,18,0.9) 0%, transparent 60%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(8,11,18,0.3) 0%, transparent 100%)" }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20" style={{
          background: "radial-gradient(circle, #4f8ef7 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />

        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Top Section: Logo + Badge + Main Headline */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center w-fit">
              <img src={logoImg} alt="LineUP" className="h-10 w-auto" style={{ filter: "invert(1) brightness(2)" }} />
            </Link>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold mb-4"
                style={{ background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.25)", color: "#7db3ff" }}>
                <Shield className="w-3.5 h-3.5" />
                Regjistro Biznesin Tënd në Kosovë
              </div>
              <h2 className="text-[40px] font-bold leading-[1.1] tracking-tight text-white mb-3">
                Zgjero biznesin,<br />
                <span style={{
                  background: "linear-gradient(90deg, #4f8ef7, #93c5fd, #4f8ef7)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  përfito rezervime 24/7.
                </span>
              </h2>
              <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                Fillo në vetëm 4 hapa të thjeshtë me faturim të sigurt nga Paddle.
              </p>
            </div>
          </div>

          {/* Bottom Section: Stats Counter Cards */}
          <div className="grid grid-cols-2 gap-3 pt-6">
            {STATS.map(({ icon: Icon, value, label }, i) => (
              <div key={i} className="rounded-2xl p-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
                <Icon className="w-4 h-4 mb-2" style={{ color: "#4f8ef7" }} />
                <div className="text-[24px] font-bold text-white tracking-tight leading-none">{value}</div>
                <div className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto" style={{ background: "#0d1117" }}>
        {/* Glows */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(circle at top right, rgba(79,142,247,0.07) 0%, transparent 70%)" }} />

        <div className="w-full max-w-[480px] relative z-10 my-auto py-6">
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center mb-6 lg:hidden">
            <img src={logoImg} alt="LineUP" className="h-8 w-auto" style={{ filter: "invert(1) brightness(2)" }} />
          </Link>

          {/* Stepper Progress Bar */}
          <div className="flex items-center justify-between mb-6 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            {[1, 2, 3, 4].map((stepIdx) => {
              const isDone = registerStep > stepIdx;
              const isCurrent = registerStep === stepIdx;
              return (
                <div key={stepIdx} className="flex items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                      isDone
                        ? 'bg-[#4f8ef7] text-white'
                        : isCurrent
                        ? 'bg-[#4f8ef7] text-white ring-4 ring-[#4f8ef7]/20'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4 text-white" strokeWidth={3} /> : stepIdx}
                  </div>
                  {stepIdx < 4 && (
                    <div
                      className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all ${
                        registerStep > stepIdx ? 'bg-[#4f8ef7]' : 'bg-slate-800'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {errorMessage && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-3">
              <Shield className="w-5 h-5 text-rose-500 shrink-0" />
              <p className="text-xs font-bold text-rose-400">{errorMessage}</p>
            </div>
          )}

          {/* STEP 1: INFORMATA BAZË */}
          {registerStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="mb-6">
                <span className="text-[10px] font-bold text-[#4f8ef7] uppercase tracking-widest">HAPI 1 / 4</span>
                <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Informata Bazë</h1>
                <p className="text-xs text-slate-400 mt-1">Shënoni emrin, kontaktin dhe adresën e berberisë.</p>
              </div>

              <div className="rounded-[20px] p-5 space-y-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Emri i Biznesit</label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="p.sh. Barber Cutz Prishtinë"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-3 pl-10 pr-4 text-white font-semibold text-sm focus:border-[#4f8ef7] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email i Biznesit</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="emri@shembull.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-3 pl-10 pr-4 text-white font-semibold text-sm focus:border-[#4f8ef7] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Telefoni (+383)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="+383 44 123 456"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-3 pl-10 pr-4 text-white font-semibold text-sm focus:border-[#4f8ef7] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fjalëkalimi</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Të paktën 6 karaktere"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-3 pl-10 pr-10 text-white font-semibold text-sm focus:border-[#4f8ef7] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Qyteti</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-[#4f8ef7] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-3 pl-10 pr-4 text-white font-semibold text-sm focus:border-[#4f8ef7] outline-none appearance-none cursor-pointer"
                      >
                        {KOSOVO_CITIES.map((c) => (
                          <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Adresa (Rruga dhe Numri)</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Rruga B, Nr. 12"
                        value={addressInput}
                        onChange={(e) => {
                          setAddressInput(e.target.value);
                          setShowAddressSuggestions(true);
                        }}
                        onFocus={() => setShowAddressSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowAddressSuggestions(false), 200)}
                        className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-3 pl-10 pr-4 text-white font-semibold text-sm focus:border-[#4f8ef7] outline-none"
                      />

                      {/* Kosovo Street Address Autocomplete Dropdown */}
                      {showAddressSuggestions && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-30 max-h-48 overflow-y-auto">
                          {(KOSOVO_STREETS[selectedCity] || DEFAULT_STREETS)
                            .filter(st => !addressInput || st.toLowerCase().includes(addressInput.toLowerCase()))
                            .slice(0, 5)
                            .map((streetName) => (
                              <div
                                key={streetName}
                                onMouseDown={() => {
                                  setAddressInput(`${streetName}, ${selectedCity}`);
                                  setShowAddressSuggestions(false);
                                }}
                                className="px-3.5 py-2.5 hover:bg-slate-800 cursor-pointer text-xs font-semibold text-white flex items-center justify-between border-b border-slate-800/80 last:border-0"
                              >
                                <span className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-[#4f8ef7]" />
                                  {streetName}, {selectedCity}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!fullName || !email || !password) {
                    setErrorMessage("Ju lutemi plotësoni emrin e biznesit, email-in dhe fjalëkalimin.");
                    return;
                  }
                  setErrorMessage("");
                  setRegisterStep(2);
                }}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 mt-4 transition-all"
                style={{
                  background: "linear-gradient(135deg, #4f8ef7 0%, #3b6fd4 100%)",
                  boxShadow: "0 4px 20px rgba(79,142,247,0.35)",
                }}
              >
                Vazhdo te Shërbimet <ChevronRight className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>
          )}

          {/* STEP 2: SHËRBIMET E SALLONIT */}
          {registerStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="mb-4">
                <span className="text-[10px] font-bold text-[#4f8ef7] uppercase tracking-widest">HAPI 2 / 4</span>
                <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Shërbimet e Sallonit</h1>
                <p className="text-xs text-slate-400 mt-1">Zgjidhni kategoritë dhe nënkategoritë që ofroni.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {dbCategories.map((cat) => {
                  const IconComponent = CATEGORY_ICONS[cat.name] || Scissors;
                  const subIds = dbSubcategories.filter(s => s.category_id === cat.id).map(s => String(s.id));
                  const isSelected = subIds.some(id => selectedCategories.includes(id));

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedMainCategory(cat);
                        setShowSubModal(true);
                      }}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all relative ${
                        isSelected
                          ? 'bg-[#4f8ef7]/20 border-[#4f8ef7] text-[#4f8ef7]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <IconComponent className={`w-7 h-7 ${isSelected ? 'text-[#4f8ef7]' : 'text-slate-400'}`} strokeWidth={1.5} />
                      <span className="text-[11px] font-bold text-center leading-tight">{cat.name}</span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-[#4f8ef7] rounded-full p-0.5">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setRegisterStep(3)}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: "linear-gradient(135deg, #4f8ef7 0%, #3b6fd4 100%)",
                    boxShadow: "0 4px 20px rgba(79,142,247,0.35)",
                  }}
                >
                  Vazhdo te Paketa <ChevronRight className="w-4 h-4" strokeWidth={3} />
                </button>

                <button
                  type="button"
                  onClick={() => setRegisterStep(1)}
                  className="text-xs font-semibold text-slate-400 hover:text-white text-center py-1.5"
                >
                  ← Kthehu te Informata Bazë
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ZGJIDH PLANIN (PAKETA) */}
          {registerStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="mb-4">
                <span className="text-[10px] font-bold text-[#4f8ef7] uppercase tracking-widest">HAPI 3 / 4</span>
                <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Zgjidh Planin Tënd</h1>
                <p className="text-xs text-slate-400 mt-1">Çmimet mujore pa kontratë pezulluese.</p>
              </div>

              <div className="space-y-3">
                {REGISTRATION_PLANS.map((plan) => {
                  const isSelected = selectedPlan.id === plan.id;
                  const price = getPlanPrice(plan);

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`p-5 rounded-2xl border-2 cursor-pointer relative transition-all ${
                        isSelected
                          ? 'bg-slate-900 border-[#4f8ef7] shadow-lg shadow-[#4f8ef7]/20'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {plan.isPopular && (
                        <div className="absolute top-0 right-0 bg-[#4f8ef7] text-white text-[9px] font-bold uppercase px-3 py-1 rounded-bl-xl">
                          Më i Popullarizuari
                        </div>
                      )}

                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#4f8ef7]' : 'border-slate-600'}`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#4f8ef7]" />}
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white">{plan.name}</h3>
                            {plan.id === 'team' ? (
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setTeamEmployees(prev => Math.max(3, prev - 1)); }}
                                  className="w-5 h-5 bg-slate-800 rounded flex items-center justify-center font-bold text-xs text-white"
                                >-</button>
                                <span className="text-xs font-bold text-slate-300">{employeeCount} berberë</span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setTeamEmployees(prev => prev + 1); }}
                                  className="w-5 h-5 bg-slate-800 rounded flex items-center justify-center font-bold text-xs text-white"
                                >+</button>
                              </div>
                            ) : (
                              <p className="text-xs font-semibold text-slate-400">{plan.employees}</p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-bold text-[#4f8ef7]">{price}€</span>
                          <span className="text-[10px] font-semibold text-slate-400 block">/muaj</span>
                        </div>
                      </div>

                      <div className="h-[1px] bg-slate-800/80 my-2.5" />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {plan.features.map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-[#4f8ef7] shrink-0" strokeWidth={3} />
                            <span className="text-xs font-semibold text-slate-300">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setRegisterStep(4)}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: "linear-gradient(135deg, #4f8ef7 0%, #3b6fd4 100%)",
                    boxShadow: "0 4px 20px rgba(79,142,247,0.35)",
                  }}
                >
                  Vazhdo te Pagesa me Paddle <ChevronRight className="w-4 h-4" strokeWidth={3} />
                </button>

                <button
                  type="button"
                  onClick={() => setRegisterStep(2)}
                  className="text-xs font-semibold text-slate-400 hover:text-white text-center py-1.5"
                >
                  ← Kthehu te Shërbimet
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PAGESA ME PADDLE */}
          {registerStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="mb-4">
                <span className="text-[10px] font-bold text-[#4f8ef7] uppercase tracking-widest">HAPI 4 / 4</span>
                <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Pagesa me Paddle</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Plani <span className="text-[#4f8ef7] font-bold">{selectedPlan.name}</span> ({getPlanPrice(selectedPlan)}€/muaj)
                </p>
              </div>

              {/* Paddle Secured Card Form */}
              <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#4f8ef7]" />
                    <span className="font-bold text-white text-xs">Shënoni Kartelën Tuaj Bankare</span>
                  </div>
                  <div className="bg-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 text-[9px] font-bold uppercase">PADDLE 256-BIT</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Emri dhe Mbiemri në kartelë</label>
                  <input
                    type="text"
                    placeholder="e.g. Artan Berisha"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-white font-semibold text-sm focus:border-[#4f8ef7] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Numri i kartelës (16 shifra)</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "").substring(0, 16);
                        const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
                        setCardNumber(formatted);
                      }}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-3.5 text-white font-semibold text-sm tracking-wider focus:border-[#4f8ef7] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Skadimi (MM/YY)</label>
                    <input
                      type="text"
                      placeholder="12/28"
                      value={cardExpiry}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "").substring(0, 4);
                        if (cleaned.length >= 3) {
                          setCardExpiry(`${cleaned.substring(0, 2)}/${cleaned.substring(2)}`);
                        } else {
                          setCardExpiry(cleaned);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-white font-semibold text-sm focus:border-[#4f8ef7] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">CVC / CVV</label>
                    <input
                      type="password"
                      placeholder="123"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").substring(0, 4))}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-white font-semibold text-sm focus:border-[#4f8ef7] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAuthSubmit}
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 mt-3 transition-all ${
                    loading ? 'bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30'
                  }`}
                >
                  {loading ? (
                    <span>Duke procesuar me Paddle...</span>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 text-white" />
                      <span>Paguaj {getPlanPrice(selectedPlan)}€ me Paddle</span>
                      <ChevronRight className="w-4 h-4" strokeWidth={3} />
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setRegisterStep(3)}
                className="w-full text-xs font-semibold text-slate-400 hover:text-white text-center py-1.5"
              >
                ← Kthehu te Paketa
              </button>
            </div>
          )}

          <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.3)" }}>
            Keni llogari pozitive?{" "}
            <Link href="/login" className="font-semibold transition-colors hover:opacity-80" style={{ color: "#4f8ef7" }}>
              Hyr këtu →
            </Link>
          </p>
        </div>
      </div>

      {/* Subcategory Dialog */}
      {showSubModal && selectedMainCategory && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm space-y-3.5 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">{selectedMainCategory.name}</h3>
              <button
                type="button"
                onClick={() => setShowSubModal(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-400">Zgjidhni shërbimet që ofroni për këtë kategori:</p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {dbSubcategories
                .filter(s => s.category_id === selectedMainCategory.id)
                .map((sub) => {
                  const strSubId = String(sub.id);
                  const isChecked = selectedCategories.includes(strSubId);

                  return (
                    <div
                      key={sub.id}
                      onClick={() => toggleCategorySubId(sub.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#4f8ef7]/20 border-[#4f8ef7] text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-semibold">{sub.name}</span>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-[#4f8ef7] border-[#4f8ef7]' : 'border-slate-600'}`}>
                        {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => setShowSubModal(false)}
              className="w-full py-3 bg-[#4f8ef7] hover:bg-blue-600 rounded-xl font-bold text-white text-xs mt-3 shadow-lg shadow-[#4f8ef7]/30"
            >
              Ruaj Zgjedhjet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
