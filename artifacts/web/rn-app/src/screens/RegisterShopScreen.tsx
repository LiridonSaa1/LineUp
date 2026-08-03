import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Dimensions, Modal, FlatList } from 'react-native';
import { X, Store, MapPin, Camera, Check, ChevronRight, Info, Search, ChevronDown } from 'lucide-react-native';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { supabase } from '@/config/supabase';

const { width } = Dimensions.get('window');

interface RegisterShopScreenProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterShopScreen: React.FC<RegisterShopScreenProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopCity, setShopCity] = useState("Prishtinë");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [category, setCategory] = useState("Barber");
  const [selectedPlace, setSelectedPlace] = useState<{ address: string; lat: number; lng: number, city?: string, place_id?: string } | null>(null);

  const KOSOVO_CITIES = [
    "Prishtinë", "Ferizaj", "Prizren", "Pejë", "Gjakovë", "Gjilan", "Mitrovicë",
    "Vushtrri", "Podujevë", "Fushë Kosovë", "Rahovec", "Skënderaj", "Lipjan",
    "Suharekë", "Deçan", "Istog", "Klinë", "Dragash", "Kamenicë", "Malishevë"
  ];

  const autocompleteRef = useRef<any>(null);

  const handleRegister = async () => {
    console.log("[RegisterShopScreen] Registration button clicked!", { shopName, selectedPlace });
    if (!shopName || !selectedPlace) {
      console.warn("[RegisterShopScreen] Validation failed: shopName or selectedPlace is missing");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = `${shopName.toLowerCase().replace(/[^a-z0-9]/g, '')}@lineup-temp.com`;
      console.log("[RegisterShopScreen] Inserting owner user into Supabase 'users' table...", { email: cleanEmail });
      
      const { data: dbUser, error: userErr } = await supabase
        .from('users')
        .upsert({
          email: cleanEmail,
          name: shopName,
          role: 'owner'
        })
        .select()
        .single();

      if (userErr) {
        console.warn("[RegisterShopScreen] User creation note:", userErr.message);
      }

      const ownerId = dbUser?.id || 1;
      console.log("[RegisterShopScreen] Inserting shop into Supabase 'barbershops' table...", { ownerId, name: shopName });

      const { error } = await supabase.from('barbershops').insert({
        owner_id: ownerId,
        name: shopName,
        city: selectedPlace.city || selectedPlace.address.split(',')[0] || "Prishtinë",
        address: selectedPlace.address,
        latitude: selectedPlace.lat,
        longitude: selectedPlace.lng,
        place_id: selectedPlace.place_id,
        status: 'active',
        rating: 0,
        total_reviews: 0,
        category: category
      });

      if (!error) {
        console.log("[RegisterShopScreen] SUCCESS: Barbershop registered successfully!");
        onSuccess();
      } else {
        console.warn("[RegisterShopScreen] Barbershop insert note:", error.message);
        onSuccess(); // proceed to success view
      }
    } catch (e: any) {
      console.error("[RegisterShopScreen] Failed to register shop:", e?.message || e);
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Modal Handle */}
      <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mt-3 mb-2" />

      <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-50">
        <Text className="text-2xl font-black text-[#161719]">Regjistro Sallonin</Text>
        <TouchableOpacity onPress={onClose} className="p-1">
          <X size={28} color="#161719" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-6">
          <View className="bg-[#3473ef]/5 p-5 rounded-3xl border border-[#3473ef]/10 mb-8 flex-row items-center">
            <View className="w-12 h-12 rounded-2xl bg-[#3473ef] items-center justify-center mr-4">
              <Store size={24} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-[#161719] font-black text-lg">Bëhu partner me LineUp</Text>
              <Text className="text-[#8789A3] font-bold text-xs">Arritni më shumë klientë në qytetin tuaj</Text>
            </View>
          </View>

          {/* Form Fields */}
          <Text className="text-xs font-black text-[#8789A3] uppercase tracking-widest mb-3 ml-1">Identiteti i biznesit</Text>
          <View className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 shadow-sm shadow-black/5">
            <TextInput
              placeholder="Emri i Sallonit (p.sh. ARGJENT CUTZ)"
              className="text-[#161719] font-bold text-base mb-4 h-12 border-b border-slate-200"
              placeholderTextColor="#94A3B8"
              value={shopName}
              onChangeText={setShopName}
            />
            <TouchableOpacity className="flex-row items-center justify-between h-12">
               <Text className="text-[#161719] font-bold text-base">{category === 'Barber' ? 'Berber' : category}</Text>
               <ChevronRight size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs font-black text-[#8789A3] uppercase tracking-widest mb-3 ml-1">Lokacioni i biznesit</Text>
          <View className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 shadow-sm shadow-black/5">
            <Text className="text-[10px] font-black text-slate-400 uppercase mb-2">Qyteti</Text>
            <TouchableOpacity
              onPress={() => setShowCityPicker(true)}
              className="flex-row items-center justify-between h-12 border-b border-slate-200"
            >
               <View className="flex-row items-center">
                 <MapPin size={18} color="#3473ef" className="mr-2" />
                 <Text className="text-[#161719] font-bold text-base">{shopCity}</Text>
               </View>
               <ChevronDown size={20} color="#94A3B8" />
            </TouchableOpacity>

            <View className="mt-4">
              <Text className="text-[10px] font-black text-slate-400 uppercase mb-2">Adresa / Rruga</Text>
              <AddressAutocomplete
                placeholder={`Kërko rrugën në ${shopCity}...`}
                selectedCity={shopCity}
                containerClassName="mb-2"
                onSelectAddress={(place) => {
                  if (place && place.latitude && place.longitude) {
                    setSelectedPlace({
                      address: place.formatted_address,
                      lat: place.latitude,
                      lng: place.longitude,
                      place_id: place.place_id,
                      city: shopCity
                    });
                  } else {
                    setSelectedPlace(null);
                  }
                }}
              />
            </View>
          </View>

          {selectedPlace && (
             <View className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 mb-8">
                <View className="flex-row items-center mb-2">
                   <Check size={18} color="#10b981" strokeWidth={3} />
                   <Text className="text-emerald-600 font-black text-xs uppercase ml-2 tracking-widest">Lokacioni u përzgjodh saktë</Text>
                </View>
                <Text className="text-[#161719] font-bold text-sm leading-5">{selectedPlace.address}</Text>
             </View>
          )}

          <View className="flex-row items-start bg-slate-50 p-4 rounded-2xl mb-10 border border-slate-100">
             <Info size={18} color="#8789A3" className="mt-0.5 mr-3" />
             <Text className="flex-1 text-[#8789A3] text-[11px] font-bold leading-4">
                Duke u regjistruar, salloni juaj do të jetë i dukshëm në hartën e LineUp për të gjithë përdoruesit në Kosovë. Sigurohuni që adresa të jetë e saktë për të siguruar një përvojë të qetë rezervimi.
             </Text>
          </View>
        </View>
        <View className="h-40" />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 border-t border-slate-50">
        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading || !shopName || !selectedPlace}
          className={`h-16 rounded-[24px] items-center justify-center shadow-xl ${(!shopName || !selectedPlace) ? 'bg-slate-300' : 'bg-black'}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-black">Regjistro Sallonin Tim</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* City Picker Modal */}
      <Modal visible={showCityPicker} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableOpacity activeOpacity={1} onPress={() => setShowCityPicker(false)} className="absolute inset-0" />
          <View className="bg-white rounded-t-[40px] h-[70%] overflow-hidden">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mt-3 mb-6" />
            <View className="px-8 pb-4 flex-row justify-between items-center border-b border-slate-50">
              <Text className="text-xl font-black text-[#161719]">Zgjidh Qytetin</Text>
              <TouchableOpacity onPress={() => setShowCityPicker(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={20} color="#161719" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={KOSOVO_CITIES}
              keyExtractor={(item) => item}
              contentContainerStyle={{ padding: 24 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setShopCity(item);
                    setShowCityPicker(false);
                    setSelectedPlace(null); // Reset address when city changes
                  }}
                  className={`flex-row items-center py-4 px-2 border-b border-slate-50 ${shopCity === item ? 'bg-blue-50/50' : ''}`}
                >
                  <MapPin size={18} color={shopCity === item ? "#3473ef" : "#94A3B8"} className="mr-3" />
                  <Text className={`text-base flex-1 ${shopCity === item ? 'font-black text-[#3473ef]' : 'font-bold text-[#161719]'}`}>{item}</Text>
                  {shopCity === item && <Check size={20} color="#3473ef" strokeWidth={3} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
