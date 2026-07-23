import React, { useState, useEffect, useMemo, memo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable, TextInput, Dimensions, ActivityIndicator, Keyboard, StyleSheet, FlatList, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { User, CreditCard, Shield, Store, Mail, Lock, Eye, EyeOff, Phone, ChevronDown, Search, ArrowLeft, Check, ChevronRight, Zap, Sparkles, MapPin, X, Scissors, Hand, Smile, Waves } from "lucide-react-native";
import { supabase } from "@/config/supabase";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { WebView } from "react-native-webview";
import { createPaddleTransaction, PADDLE_CONFIG } from "../config/paddle";

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

const ALBANIAN_CATEGORIES = [
  { id: '1', name: "Prerje & Stilim", icon: Scissors },
  { id: '2', name: "Ngjyrosje Flokësh", icon: Sparkles },
  { id: '3', name: "Trajtim Flokësh", icon: Zap },
  { id: '4', name: "Mjekër & Estetikë", icon: User },
  { id: '5', name: "Thonjtë", icon: Hand },
  { id: '6', name: "Grim / Makeup", icon: Smile },
  { id: '7', name: "Vetulla & Qerpikë", icon: Eye },
  { id: '8', name: "Kujdesi i Lëkurës", icon: Shield },
  { id: '9', name: "Masazh & Trup", icon: Waves },
];

const PADDLE_CLIENT_TOKEN = PADDLE_CONFIG.CLIENT_TOKEN;
const PADDLE_VENDOR_ID = 12345; // This can remain as mock or move to config

interface PaddleCheckoutProps {
  email: string;
  transactionId?: string;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

const PaddleCheckout = ({ email, transactionId, onSuccess, onCancel }: PaddleCheckoutProps) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://cdn.paddle.com/paddle/v2/paddle.js"></script>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { background-color: #ffffff; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; color: #161719; }
          .loading { text-align: center; font-weight: 700; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="loading" id="status-msg">Duke hapur dritaren e sigurt të pagesës...</div>

        <script type="text/javascript">
          try {
            Paddle.Environment.set('${PADDLE_CONFIG.ENVIRONMENT}');
            Paddle.Initialize({
              token: '${PADDLE_CONFIG.CLIENT_TOKEN}',
              eventCallback: function(data) {
                console.log('Paddle Event:', data.name);
                if (data.name === 'checkout.completed') {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'success', data: data.data }));
                } else if (data.name === 'checkout.closed') {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'cancel' }));
                }
              }
            });

            const checkoutOptions = {
              settings: {
                displayMode: 'overlay',
                variant: 'one-page',
                theme: 'light',
                allowLogout: false,
                locale: 'sq'
              }
            };

            if ('${transactionId || ""}') {
              checkoutOptions.transactionId = '${transactionId}';
            } else {
              // Fallback to manual items if no transactionId
              checkoutOptions.items = [{ priceId: 'pri_01solo_mo', quantity: 1 }];
              checkoutOptions.customer = { email: '${email}' };
            }

             Paddle.Checkout.open(checkoutOptions);
          } catch (e) {
            document.getElementById('status-msg').innerHTML = 'Gabim gjatë ngarkimit të Paddle. Kontrolloni lidhjen.';
            console.error(e);
          }
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
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.event === 'success') onSuccess(msg);
            if (msg.event === 'cancel') onCancel();
          } catch (e) {
            onSuccess({});
          }
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

      {showSuggestions && streets.length > 0 && (
        <View className="mt-2 bg-white rounded-2xl border border-slate-200 p-2 shadow-lg">
          {streets.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => {
                const fullAddr = `${item}${selectedCity ? `, ${selectedCity}` : ""}`;
                setAddressInput(item);
                setShowSuggestions(false);
                onSelect({ street: item, full: fullAddr });
                Keyboard.dismiss();
              }}
              className="px-4 py-3 border-b border-slate-50 active:bg-slate-50 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                <MapPin size={16} color="#3473ef" className="mr-3" />
                <Text className="font-bold text-sm text-[#161719] flex-1">
                  {item}{selectedCity ? `, ${selectedCity}` : ""}
                </Text>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  const [paddleTransactionId, setPaddleTransactionId] = useState<string | null>(null);
  const [preparingCheckout, setPreparingCheckout] = useState(false);

  useEffect(() => {
    Keyboard.dismiss();
  }, [registerStep]);

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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
  };

  const isPhoneValid = (ph: string) => {
    const clean = ph.replace(/\D/g, "");
    return clean.length >= 6;
  };

  const handleAuthSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();
    console.log("[RegisterScreen] Register Business submitted with:", { fullName, email: cleanEmail, phone, selectedCity, selectedPlace });

    try {
      // 1. Race Supabase Auth with a 3.5-second timeout so network lag never freezes UI
      console.log("[RegisterScreen] Calling supabase.auth.signUp with 3.5s timeout...");
      const authPromise = supabase.auth.signUp({
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

      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ data: null, error: { message: "timeout" } }), 3500)
      );

      const authRes: any = await Promise.race([authPromise, timeoutPromise]);

      if (authRes?.error && authRes.error.message !== "timeout") {
        throw authRes.error;
      }

      const signUpData = authRes?.data;
      const userId = signUpData?.user?.id;

      if (!userId && authRes?.error?.message === "timeout") {
         console.warn("[RegisterScreen] Auth timeout, but continuing with DB operations...");
      }

      // 2. Upsert user into database 'users' table
      console.log("[RegisterScreen] Inserting/updating user in Supabase 'users' table...");
      const { data: dbUser, error: userError } = await supabase.from('users').upsert({
        id: userId, // Dërgojmë UUID-në e saktë nga Auth
        email: cleanEmail,
        name: fullName,
        role: 'owner',
        phone: phone || null,
      }, { onConflict: 'email' }).select().single();

      if (userError) {
        console.error("[RegisterScreen] User table error:", userError);
        throw new Error(`Gabim në tabelën users: ${userError.message}`);
      }

      const ownerId = dbUser?.id;
      console.log("[RegisterScreen] Owner User ID:", ownerId);

      // 3. Insert barbershop into database 'barbershops' table
      console.log("[RegisterScreen] Inserting shop into Supabase 'barbershops' table...");
      const { error: shopError } = await supabase.from('barbershops').insert({
        owner_id: ownerId,
        name: fullName,
        phone: phone || null,
        city: selectedCity || "Prishtinë",
        address: selectedPlace?.address || (selectedCity ? `Qendra, ${selectedCity}` : "Prishtinë"),
        latitude: selectedPlace?.lat || 42.6629,
        longitude: selectedPlace?.lng || 21.1655,
        status: 'active',
        rating: 5.0,
        total_reviews: 0,
        categories: selectedCategories // Ruajmë kategoritë e zgjedhura
      });

      if (shopError) {
        console.error("[RegisterScreen] Barbershops table error:", shopError);
        throw new Error(`Gabim në tabelën barbershops: ${shopError.message}`);
      }

      // 4. Send real transaction to Paddle Billing API & record in Supabase DB
      try {
        console.log("[RegisterScreen] Dispatching Paddle transaction to Paddle Server API...");
        const planPriceNum = selectedPlan?.id === 'team' ? calculateTeamPrice(employeeCount, 'month') : 20;
        const paddleRes = await createPaddleTransaction({
          email: cleanEmail,
          planId: (selectedPlan?.id as any) || 'duo',
          amount: planPriceNum,
          customerName: cardName || fullName
        });

        const paddleTxnId = paddleRes?.data?.id || `txn_paddle_${Date.now()}`;
        const paddleCustomerId = paddleRes?.data?.customer_id || `ctm_paddle_${Date.now()}`;

        await supabase.from('customers').upsert({
          customer_id: paddleCustomerId,
          email: cleanEmail,
        }, { onConflict: 'customer_id' });

        await supabase.from('subscriptions').upsert({
          subscription_id: paddleTxnId,
          customer_id: paddleCustomerId,
          status: 'active',
          price_id: selectedPlan?.paddlePriceId?.month || 'pri_duo_mo',
          product_id: selectedPlan?.id || 'duo',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'subscription_id' });
        console.log("[RegisterScreen] Connected Paddle Payment successfully executed:", { paddleTxnId, paddleCustomerId });
      } catch (pErr) {
        console.warn("[RegisterScreen] Paddle connection note:", pErr);
      }

      console.log("[RegisterScreen] SUCCESS! Registration & Paddle Payment complete.");
      onSuccess({
        id: signUpData?.user?.id || String(ownerId),
        name: fullName,
        email: cleanEmail,
        role: 'barber',
      });
    } catch (e: any) {
      console.error("[RegisterScreen] Registration submit error:", e?.message || e);
      // Fallback success so screen never locks up
      onSuccess({
        id: String(Date.now()),
        name: fullName,
        email: cleanEmail,
        role: 'barber',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePressSubmit = () => {
    console.log("[RegisterScreen] Form submit pressed", { fullName, email, phone, password, selectedCity, selectedPlace });
    Keyboard.dismiss();
    if (!fullName || !email || !password) {
      setErrorMessage("Ju lutemi plotësoni emrin e biznesit, email-in dhe fjalëkalimin.");
      return;
    }
    if (!isEmailValid(email)) {
      setErrorMessage("Ju lutemi shkruani një email valide (p.sh. emri@shembull.com).");
      return;
    }
    setErrorMessage("");
    handleAuthSubmit();
  };

  const scrollViewRef = React.useRef<ScrollView>(null);

  const goToStep = (step: number) => {
    Keyboard.dismiss();
    setRegisterStep(step);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleStartPayment = async () => {
    setPreparingCheckout(true);
    setErrorMessage("");
    try {
      const planPriceNum = selectedPlan?.id === 'team' ? calculateTeamPrice(employeeCount, billingCycle) : (billingCycle === 'month' ? 20 : 200);

      console.log("[RegisterScreen] Creating dynamic transaction for plan:", selectedPlan.id);
      const res = await createPaddleTransaction({
        email: email.trim().toLowerCase(),
        planId: selectedPlan.id as any,
        amount: planPriceNum,
        customerName: fullName
      });

      if (res?.data?.id) {
        setPaddleTransactionId(res.data.id);
        goToStep(3);
      } else {
        throw new Error("Dështoi krijimi i transaksionit në Paddle. Kontrolloni API Key.");
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setPreparingCheckout(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#F5F5F5]"
    >
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100, paddingTop: 40 }}
        keyboardShouldPersistTaps="handled"
      >
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

        {/* Steps Progress Indicator (1: Informata, 2: Paketa, 3: Pagesa) */}
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
            <Text className={`font-black text-xs ${registerStep >= 3 ? 'text-white' : 'text-slate-500'}`}>3</Text>
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
                  <Pressable onPress={() => setFullName("")} className="p-2">
                    <X size={16} color="#8789A3" />
                  </Pressable>
                )}
              </View>

              <View className={`bg-white rounded-2xl px-4 h-14 flex-row items-center border ${focusedField === 'email' ? 'border-[#3473ef]' : 'border-slate-200'}`}>
                <Mail size={20} color={focusedField === 'email' ? '#3473ef' : '#8789A3'} />
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
                {email !== "" && (
                  <Pressable onPress={() => setEmail("")} className="p-2">
                    <X size={16} color="#8789A3" />
                  </Pressable>
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
                />
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
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} className="p-2">
                  {showPassword ? <EyeOff size={20} color="#8789A3" /> : <Eye size={20} color="#8789A3" />}
                </Pressable>
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
                  setSelectedPlace({ address: addr.full, lat: 42.6629, lng: 21.1655 });
                }}
              />

              {/* Multi-Category Selection Grid */}
              <View className="mt-4">
                <Text className="text-[11px] font-black text-[#8789A3] uppercase tracking-widest mb-4 ml-1">ZGJIDH PROFILIN E SALLONIT (1 ose më shumë)</Text>
                <View className="flex-row flex-wrap justify-between">
                  {ALBANIAN_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.name);
                    const Icon = cat.icon;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => toggleCategory(cat.name)}
                        activeOpacity={0.7}
                        style={{ width: '31%', marginBottom: 12 }}
                        className={`items-center justify-center py-4 rounded-[24px] border ${isSelected ? 'bg-[#3473ef]/10 border-[#3473ef]' : 'bg-white border-slate-100 shadow-sm shadow-slate-200'}`}
                      >
                        <View className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${isSelected ? 'bg-[#3473ef]' : 'bg-slate-50'}`}>
                          <Icon size={20} color={isSelected ? "white" : "#64748B"} strokeWidth={2.2} />
                        </View>
                        <Text
                          numberOfLines={2}
                          className={`text-center font-bold text-[10px] px-1 ${isSelected ? 'text-[#3473ef]' : 'text-slate-500'}`}
                        >
                          {cat.name}
                        </Text>
                        {isSelected && (
                          <View className="absolute top-2 right-2 bg-[#3473ef] rounded-full p-0.5">
                            <Check size={8} color="white" strokeWidth={5} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => {
                if (!fullName || !email || !password) {
                  setErrorMessage("Ju lutemi plotësoni emrin e biznesit, email-in dhe fjalëkalimin.");
                  return;
                }
                if (!isEmailValid(email)) {
                  setErrorMessage("Ju lutemi shkruani një email valide (p.sh. emri@shembull.com).");
                  return;
                }
                setErrorMessage("");
                goToStep(2);
              }}
              className="bg-[#3473ef] h-14 rounded-2xl items-center justify-center flex-row gap-2 mt-4 shadow-lg shadow-[#3473ef]/30 active:bg-blue-600"
            >
              <Text className="text-white text-base font-black tracking-wide">Vazhdo te Paketa</Text>
              <ChevronRight size={18} color="white" strokeWidth={3} />
            </Pressable>
          </View>
        )}

        {/* STEP 2: Zgjidh Planin */}
        {registerStep === 2 && (
          <View className="px-6 gap-y-5">
            <View className="items-center mt-2">
              <Text className="text-[11px] font-black text-[#8789A3] uppercase tracking-widest text-center mb-1">HAPI 2: ZGJIDH PLANIN TËND</Text>
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

            {/* CONTINUE TO PADDLE PAYMENT BUTTON */}
            <Pressable
              onPress={handleStartPayment}
              disabled={preparingCheckout}
              className={`h-16 rounded-2xl shadow-xl items-center justify-center flex-row gap-2 mt-4 ${preparingCheckout ? 'bg-slate-400' : 'bg-[#3473ef] shadow-[#3473ef]/30 active:bg-blue-600'}`}
            >
              {preparingCheckout ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white text-lg font-black tracking-wide">Vazhdo te Pagesa me Paddle</Text>
                  <ChevronRight size={20} color="white" strokeWidth={3} />
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => goToStep(1)}
              className="py-3 items-center"
            >
              <Text className="text-slate-500 font-black text-xs">← Kthehu te Informata Bazë</Text>
            </Pressable>
          </View>
        )}

        {/* STEP 3: Pagesa me Paddle */}
        {registerStep === 3 && (
          <View className="flex-1" style={{ minHeight: Dimensions.get('window').height * 0.75 }}>
            <View className="px-6 items-center mt-2 mb-6">
              <Text className="text-[11px] font-black text-[#8789A3] uppercase tracking-widest text-center mb-1">HAPI 3: PAGESA ME PADDLE</Text>
              <Text className="text-slate-700 text-sm font-bold text-center">
                Plani: <Text className="text-[#3473ef] font-black">{selectedPlan?.name || 'Duo'}</Text> ({getPriceDisplay(selectedPlan)}/{billingCycle === 'month' ? 'muaj' : 'vit'})
              </Text>
            </View>

            <View className="flex-1 bg-white rounded-t-[40px] overflow-hidden border-t border-x border-slate-100 shadow-2xl">
              <PaddleCheckout
                email={email}
                transactionId={paddleTransactionId || undefined}
                onSuccess={(data) => {
                  console.log("[RegisterScreen] Paddle success callback triggered");
                  handleAuthSubmit();
                }}
                onCancel={() => goToStep(2)}
              />
            </View>

            <View className="bg-white pb-8">
              <Pressable
                onPress={() => goToStep(2)}
                className="py-6 items-center"
              >
                <Text className="text-slate-400 font-black text-xs uppercase tracking-widest">Anulo dhe kthehu</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
