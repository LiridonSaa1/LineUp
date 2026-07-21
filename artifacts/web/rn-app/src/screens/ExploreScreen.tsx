import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Modal } from "react-native";
import { Search, MapPin, SlidersHorizontal, Star, Heart, ArrowLeft, Bell, ArrowUpRight, ChevronDown, Check } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { fetchFromAPI } from "@/config/api";
import { supabase } from "@/config/supabase";

interface ExploreScreenProps {
  onSelectShop: (shop: any) => void;
  initialCity?: string;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({ onSelectShop, initialCity = "Të gjitha" }) => {
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialCity) {
      setSelectedCity(initialCity);
    }
  }, [initialCity]);

  const CITIES = ["Të gjitha", "Deçan", "Dragash", "Drenas", "Ferizaj", "Fushë Kosovë", "Gjakovë", "Gjilan", "Graçanicë", "Han i Elezit", "Istog", "Junik", "Kaçanik", "Kamenicë", "Klinë", "Kllokot", "Leposaviq", "Lipjan", "Malishevë", "Mamushë", "Mitrovicë", "Mitrovicë e Veriut", "Novobërdë", "Obiliq", "Partesh", "Pejë", "Podujevë", "Prishtinë", "Prizren", "Rahovec", "Ranillug", "Skënderaj", "Shtime", "Shtërpcë", "Suharekë", "Viti", "Vushtrri", "Zubin Potok", "Zveçan"];

  useEffect(() => {
    async function loadShops() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('barbershops')
          .select('*')
          .eq('status', 'active');

        if (error) throw error;
        setShops(data || []);
      } catch (e) {
        console.warn("Error fetching shops from Supabase:", e);
      } finally {
        setLoading(false);
      }
    }
    loadShops();
  }, []);

  const filteredShops = shops.filter((shop) => {
    // Normalize city names for comparison (e.g. Prishtinë vs Prishtina)
    const normalize = (c: string) => c.toLowerCase().replace(/ë/g, 'a').trim();

    const matchesCity = selectedCity === "Të gjitha" ||
                        shop.city === selectedCity ||
                        normalize(shop.city || "") === normalize(selectedCity);

    const matchesQuery = !search ||
                         shop.name?.toLowerCase().includes(search.toLowerCase()) ||
                         shop.city?.toLowerCase().includes(search.toLowerCase());

    return matchesCity && matchesQuery;
  });

  return (
    <View className="flex-1 bg-[#F8F9FE]">
      {/* ── PURPLE HEADER BANNER ───────────────────────────── */}
      <View className="bg-[#3473ef] pt-14 pb-8 px-6 rounded-b-[40px] z-10">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity className="w-11 h-11 rounded-full bg-white items-center justify-center shadow-md">
            <ArrowLeft size={20} color="#161719" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text className="text-white text-xl font-black tracking-tight">Eksploro Qytetet</Text>

          <TouchableOpacity className="w-11 h-11 rounded-full bg-white items-center justify-center shadow-md">
            <Bell size={20} color="#3473ef" />
          </TouchableOpacity>
        </View>

        {/* Search Bar inside Header */}
        <View className="bg-white rounded-full px-5 py-3 flex-row items-center justify-between shadow-md">
          <View className="flex-row items-center gap-3 flex-1">
            <Search size={20} color="#8789A3" />
            <TextInput
              placeholder="Kërko berber, qytet..."
              placeholderTextColor="#8789A3"
              className="text-[#161719] font-bold text-sm flex-1"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity className="w-9 h-9 rounded-full bg-[#3473ef] items-center justify-center">
            <SlidersHorizontal size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── CITY DROPDOWN SELECTOR ─────────────────────────── */}
      <View className="pt-6 px-6 relative z-20">
        <TouchableOpacity
          onPress={() => setDropdownOpen(!dropdownOpen)}
          className="bg-white rounded-2xl border border-slate-200/80 px-5 py-3.5 flex-row justify-between items-center shadow-xs active:scale-98"
        >
          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-full bg-[#3473ef]/10 items-center justify-center">
              <MapPin size={18} color="#3473ef" />
            </View>
            <View>
              <Text className="text-[#8789A3] text-[10px] font-black uppercase tracking-widest">Qyteti i zgjedhur</Text>
              <Text className="text-[#161719] font-black text-sm">{selectedCity}</Text>
            </View>
          </View>

          <View className="w-8 h-8 rounded-full bg-[#EBF2FF] items-center justify-center">
            <ChevronDown size={18} color="#3473ef" />
          </View>
        </TouchableOpacity>

        {/* Expandable Dropdown List */}
        {dropdownOpen && (
          <View className="mt-2 bg-white rounded-3xl border border-slate-200 p-2 shadow-xl overflow-hidden">
            <ScrollView
              style={{ maxHeight: 210 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {CITIES.map((city) => {
                const isSelected = selectedCity === city;
                return (
                  <TouchableOpacity
                    key={city}
                    onPress={() => {
                      setSelectedCity(city);
                      setDropdownOpen(false);
                    }}
                    className={`flex-row items-center justify-between px-4 py-3 rounded-2xl mb-1 ${
                      isSelected ? "bg-[#3473ef] text-white" : "bg-transparent active:bg-slate-50"
                    }`}
                  >
                    <Text className={`font-extrabold text-sm ${isSelected ? "text-white" : "text-[#161719]"}`}>
                      📍 {city}
                    </Text>
                    {isSelected && <Check size={18} color="white" strokeWidth={3} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ── TOP RATED SALONS LIST ───────────────────────────── */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-black text-[#161719]">Top Rated Salons</Text>
          <TouchableOpacity>
            <Text className="text-xs font-black text-[#3473ef]">See All »</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3473ef" className="my-10" />
        ) : (
          filteredShops.map((shop, i) => (
            <TouchableOpacity 
              key={shop.id || i}
              onPress={() => onSelectShop(shop)}
              className="bg-white rounded-[32px] overflow-hidden mb-6 shadow-sm border border-slate-100 p-4"
            >
              <View className="h-48 rounded-2xl overflow-hidden relative bg-slate-100 mb-4">
                <Image 
                  source={{ uri: shop.imageUrl || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80" }} 
                  className="w-full h-full object-cover" 
                />
                <TouchableOpacity className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white items-center justify-center shadow-md">
                  <Heart size={18} color="#FF4757" fill="#FF4757" />
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-2">
                  <Text className="text-xl font-black text-[#161719] mb-1">{shop.name}</Text>
                  <Text className="text-[#8789A3] text-xs font-bold mb-2">{shop.address || "Tower Plaza, Sheikh Zayed Road"}</Text>
                  <Text className="text-[#3473ef] text-lg font-black">$200</Text>
                </View>

                <View className="items-end gap-3">
                  <View className="bg-[#3473ef]/10 px-3 py-1 rounded-full flex-row items-center gap-1">
                    <Star size={14} color="#3473ef" fill="#3473ef" />
                    <Text className="text-[#3473ef] font-black text-xs">{shop.rating || "4.8"}</Text>
                  </View>

                  <TouchableOpacity 
                    onPress={() => onSelectShop(shop)}
                    className="w-10 h-10 rounded-full bg-[#3473ef] items-center justify-center shadow-md shadow-[#3473ef]/30"
                  >
                    <ArrowUpRight size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};
