import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions } from "react-native";
import { Scissors, MapPin, Search, ChevronDown, Heart, Star, Grid, Eye, Waves, Hand, Sparkles, Smile, User, Syringe, Zap, Shield, Check, ArrowRight } from "lucide-react-native";
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { supabase } from "@/config/supabase";

const { width } = Dimensions.get("window");

interface HomeScreenProps {
  onSelectShop: (shop: any) => void;
  onOpenLocation: () => void;
  onOpenSearch: () => void;
  selectedLocation?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectShop, onOpenLocation, onOpenSearch, selectedLocation = "Current location" }) => {
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
          <TouchableOpacity
            onPress={onOpenLocation}
            className="flex-row items-center mb-8 px-1"
          >
            <MapPin size={20} color="#3473ef" strokeWidth={2.5} />
            <Text className="text-base font-extrabold mx-2 text-[#161719]">{selectedLocation}</Text>
            <ChevronDown size={18} color="#161719" strokeWidth={3} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onOpenSearch}
            className="overflow-hidden border border-white/90 shadow-2xl shadow-black/10"
            style={{ borderRadius: 100, backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
          >
            <BlurView intensity={80} tint="light" className="flex-row items-center pl-5 pr-1.5 py-1.5">
              <Search size={22} color="#161719" strokeWidth={3} />
              <View className="flex-1 ml-3 h-12 justify-center">
                <Text className="text-[16px] text-[#4b5563] font-extrabold">
                  Kërko sallone, trajtime...
                </Text>
              </View>
              <View className="bg-black px-8 h-12 rounded-full items-center justify-center ml-2 shadow-lg">
                <Text className="text-white font-black text-base">Kërko</Text>
              </View>
            </BlurView>
          </TouchableOpacity>
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
                  style={{ borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <BlurView intensity={30} tint="light" className="w-20 h-20 items-center justify-center">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      className="items-center justify-center w-full h-full"
                    >
                      <Icon size={36} color="#161719" strokeWidth={1.8} />
                    </TouchableOpacity>
                  </BlurView>
                </View>
                <Text className="text-[10px] text-center font-bold text-[#161719] leading-3" numberOfLines={2}>{cat.name}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── ADVERTISEMENT CAROUSEL ─────────────────── */}
      <View className="mt-4 px-6">
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          className="rounded-[32px] overflow-hidden"
        >
          {[
            { title: "Special Offer", desc: "Get 20% off on your first booking", color: "#4f46e5" },
            { title: "Premium Package", desc: "Exclusive treatments for members", color: "#f47458" },
            { title: "Summer Style", desc: "New trends available now", color: "#10b981" },
          ].map((ad, i) => (
            <View key={i} style={{ width: width - 48 }} className="h-44 relative">
              <View className="absolute inset-0" style={{ backgroundColor: ad.color, opacity: 0.8 }} />
              <View className="absolute inset-0 bg-black/10" />
              <View className="flex-1 p-8 justify-center">
                <View className="bg-white/30 self-start px-3 py-1 rounded-full mb-3 border border-white/20">
                  <Text className="text-white text-[10px] font-black uppercase tracking-widest">Reklam</Text>
                </View>
                <Text className="text-white text-3xl font-black mb-1">{ad.title}</Text>
                <Text className="text-white/90 text-base font-bold">{ad.desc}</Text>
              </View>
              <View className="absolute right-[-20] bottom-[-20] w-40 h-40 bg-white/10 rounded-full" />
            </View>
          ))}
        </ScrollView>
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

      {/* ── PRICING PLANS ───────────────────────────── */}
      <View className="mt-12 px-6">
        <Text className="text-xl font-black text-[#161719] mb-4">Planet e Çmimeve</Text>
        <View
          className="overflow-hidden shadow-xl"
          style={{ borderRadius: 32 }}
        >
          <View className="p-6 bg-[#3473ef] relative">
            {/* Background Accent */}
            <View className="absolute top-[-10] right-[-10] w-24 h-24 bg-white/10 rounded-full" />

            <View className="flex-row justify-between items-start mb-6">
              <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center border border-white/30">
                <Zap size={24} color="white" />
              </View>
              <View className="bg-white/20 px-3 py-1 rounded-full border border-white/30">
                <Text className="text-white text-[9px] font-black uppercase tracking-widest">Më i Populluari</Text>
              </View>
            </View>

            <Text className="text-white text-2xl font-black mb-1">Professional</Text>
            <Text className="text-white/70 font-bold mb-4 text-xs">Rritni biznesin tuaj me lehtësi</Text>

            <View className="flex-row items-baseline mb-6">
              <Text className="text-4xl font-black text-white">20€</Text>
              <Text className="text-sm font-bold text-white/70 ml-2">/muaj</Text>
            </View>

            <View className="bg-white/10 rounded-[24px] p-4 mb-6 border border-white/20">
              <View className="flex-row items-center mb-3">
                <View className="w-6 h-6 rounded-full bg-white/20 items-center justify-center mr-3">
                  <Check size={14} color="white" strokeWidth={3} />
                </View>
                <Text className="font-bold text-white text-sm flex-1">Deri në 2 berberë të përfshirë</Text>
              </View>

              <View className="h-[1px] bg-white/10 w-full mb-3" />

              <View className="flex-row items-center">
                <View className="w-6 h-6 rounded-full bg-amber-400/20 items-center justify-center mr-3">
                  <Sparkles size={14} color="#fbbf24" strokeWidth={2} />
                </View>
                <Text className="font-bold text-white/90 text-[11px] flex-1 italic">
                  +3€ për çdo punonjës të ri pas limitit
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              className="h-12 bg-white rounded-2xl items-center justify-center shadow-lg shadow-black/10 active:scale-95"
            >
              <Text className="text-[#3473ef] font-black text-base">Fillo Tani</Text>
            </TouchableOpacity>
          </View>
        </View>
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

      {/* ── HOW TO USE ────────────────────────────── */}
      <View className="mt-16 px-6 pb-20">
        <View className="flex-row items-center justify-between mb-10">
          <View>
            <Text className="text-3xl font-black text-[#161719]">How to use it</Text>
            <Text className="text-[#8789A3] font-bold mt-1">Experience the best styling</Text>
          </View>
          <View className="w-14 h-14 rounded-full bg-white border border-slate-100 items-center justify-center shadow-sm">
            <ArrowRight size={24} color="#161719" />
          </View>
        </View>

        <View className="gap-y-10">
          {[
            { step: "01", title: "Find your style", desc: "Browse through our curated list of top-rated salons and barbers.", icon: Search },
            { step: "02", title: "Choose location", desc: "Select your city or use current location to find nearby services.", icon: MapPin },
            { step: "03", title: "Instant booking", desc: "Confirm your appointment with a few taps and get stylized.", icon: Scissors },
          ].map((item, i) => (
            <View key={i} className="flex-row items-start">
              <View className="w-14 h-14 rounded-[22px] bg-white border border-slate-100 items-center justify-center shadow-sm z-10">
                <item.icon size={26} color="#3473ef" strokeWidth={2.2} />
              </View>
              <View className="flex-1 ml-6 pt-1">
                <Text className="text-[12px] font-black text-[#3473ef] uppercase tracking-[0.2em] mb-1">Step {item.step}</Text>
                <Text className="text-xl font-black text-[#161719] mb-2">{item.title}</Text>
                <Text className="text-[#8789A3] font-bold leading-6">{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

    </ScrollView>
  </View>
);
};

