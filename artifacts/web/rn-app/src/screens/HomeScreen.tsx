import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions } from "react-native";
import { Scissors, MapPin, Search, ChevronDown, Heart, Star, Grid, Eye, Waves, Hand, Sparkles, Smile, User, Syringe } from "lucide-react-native";
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { supabase } from "@/config/supabase";

const { width } = Dimensions.get("window");

interface HomeScreenProps {
  onSelectShop: (shop: any) => void;
  onOpenLocation: () => void;
  selectedLocation?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectShop, onOpenLocation, selectedLocation = "Current location" }) => {
  const [loading, setLoading] = useState(true);
  const [recommendedShops, setRecommendedShops] = useState<any[]>([]);

  const CATEGORIES = [
    { name: "All", icon: Grid },
    { name: "Hair and styling", icon: Scissors },
    { name: "Brows & lashes", icon: Eye },
    { name: "Massage", icon: User },
    { name: "Spa & sauna", icon: Waves },
    { name: "Nails", icon: Hand },
    { name: "Hair removal", icon: Sparkles },
    { name: "Facials", icon: Smile },
    { name: "Barbering", icon: Scissors },
    { name: "Aesthetics", icon: Syringe },
  ];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: shopsData, error: shopsError } = await supabase
          .from('barbershops')
          .select('*')
          .eq('status', 'active')
          .order('rating', { ascending: false })
          .limit(6);

        if (shopsError) throw shopsError;
        if (shopsData) setRecommendedShops(shopsData);
      } catch (e) {
        console.warn("Failed to load home data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const renderShopCard = (item: any) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => onSelectShop(item)}
      className="mr-4 mb-6"
      style={{ width: width * 0.65 }}
    >
      <View className="relative rounded-3xl overflow-hidden mb-3">
        <Image
          source={{ uri: item.imageUrl || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1000&auto=format&fit=crop&q=80" }}
          className="w-full h-48 object-cover"
        />
        <View
          className="absolute top-3 left-3 overflow-hidden rounded-full border border-white/60"
          style={{ borderRadius: 100 }}
        >
          <BlurView intensity={80} tint="light" className="px-3 py-1 bg-white/50">
            <Text className="text-black text-[10px] font-bold">Featured</Text>
          </BlurView>
        </View>
        <TouchableOpacity
          className="absolute top-3 right-3 overflow-hidden rounded-full border border-white/60"
          style={{ borderRadius: 100 }}
        >
          <BlurView intensity={60} tint="light" className="w-8 h-8 items-center justify-center bg-white/30">
            <Heart size={18} color="white" fill="white" />
          </BlurView>
        </TouchableOpacity>
      </View>
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-2">
          <Text className="text-lg font-bold text-[#161719]" numberOfLines={1}>{item.name}</Text>
          <Text className="text-[#8789A3] text-sm mt-0.5" numberOfLines={1}>
            {item.distance || ">50 km"} • {item.address || "Manastirski Livadi, Sofia"}
          </Text>
          <Text className="text-[#8789A3] text-sm mt-0.5">{item.category || "Beauty Salon"} • {item.reviews || "1866"} reviews</Text>
        </View>
        <View className="flex-row items-center bg-amber-50 px-2 py-1 rounded-lg">
          <Star size={12} color="#fbbf24" fill="#fbbf24" />
          <Text className="text-[#161719] font-bold text-xs ml-1">{parseFloat(item.rating || "5.0").toFixed(1)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#EFF2F7]">
      {/* Background Decorative Blobs */}
      <View className="absolute top-[-50] left-[-50] w-64 h-64 bg-[#3473ef]/15 rounded-full blur-3xl" />
      <View className="absolute top-[200] right-[-100] w-80 h-80 bg-[#f47458]/15 rounded-full blur-3xl" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── HEADER SECTION ───────────────────────────── */}
        <View className="px-6 pt-14 pb-4">
          <View
            className="overflow-hidden border border-white/60 mb-8 shadow-sm"
            style={{ borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
          >
            <BlurView intensity={30} tint="light" className="flex-row items-center px-4 py-3">
              <MapPin size={20} color="#4f46e5" fill="#4f46e5" />
              <TouchableOpacity
                onPress={onOpenLocation}
                className="flex-row items-center flex-1"
              >
                <Text className="text-base font-bold mx-2 text-[#161719]">{selectedLocation}</Text>
                <ChevronDown size={18} color="#161719" strokeWidth={2.5} />
              </TouchableOpacity>
            </BlurView>
          </View>

          <View
            className="overflow-hidden border border-white/70 shadow-xl shadow-black/5"
            style={{ borderRadius: 100, backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            <BlurView intensity={40} tint="light" className="flex-row items-center pl-5 pr-1.5 py-1.5">
              <Search size={22} color="#161719" strokeWidth={2.5} />
              <TextInput
                placeholder="Search venues, treatments"
                className="flex-1 ml-3 h-12 text-[16px] text-[#161719] font-bold"
                placeholderTextColor="#6b7280"
              />
              <TouchableOpacity className="bg-black px-8 h-12 rounded-full items-center justify-center ml-2 shadow-sm">
                <Text className="text-white font-bold text-base">Search</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        </View>

      {/* ── CATEGORIES GRID ──────────────────────────── */}
      <View className="px-6 mt-4">
        <View className="flex-row flex-wrap justify-between">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <View key={i} className="items-center mb-6" style={{ width: '18%' }}>
                <View
                  className="overflow-hidden border border-white/60 shadow-sm mb-2"
                  style={{ borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <BlurView intensity={30} tint="light" className="w-16 h-16 items-center justify-center">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      className="items-center justify-center w-full h-full"
                    >
                      <Icon size={30} color="#161719" strokeWidth={2.2} />
                    </TouchableOpacity>
                  </BlurView>
                </View>
                <Text className="text-[10px] text-center font-bold text-[#161719] leading-3" numberOfLines={2}>{cat.name}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── RECOMMENDED SECTION ──────────────────────── */}
      <View className="mt-4">
        <View className="flex-row items-center justify-between px-6 mb-4">
          <Text className="text-2xl font-bold text-[#161719]">Recommended</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6">
          {recommendedShops.map(renderShopCard)}
        </ScrollView>
      </View>

      {/* ── NEW TO FRESHA SECTION ───────────────────── */}
      <View className="mt-8">
        <View className="flex-row items-center justify-between px-6 mb-4">
          <Text className="text-2xl font-bold text-[#161719]">New to Fresha</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-6">
          {recommendedShops.slice().reverse().map(renderShopCard)}
        </ScrollView>
      </View>

    </ScrollView>
  </View>
);
};

