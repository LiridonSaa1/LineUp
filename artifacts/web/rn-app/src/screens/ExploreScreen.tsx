import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator } from "react-native";
import { Search, MapPin, SlidersHorizontal, Star, Heart, Clock, Scissors } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { GlassCard } from "@/components/GlassCard";
import { fetchFromAPI } from "@/config/api";

export const ExploreScreen = () => {
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("Të gjitha");
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const CITIES = ['Të gjitha', 'Prishtinë', 'Prizren', 'Pejë', 'Ferizaj', 'Gjakovë', 'Gjilan', 'Mitrovicë'];

  useEffect(() => {
    async function loadShops() {
      setLoading(true);
      try {
        const data = await fetchFromAPI("/api/barbershops");
        if (Array.isArray(data)) {
          setShops(data);
        }
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
    <View className="flex-1 bg-[#050608] pt-16">
      {/* Header & Search */}
      <View className="px-8 mb-6">
        <Text className="text-4xl font-black text-white mb-6 tracking-tighter">Eksploro</Text>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex-row items-center px-5 h-14">
            <Search size={20} color="rgba(255,255,255,0.3)" />
            <TextInput
              className="flex-1 ml-3 text-white font-bold"
              placeholder="Kërko berber, qytet..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl items-center justify-center">
            <SlidersHorizontal size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Chips */}
      <View className="mb-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-8">
          {CITIES.map((city, i) => {
            const isSelected = selectedCity === city;
            return (
              <TouchableOpacity
                key={city}
                onPress={() => setSelectedCity(city)}
                className={`mr-3 px-6 py-3 rounded-full border ${isSelected ? 'bg-[#3472ef] border-[#3472ef]' : 'bg-white/5 border-white/10'}`}
              >
                <Text className={`font-black text-[10px] uppercase tracking-widest ${isSelected ? 'text-white' : 'text-white/40'}`}>
                  {city}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 120 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#3472ef" className="my-10" />
        ) : filteredShops.length === 0 ? (
          <View className="p-8 items-center justify-center">
            <Scissors size={32} color="rgba(255,255,255,0.2)" />
            <Text className="text-white/40 font-bold text-xs mt-3">Nuk u gjet asnjë berberi në këtë kërkim.</Text>
          </View>
        ) : (
          filteredShops.map((shop, i) => (
            <Animated.View key={shop.id || i} entering={FadeInDown.delay(i * 80).duration(500)}>
              <TouchableOpacity className="flex-row bg-white/[0.03] border border-white/5 rounded-3xl p-4 mb-4 items-center shadow-2xl">
                <View className="w-24 h-24 bg-zinc-800 rounded-2xl overflow-hidden mr-4">
                  {shop.imageUrl ? (
                    <Image source={{ uri: shop.imageUrl }} className="w-full h-full object-cover" />
                  ) : (
                    <View className="w-full h-full items-center justify-center bg-zinc-900">
                      <Scissors size={24} color="#3472ef" />
                    </View>
                  )}
                </View>

                <View className="flex-1">
                  <View className="flex-row justify-between items-start">
                    <Text className="text-white font-black text-lg">{shop.name}</Text>
                    <TouchableOpacity>
                      <Heart size={18} color="rgba(255,255,255,0.3)" />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row items-center gap-1 mt-1 mb-3">
                    <MapPin size={12} color="#3472ef" />
                    <Text className="text-white/40 text-[10px] font-bold uppercase tracking-tight">{shop.city}, {shop.address || "Qendër"}</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1">
                      <Star size={14} color="#fbbf24" fill="#fbbf24" />
                      <Text className="text-white font-black text-sm">{shop.rating || "4.9"}</Text>
                    </View>
                    <View className="flex-row items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg">
                      <Clock size={10} color="#10b981" />
                      <Text className="text-emerald-500 text-[8px] font-black uppercase">Hapur</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
};
