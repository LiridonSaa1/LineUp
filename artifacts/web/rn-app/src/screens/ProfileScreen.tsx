import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, Image, TextInput, Dimensions, ActivityIndicator, Keyboard, Alert } from "react-native";
import { User, Settings, CreditCard, Bell, Shield, HelpCircle, LogOut, ChevronRight, Calendar, Heart, Award, Store, Mail, Lock, Eye, EyeOff, UserPlus, LogIn, Phone, ChevronDown, Search, ArrowLeft, Check, Zap, Sparkles, MapPin, X } from "lucide-react-native";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { BlurView } from 'expo-blur';
import { supabase } from "@/config/supabase";
const KOSOVO_CITIES = [
  { formatted_address: "Ferizaj", city: "Ferizaj", street: "", postal_code: "70000", country: "Kosovë", latitude: 42.3703, longitude: 21.1559 },
  { formatted_address: "Prishtinë", city: "Prishtinë", street: "", postal_code: "10000", country: "Kosovë", latitude: 42.6629, longitude: 21.1655 },
  { formatted_address: "Prizren", city: "Prizren", street: "", postal_code: "20000", country: "Kosovë", latitude: 42.2139, longitude: 20.7397 },
  { formatted_address: "Pejë", city: "Pejë", street: "", postal_code: "30000", country: "Kosovë", latitude: 42.6593, longitude: 20.2883 },
  { formatted_address: "Gjakovë", city: "Gjakovë", street: "", postal_code: "50000", country: "Kosovë", latitude: 42.3803, longitude: 20.4308 },
  { formatted_address: "Gjilan", city: "Gjilan", street: "", postal_code: "60000", country: "Kosovë", latitude: 42.4635, longitude: 21.4678 },
  { formatted_address: "Mitrovicë", city: "Mitrovicë", street: "", postal_code: "40000", country: "Kosovë", latitude: 42.8914, longitude: 20.8660 },
  { formatted_address: "Vushtrri", city: "Vushtrri", street: "", postal_code: "42000", country: "Kosovë", latitude: 42.8231, longitude: 20.9675 },
  { formatted_address: "Podujevë", city: "Podujevë", street: "", postal_code: "11000", country: "Kosovë", latitude: 42.9114, longitude: 21.1903 },
  { formatted_address: "Fushë Kosovë", city: "Fushë Kosovë", street: "", postal_code: "12000", country: "Kosovë", latitude: 42.6340, longitude: 21.0963 },
  { formatted_address: "Rahovec", city: "Rahovec", street: "", postal_code: "21000", country: "Kosovë", latitude: 42.3994, longitude: 20.6553 },
  { formatted_address: "Skënderaj", city: "Skënderaj", street: "", postal_code: "41000", country: "Kosovë", latitude: 42.7478, longitude: 20.7878 },
  { formatted_address: "Lipjan", city: "Lipjan", street: "", postal_code: "14000", country: "Kosovë", latitude: 42.5217, longitude: 21.1258 },
  { formatted_address: "Suharekë", city: "Suharekë", street: "", postal_code: "23000", country: "Kosovë", latitude: 42.3581, longitude: 20.8250 },
  { formatted_address: "Deçan", city: "Deçan", street: "", postal_code: "51000", country: "Kosovë", latitude: 42.5353, longitude: 20.2878 },
  { formatted_address: "Istog", city: "Istog", street: "", postal_code: "31000", country: "Kosovë", latitude: 42.7808, longitude: 20.4875 },
  { formatted_address: "Klinë", city: "Klinë", street: "", postal_code: "32000", country: "Kosovë", latitude: 42.6225, longitude: 20.5786 },
];

const { width } = Dimensions.get("window");

const REGISTRATION_PLANS = [
  { id: 'starter', name: 'Starter Plan', price: '19€', period: 'muaj', features: ['Deri në 300 rezervime/muaj', '1 profil stafi', 'Kalendari i rezervimeve', 'Njoftime me email'] },
  { id: 'pro', name: 'Pro Plan', price: '39€', period: 'muaj', features: ['Rezervime pa limit', 'Deri në 5 profile stafi', 'Njoftime me SMS & Email', 'Statistika & Raporte', 'Mbështetje prioritare'], isPopular: true },
  { id: 'elite', name: 'Elite Plan', price: '59€', period: 'muaj', features: ['Të gjitha të planit Pro', 'Profile stafi pa limit', 'Marketing me SMS', 'Landing page e personalizuar', 'Asistent personal 24/7'] }
];

interface ProfileScreenProps {
  user: any;
  onLogin: (userData?: any) => void;
  onLogout: () => void;
  onOpenRegisterShop: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogin, onLogout, onOpenRegisterShop }) => {
  const [stats, setStats] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<'client' | 'barber'>('barber');
  const [phone, setPhone] = useState("");
  const [selectedCity, setSelectedCity] = useState("Prishtinë");
  const [citySearch, setCitySearch] = useState("");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{ address: string; lat: number; lng: number } | null>(null);

  // Registration steps and plans
  const [registerStep, setRegisterStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(REGISTRATION_PLANS[1]);

  // Paddle Checkout states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const [shops, cities, appointments] = await Promise.all([
          supabase.from('barbershops').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('barbershops').select('city').eq('status', 'active'),
          supabase.from('appointments').select('*', { count: 'exact', head: true }).neq('status', 'cancelled')
        ]);

        const uniqueCities = new Set(cities.data?.map(s => s.city));

        setStats({
          activeShops: shops.count || 0,
          citiesCount: uniqueCities.size || 0,
          confirmedAppointments: appointments.count || 0
        });
      } catch (e) {
        console.warn("Failed to fetch stats from Supabase:", e);
      }
    }
    loadStats();
  }, []);

  const handleAuthSubmit = async () => {
    if (!email || !password) {
      setErrorMessage("Ju lutemi plotësoni email-in dhe fjalëkalimin.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      if (authMode === 'register') {
        // --- REAL REGISTER WITH SUPABASE ---
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'barber',
            }
          }
        });

        if (signUpError) {
          setErrorMessage(signUpError.message || "Ndodhi një gabim gjatë regjistrimit.");
          setLoading(false);
          return;
        }

        if (!signUpData || !signUpData.user) {
          setErrorMessage("Regjistrimi dështoi. Ju lutemi provoni përsëri.");
          setLoading(false);
          return;
        }

        // Insert into users table in Supabase with correct auth ID
        try {
          await supabase.from('users').upsert({
            id: signUpData.user.id,
            email: email.trim().toLowerCase(),
            name: fullName || email.split('@')[0],
            role: 'barber',
          });
        } catch (dbErr) {
          console.warn("Error writing to users table:", dbErr);
        }

        // Insert into barbershops table in Supabase
        try {
          await supabase.from('barbershops').insert({
            id: signUpData.user.id,
            name: fullName,
            email: email.trim().toLowerCase(),
            phone: phone,
            city: selectedCity,
            address: selectedPlace?.address || "",
            latitude: selectedPlace?.lat || 42.6629,
            longitude: selectedPlace?.lng || 21.1655,
            status: 'active',
            rating: 5.0,
            reviews: 0,
            plan_id: selectedPlan.id
          });
        } catch (dbErr) {
          console.warn("Error writing to barbershops table:", dbErr);
        }

        onLogin({
          id: signUpData.user.id,
          name: fullName,
          email: email.trim().toLowerCase(),
          role: 'barber',
        });
      } else {
        // --- REAL LOGIN WITH SUPABASE ---
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        // Query users or barbershops table in Supabase
        const { data: dbUser } = await supabase.from('users').select('*').eq('email', email.trim().toLowerCase()).maybeSingle();
        const { data: dbBarber } = await supabase.from('barbershops').select('*').eq('email', email.trim().toLowerCase()).maybeSingle();

        if (dbUser) {
          onLogin({
            id: dbUser.id,
            name: dbUser.name || dbUser.full_name || email.split('@')[0],
            email: dbUser.email,
            role: dbUser.role || 'client'
          });
        } else if (dbBarber) {
          onLogin({
            id: dbBarber.id,
            name: dbBarber.name,
            email: dbBarber.email || email,
            role: 'barber'
          });
        } else if (authData?.user) {
          onLogin({
            id: authData.user.id,
            name: authData.user.user_metadata?.full_name || email.split('@')[0],
            email: authData.user.email,
            role: authData.user.user_metadata?.role || role
          });
        } else if (authError) {
          setErrorMessage("E-mail ose fjalëkalimi është i gabuar. Ju lutem kontrolloni të dhënat.");
          setLoading(false);
          return;
        } else {
          onLogin({
            name: fullName || email.split('@')[0],
            email: email.trim().toLowerCase(),
            role: role
          });
        }
      }
    } catch (e: any) {
      console.warn("Auth submit error:", e);
      setErrorMessage(e?.message || "Ndodhi një gabim gjatë kyçjes.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    if (authMode === 'register') {
      console.log("ProfileScreen: Rendering temporary debug register screen");
      return (
        <View className="flex-1 bg-slate-100 justify-center items-center p-6">
          <Store size={48} color="#3473ef" className="mb-4" />
          <Text className="text-xl font-black text-[#161719] mb-2">Regjistro Biznesin</Text>
          <Text className="text-slate-500 text-center mb-6">Nëse e shihni këtë ekran, kalimi i modaliteteve po funksionon pa probleme!</Text>
          <TouchableOpacity
            onPress={() => { Keyboard.dismiss(); setAuthMode('login'); }}
            className="bg-[#3473ef] px-6 py-3.5 rounded-2xl shadow-md"
          >
            <Text className="text-white font-black text-sm">Kthehu te Kyçja</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView className="flex-1 bg-[#F5F5F5]" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Background Decorative Ambient Blobs */}
        <View className="absolute top-[-50] left-[-50] w-72 h-72 bg-[#3473ef]/15 rounded-full blur-3xl" />
        <View className="absolute top-[200] right-[-80] w-80 h-80 bg-[#f47458]/10 rounded-full blur-3xl" />

        {/* Auth Header */}
        <View className="pt-16 pb-8 px-6 items-center">
           <View className="w-20 h-20 bg-[#3473ef] rounded-3xl items-center justify-center shadow-xl shadow-[#3473ef]/30 border border-white mb-4">
              <User size={40} color="white" strokeWidth={2.5} />
           </View>

           <Text className="text-3xl font-black text-[#161719] text-center tracking-tight mb-2">LineUp</Text>
           <Text className="text-[#64748B] font-bold text-center text-sm leading-5 px-6">
             Platforma #1 për rezervimin e salloneve & berberëve në Kosovë.
           </Text>
        </View>

        <View className="px-6">
           <View className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/60 border border-slate-100">
              {/* Tab Switcher */}
              <View className="flex-row bg-slate-100 p-1.5 rounded-2xl mb-6">
                <TouchableOpacity
                  onPress={() => { Keyboard.dismiss(); console.log("ProfileScreen: tab switcher clicked: login"); setAuthMode('login'); setErrorMessage(""); }}
                  className={`flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2 ${authMode === 'login' ? 'bg-white shadow-sm border border-slate-200/80' : ''}`}
                >
                  <LogIn size={16} color={authMode === 'login' ? '#3473ef' : '#64748B'} strokeWidth={2.5} />
                  <Text className={`font-black text-xs uppercase tracking-wider ${authMode === 'login' ? 'text-[#161719]' : 'text-[#64748B]'}`}>Kyçu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { Keyboard.dismiss(); console.log("ProfileScreen: tab switcher clicked: register"); setAuthMode('register'); setErrorMessage(""); }}
                  className={`flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2 ${authMode === 'register' ? 'bg-white shadow-sm border border-slate-200/80' : ''}`}
                >
                  <UserPlus size={16} color={authMode === 'register' ? '#3473ef' : '#64748B'} strokeWidth={2.5} />
                  <Text className={`font-black text-xs uppercase tracking-wider ${authMode === 'register' ? 'text-[#161719]' : 'text-[#64748B]'}`}>Krijo Llogari</Text>
                </TouchableOpacity>
              </View>

              {/* Error Alert */}
              {errorMessage !== "" && (
                <View className="bg-rose-50 border border-rose-200 p-4 rounded-2xl mb-6 flex-row items-center">
                  <Shield size={18} color="#ef4444" className="mr-3" />
                  <Text className="text-rose-700 font-bold text-xs flex-1">{errorMessage}</Text>
                </View>
              )}

              {/* Form Inputs */}
              <View className="gap-y-4 mb-6">
                 <View className="bg-slate-50 rounded-2xl px-4 h-14 flex-row items-center border border-slate-200">
                    <Mail size={20} color="#8789A3" />
                    <TextInput
                      placeholder="E-mail adresa"
                      value={email}
                      onChangeText={setEmail}
                      className="flex-1 ml-3 font-bold text-[#161719]"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                 </View>

                 <View className="bg-slate-50 rounded-2xl px-4 h-14 flex-row items-center border border-slate-200">
                    <Lock size={20} color="#8789A3" />
                    <TextInput
                      placeholder="Fjalëkalimi"
                      value={password}
                      onChangeText={setPassword}
                      className="flex-1 ml-3 font-bold text-[#161719]"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                       {showPassword ? <EyeOff size={20} color="#8789A3" /> : <Eye size={20} color="#8789A3" />}
                    </TouchableOpacity>
                 </View>
              </View>

              <TouchableOpacity
                onPress={handleAuthSubmit}
                disabled={loading}
                activeOpacity={0.9}
                className="bg-black h-14 rounded-2xl items-center justify-center shadow-lg active:scale-98"
              >
                 {loading ? (
                   <ActivityIndicator color="white" />
                 ) : (
                   <Text className="text-white text-base font-black tracking-wide">
                     Kyçu Tani
                   </Text>
                 )}
              </TouchableOpacity>

              <TouchableOpacity className="mt-4 items-center">
                 <Text className="text-[#3473ef] font-black text-xs">Harruat fjalëkalimin?</Text>
              </TouchableOpacity>
           </View>
        </View>

        {/* Security Guarantee Badge */}
        <View className="px-6 mt-6">
           <View className="bg-white p-4 rounded-2xl border border-slate-200/80 flex-row items-center shadow-sm">
              <Shield size={18} color="#3473ef" className="mr-3" />
              <Text className="flex-1 text-[#64748B] font-bold text-xs leading-4">
                 Të dhënat tuaja ruhen në mënyrë të sigurt me enkriptim të avancuar.
              </Text>
           </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#ECEEF2]" showsVerticalScrollIndicator={false}>
      {/* Top Purple Header Banner */}
      <View className="bg-[#3473ef] pt-16 pb-12 px-6 rounded-b-[40px] items-center">
        <View className="w-28 h-28 rounded-full bg-white p-1 shadow-xl mb-4 relative">
          <Image 
            source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" }} 
            className="w-full h-full rounded-full object-cover" 
          />
          <View className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 rounded-full border-2 border-white items-center justify-center" />
        </View>

        <Text className="text-2xl font-black text-white tracking-tight">{user.name}</Text>
        <View className="bg-white/20 px-4 py-1 rounded-full mt-2 border border-white/30">
          <Text className="text-white font-extrabold text-[11px]">Anëtar Premium</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View className="px-6 -mt-6">
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex-row justify-around">
          <View className="items-center">
            <Text className="text-[#161719] font-black text-2xl">{stats?.activeShops || "15"}</Text>
            <Text className="text-[#8789A3] text-[10px] font-extrabold uppercase mt-1">Sallone</Text>
          </View>
          <View className="w-[1px] h-10 bg-slate-100 self-center" />
          <View className="items-center">
            <Text className="text-[#161719] font-black text-2xl">{stats?.citiesCount || "7"}</Text>
            <Text className="text-[#8789A3] text-[10px] font-extrabold uppercase mt-1">Qytete</Text>
          </View>
          <View className="w-[1px] h-10 bg-slate-100 self-center" />
          <View className="items-center">
            <Text className="text-[#161719] font-black text-2xl">{stats?.confirmedAppointments || "450"}+</Text>
            <Text className="text-[#8789A3] text-[10px] font-extrabold uppercase mt-1">Rezervime</Text>
          </View>
        </View>
      </View>

      {/* Menu Options */}
      <View className="px-6 pt-6 pb-32">
        <Text className="text-[#8789A3] font-black text-xs uppercase tracking-widest mb-4">Llogaria</Text>

        <View className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm mb-6">
          <MenuButton icon={Calendar} label="Terminet e mia" />
          <MenuButton icon={Heart} label="Sallonet e ruajtura" />
          <MenuButton icon={CreditCard} label="Metodat e pagesës" />
          <MenuButton icon={Bell} label="Njoftimet" hasSwitch />
          <MenuButton icon={Shield} label="Privatësia & Siguria" />
        </View>

        <Text className="text-[#8789A3] font-black text-xs uppercase tracking-widest mb-4">Për Biznes</Text>
        <View className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm mb-6">
          <MenuButton icon={Award} label="Paneli i Partnerit" />
          <MenuButton
            icon={Store}
            label="Regjistro Sallonin Tim"
            onPress={onOpenRegisterShop}
          />
        </View>

        <Text className="text-[#8789A3] font-black text-xs uppercase tracking-widest mb-4">Mbështetja</Text>
        <View className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm mb-8">
          <MenuButton icon={HelpCircle} label="Qendra e ndihmës" />
          <MenuButton icon={Settings} label="Cilësimet" />
        </View>

        <TouchableOpacity
          onPress={onLogout}
          activeOpacity={0.8}
          className="flex-row items-center justify-center gap-3 bg-rose-50 border border-rose-100 py-4 rounded-2xl active:scale-98"
        >
          <LogOut size={18} color="#FF4757" />
          <Text className="text-[#FF4757] font-black uppercase tracking-widest text-xs">Çkyçu</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const MenuButton = ({ icon: Icon, label, hasSwitch = false, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="flex-row items-center px-6 py-4.5 border-b border-slate-50"
  >
    <View className="w-10 h-10 rounded-full bg-[#EBF2FF] items-center justify-center mr-4">
      <Icon size={18} color="#3473ef" />
    </View>
    <Text className="flex-1 text-[#161719] font-extrabold text-sm">{label}</Text>
    {hasSwitch ? (
      <Switch trackColor={{ false: "#E2E8F0", true: "#3473ef" }} thumbColor="white" value={true} />
    ) : (
      <ChevronRight size={18} color="#8789A3" />
    )}
  </TouchableOpacity>
);
