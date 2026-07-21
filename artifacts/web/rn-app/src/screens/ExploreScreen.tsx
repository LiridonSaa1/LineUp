import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Modal } from "react-native";
import { Search, MapPin, SlidersHorizontal, Star, Heart, ArrowLeft, Bell, ArrowUpRight, ChevronDown, Check } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { fetchFromAPI } from "@/config/api";

interface ExploreScreenProps {
  onSelectShop: (shop: any) => void;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({ onSelectShop }) => {
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("Të gjitha");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const CITIES = ["Të gjitha", "Prishtinë", "Prizren", "Pejë", "Ferizaj", "Gjakovë", "Gjilan", "Mitrovicë"];

  useEffect(() => {
    async function loadShops() {
      setLoading(true);
      try {
        const response = await fetchFromAPI("/api/barbershops");
        const list = Array.isArray(response) ? response : (response?.data || []);
        setShops(list);
      } catch (e) {
        console.warn("Error fetching shops:", e);
      } finally {
        setLoading(false);
      }
    }
    loadShops();
  }, []);

  const filteredShops = shops.filter((shop) => {
    const matchesCity = selectedCity === "Të gjitha" || shop.city === selectedCity;
    const matchesQuery = !search || shop.name?.toLowerCase().includes(search.toLowerCase()) || shop.city?.toLowerCase().includes(search.toLowerCase());
    return matchesCity && matchesQuery;
  });

  return (
    <View className="flex-1 bg-[#F8F9FE]">
      {/* ── PURPLE HEADER BANNER ───────────────────────────── */}
      <View className="bg-[#7F3DFF] pt-14 pb-8 px-6 rounded-b-[40px] z-10">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity className="w-11 h-11 rounded-full bg-white items-center justify-center shadow-md">
            <ArrowLeft size={20} color="#161719" strokeWidth={2.5} />
          </TouchableOpacity>

          <Text className="text-white text-xl font-black tracking-tight">Eksploro Qytetet</Text>

          <TouchableOpacity className="w-11 h-11 rounded-full bg-white items-center justify-center shadow-md">
            <Bell size={20} color="#7F3DFF" />
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
          <TouchableOpacity className="w-9 h-9 rounded-full bg-[#7F3DFF] items-center justify-center">
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
            <View className="w-8 h-8 rounded-full bg-[#7F3DFF]/10 items-center justify-center">
              <MapPin size={18} color="#7F3DFF" />
            </View>
            <View>
              <Text className="text-[#8789A3] text-[10px] font-black uppercase tracking-widest">Qyteti i zgjedhur</Text>
              <Text className="text-[#161719] font-black text-sm">{selectedCity}</Text>
            </View>
          </View>

          <View className="w-8 h-8 rounded-full bg-[#F2EDFF] items-center justify-center">
            <ChevronDown size={18} color="#7F3DFF" />
          </View>
        </TouchableOpacity>

        {/* Expandable Dropdown List */}
        {dropdownOpen && (
          <View className="mt-2 bg-white rounded-3xl border border-slate-200 p-2 shadow-xl">
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
                    isSelected ? "bg-[#7F3DFF] text-white" : "bg-transparent hover:bg-slate-50"
                  }`}
                >
                  <Text className={`font-extrabold text-sm ${isSelected ? "text-white" : "text-[#161719]"}`}>
                    📍 {city}
                  </Text>
                  {isSelected && <Check size={18} color="white" strokeWidth={3} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* ── TOP RATED SALONS LIST ───────────────────────────── */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-black text-[#161719]">Top Rated Salons</Text>
          <TouchableOpacity>
            <Text className="text-xs font-black text-[#7F3DFF]">See All »</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#7F3DFF" className="my-10" />
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
                  <Text className="text-[#7F3DFF] text-lg font-black">$200</Text>
                </View>

                <View className="items-end gap-3">
                  <View className="bg-[#7F3DFF]/10 px-3 py-1 rounded-full flex-row items-center gap-1">
                    <Star size={14} color="#7F3DFF" fill="#7F3DFF" />
                    <Text className="text-[#7F3DFF] font-black text-xs">{shop.rating || "4.8"}</Text>
                  </View>

                  <TouchableOpacity 
                    onPress={() => onSelectShop(shop)}
                    className="w-10 h-10 rounded-full bg-[#7F3DFF] items-center justify-center shadow-md shadow-[#7F3DFF]/30"
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
