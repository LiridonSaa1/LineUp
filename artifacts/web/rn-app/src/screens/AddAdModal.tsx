import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Dimensions, Image, Alert } from 'react-native';
import { X, Megaphone, MapPin, Camera, Check, ChevronDown, Info, Search, Building2, Calendar, Sparkles, Zap, Award } from 'lucide-react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { supabase } from '@/config/supabase';

const { width, height } = Dimensions.get("window");
const GOOGLE_MAPS_KEY = 'AIzaSyD9DOb-ko2C84TUlBVuPVILNaf3Jhkl-yg';

// Comprehensive list of Kosovo Municipalities with Coordinates
const CITY_DATA: Record<string, { lat: number; lng: number }> = {
  "Prishtinë": { lat: 42.6629, lng: 21.1655 },
  "Prizren": { lat: 42.2139, lng: 20.7397 },
  "Pejë": { lat: 42.6593, lng: 20.2883 },
  "Gjakovë": { lat: 42.3803, lng: 20.4308 },
  "Gjilan": { lat: 42.4635, lng: 21.4678 },
  "Mitrovicë": { lat: 42.8914, lng: 20.8660 },
  "Ferizaj": { lat: 42.3703, lng: 21.1559 },
  "Vushtrri": { lat: 42.8231, lng: 20.9675 },
  "Podujevë": { lat: 42.9114, lng: 21.1903 },
  "Rahovec": { lat: 42.3994, lng: 20.6553 },
  "Fushë Kosovë": { lat: 42.6340, lng: 21.0963 },
  "Skënderaj": { lat: 42.7478, lng: 20.7878 },
  "Lipjan": { lat: 42.5217, lng: 21.1258 },
  "Malishevë": { lat: 42.4822, lng: 20.7461 },
  "Kamenicë": { lat: 42.5781, lng: 21.5803 },
  "Suharekë": { lat: 42.3581, lng: 20.8250 },
  "Viti": { lat: 42.3214, lng: 21.3583 },
  "Deçan": { lat: 42.5353, lng: 20.2878 },
  "Istog": { lat: 42.7808, lng: 20.4875 },
  "Klinë": { lat: 42.6225, lng: 20.5786 },
  "Drenas (Gllogoc)": { lat: 42.6228, lng: 20.8933 },
  "Junik": { lat: 42.4764, lng: 20.2742 },
  "Mamushë": { lat: 42.3325, lng: 20.7275 },
  "Elez Han": { lat: 42.1467, lng: 21.2986 },
  "Graçanicë": { lat: 42.5983, lng: 21.1917 },
  "Ranillug": { lat: 42.4931, lng: 21.6214 },
  "Partesh": { lat: 42.4031, lng: 21.4331 },
  "Kllokot": { lat: 42.3703, lng: 21.3753 },
  "Novobërdë": { lat: 42.6153, lng: 21.4339 },
  "Shtërpcë": { lat: 42.2394, lng: 21.0264 },
  "Leposaviq": { lat: 43.1039, lng: 20.8094 },
  "Zveçan": { lat: 42.9039, lng: 20.8403 },
  "Zubin Potok": { lat: 42.9133, lng: 20.6897 },
};

const CITIES = Object.keys(CITY_DATA).sort();

const PLANS = [
  { id: 1, name: "Basic Promotion", price: "9.99€", duration: "3 ditë", icon: Zap, color: "#94A3B8" },
  { id: 2, name: "Premium Promotion", price: "15.99€", duration: "7 ditë", icon: Sparkles, color: "#3473ef", isPopular: true },
  { id: 3, name: "VIP Featured Partner", price: "24.99€", duration: "14 ditë", icon: Award, color: "#fbbf24" }
];

interface AddAdModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddAdModal: React.FC<AddAdModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [selectedCity, setSelectedCity] = useState("Prishtinë");
  const [citySearch, setCitySearch] = useState("");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);

  const autocompleteRef = useRef<any>(null);

  const filteredCities = CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));

  const handleSubmit = async () => {
    if (!businessName || !selectedPlace) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('advertisements').insert({
        business_name: businessName,
        city: selectedCity,
        address: selectedPlace.address,
        latitude: selectedPlace.lat,
        longitude: selectedPlace.lng,
        plan_id: selectedPlan.id,
        price: parseFloat(selectedPlan.price.replace('€', '')),
        status: 'pending'
      });

      if (!error) {
        Alert.alert("Sukses", "Reklama juaj u regjistrua me sukses!");
        onSuccess();
      } else {
        console.error("Error saving advertisement:", error);
        Alert.alert("Gabim", "Nuk mund të ruhej reklama. Ju lutem provoni përsëri.");
      }
    } catch (e) {
      console.error("Supabase insert error:", e);
      Alert.alert("Gabim", "Pati një problem me lidhjen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Modal Handle */}
      <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mt-3 mb-2" />

      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-50">
        <Text className="text-2xl font-black text-[#161719]">Shto Reklamë</Text>
        <TouchableOpacity onPress={onClose} className="p-1">
          <X size={28} color="#161719" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-6">

          {/* Business Info Section */}
          <Text className="text-xs font-black text-[#8789A3] uppercase tracking-widest mb-3 ml-1">Detajet e Biznesit</Text>
          <View className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 shadow-sm shadow-black/5">
            <View className="flex-row items-center border-b border-slate-200 pb-2 mb-4">
               <Building2 size={18} color="#8789A3" />
               <TextInput
                  placeholder="Emri i Biznesit"
                  className="flex-1 ml-3 text-[#161719] font-bold text-base h-10"
                  placeholderTextColor="#94A3B8"
                  value={businessName}
                  onChangeText={setBusinessName}
               />
            </View>

            <TouchableOpacity
              onPress={() => setShowCityPicker(!showCityPicker)}
              className="flex-row items-center justify-between h-10 px-0.5"
            >
               <View className="flex-row items-center">
                  <MapPin size={18} color="#8789A3" />
                  <Text className="text-[#161719] font-bold text-base ml-3">{selectedCity}</Text>
               </View>
               <ChevronDown size={20} color="#94A3B8" />
            </TouchableOpacity>

            {showCityPicker && (
               <View className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                  <View className="flex-row items-center px-4 py-3 border-b border-slate-100">
                    <Search size={16} color="#8789A3" />
                    <TextInput
                      placeholder="Kërko qytetin..."
                      className="flex-1 ml-2 font-bold text-sm text-[#161719]"
                      value={citySearch}
                      onChangeText={setCitySearch}
                    />
                  </View>
                  <View style={{ maxHeight: 250 }}>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="always">
                      {filteredCities.map(city => (
                        <TouchableOpacity
                          key={city}
                          onPress={() => {
                          setSelectedCity(city);
                          setShowCityPicker(false);
                          setCitySearch("");
                          // Clear address search when city changes
                          autocompleteRef.current?.setAddressText('');
                          setSelectedPlace(null);
                        }}
                          className={`px-5 py-3.5 border-b border-slate-50 ${selectedCity === city ? 'bg-[#3473ef]/5' : ''}`}
                        >
                          <Text className={`font-bold text-sm ${selectedCity === city ? 'text-[#3473ef]' : 'text-[#161719]'}`}>{city}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
               </View>
            )}
          </View>

          {/* Location Autocomplete */}
          <Text className="text-xs font-black text-[#8789A3] uppercase tracking-widest mb-3 ml-1">Lokacioni i Verifikuar</Text>
          <View className="mb-6 z-50">
             <GooglePlacesAutocomplete
                ref={autocompleteRef}
                placeholder={`Kërko rrugën në ${selectedCity}...`}
                fetchDetails={true}
                onPress={(data, details = null) => {
                  setSelectedPlace({
                    address: data.description,
                    lat: details?.geometry?.location?.lat || 0,
                    lng: details?.geometry?.location?.lng || 0
                  });
                }}
                query={{
                  key: GOOGLE_MAPS_KEY,
                  language: 'sq',
                  components: 'country:xk',
                  location: `${CITY_DATA[selectedCity].lat},${CITY_DATA[selectedCity].lng}`,
                  radius: 5000, // 5km strict radius biasing
                  strictbounds: true
                }}
                enablePoweredByContainer={false}
                minLength={2}
                textInputProps={{
                   onChangeText: (text) => {
                      if (text === "") setSelectedPlace(null);
                   }
                }}
                styles={{
                  textInputContainer: { backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 8 },
                  textInput: { height: 56, fontSize: 16, color: '#161719', fontWeight: 'bold', backgroundColor: 'transparent' },
                  listView: { backgroundColor: 'white', borderRadius: 20, marginTop: 10, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, zIndex: 1000 },
                  row: { padding: 15, height: 60, flexDirection: 'row' },
                  description: { fontSize: 15, color: '#161719', fontWeight: '500' },
                }}
                renderLeftButton={() => <View className="justify-center pl-2"><Search size={20} color="#3473ef" /></View>}
             />
          </View>

          {selectedPlace && (
             <View className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 mb-8">
                <View className="flex-row items-center mb-2">
                   <Check size={18} color="#10b981" strokeWidth={3} />
                   <Text className="text-emerald-600 font-black text-xs uppercase ml-2 tracking-widest">Adresa u verifikua</Text>
                </View>
                <Text className="text-[#161719] font-bold text-sm leading-5">{selectedPlace.address}</Text>
             </View>
          )}

          {/* Image Upload Area */}
          <Text className="text-xs font-black text-[#8789A3] uppercase tracking-widest mb-3 ml-1">Vizuali i Reklamës</Text>
          <TouchableOpacity className="h-44 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 items-center justify-center mb-8">
             <View className="w-14 h-14 bg-white rounded-full items-center justify-center shadow-sm mb-3">
                <Camera size={24} color="#3473ef" />
             </View>
             <Text className="text-[#161719] font-black text-sm">Ngarko Foto / Logo</Text>
             <Text className="text-[#8789A3] font-bold text-[11px] mt-1">Rekomandohet 1000x500px</Text>
          </TouchableOpacity>

          {/* Plan Selection */}
          <Text className="text-xs font-black text-[#8789A3] uppercase tracking-widest mb-3 ml-1">Zgjidh Planin</Text>
          <View className="gap-y-3 mb-10">
             {PLANS.map(plan => {
                const Icon = plan.icon;
                const isSelected = selectedPlan.id === plan.id;
                return (
                   <TouchableOpacity
                     key={plan.id}
                     onPress={() => setSelectedPlan(plan)}
                     className={`flex-row items-center p-4 rounded-3xl border-2 ${isSelected ? 'border-[#3473ef] bg-[#3473ef]/5' : 'border-slate-100 bg-white'}`}
                   >
                      <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: isSelected ? '#3473ef' : '#F1F5F9' }}>
                         <Icon size={24} color={isSelected ? 'white' : plan.color} />
                      </View>
                      <View className="flex-1 ml-4">
                         <View className="flex-row items-center">
                            <Text className="text-[#161719] font-black text-[15px]">{plan.name}</Text>
                            {plan.isPopular && (
                               <View className="bg-amber-400 px-2 py-0.5 rounded-full ml-2">
                                  <Text className="text-[#161719] text-[7px] font-black uppercase">Më i Populluari</Text>
                               </View>
                            )}
                         </View>
                         <Text className="text-[#8789A3] font-bold text-xs">Kohëzgjatja: {plan.duration}</Text>
                      </View>
                      <Text className={`text-lg font-black ${isSelected ? 'text-[#3473ef]' : 'text-[#161719]'}`}>{plan.price}</Text>
                   </TouchableOpacity>
                );
             })}
          </View>

        </View>
        <View className="h-40" />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 border-t border-slate-50">
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !businessName || !selectedPlace}
          className={`h-16 rounded-[24px] items-center justify-center shadow-xl ${(!businessName || !selectedPlace) ? 'bg-slate-300' : 'bg-black'}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-black">Vazhdo te Pagesa — {selectedPlan.price}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
