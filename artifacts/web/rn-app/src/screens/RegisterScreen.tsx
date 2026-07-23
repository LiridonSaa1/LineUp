import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Dimensions, ActivityIndicator, Keyboard, StyleSheet } from "react-native";
import { User, CreditCard, Shield, Store, Mail, Lock, Eye, EyeOff, Phone, ChevronDown, Search, ArrowLeft, Check, ChevronRight, Zap, Sparkles, MapPin, X } from "lucide-react-native";
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

const REGISTRATION_PLANS = [
  { id: 'starter', name: 'Plani Starter', price: '19€', period: 'muaj', features: ['Deri në 300 rezervime/muaj', '1 profil stafi', 'Kalendari i rezervimeve', 'Njoftime me email'] },
  { id: 'pro', name: 'Plani Pro', price: '39€', period: 'muaj', features: ['Rezervime pa limit', 'Deri në 5 profile stafi', 'Njoftime me SMS & Email', 'Statistika & Raporte', 'Mbështetje prioritare'], isPopular: true },
  { id: 'elite', name: 'Plani Elite', price: '59€', period: 'muaj', features: ['Të gjitha të planit Pro', 'Profile stafi pa limit', 'Marketing me SMS', 'Landing page e personalizuar', 'Asistent personal 24/7'] }
];

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
  const [citySearch, setCitySearch] = useState("");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState(REGISTRATION_PLANS[1]);

  // Paddle Checkout states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

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
          }
        }
      });

      if (signUpError) {
        setErrorMessage(signUpError.message);
        setLoading(false);
        return;
      }

      if (signUpData?.user) {
        // Insert into users table in Supabase
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
    <View className="flex-1 bg-[#F5F5F5]">
      {/* Background Decorative Blobs */}
      <View className="absolute top-[-50] left-[-50] w-64 h-64 bg-[#3473ef]/15 rounded-full blur-3xl" />
      <View className="absolute top-[200] right-[-100] w-80 h-80 bg-[#f47458]/15 rounded-full blur-3xl" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 80, paddingTop: 40 }} keyboardShouldPersistTaps="handled">
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
            
            <View className={`bg-white rounded-2xl px-4 h-14 flex-row items-center border transition-all ${focusedField === 'fullName' ? 'border-[#3473ef] shadow-md shadow-[#3473ef]/5' : 'border-slate-200'}`}>
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
                <TouchableOpacity onPress={() => setFullName("")} className="p-1">
                  <X size={16} color="#8789A3" />
                </TouchableOpacity>
              )}
            </View>

            <View className={`bg-white rounded-2xl px-4 h-14 flex-row items-center border transition-all ${focusedField === 'email' ? 'border-[#3473ef] shadow-md shadow-[#3473ef]/5' : 'border-slate-200'}`}>
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
                <TouchableOpacity onPress={() => setEmail("")} className="p-1">
                  <X size={16} color="#8789A3" />
                </TouchableOpacity>
              )}
            </View>

            <View className={`bg-white rounded-2xl px-4 h-14 flex-row items-center border transition-all ${focusedField === 'phone' ? 'border-[#3473ef] shadow-md shadow-[#3473ef]/5' : 'border-slate-200'}`}>
              <Phone size={20} color={focusedField === 'phone' ? '#3473ef' : '#8789A3'} />
              <TextInput
                placeholder="Telefoni +383"
                value={phone}
                onChangeText={(val) => {
                  // Format Kosova phone number dynamically
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
                <TouchableOpacity onPress={() => setPhone("")} className="p-1">
                  <X size={16} color="#8789A3" />
                </TouchableOpacity>
              )}
            </View>

            <View className={`bg-white rounded-2xl px-4 h-14 flex-row items-center border transition-all ${focusedField === 'password' ? 'border-[#3473ef] shadow-md shadow-[#3473ef]/5' : 'border-slate-200'}`}>
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
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                {showPassword ? <EyeOff size={20} color={focusedField === 'password' ? '#3473ef' : '#8789A3'} /> : <Eye size={20} color={focusedField === 'password' ? '#3473ef' : '#8789A3'} />}
              </TouchableOpacity>
            </View>

            {/* City Picker input */}
            <View className="relative z-50">
              <TouchableOpacity
                onPress={() => setShowCityPicker(!showCityPicker)}
                className={`w-full bg-white border rounded-2xl px-4 h-14 flex-row items-center justify-between transition-all ${showCityPicker ? 'border-[#3473ef] shadow-md shadow-[#3473ef]/5' : 'border-slate-200'}`}
              >
                <View className="flex-row items-center gap-3">
                  <MapPin size={20} color={selectedCity ? "#3473ef" : "#8789A3"} />
                  <Text className="text-[#161719] font-bold text-base">{selectedCity || "Qyteti"}</Text>
                </View>
                {showCityPicker ? (
                  <X size={18} color="#8789A3" strokeWidth={2.5} />
                ) : (
                  <ChevronDown size={20} color="#8789A3" />
                )}
              </TouchableOpacity>

              {showCityPicker && (
                <View className="absolute top-16 left-0 right-0 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50">
                  <View className="flex-row items-center px-4 py-3 border-b border-slate-100">
                    <Search size={16} color="#8789A3" />
                    <TextInput
                      placeholder="Kërko qytetin..."
                      placeholderTextColor="#94A3B8"
                      className="flex-1 ml-2 font-bold text-sm text-[#161719]"
                      value={citySearch}
                      onChangeText={setCitySearch}
                    />
                  </View>
                  <View style={{ maxHeight: 180 }}>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="always">
                      {KOSOVO_CITIES.filter(c => c.city.toLowerCase().includes(citySearch.toLowerCase())).map(city => (
                        <TouchableOpacity
                          key={city.city}
                          onPress={() => {
                            setSelectedCity(city.city);
                            setShowCityPicker(false);
                            setCitySearch("");
                            setSelectedPlace(null);
                            Keyboard.dismiss();
                          }}
                          className={`px-5 py-3.5 border-b border-slate-100 ${selectedCity === city.city ? 'bg-[#3473ef]/10' : ''}`}
                        >
                          <Text className={`font-bold text-sm ${selectedCity === city.city ? 'text-[#3473ef]' : 'text-[#161719]'}`}>{city.city}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>

            {/* Street address input */}
            <View className={`bg-white rounded-2xl px-4 h-14 flex-row items-center border transition-all ${focusedField === 'address' ? 'border-[#3473ef] shadow-md shadow-[#3473ef]/5' : 'border-slate-200'}`}>
              <MapPin size={20} color={focusedField === 'address' ? '#3473ef' : '#8789A3'} />
              <TextInput
                placeholder="Adresa (Rruga dhe Numri)"
                value={selectedPlace ? selectedPlace.address : ""}
                onChangeText={(val) => setSelectedPlace(val ? { address: val, lat: 42.6629, lng: 21.1655 } : null)}
                className="flex-1 ml-3 font-bold text-[#161719] text-base"
                placeholderTextColor="#94A3B8"
                onFocus={() => setFocusedField('address')}
                onBlur={() => setFocusedField(null)}
                textContentType="fullStreetAddress"
                autoComplete="street-address"
              />
              {selectedPlace && selectedPlace.address !== "" && (
                <TouchableOpacity onPress={() => setSelectedPlace(null)} className="p-1">
                  <X size={18} color="#8789A3" strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              if (!fullName || !email || !phone || !password || !selectedPlace) {
                setErrorMessage("Ju lutemi plotësoni të gjitha fushat dhe zgjidhni adresën.");
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
          <Text className="text-[11px] font-black text-[#8789A3] uppercase tracking-widest text-center mt-2">HAPI 2: ZGJIDH PLANIN TËND</Text>
          
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
                    <Text className="text-lg font-black text-[#161719]">{plan.name}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-2xl font-black text-[#3473ef]">{plan.price}</Text>
                    <Text className="text-slate-400 text-[10px] font-bold mt-0.5">/{plan.period}</Text>
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
        <View className="px-6 gap-y-6">
          <View className="items-center mt-2">
            <Text className="text-[11px] font-black text-[#8789A3] uppercase tracking-widest text-center mb-1">HAPI 3: PAGESA ME PADDLE</Text>
            <Text className="text-slate-500 text-xs font-bold text-center">Faturimi i sigurt i planit {selectedPlan.name} ({selectedPlan.price})</Text>
          </View>

          {/* Styled Mock Paddle Checkout Container */}
          <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-2xl shadow-black/5">
            <View className="flex-row items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <View className="flex-row items-center gap-2">
                <CreditCard size={18} color="#3473ef" />
                <Text className="text-[#161719] font-black text-sm">Pagesë e sigurt me Paddle</Text>
              </View>
              <Lock size={14} color="#8789A3" />
            </View>

            {/* Card Fields */}
            <View className="gap-y-4 mb-6">
              <View className={`bg-slate-50 rounded-2xl px-4 h-12 flex-row items-center border transition-all ${focusedField === 'cardNumber' ? 'border-[#3473ef] bg-white shadow-md shadow-[#3473ef]/5' : 'border-slate-200'}`}>
                <CreditCard size={16} color={focusedField === 'cardNumber' ? '#3473ef' : '#8789A3'} />
                <TextInput
                  placeholder="Numri i Kartës"
                  placeholderTextColor="#94A3B8"
                  value={cardNumber}
                  onChangeText={(val) => {
                    const cleaned = val.replace(/\D/g, "");
                    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
                    setCardNumber(formatted);
                  }}
                  keyboardType="numeric"
                  maxLength={19} // 16 digits + 3 spaces
                  className="flex-1 ml-3 font-bold text-[#161719] text-sm"
                  onFocus={() => setFocusedField('cardNumber')}
                  onBlur={() => setFocusedField(null)}
                  textContentType="creditCardNumber"
                  autoComplete="cc-number"
                />
              </View>

              <View className="flex-row gap-3">
                <View className={`bg-slate-50 rounded-2xl px-4 h-12 flex-row items-center border flex-1 transition-all ${focusedField === 'cardExpiry' ? 'border-[#3473ef] bg-white shadow-md shadow-[#3473ef]/5' : 'border-slate-200'}`}>
                  <TextInput
                    placeholder="MM/VV"
                    placeholderTextColor="#94A3B8"
                    value={cardExpiry}
                    onChangeText={(val) => {
                      const cleaned = val.replace(/\D/g, "");
                      let formatted = cleaned;
                      if (cleaned.length > 2) {
                        formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
                      }
                      setCardExpiry(formatted);
                    }}
                    keyboardType="numeric"
                    maxLength={5}
                    className="flex-1 font-bold text-[#161719] text-sm text-center"
                    onFocus={() => setFocusedField('cardExpiry')}
                    onBlur={() => setFocusedField(null)}
                    textContentType="none"
                    autoComplete="cc-exp"
                  />
                </View>
                <View className={`bg-slate-50 rounded-2xl px-4 h-12 flex-row items-center border flex-1 transition-all ${focusedField === 'cardCvv' ? 'border-[#3473ef] bg-white shadow-md shadow-[#3473ef]/5' : 'border-slate-200'}`}>
                  <TextInput
                    placeholder="CVV"
                    placeholderTextColor="#94A3B8"
                    value={cardCvv}
                    onChangeText={setCardCvv}
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={3}
                    className="flex-1 font-bold text-[#161719] text-sm text-center"
                    onFocus={() => setFocusedField('cardCvv')}
                    onBlur={() => setFocusedField(null)}
                    textContentType="none"
                    autoComplete="cc-csc"
                  />
                </View>
              </View>

              <View className={`bg-slate-50 rounded-2xl px-4 h-12 flex-row items-center border transition-all ${focusedField === 'cardName' ? 'border-[#3473ef] bg-white shadow-md shadow-[#3473ef]/5' : 'border-slate-200'}`}>
                <User size={16} color={focusedField === 'cardName' ? '#3473ef' : '#8789A3'} />
                <TextInput
                  placeholder="Emri në Kartë"
                  placeholderTextColor="#94A3B8"
                  value={cardName}
                  onChangeText={setCardName}
                  className="flex-1 ml-3 font-bold text-[#161719] text-sm"
                  onFocus={() => setFocusedField('cardName')}
                  onBlur={() => setFocusedField(null)}
                  textContentType="name"
                  autoComplete="name"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleAuthSubmit}
              disabled={loading || !cardNumber || !cardExpiry || !cardCvv || !cardName}
              activeOpacity={0.9}
              className="bg-black h-14 rounded-2xl items-center justify-center shadow-lg active:scale-98"
            >
               {loading ? (
                 <ActivityIndicator color="white" />
               ) : (
                 <Text className="text-white text-base font-black tracking-wide">
                   Paguaj & Regjistro Sallonin ({selectedPlan.price})
                 </Text>
               )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setRegisterStep(2)}
            className="py-3 items-center"
          >
            <Text className="text-slate-500 font-black text-xs">Kthehu mbrapa</Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
    </View>
  );
};
