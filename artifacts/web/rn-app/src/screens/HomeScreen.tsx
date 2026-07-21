import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Dimensions } from "react-native";
import { Scissors, MapPin, Search, Bell, Sparkles, Star, Heart, Flame, Clock, SlidersHorizontal, ArrowUpRight, User, ChevronDown, Check } from "lucide-react-native";
import Animated, { FadeInUp, FadeInRight } from "react-native-reanimated";
import { fetchFromAPI } from "@/config/api";

const { width } = Dimensions.get("window");

interface HomeScreenProps {
  onSelectShop: (shop: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectShop }) => {
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("Të gjitha");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [topShops, setTopShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const CITIES = ["Të gjitha", "Prishtinë", "Prizren", "Pejë", "Ferizaj", "Gjakovë", "Gjilan", "Mitrovicë"];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let response = await fetchFromAPI("/api/barbershops/top");
        let list = Array.isArray(response) ? response : (response?.data || []);
        if (list.length === 0) {
          response = await fetchFromAPI("/api/barbershops");
          list = Array.isArray(response) ? response : (response?.data || []);
        }
        setTopShops(list);
      } catch (e) {
        console.warn("Failed to load top shops:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const SERVICES = [
    { label: "Haircut", icon: Scissors, bg: "#F2EDFF" },
    { label: "Shaving", icon: Sparkles, bg: "#EBF5FF" },
    { label: "Styling", icon: User, bg: "#FFF4E5" },
    { label: "Coloring", icon: Flame, bg: "#FDF0F5" },
    { label: "Make Up", icon: Clock, bg: "#F0FAED" },
  ];

  const filteredShops = topShops.filter((shop) => {
    const matchesCity = selectedCity === "Të gjitha" || shop.city === selectedCity;
    const matchesQuery = !search || shop.name?.toLowerCase().includes(search.toLowerCase()) || shop.city?.toLowerCase().includes(search.toLowerCase());
    return matchesCity && matchesQuery;
  });

  return (
    <ScrollView className="flex-1 bg-[#F8F9FE]" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

      {/* ── PURPLE HEADER BANNER ───────────────────────────── */}
      <View className="bg-[#7F3DFF] pt-14 pb-8 px-6 rounded-b-[40px] z-10">
        {/* User Info & Icons */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center border border-white/30 overflow-hidden">
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" }} 
                className="w-full h-full object-cover" 
              />
            </View>
            <View>
              <Text className="text-white/70 text-xs font-semibold">Hello Jobby</Text>
              <Text className="text-white text-lg font-black tracking-tight">Good Morning</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity className="w-11 h-11 rounded-full bg-white/15 items-center justify-center border border-white/20">
              <Heart size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="w-11 h-11 rounded-full bg-white items-center justify-center shadow-md">
              <Bell size={20} color="#7F3DFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* City Dropdown Search Bar inside Purple Header */}
        <View className="relative z-30">
          <TouchableOpacity
            onPress={() => setDropdownOpen(!dropdownOpen)}
            className="bg-white rounded-full px-5 py-3.5 flex-row items-center justify-between shadow-lg active:scale-98"
          >
            <View className="flex-row items-center gap-3 flex-1">
              <MapPin size={20} color="#7F3DFF" />
              <View className="flex-1">
                <Text className="text-[#8789A3] text-[9px] font-black uppercase tracking-widest">Kërko sipas Qytetit</Text>
                <Text className="text-[#161719] font-black text-sm">{selectedCity}</Text>
              </View>
            </View>

            <View className="w-9 h-9 rounded-full bg-[#7F3DFF] items-center justify-center">
              <ChevronDown size={18} color="white" />
            </View>
          </TouchableOpacity>

          {/* Expandable Dropdown List inside Header */}
          {dropdownOpen && (
            <View className="absolute top-16 left-0 right-0 bg-white rounded-3xl border border-slate-200 p-2 shadow-2xl z-50">
              {CITIES.map((city) => {
                const isSelected = selectedCity === city;
                return (
                  <TouchableOpacity
                    key={city}
                    onPress={() => {
                      setSelectedCity(city);
                      setDropdownOpen(false);
                    }}
                    className={`flex-row items-center justify-between px-5 py-3.5 rounded-2xl mb-1 ${
                      isSelected ? "bg-[#7F3DFF]" : "bg-transparent hover:bg-slate-50"
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
      </View>

      {/* ── SPECIAL OFFERS SLIDER ────────────────────────────── */}
      <View className="mt-8 px-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-black text-[#161719]">Special Offers</Text>
          <TouchableOpacity>
            <Text className="text-xs font-black text-[#7F3DFF]">See All »</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="bg-[#7F3DFF] rounded-[32px] p-6 relative overflow-hidden flex-row items-center justify-between shadow-lg shadow-[#7F3DFF]/30">
          <View className="flex-1 mr-4">
            <View className="bg-white/20 px-3 py-1 rounded-full self-start mb-3">
              <Text className="text-white text-[10px] font-black uppercase tracking-widest">Just For You</Text>
            </View>
            <Text className="text-white text-xl font-black mb-1 leading-tight">Get Special Discount</Text>
            <Text className="text-white/80 text-xs font-extrabold mb-4">Up to <Text className="text-amber-300">40% Off</Text></Text>

            <TouchableOpacity className="bg-white/20 px-5 py-2.5 rounded-full self-start flex-row items-center gap-2 border border-white/30">
              <Text className="text-white text-xs font-extrabold">Book Now</Text>
              <ArrowUpRight size={14} color="white" />
            </TouchableOpacity>
          </View>

          <View className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/30 shadow-md">
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop&q=80" }} 
              className="w-full h-full object-cover" 
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── SERVICES ROW ────────────────────────────────────── */}
      <View className="mt-8 px-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-black text-[#161719]">Services</Text>
          <TouchableOpacity>
            <Text className="text-xs font-black text-[#7F3DFF]">See All »</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-4">
          {SERVICES.map((srv, i) => {
            const Icon = srv.icon;
            return (
              <TouchableOpacity key={i} className="items-center mr-4">
                <View style={{ backgroundColor: srv.bg }} className="w-16 h-16 rounded-full items-center justify-center mb-2 shadow-xs">
                  <Icon size={24} color="#7F3DFF" strokeWidth={2.2} />
                </View>
                <Text className="text-[#161719] text-xs font-extrabold">{srv.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── TOP RATED SALONS ─────────────────────────────────── */}
      <View className="mt-8 px-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-black text-[#161719]">Top Rated Salons</Text>
          <TouchableOpacity>
            <Text className="text-xs font-black text-[#7F3DFF]">See All »</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#7F3DFF" className="my-8" />
        ) : (
          filteredShops.map((shop, i) => (
            <TouchableOpacity 
              key={shop.id || i}
              onPress={() => onSelectShop(shop)}
              className="bg-white rounded-[32px] overflow-hidden mb-6 shadow-sm border border-slate-100 p-4"
            >
              <View className="h-44 rounded-2xl overflow-hidden relative bg-slate-100 mb-4">
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
                  <Text className="text-lg font-black text-[#161719] mb-1">{shop.name}</Text>
                  <Text className="text-[#8789A3] text-xs font-bold mb-2">{shop.address || "Tower Plaza, Sheikh Zayed Road"}</Text>
                  <Text className="text-[#7F3DFF] text-base font-black">$200</Text>
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
      </View>

    </ScrollView>
  );
};
