import React, { useState, useEffect, useMemo, memo, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable, TextInput, Dimensions, ActivityIndicator, Keyboard, StyleSheet, FlatList, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { User, CreditCard, Shield, Store, Mail, Lock, Eye, EyeOff, Phone, ChevronDown, Search, ArrowLeft, Check, ChevronRight, Zap, Sparkles, MapPin, X, Scissors, Hand, Smile, Waves } from "lucide-react-native";
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { supabase } from "@/config/supabase";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { WebView } from "react-native-webview";
import { createPaddleTransaction, PADDLE_CONFIG } from "../config/paddle";
import { PaddleCheckout } from "../components/PaddleCheckout";
import { CategoryAccordion, Category, Subcategory } from "../components/CategoryAccordion";
import { BlurView } from 'expo-blur';

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

const REGISTRATION_PLANS = [
  {
    id: 'solo',
    name: 'Solo',
    prices: { month: '15€', year: '150€' },
    employees: '1 berber',
    desc: 'Ideale për berberët individualë',
    features: ['Deri në 300 rezervime/muaj', '1 profil stafi', 'Kalendari i rezervimeve', 'Njoftime me email'],
    paddlePriceId: { month: 'pri_solo_mo', year: 'pri_solo_yr' }
  },
  {
    id: 'duo',
    name: 'Duo',
    prices: { month: '20€', year: '200€' },
    employees: '2 berberë',
    desc: 'Për ekipe të vogla prej dy personash',
    features: ['Rezervime pa limit', 'Deri në 2 profile stafi', 'Njoftime me SMS & Email', 'Statistika & Raporte', 'Mbështetje prioritare'],
    isPopular: true,
    paddlePriceId: { month: 'pri_duo_mo', year: 'pri_duo_yr' }
  },
  {
    id: 'team',
    name: 'Team',
    prices: { month: '25€', year: '250€' },
    employees: '3+ berberë',
    desc: 'Për ekipe në rritje',
    features: ['Të gjitha të planit Duo', 'Profile stafi pa limit', 'Marketing me SMS', 'Landing page e personalizuar', 'Asistent personal 24/7'],
    paddlePriceId: { month: 'pri_team_mo', year: 'pri_team_yr' }
  }
];



const PADDLE_CLIENT_TOKEN = PADDLE_CONFIG.CLIENT_TOKEN;
const PADDLE_VENDOR_ID = 12345; // This can remain as mock or move to config

interface CityPickerProps {
  selectedCity: string;
  onSelect: (city: string) => void;
}

const CityPicker = memo(({ selectedCity, onSelect }: CityPickerProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCities = useMemo(() => {
    return KOSOVO_CITIES.filter(c =>
      c.city.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <View className="mb-1">
      <TouchableOpacity
        onPress={() => {
          Keyboard.dismiss();
          setShowPicker(true);
        }}
        activeOpacity={0.8}
        className={`w-full bg-white border rounded-2xl px-4 h-14 flex-row items-center justify-between ${selectedCity ? 'border-[#3473ef]' : 'border-slate-200'}`}
      >
        <View className="flex-row items-center gap-3">
          <MapPin size={20} color={selectedCity ? "#3473ef" : "#8789A3"} />
          <Text className="text-[#161719] font-bold text-base">{selectedCity || "Zgjidh Qytetin"}</Text>
        </View>
        <ChevronDown size={20} color="#8789A3" />
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          />
          <View className="bg-white rounded-t-[32px] h-[80%] overflow-hidden">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mt-3 mb-2" />
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-50">
              <Text className="text-xl font-black text-[#161719]">Zgjidh qytetin</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={20} color="#161719" />
              </TouchableOpacity>
            </View>

            <View className="px-6 py-4">
              <View className="flex-row items-center bg-slate-100 rounded-2xl px-4 h-12">
                <Search size={18} color="#8789A3" />
                <TextInput
                  placeholder="Kërko qytetin..."
                  placeholderTextColor="#94A3B8"
                  className="flex-1 ml-3 font-bold text-base text-[#161719]"
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                />
              </View>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            >
              {filteredCities.map((item) => (
                <TouchableOpacity
                  key={item.city}
                  onPress={() => {
                    Keyboard.dismiss();
                    onSelect(item.city);
                    setShowPicker(false);
                    setSearch("");
                  }}
                  className={`flex-row items-center py-4 border-b border-slate-50 ${selectedCity === item.city ? 'bg-[#3473ef]/5 rounded-xl px-3' : ''}`}
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${selectedCity === item.city ? 'bg-[#3473ef]' : 'bg-slate-100'}`}>
                    <MapPin size={18} color={selectedCity === item.city ? 'white' : '#8789A3'} />
                  </View>
                  <Text className={`font-bold text-lg flex-1 ${selectedCity === item.city ? 'text-[#3473ef]' : 'text-[#161719]'}`}>{item.city}</Text>
                  {selectedCity === item.city && <Check size={20} color="#3473ef" strokeWidth={3} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
});

interface AddressPickerProps {
  selectedCity: string;
  onSelect: (address: { address: string, lat: number, lng: number }) => void;
  focusedField: string | null;
  setFocusedField: (field: string | null) => void;
}

const AddressPicker = memo(({
  selectedCity,
  onSelect,
  focusedField,
  setFocusedField
}: AddressPickerProps) => {
  const cityObj = KOSOVO_CITIES.find(c => c.city === selectedCity);
  const cityCoords = cityObj ? { lat: cityObj.latitude, lng: cityObj.longitude } : undefined;

  return (
    <View className="mb-1" style={{ zIndex: focusedField === 'address' ? 2000 : 1 }}>
       <AddressAutocomplete
          placeholder="Adresa (Rruga dhe Numri)"
          selectedCity={selectedCity}
          cityCoords={cityCoords}
          onSelectAddress={(place) => {
            if (place && place.latitude && place.longitude) {
              onSelect({
                address: place.formatted_address,
                lat: place.latitude,
                lng: place.longitude
              });
            }
          }}
          containerClassName={focusedField === 'address' ? 'border-[#3473ef]' : ''}
          onChangeText={(text) => {
             if (text.length >= 2) setFocusedField('address');
          }}
       />
    </View>
  );
});

interface RegisterScreenProps {
  onClose: () => void;
  onSuccess: (userData?: any) => void;
  initialPlanId?: string;
  setIsRegistering?: (val: boolean) => void;
}

import { DEFAULT_CATEGORIES, DEFAULT_SUBCATEGORIES, CATEGORY_ORDER } from "../config/defaultCategories";

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onClose, onSuccess, initialPlanId, setIsRegistering }) => {
  const [registerStep, setRegisterStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [paddleTransactionId, setPaddleTransactionId] = useState<string | null>(null);
  const [preparingCheckout, setPreparingCheckout] = useState(false);

  // Email check states
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    Keyboard.dismiss();
  }, [registerStep]);

  const [dbCategories, setDbCategories] = useState<Category[]>(DEFAULT_CATEGORIES as any);
  const [dbSubcategories, setDbSubcategories] = useState<Subcategory[]>(DEFAULT_SUBCATEGORIES as any);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log("[RegisterScreen] Fetching categories and subcategories...");
        const [{ data: catData, error: catError }, { data: subData, error: subError }] = await Promise.all([
          supabase.from('categories').select('*'),
          supabase.from('subcategories').select('*').order('name')
        ]);

        if (catError) throw catError;
        if (subError) throw subError;

        if (catData && catData.length > 0) {
          console.log(`[RegisterScreen] Fetched ${catData.length} categories from DB.`);
          const sortedCats = [...catData].sort((a, b) => {
            const indexA = CATEGORY_ORDER.indexOf(a.name);
            const indexB = CATEGORY_ORDER.indexOf(b.name);
            if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
          setDbCategories(sortedCats as Category[]);
        } else {
          console.warn("[RegisterScreen] No categories found in DB, using defaults.");
        }

        if (subData && subData.length > 0) {
          console.log(`[RegisterScreen] Fetched ${subData.length} subcategories from DB.`);
          setDbSubcategories(subData as Subcategory[]);
        }
      } catch (err) {
        console.error("[RegisterScreen] Failed to fetch categories from Supabase:", err);
      }
    };
    fetchCategories();
  }, []);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+383 ");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<{ address: string; lat: number; lng: number } | null>(null);

  const [selectedPlan, setSelectedPlan] = useState(initialPlanId ? REGISTRATION_PLANS.find(p => p.id === initialPlanId) || REGISTRATION_PLANS[1] : REGISTRATION_PLANS[1]);
  
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [employeeCount, setTeamEmployees] = useState(3);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<any | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);

  // Debounced Email Existence Check
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkEmail = async (emailToCheck: string) => {
      if (!isEmailValid(emailToCheck)) {
        setEmailExists(false);
        return;
      }

      setCheckingEmail(true);
      try {
        const cleanEmail = emailToCheck.toLowerCase().trim();

        // Check only users table as all entities (clients/owners) are users
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (error) throw error;
        setEmailExists(!!data);
      } catch (err) {
        console.warn("Email check error:", err);
      } finally {
        setCheckingEmail(false);
      }
    };

    if (email.length > 5) {
      timeoutId = setTimeout(() => {
        checkEmail(email);
      }, 600);
    } else {
      setEmailExists(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [email]);

  const toggleCategory = (catName: string) => {
    setSelectedCategories(prev =>
      prev.includes(catName)
        ? prev.filter(c => c !== catName)
        : [...prev, catName]
    );
  };

  const calculateTeamPrice = (count: number, cycle: 'month' | 'year') => {
    const basePrice = 25;
    const extraPrice = (Math.max(3, count) - 3) * 5;
    const monthlyTotal = basePrice + extraPrice;
    return cycle === 'year' ? monthlyTotal * 12 * 0.85 : monthlyTotal; // 15% discount for yearly
  };

  const getPriceDisplay = (plan: any) => {
    if (plan.id === 'team') {
      const price = calculateTeamPrice(employeeCount, billingCycle);
      return `${Math.round(price)}€`;
    }
    return billingCycle === 'month' ? plan.prices.month : plan.prices.year;
  };

  // Paddle Checkout states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const isEmailValid = (em: string) => {
    const clean = em.trim().toLowerCase();
    // Validate email format and check allowed domains
    const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
    const allowedDomains = ['@gmail.com', '@outlook.com', '@pronto.me'];
    const hasAllowedDomain = allowedDomains.some(domain => clean.endsWith(domain));
    
    return isValidFormat && hasAllowedDomain;
  };

  const isPhoneValid = (ph: string) => {
    const clean = ph.replace(/\D/g, "");
    return clean.length >= 6;
  };

  const scrollViewRef = useRef<ScrollView>(null);

  const goToStep = (step: number) => {
    Keyboard.dismiss();
    setRegisterStep(step);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleFinalizeRegistration = async (passedUserId?: string) => {
    Keyboard.dismiss();
    if (loading) return;
    setLoading(true);
    setErrorMessage("");

    if (setIsRegistering) setIsRegistering(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      let userId = passedUserId;
      if (!userId) {
        const { data: authUser } = await supabase.auth.getUser();
        userId = authUser.user?.id;
      }

      if (!userId) throw new Error("Sesioni skadoi. Ju lutemi hyni përsëri.");

      console.log("[RegisterScreen] Finalizing DB records for user:", userId);

      // 1. Upsert user into database 'users' table
      const { data: dbUser, error: userError } = await supabase.from('users').upsert({
        id: userId,
        email: cleanEmail,
        name: fullName,
        role: 'owner',
        phone: phone || null,
      }, { onConflict: 'email' }).select().single();

      if (userError) throw userError;

      const ownerId = dbUser?.id;

      // 2. Insert barbershop
      const CITY_MAP_COORDS: Record<string, { lat: number; lng: number }> = {
        "prishtin": { lat: 42.6629, lng: 21.1655 },
        "ferizaj": { lat: 42.3703, lng: 21.1559 },
        "prizren": { lat: 42.2139, lng: 20.7397 },
        "pej": { lat: 42.6593, lng: 20.2883 },
        "gjakov": { lat: 42.3803, lng: 20.4308 },
        "gjilan": { lat: 42.4635, lng: 21.4678 },
        "mitrovic": { lat: 42.8914, lng: 20.8660 },
      };

      const cityKey = (selectedCity || "prishtin").toLowerCase().replace(/ë/g, "e").replace(/ç/g, "c");
      let fallbackCoords = CITY_MAP_COORDS["prishtin"];
      for (const [k, v] of Object.entries(CITY_MAP_COORDS)) {
        if (cityKey.includes(k)) { fallbackCoords = v; break; }
      }

      const { data: newShop, error: shopError } = await supabase.from('barbershops').insert({
        owner_id: ownerId,
        name: fullName,
        city: selectedCity || "Prishtinë",
        address: selectedPlace?.address || (selectedCity ? `Qendra, ${selectedCity}` : "Prishtinë"),
        latitude: selectedPlace?.lat || fallbackCoords.lat,
        longitude: selectedPlace?.lng || fallbackCoords.lng,
        status: 'active',
        subcategories: selectedCategories,
        category: selectedMainCategory?.name || 'Barber'
      }).select().single();

      if (shopError) throw shopError;

      // 3. Create default barber profile
      if (ownerId && newShop?.id) {
        await supabase.from('barbers').insert({
          user_id: ownerId,
          shop_id: newShop.id,
          name: fullName,
          is_active: true
        });
      }

      console.log("[RegisterScreen] SUCCESS! Redirecting to dashboard...");
      onSuccess({
        id: userId,
        name: fullName,
        email: cleanEmail,
        role: 'owner',
      });
    } catch (e: any) {
      console.error("[RegisterScreen] Finalize error:", e);
      setErrorMessage(e.message || "Ndodhi një gabim gjatë rregullimit të profilit.");
    } finally {
      setLoading(false);
      if (setIsRegistering) setIsRegistering(false);
    }
  };

  const handleStartPayment = async () => {
    Keyboard.dismiss();
    setPreparingCheckout(true);
    setErrorMessage("");
    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Create/Register User FIRST to get userId
      console.log("[RegisterScreen] Registering user before payment...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: 'owner',
          }
        }
      });

      let userId = authData?.user?.id;

      // Handle "already registered" - try to sign in to get ID
      if (authError && (authError.message.includes("already registered") || authError.message.includes("already been registered"))) {
        console.log("[RegisterScreen] User exists, signing in to retrieve ID...");
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });
        if (signInError) throw new Error("Ky email është i regjistruar. Ju lutemi përdorni fjalëkalimin e saktë.");
        userId = signInData?.user?.id;
      } else if (authError) {
        throw authError;
      }

      if (!userId) throw new Error("Dështoi krijimi i llogarisë.");

      // 2. Create Paddle Transaction with userId in custom_data
      const planPriceNum = selectedPlan?.id === 'team' ? calculateTeamPrice(employeeCount, billingCycle) : (billingCycle === 'month' ? 20 : 200);

      console.log("[RegisterScreen] Creating Paddle transaction for userId:", userId);
      const res = await createPaddleTransaction({
        email: cleanEmail,
        planId: (selectedPlan?.id as any) || 'solo',
        amount: planPriceNum,
        userId: userId,
        customerName: fullName
      });

      if (res?.id) {
        setPaddleTransactionId(res.id);
      }
      
      // 3. Go to Step 4 to show the UI
      goToStep(4);
    } catch (err: any) {
      console.error("[RegisterScreen] Pre-payment error:", err);
      setErrorMessage(err.message || "Ndodhi një gabim gjatë përgatitjes së pagesës.");
    } finally {
      setPreparingCheckout(false);
    }
  };

  return (
    <View
      className="flex-1 bg-white"
    >
      {/* Background Decorative Blobs */}
      <View className="absolute top-[-50] left-[-50] w-64 h-64 bg-[#3473ef]/15 rounded-full blur-3xl" />
      <View className="absolute top-[200] right-[-100] w-80 h-80 bg-[#f47458]/15 rounded-full blur-3xl" />

    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      enabled={registerStep !== 4}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 20,
          paddingTop: 40
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center">
          {/* Header section with Close Button */}
          <View className="pt-16 pb-4 px-6 flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <View className="w-14 h-14 bg-[#3473ef]/10 rounded-2xl items-center justify-center border border-[#3473ef]/20">
                <Store size={28} color="#3473ef" />
              </View>
              <View>
                <Text className="text-2xl font-black text-[#161719] tracking-tight">Regjistro biznesin</Text>
                <Text className="text-slate-500 font-bold text-xs mt-0.5">Fillo të marrësh rezervime në LineUp.</Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              className="w-10 h-10 bg-white rounded-full items-center justify-center border border-slate-200 shadow-sm active:bg-slate-100"
            >
              <X size={20} color="#161719" strokeWidth={2.5} />
            </Pressable>
          </View>

        {/* Steps Progress Indicator (1: Informata, 2: Paketa, 3: Shërbimet, 4: Pagesa) */}
        <View className="flex-row justify-center items-center px-8 py-4 mb-4">
          <View className={`w-8 h-8 rounded-full items-center justify-center ${registerStep >= 1 ? 'bg-[#3473ef]' : 'bg-slate-200'}`}>
            {registerStep > 1 ? <Check size={16} color="white" strokeWidth={3} /> : <Text className="font-black text-xs text-white">1</Text>}
          </View>
          <View className={`flex-1 h-0.5 mx-2 ${registerStep >= 2 ? 'bg-[#3473ef]' : 'bg-slate-300'}`} />
          <View className={`w-8 h-8 rounded-full items-center justify-center ${registerStep >= 2 ? 'bg-[#3473ef]' : 'bg-slate-200'}`}>
            {registerStep > 2 ? <Check size={16} color="white" strokeWidth={3} /> : <Text className={`font-black text-xs ${registerStep >= 2 ? 'text-white' : 'text-slate-500'}`}>2</Text>}
          </View>
          <View className={`flex-1 h-0.5 mx-2 ${registerStep >= 3 ? 'bg-[#3473ef]' : 'bg-slate-300'}`} />
          <View className={`w-8 h-8 rounded-full items-center justify-center ${registerStep >= 3 ? 'bg-[#3473ef]' : 'bg-slate-200'}`}>
            {registerStep > 3 ? <Check size={16} color="white" strokeWidth={3} /> : <Text className={`font-black text-xs ${registerStep >= 3 ? 'text-white' : 'text-slate-500'}`}>3</Text>}
          </View>
          <View className={`flex-1 h-0.5 mx-2 ${registerStep >= 4 ? 'bg-[#3473ef]' : 'bg-slate-300'}`} />
          <View className={`w-8 h-8 rounded-full items-center justify-center ${registerStep >= 4 ? 'bg-[#3473ef]' : 'bg-slate-200'}`}>
            <Text className={`font-black text-xs ${registerStep >= 4 ? 'text-white' : 'text-slate-500'}`}>4</Text>
          </View>
        </View>

        {errorMessage !== "" && (
          <View className="mx-6 bg-rose-50 border border-rose-200 p-4 rounded-2xl mb-4 flex-row items-center">
            <Shield size={18} color="#ef4444" className="mr-3" />
            <Text className="text-rose-700 font-bold text-xs flex-1">{errorMessage}</Text>
          </View>
        )}

        {/* STEP 1: Basic Info & Location */}
        {registerStep === 1 && (
          <View className="px-6 gap-y-6">
            <View className="gap-y-3">
              <Text className="text-[11px] font-black text-[#8789A3] uppercase tracking-widest text-center mt-2">HAPI 1: INFORMATA BAZË</Text>
              
              <View className={`bg-white rounded-2xl px-4 h-14 flex-row items-center border ${focusedField === 'fullName' ? 'border-[#3473ef]' : 'border-slate-200'}`}>
                <Store size={20} color={focusedField === 'fullName' ? '#3473ef' : '#8789A3'} />
                <TextInput
                  placeholder="Emri i biznesit (p.sh. Barber Cutz)"
                  value={fullName}
                  onChangeText={setFullName}
                  className="flex-1 ml-3 font-bold text-[#161719] text-base"
                  placeholderTextColor="#94A3B8"
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                />
                {fullName !== "" && (
                  <TouchableOpacity onPress={() => setFullName("")} className="p-2">
                    <X size={16} color="#8789A3" />
                  </TouchableOpacity>
                )}
              </View>

              <View>
                <View className={`bg-white rounded-2xl px-4 h-14 flex-row items-center border ${
                  email.length > 0 && isEmailValid(email)
                    ? 'border-[#10b981]'
                    : email.length > 0 && focusedField === 'email' && !isEmailValid(email)
                    ? 'border-orange-400'
                    : focusedField === 'email'
                    ? 'border-[#3473ef]'
                    : 'border-slate-200'
                }`}>
                  <Mail size={20} color={
                    email.length > 0 && isEmailValid(email) ? '#10b981' :
                    email.length > 0 && focusedField === 'email' && !isEmailValid(email) ? '#fb923c' :
                    focusedField === 'email' ? '#3473ef' : '#8789A3'
                  } />
                  <TextInput
                    placeholder="Email i biznesit"
                    value={email}
                    onChangeText={setEmail}
                    className="flex-1 ml-3 font-bold text-[#161719] text-base"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                  {email !== "" && isEmailValid(email) && (
                    <View className="mr-2">
                      <Check size={20} color="#10b981" strokeWidth={3} />
                    </View>
                  )}
                  {email !== "" && (
                    <TouchableOpacity onPress={() => setEmail("")} className="p-2">
                      <X size={16} color="#8789A3" />
                    </TouchableOpacity>
                  )}
                  {checkingEmail && (
                    <View className="mr-2">
                      <ActivityIndicator size="small" color="#3473ef" />
                    </View>
                  )}
                </View>
                {email !== "" && !isEmailValid(email) && focusedField === 'email' && (
                  <Text className="text-orange-500 font-bold text-xs mt-1.5 ml-2">
                    Kërkohet: @gmail.com, @outlook.com, ose @pronto.me
                  </Text>
                )}
                {emailExists && (
                  <Text className="text-rose-500 font-bold text-xs mt-1.5 ml-2">
                    Ky email është i regjistruar paraprakisht.
                  </Text>
                )}
              </View>

              <View className="flex-row gap-x-3">
                <View className={`flex-1 bg-white rounded-2xl px-4 h-14 flex-row items-center border ${focusedField === 'phone' ? 'border-[#3473ef]' : 'border-slate-200'}`}>
                  <Phone size={20} color={focusedField === 'phone' ? '#3473ef' : '#8789A3'} />
                  <TextInput
                    placeholder="Telefoni"
                    value={phone}
                    onChangeText={(val) => {
                      const cleaned = val.replace(/\D/g, "");
                      let formatted = val;
                      if (cleaned.length > 0) {
                        let numberPart = cleaned;
                        if (cleaned.startsWith("383")) {
                          numberPart = cleaned.substring(3);
                        } else if (cleaned.startsWith("0")) {
                          numberPart = cleaned.substring(1);
                        }

                        if (numberPart.length > 5) {
                          formatted = `+383 ${numberPart.substring(0, 2)} ${numberPart.substring(2, 5)} ${numberPart.substring(5, 8)}`;
                        } else if (numberPart.length > 2) {
                          formatted = `+383 ${numberPart.substring(0, 2)} ${numberPart.substring(2)}`;
                        } else {
                          formatted = `+383 ${numberPart}`;
                        }
                      } else {
                        formatted = val.length > 0 ? "+383 " : "";
                      }
                      setPhone(formatted);
                    }}
                    className="flex-1 ml-3 font-bold text-[#161719] text-sm"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                <View className={`flex-1 bg-white rounded-2xl px-4 h-14 flex-row items-center border ${focusedField === 'password' ? 'border-[#3473ef]' : 'border-slate-200'}`}>
                  <Lock size={20} color={focusedField === 'password' ? '#3473ef' : '#8789A3'} />
                  <TextInput
                    placeholder="Fjalëkalimi"
                    value={password}
                    onChangeText={setPassword}
                    className="flex-1 ml-3 font-bold text-[#161719] text-sm"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} className="p-1">
                    {showPassword ? <EyeOff size={18} color="#8789A3" /> : <Eye size={18} color="#8789A3" />}
                  </Pressable>
                </View>
              </View>

              {/* City Picker input */}
              <CityPicker
                selectedCity={selectedCity}
                onSelect={(city) => {
                  setSelectedCity(city);
                  setSelectedPlace(null);
                }}
              />

              {/* Street address input */}
              <AddressPicker
                selectedCity={selectedCity}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                onSelect={(addr) => {
                  setSelectedPlace({ address: addr.address, lat: addr.lat, lng: addr.lng });
                }}
              />

              {/* Dynamic Categories Selection - MOVED TO STEP 3 */}
            </View>

            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                if (!fullName || !email || !password) {
                  setErrorMessage("Ju lutemi plotësoni emrin e biznesit, email-in dhe fjalëkalimin.");
                  return;
                }
                if (!isEmailValid(email)) {
                  setErrorMessage("Ju lutemi shkruani një email valide (p.sh. emri@shembull.com).");
                  return;
                }
                if (emailExists) {
                  setErrorMessage("Ky email është i regjistruar paraprakisht.");
                  return;
                }
                setErrorMessage("");
                goToStep(2);
              }}
              disabled={checkingEmail || emailExists}
              className={`h-14 rounded-2xl items-center justify-center flex-row gap-2 mt-4 shadow-lg active:bg-blue-600 ${
                (checkingEmail || emailExists) ? 'bg-slate-400 shadow-none' : 'bg-[#3473ef] shadow-[#3473ef]/30'
              }`}
            >
              <Text className="text-white text-base font-black tracking-wide">
                {checkingEmail ? "Duke kontrolluar..." : "Vazhdo te Shërbimet"}
              </Text>
              {!checkingEmail && <ChevronRight size={18} color="white" strokeWidth={3} />}
            </Pressable>
          </View>
        )}

        {/* STEP 2: Zgjidh Shërbimet */}
        {registerStep === 2 && (
          <View className="px-6 flex-1 mt-2">
            <View className="items-center mb-6">
              <Text className="text-[11px] font-black text-[#8789A3] uppercase tracking-widest text-center mb-1">HAPI 2: SHËRBIMET E SALLONIT</Text>
              <Text className="text-slate-500 text-xs font-bold text-center">Zgjidhni shërbimet që ofroni për klientët</Text>
            </View>

            <View className="flex-row flex-wrap justify-between">
              {dbCategories
                .map((cat, i) => {
                  // Fallback for icons: if it's an emoji (string), render as Text, else as Component
                  const isEmoji = typeof cat.icon === 'string' && cat.icon.length <= 4;
                  const IconComponent = CATEGORY_ICONS[cat.name] || Scissors;
                  const catSubIds = dbSubcategories.filter(s => s.category_id === cat.id).map(s => s.id);
                  const isSelected = catSubIds.some(id => selectedCategories.includes(id));

                  return (
                    <View key={cat.id} className="items-center mb-6" style={{ width: '31%' }}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedMainCategory(cat);
                          setShowSubModal(true);
                        }}
                        activeOpacity={0.7}
                        className={`w-full aspect-square rounded-[24px] items-center justify-center border shadow-sm mb-2 ${
                          isSelected
                            ? 'bg-[#3473ef]/10 border-[#3473ef]'
                            : 'bg-white border-slate-200 shadow-slate-200'
                        }`}
                      >
                        {isEmoji ? (
                          <Text className="text-3xl">{cat.icon}</Text>
                        ) : (
                          <IconComponent size={32} color={isSelected ? "#3473ef" : "#161719"} strokeWidth={1.5} />
                        )}
                        {isSelected && (
                          <View className="absolute top-2 right-2 bg-[#3473ef] rounded-full p-0.5">
                            <Check size={10} color="white" strokeWidth={4} />
                          </View>
                        )}
                      </TouchableOpacity>
                      <Text className={`text-[10px] text-center font-bold leading-3 ${isSelected ? 'text-[#3473ef]' : 'text-[#161719]'}`} numberOfLines={2}>
                        {cat.name}
                      </Text>
                    </View>
                  );
                })}
            </View>

            <Pressable
              onPress={() => goToStep(3)}
              disabled={selectedCategories.length === 0}
              className={`h-16 rounded-2xl shadow-xl items-center justify-center flex-row gap-2 mt-8 ${
                selectedCategories.length === 0 ? 'bg-slate-400' : 'bg-[#3473ef] shadow-[#3473ef]/30 active:bg-blue-600'
              }`}
            >
              <Text className="text-white text-lg font-black tracking-wide">Vazhdo te Paketa</Text>
              <ChevronRight size={20} color="white" strokeWidth={3} />
            </Pressable>

            <Pressable
              onPress={() => goToStep(1)}
              className="py-6 items-center"
            >
              <Text className="text-slate-500 font-black text-xs">← Kthehu te Informata Bazë</Text>
            </Pressable>
          </View>
        )}

        {/* STEP 3: Zgjidh Planin */}
        {registerStep === 3 && (
          <View className="px-6 gap-y-5 mt-2">
            <View className="items-center">
              <Text className="text-[11px] font-black text-[#8789A3] uppercase tracking-widest text-center mb-1">HAPI 3: ZGJIDH PLANIN TËND</Text>
              <Text className="text-slate-500 text-xs font-bold text-center mb-4">Çmimet mujore pa kontratë pezulluese</Text>
            </View>
            
            <View className="gap-y-4">
              {REGISTRATION_PLANS.map((plan) => {
                const isSelected = selectedPlan?.id === plan?.id;
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => {
                      console.log("[RegisterScreen] Selected plan:", plan.id);
                      setSelectedPlan(plan);
                    }}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 24,
                      padding: 20,
                      borderWidth: 2,
                      borderColor: isSelected ? '#3473ef' : '#e2e8f0',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {plan.isPopular && (
                      <View className="absolute top-0 right-0 bg-[#3473ef] px-4 py-1 rounded-bl-2xl">
                        <Text className="text-white text-[9px] font-black uppercase tracking-wider">Më i Popullarizuari</Text>
                      </View>
                    )}

                    <View className="flex-row justify-between items-center mb-3">
                      <View className="flex-row items-center gap-3">
                        <View style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          borderWidth: 2,
                          borderColor: isSelected ? '#3473ef' : '#cbd5e1',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'white'
                        }}>
                          {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#3473ef' }} />}
                        </View>
                        <View>
                          <Text className="text-lg font-black text-[#161719]">{plan.name}</Text>
                          {plan.id === 'team' ? (
                            <View className="flex-row items-center gap-2 mt-0.5">
                              <Pressable
                                onPress={() => setTeamEmployees(prev => Math.max(3, prev - 1))}
                                className="w-6 h-6 bg-slate-100 rounded-md items-center justify-center active:bg-slate-200"
                              >
                                <Text className="font-black text-xs text-[#161719]">-</Text>
                              </Pressable>
                              <Text className="text-[#161719] font-bold text-xs">{employeeCount} berberë</Text>
                              <Pressable
                                onPress={() => setTeamEmployees(prev => prev + 1)}
                                className="w-6 h-6 bg-slate-100 rounded-md items-center justify-center active:bg-slate-200"
                              >
                                <Text className="font-black text-xs text-[#161719]">+</Text>
                              </Pressable>
                            </View>
                          ) : (
                            <Text className="text-slate-400 text-[10px] font-bold">{plan.employees}</Text>
                          )}
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-2xl font-black text-[#3473ef]">
                          {plan.id === 'team' ? `${calculateTeamPrice(employeeCount, 'month')}€` : (plan.prices?.month || '15€')}
                        </Text>
                        <Text className="text-slate-400 text-[10px] font-bold mt-0.5">/muaj</Text>
                      </View>
                    </View>

                    <View className="h-[1px] bg-slate-100 my-2" />

                    <View className="gap-y-2 mt-2">
                      {plan.features?.map((feature, fIdx) => (
                        <View key={fIdx} className="flex-row items-center gap-2">
                          <Check size={14} color="#3473ef" strokeWidth={3} />
                          <Text className="text-slate-600 font-bold text-xs">{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleStartPayment}
              disabled={preparingCheckout}
              className={`h-16 rounded-2xl shadow-xl items-center justify-center flex-row gap-2 mt-8 ${
                preparingCheckout ? 'bg-slate-400' : 'bg-[#3473ef] shadow-[#3473ef]/30 active:bg-blue-600'
              }`}
            >
              {preparingCheckout ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white text-lg font-black tracking-wide">Vazhdo te Pagesa</Text>
                  <ChevronRight size={20} color="white" strokeWidth={3} />
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => goToStep(2)}
              className="py-6 items-center"
            >
              <Text className="text-slate-500 font-black text-xs">← Kthehu te Shërbimet</Text>
            </Pressable>
          </View>
        )}

        {/* STEP 4: Pagesa me Paddle */}
        {registerStep === 4 && (
          <View className="flex-1" style={{ minHeight: Dimensions.get('window').height * 0.75 }}>
            <View className="px-6 items-center mt-2 mb-6">
              <Text className="text-[11px] font-black text-[#8789A3] uppercase tracking-widest text-center mb-1">HAPI 4: PAGESA ME PADDLE</Text>
              <Text className="text-slate-700 text-sm font-bold text-center">
                Plani: <Text className="text-[#3473ef] font-black">{selectedPlan?.name || 'Duo'}</Text> ({getPriceDisplay(selectedPlan)}/{billingCycle === 'month' ? 'muaj' : 'vit'})
              </Text>
            </View>

            <View className="flex-1 bg-white overflow-hidden shadow-2xl">
              <PaddleCheckout
                email={email}
                transactionId={paddleTransactionId || undefined}
                priceId={selectedPlan?.paddlePriceId?.[billingCycle]}
                onSuccess={(data) => {
                  console.log("[RegisterScreen] Paddle success callback triggered");
                  handleFinalizeRegistration();
                }}
                onCancel={() => goToStep(3)}
              />
            </View>

            <View className="bg-white pb-8">
              <Pressable
                onPress={() => goToStep(3)}
                className="py-6 items-center"
              >
                <Text className="text-slate-400 font-black text-xs uppercase tracking-widest">Anulo dhe kthehu</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Bottom spacer for keyboard scrolling accessibility */}
        <View style={{ height: 280 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>

      {/* Subcategory Modal */}
      <Modal
        visible={showSubModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSubModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setShowSubModal(false)}
          />
          <View className="bg-white rounded-t-[32px] h-[75%] overflow-hidden flex-col">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mt-3 mb-2" />
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-50">
              <View className="flex-row items-center">
                {selectedMainCategory && (
                  React.createElement(CATEGORY_ICONS[selectedMainCategory.name] || Scissors, { size: 24, color: "#161719", className: "mr-3" })
                )}
                <Text className="text-xl font-black text-[#161719] ml-3">{selectedMainCategory?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSubModal(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={20} color="#161719" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} className="flex-1" keyboardShouldPersistTaps="handled">
              <Text className="text-sm font-bold text-[#8789A3] mb-4">Zgjidhni shërbimet (mund të zgjidhni më shumë se një):</Text>
              
            {selectedMainCategory && dbSubcategories.filter(s => String(s.category_id).trim() === String(selectedMainCategory.id).trim()).map((sub, idx) => {
                const subId = String(sub.id).trim();
                const isSelected = selectedCategories.includes(subId);
                return (
                  <TouchableOpacity
                    key={`${subId}-${idx}`}
                    onPress={() => {
                      console.log("[Register] Toggling subcat:", subId);
                      toggleCategory(subId);
                    }}
                    activeOpacity={0.7}
                    className={`flex-row items-center py-[14px] px-1 border-b ${isSelected ? 'border-[#3473ef]/30' : 'border-slate-100'}`}
                  >
                    <View className={`w-6 h-6 rounded-md border items-center justify-center mr-4 ${isSelected ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-white border-slate-300'}`}>
                      {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                    </View>
                    <Text className={`text-base flex-1 ${isSelected ? 'font-black text-[#3473ef]' : 'font-bold text-[#161719]'}`} numberOfLines={1}>{sub.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-50">
              <TouchableOpacity
                onPress={() => setShowSubModal(false)}
                className="h-14 bg-black rounded-2xl items-center justify-center shadow-lg"
              >
                <Text className="text-white font-black text-lg">Ruaj Zgjedhjet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
