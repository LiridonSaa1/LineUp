import React, { useState, useEffect, useMemo, memo } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Dimensions, ActivityIndicator, Keyboard, StyleSheet, FlatList, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { User, CreditCard, Shield, Store, Mail, Lock, Eye, EyeOff, Phone, ChevronDown, Search, ArrowLeft, Check, ChevronRight, Zap, Sparkles, MapPin, X } from "lucide-react-native";
import { supabase } from "@/config/supabase";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

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

const KOSOVO_STREETS: Record<string, string[]> = {
  "Prishtinë": [
    "Rruga B", "Rruga C", "Rruga Muharrem Fejza", "Bulevardi Nënë Tereza", "Rruga Bill Clinton", 
    "Rruga George Bush", "Rruga Garibaldi", "Rruga Luan Haradinaj", "Rruga UÇK", 
    "Rruga Agim Ramadani", "Rruga Bajram Kelmendi", "Rruga Fehmi Agani", "Rruga Rexhep Luci"
  ],
  "Ferizaj": [
    "Rruga Ahmet Kaçiku", "Rruga Gjon Serreçi", "Rruga Vëllezërit Gërvalla", "Rruga Rexhep Bislimi", 
    "Rruga Zenel Hajdini", "Rruga Enver Topalli", "Rruga Kemajl Hetemi", "Rruga 2 Korriku"
  ],
  "Prizren": [
    "Rruga William Walker", "Rruga Edit Durham", "Rruga Adem Jashari", "Rruga Remzi Ademaj", 
    "Bulevardi i Dëshmorëve", "Rruga Shatërvan", "Rruga Marin Barleti", "Rruga Jeronim De Rada"
  ],
  "Pejë": [
    "Rruga Mbretëresha Teutë", "Rruga Eliot Engel", "Rruga Adem Jashari", "Rruga Hasan Prishtina", 
    "Rruga Lekë Dukagjini", "Rruga Papa Klementi", "Rruga William Walker"
  ],
  "Gjakovë": [
    "Rruga Çarshia e Madhe", "Rruga Mother Teresa", "Rruga Ismail Qemali", "Rruga Bardhyl Qaushi", 
    "Rruga Mic Sokoli", "Rruga Sadik Stavileci", "Rruga Washington"
  ],
  "Gjilan": [
    "Rruga Adem Jashari", "Rruga Marie Shllaku", "Rruga Medlin Ollbrajt", "Rruga Idriz Seferi", 
    "Rruga Mulla Idrizi", "Rruga Bulevardi i Pavarësisë", "Rruga Kadri Zeka"
  ],
  "Mitrovicë": [
    "Rruga Mbretëresha Teutë", "Rruga Shemsi Ahmeti", "Rruga Isa Boletini", "Rruga Bislim Bajgora", 
    "Rruga Bulevardi Sheshi Adem Jashari", "Rruga UÇK"
  ]
};

const DEFAULT_STREETS = [
  "Rruga Adem Jashari", "Rruga UÇK", "Rruga Nënë Tereza", "Rruga Zahir Pajaziti", "Rruga Skënderbeu"
];

import { WebView } from 'react-native-webview';

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

const PADDLE_CLIENT_TOKEN = 'test_7386629d38c644d6b63d2e9c2c6'; // Mock sandbox token
const PADDLE_VENDOR_ID = 12345; // Mock vendor ID

interface PaddleCheckoutProps {
  email: string;
  priceId: string;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

const PaddleCheckout = ({ email, priceId, onSuccess, onCancel }: PaddleCheckoutProps) => {
  // This HTML will initialize Paddle.js and open the checkout overlay
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>
        <style>
          body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; font-family: sans-serif; }
          .loading { text-align: center; }
        </style>
      </head>
      <body>
        <div class="loading">Duke hapur dritaren e pagesës...</div>
        <script type="text/javascript">
          Paddle.Environment.set('sandbox');
          Paddle.Initialize({
            token: '${PADDLE_CLIENT_TOKEN}',
            eventCallback: function(data) {
              if (data.name === 'checkout.completed') {
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'success', data: data.data }));
              } else if (data.name === 'checkout.closed') {
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'cancel' }));
              }
            }
          });

          Paddle.Checkout.open({
            settings: {
              displayMode: 'overlay',
              variant: 'one-page',
              theme: 'light',
              allowLogout: false
            },
            items: [{ priceId: '${priceId}', quantity: 1 }],
            customer: { email: '${email}' }
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        onMessage={(event) => {
          const msg = JSON.parse(event.nativeEvent.data);
          if (msg.event === 'success') onSuccess(msg.data);
          if (msg.event === 'cancel') onCancel();
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }]}>
            <ActivityIndicator size="large" color="#3473ef" />
          </View>
        )}
      />
    </View>
  );
};

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

            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item.city}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
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
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
});

interface AddressPickerProps {
  selectedCity: string;
  onSelect: (address: { street: string, full: string }) => void;
  focusedField: string | null;
  setFocusedField: (field: string | null) => void;
}

const AddressPicker = memo(({
  selectedCity,
  onSelect,
  focusedField,
  setFocusedField
}: AddressPickerProps) => {
  const [addressInput, setAddressInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const streets = useMemo(() => {
    if (!addressInput) return [];
    const list = KOSOVO_STREETS[selectedCity] || DEFAULT_STREETS;
    return list.filter(st => st.toLowerCase().includes(addressInput.toLowerCase()));
  }, [selectedCity, addressInput]);

  const handleTextChange = (val: string) => {
    setAddressInput(val);
    // Show suggestions only if user hasn't selected one yet or is typing
    setShowSuggestions(val.length > 0);
    const fullAddr = val ? `${val}${selectedCity ? `, ${selectedCity}` : ""}` : "";
    onSelect({ street: val, full: fullAddr });
  };

  return (
    <View className="mb-1">
      <View className={`bg-white rounded-2xl px-4 h-14 flex-row items-center border ${focusedField === 'address' ? 'border-[#3473ef]' : 'border-slate-200'}`}>
        <MapPin size={20} color={focusedField === 'address' ? '#3473ef' : '#8789A3'} />
        <TextInput
          placeholder="Adresa (Rruga dhe Numri)"
          value={addressInput}
          onChangeText={handleTextChange}
          className="flex-1 ml-3 font-bold text-[#161719] text-base"
          placeholderTextColor="#94A3B8"
          onFocus={() => {
            setFocusedField('address');
            if (addressInput.length > 0) setShowSuggestions(true);
          }}
          onBlur={() => setFocusedField(null)}
          textContentType="fullStreetAddress"
          autoComplete="street-address"
        />
        {addressInput !== "" && (
          <TouchableOpacity
            onPress={() => {
              setAddressInput("");
              setShowSuggestions(false);
              onSelect({ street: "", full: "" });
            }}
            className="p-2 bg-slate-50 rounded-full"
          >
            <X size={16} color="#8789A3" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={showSuggestions && streets.length > 0}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSuggestions(false)}
      >
        <View className="flex-1 bg-black/20 justify-center px-6">
          <View className="bg-white rounded-3xl max-h-[60%] overflow-hidden shadow-2xl">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-50">
              <Text className="text-base font-black text-[#161719]">Sugjerime adresash</Text>
              <TouchableOpacity onPress={() => setShowSuggestions(false)}>
                <X size={18} color="#8789A3" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={streets}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="always"
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    const fullAddr = `${item}${selectedCity ? `, ${selectedCity}` : ""}`;
                    setAddressInput(item);
                    setShowSuggestions(false);
                    onSelect({ street: item, full: fullAddr });
                    Keyboard.dismiss();
                  }}
                  className="px-5 py-4 border-b border-slate-50 active:bg-slate-50 flex-row items-center"
                >
                  <MapPin size={16} color="#3473ef" className="mr-3" />
                  <Text className="font-bold text-sm text-[#161719] flex-1">{item}{selectedCity ? `, ${selectedCity}` : ""}</Text>
                  <ChevronRight size={16} color="#CBD5E1" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
});

interface RegisterScreenProps {
  onClose: () => void;
  onSuccess: (userData: any) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onClose, onSuccess }) => {
  const [registerStep, setRegisterStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState(REGISTRATION_PLANS[1]);
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [employeeCount, setTeamEmployees] = useState(3);

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
    return clean.endsWith("@gmail.com") || clean.endsWith("@outlook.com") || clean.endsWith("@pronto.me");
  };

  const isPhoneValid = (ph: string) => {
    const clean = ph.replace(/\D/g, "");
    return clean.length === 11 && clean.startsWith("383");
  };

  const handleAuthSubmit = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      // --- REAL BUSINESS REGISTRATION ---
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: 'barber',
            is_active_partner: true,
          }
        }
      });

      if (signUpError) {
        setErrorMessage(signUpError.message);
        setLoading(false);
        return;
      }

      if (signUpData?.user) {
        // 1. Insert into users table
        await supabase.from('users').upsert({
          id: signUpData.user.id,
          email: email.trim().toLowerCase(),
          name: fullName,
          role: 'barber',
        });

        // 2. Insert into barbershops table
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
          plan_id: selectedPlan.id,
          billing_cycle: billingCycle
        });

        // 3. Mark as success to trigger parent reload/navigation
        onSuccess({
          id: signUpData.user.id,
          name: fullName,
          email: email.trim().toLowerCase(),
          role: 'barber',
        });
      }
    } catch (e: any) {
      console.warn("Auth submit error:", e);
      setErrorMessage(e?.message || "Ndodhi një gabim gjatë regjistrimit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#F5F5F5]"
    >
      {/* Background Decorative Blobs */}
      <View className="absolute top-[-50] left-[-50] w-64 h-64 bg-[#3473ef]/15 rounded-full blur-3xl" />
      <View className="absolute top-[200] right-[-100] w-80 h-80 bg-[#f47458]/15 rounded-full blur-3xl" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100, paddingTop: 40 }}
        keyboardShouldPersistTaps="handled"
      >
      {/* Header section with Close Button */}
      <View className="pt-16 pb-6 px-6 flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <View className="w-14 h-14 bg-[#3473ef]/10 rounded-2xl items-center justify-center border border-[#3473ef]/20">
            <Store size={28} color="#3473ef" />
          </View>
          <View>
            <Text className="text-2xl font-black text-[#161719] tracking-tight">Regjistro biznesin</Text>
            <Text className="text-slate-500 font-bold text-xs mt-0.5">Fillo të marrësh rezervime në LineUp.</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} className="w-10 h-10 bg-white rounded-full items-center justify-center border border-slate-200 shadow-sm">
          <X size={20} color="#161719" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Steps Progress Indicator */}
      <View className="flex-row justify-center items-center px-8 py-4 mb-6">
        <View className={`w-8 h-8 rounded-full items-center justify-center ${registerStep >= 1 ? 'bg-[#3473ef]' : 'bg-slate-200'}`}>
          {registerStep > 1 ? <Check size={16} color="white" strokeWidth={3} /> : <Text className={`font-black text-xs ${registerStep >= 1 ? 'text-white' : 'text-slate-500'}`}>1</Text>}
        </View>
        <View className={`flex-1 h-0.5 mx-2 ${registerStep >= 2 ? 'bg-[#3473ef]' : 'bg-slate-300'}`} />
        
        <View className={`w-8 h-8 rounded-full items-center justify-center ${registerStep >= 2 ? 'bg-[#3473ef]' : 'bg-slate-200'}`}>
          {registerStep > 2 ? <Check size={16} color="white" strokeWidth={3} /> : <Text className={`font-black text-xs ${registerStep >= 2 ? 'text-white' : 'text-slate-500'}`}>2</Text>}
        </View>
        <View className={`flex-1 h-0.5 mx-2 ${registerStep >= 3 ? 'bg-[#3473ef]' : 'bg-slate-300'}`} />
        
        <View className={`w-8 h-8 rounded-full items-center justify-center ${registerStep >= 3 ? 'bg-[#3473ef]' : 'bg-slate-200'}`}>
          <Text className={`font-black text-xs ${registerStep >= 3 ? 'text-white' : 'text-slate-500'}`}>3</Text>
        </View>
      </View>

      {errorMessage !== "" && (
        <View className="mx-6 bg-rose-50 border border-rose-200 p-4 rounded-2xl mb-6 flex-row items-center">
          <Shield size={18} color="#ef4444" className="mr-3" />
          <Text className="text-rose-700 font-bold text-xs flex-1">{errorMessage}</Text>
        </View>
      )}

      {/* STEP 1: Basic Info & Location */}
      {registerStep === 1 && (
        <View className="px-6 gap-y-6">
          <View className="gap-y-3">
            <Text className="text-[11px] font-black text-[#8789A3] uppercase tracking-widest text-center mt-2">INFORMATA BAZË</Text>
            
            <View className={`bg-white rounded-2xl px-4 h-14 flex-row items-center border ${focusedField === 'fullName' ? 'border-[#3473ef]' : 'border-slate-200'}`}>
              <Store size={20} color={focusedField === 'fullName' ? '#3473ef' : '#8789A3'} />
              <TextInput
                placeholder="Emri i biznesit"
                value={fullName}
                onChangeText={setFullName}
                className="flex-1 ml-3 font-bold text-[#161719] text-base"
                placeholderTextColor="#94A3B8"
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField(null)}
                textContentType="organizationName"
                autoComplete="organization"
              />
              {fullName !== "" && (
                <TouchableOpacity onPress={() => setFullName("")} className="p-2" activeOpacity={0.7}>
                  <X size={16} color="#8789A3" />
                </TouchableOpacity>
              )}
            </View>

            <View className={`bg-white rounded-2xl px-4 h-14 flex-row items-center border ${focusedField === 'email' ? 'border-[#3473ef]' : 'border-slate-200'}`}>
              <Mail size={20} color={focusedField === 'email' ? '#3473ef' : '#8789A3'} />
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                className="flex-1 ml-3 font-bold text-[#161719] text-base"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                textContentType="emailAddress"
                autoComplete="email"
              />
              {email !== "" && (
                <TouchableOpacity onPress={() => setEmail("")} className="p-2" activeOpacity={0.7}>
                  <X size={16} color="#8789A3" />
                </TouchableOpacity>
              )}
            </View>

            <View className={`bg-white rounded-2xl px-4 h-14 flex-row items-center border ${focusedField === 'phone' ? 'border-[#3473ef]' : 'border-slate-200'}`}>
              <Phone size={20} color={focusedField === 'phone' ? '#3473ef' : '#8789A3'} />
              <TextInput
                placeholder="Telefoni +383"
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
                    formatted = "";
                  }
                  setPhone(formatted);
                }}
                className="flex-1 ml-3 font-bold text-[#161719] text-base"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                textContentType="telephoneNumber"
                autoComplete="tel"
              />
              {phone !== "" && (
                <TouchableOpacity onPress={() => setPhone("")} className="p-2" activeOpacity={0.7}>
                  <X size={16} color="#8789A3" />
                </TouchableOpacity>
              )}
            </View>

            <View className={`bg-white rounded-2xl px-4 h-14 flex-row items-center border ${focusedField === 'password' ? 'border-[#3473ef]' : 'border-slate-200'}`}>
              <Lock size={20} color={focusedField === 'password' ? '#3473ef' : '#8789A3'} />
              <TextInput
                placeholder="Fjalëkalimi"
                value={password}
                onChangeText={setPassword}
                className="flex-1 ml-3 font-bold text-[#161719] text-base"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                textContentType="newPassword"
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2" activeOpacity={0.7}>
                {showPassword ? <EyeOff size={20} color={focusedField === 'password' ? '#3473ef' : '#8789A3'} /> : <Eye size={20} color={focusedField === 'password' ? '#3473ef' : '#8789A3'} />}
              </TouchableOpacity>
            </View>

            {/* City Picker input */}
            <CityPicker
              selectedCity={selectedCity}
              onSelect={(city) => {
                setSelectedCity(city);
                setSelectedPlace(null);
              }}
            />

            {/* Street address input with popular suggestions for selected city */}
            <AddressPicker
              selectedCity={selectedCity}
              focusedField={focusedField}
              setFocusedField={setFocusedField}
              onSelect={(addr) => {
                setSelectedPlace({ address: addr.full, lat: 42.6629, lng: 21.1655 });
              }}
            />
          </View>

          <TouchableOpacity
            onPress={() => {
              if (!fullName || !email || !phone || !password || !selectedPlace) {
                setErrorMessage("Ju lutemi plotësoni të gjitha fushat dhe zgjidhni adresën.");
                return;
              }
              if (!isEmailValid(email)) {
                setErrorMessage("Email-i duhet të jetë valide (vetëm me @gmail.com, @outlook.com ose @pronto.me).");
                return;
              }
              if (!isPhoneValid(phone)) {
                setErrorMessage("Numri i telefonit duhet të jetë sipas rregullave të Kosovës (p.sh. +383 45 436 246).");
                return;
              }
              setErrorMessage("");
              setRegisterStep(2);
            }}
            activeOpacity={0.9}
            className="bg-[#3473ef] h-14 rounded-2xl items-center justify-center flex-row gap-2 mt-4 shadow-lg shadow-[#3473ef]/30"
          >
            <Text className="text-white text-base font-black tracking-wide">Vazhdo</Text>
            <ChevronRight size={18} color="white" strokeWidth={3} />
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 2: Zgjidh Planin */}
      {registerStep === 2 && (
        <View className="px-6 gap-y-5">
          <View className="items-center mt-2">
            <Text className="text-[11px] font-black text-[#8789A3] uppercase tracking-widest text-center mb-4">HAPI 2: ZGJIDH PLANIN TËND</Text>

            {/* Billing Cycle Toggle */}
            <View className="bg-slate-200 p-1 rounded-2xl flex-row w-full max-w-[280px]">
              <TouchableOpacity
                onPress={() => setBillingCycle('month')}
                className={`flex-1 py-2.5 rounded-xl items-center ${billingCycle === 'month' ? 'bg-white shadow-sm' : ''}`}
              >
                <Text className={`font-black text-xs ${billingCycle === 'month' ? 'text-[#161719]' : 'text-slate-500'}`}>MUJOR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBillingCycle('year')}
                className={`flex-1 py-2.5 rounded-xl items-center ${billingCycle === 'year' ? 'bg-white shadow-sm' : ''}`}
              >
                <View className="flex-row items-center gap-1.5">
                  <Text className={`font-black text-xs ${billingCycle === 'year' ? 'text-[#161719]' : 'text-slate-500'}`}>VJETOR</Text>
                  <View className="bg-emerald-500 px-1.5 py-0.5 rounded-md">
                    <Text className="text-white text-[8px] font-black">-15%</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          <View className="gap-y-4">
            {REGISTRATION_PLANS.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelectedPlan(plan)}
                activeOpacity={0.9}
                className={`bg-white rounded-3xl p-5 border-2 relative overflow-hidden ${selectedPlan.id === plan.id ? 'border-[#3473ef] shadow-md shadow-[#3473ef]/10' : 'border-slate-200'}`}
              >
                {plan.isPopular && (
                  <View className="absolute top-0 right-0 bg-[#3473ef] px-4 py-1 rounded-bl-2xl">
                    <Text className="text-white text-[9px] font-black uppercase tracking-wider">Më i Popullarizuari</Text>
                  </View>
                )}

                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center gap-2">
                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selectedPlan.id === plan.id ? 'border-[#3473ef]' : 'border-slate-300'}`}>
                      {selectedPlan.id === plan.id && <View className="w-2.5 h-2.5 rounded-full bg-[#3473ef]" />}
                    </View>
                    <View>
                      <Text className="text-lg font-black text-[#161719]">{plan.name}</Text>
                      {plan.id === 'team' ? (
                        <View className="flex-row items-center gap-2 mt-0.5">
                          <TouchableOpacity
                            onPress={() => setTeamEmployees(prev => Math.max(3, prev - 1))}
                            className="w-5 h-5 bg-slate-100 rounded-md items-center justify-center"
                          >
                             <Text className="font-black text-xs">-</Text>
                          </TouchableOpacity>
                          <Text className="text-[#161719] font-bold text-xs">{employeeCount} berberë</Text>
                          <TouchableOpacity
                            onPress={() => setTeamEmployees(prev => prev + 1)}
                            className="w-5 h-5 bg-slate-100 rounded-md items-center justify-center"
                          >
                             <Text className="font-black text-xs">+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <Text className="text-slate-400 text-[10px] font-bold">{plan.employees}</Text>
                      )}
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-2xl font-black text-[#3473ef]">{getPriceDisplay(plan)}</Text>
                    <Text className="text-slate-400 text-[10px] font-bold mt-0.5">/{billingCycle === 'month' ? 'muaj' : 'vit'}</Text>
                  </View>
                </View>

                <View className="h-[1px] bg-slate-100 my-2" />

                <View className="gap-y-2 mt-2">
                  {plan.features.map((feature, fIdx) => (
                    <View key={fIdx} className="flex-row items-center gap-2">
                      <Check size={14} color="#3473ef" strokeWidth={3} />
                      <Text className="text-slate-600 font-bold text-xs">{feature}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => setRegisterStep(3)}
            activeOpacity={0.9}
            className="bg-[#3473ef] h-14 rounded-2xl items-center justify-center flex-row gap-2 mt-6 shadow-lg shadow-[#3473ef]/30"
          >
            <Text className="text-white text-base font-black tracking-wide">Vazhdo te Pagesa</Text>
            <ChevronRight size={18} color="white" strokeWidth={3} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRegisterStep(1)}
            className="py-3 items-center"
          >
            <Text className="text-slate-500 font-black text-xs">Kthehu mbrapa</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 3: Paddle Secure Checkout */}
      {registerStep === 3 && (
        <View className="px-6 flex-1 min-h-[500px]">
          <View className="items-center mt-2 mb-6">
            <Text className="text-[11px] font-black text-[#8789A3] uppercase tracking-widest text-center mb-1">HAPI 3: PAGESA ME PADDLE</Text>
            <Text className="text-slate-500 text-xs font-bold text-center">Faturimi i sigurt i planit {selectedPlan.name} ({getPriceDisplay(selectedPlan)})</Text>
          </View>

          <View className="flex-1 bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-2xl">
            <PaddleCheckout
              email={email}
              priceId={billingCycle === 'month' ? selectedPlan.paddlePriceId.month : selectedPlan.paddlePriceId.year}
              onSuccess={handleAuthSubmit}
              onCancel={() => setRegisterStep(2)}
            />
          </View>

          <TouchableOpacity
            onPress={() => setRegisterStep(2)}
            className="py-6 items-center"
          >
            <Text className="text-slate-500 font-black text-xs uppercase tracking-widest">Anulo dhe kthehu</Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
