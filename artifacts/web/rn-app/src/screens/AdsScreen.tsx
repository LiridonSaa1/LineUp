import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { Sparkles, Megaphone, Star, MapPin, Gift, PhoneCall, ArrowUpRight, Heart } from "lucide-react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { fetchFromAPI } from "@/config/api";

export const AdsScreen = () => {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAds() {
      setLoading(true);
      try {
        const response = await fetchFromAPI("/api/ads");
        const list = Array.isArray(response) ? response : (response?.data || []);
        if (list.length > 0) {
          setAds(list);
        }
      } catch (e) {
        console.warn("Error fetching ads:", e);
      } finally {
        setLoading(false);
      }
    }
    loadAds();
  }, []);

  return (
    <ScrollView className="flex-1 bg-[#F8F9FE]" showsVerticalScrollIndicator={false}>
      {/* Top Header Banner */}
      <View className="bg-[#7F3DFF] pt-14 pb-8 px-6 rounded-b-[40px]">
        <View className="flex-row items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full self-start mb-3 border border-white/30">
          <Megaphone size={14} color="white" />
          <Text className="text-white text-[10px] font-black uppercase tracking-widest">Sponsored & Deals</Text>
        </View>
        <Text className="text-3xl font-black text-white tracking-tight mb-2">Special Discounts</Text>
        <Text className="text-white/70 text-xs font-semibold">Get up to 40% discount on top rated salons.</Text>
      </View>

      {/* Offers & Ads Cards */}
      <View className="px-6 pt-6 pb-32">
        {loading && ads.length === 0 ? (
          <ActivityIndicator size="large" color="#7F3DFF" className="my-10" />
        ) : (
          (ads.length > 0 ? ads : [
            {
              title: "Barber Lab Prishtinë",
              description: "20% Discount for Morning Appointments",
              promoCode: "LINEUP20",
              location: "Prishtinë, Rr. UÇK",
              rating: "4.9",
              tag: "Exclusive"
            },
            {
              title: "Gentlemen's Club Pejë",
              description: "Haircut + Free Face Mask",
              promoCode: "FREEMASK",
              location: "Pejë, Center",
              rating: "4.8",
              tag: "Top Deal"
            }
          ]).map((ad, i) => (
            <View key={i} className="bg-white rounded-[32px] p-6 mb-6 shadow-sm border border-slate-100">
              <View className="flex-row items-center justify-between mb-4">
                <View className="bg-[#F2EDFF] px-4 py-1.5 rounded-full flex-row items-center gap-1.5">
                  <Gift size={14} color="#7F3DFF" />
                  <Text className="text-[#7F3DFF] text-[10px] font-black uppercase tracking-widest">{ad.tag || ad.badge || "Exclusive"}</Text>
                </View>
                <View className="flex-row items-center gap-1 bg-amber-50 px-3 py-1 rounded-full">
                  <Star size={14} color="#FFC107" fill="#FFC107" />
                  <Text className="text-[#161719] font-black text-xs">{ad.rating || "5.0"}</Text>
                </View>
              </View>

              <Text className="text-[#161719] text-xl font-black mb-1">{ad.title || ad.salon}</Text>
              <View className="flex-row items-center gap-1.5 mb-4">
                <MapPin size={14} color="#7F3DFF" />
                <Text className="text-[#8789A3] text-xs font-semibold">{ad.location || ad.city || "Kosovo"}</Text>
              </View>

              <View className="bg-[#F8F9FE] p-4 rounded-2xl border border-slate-100 mb-5 flex-row items-center justify-between">
                <View className="flex-1 mr-2">
                  <Text className="text-[#8789A3] text-[9px] font-black uppercase tracking-widest mb-0.5">Offer Detail</Text>
                  <Text className="text-[#161719] text-sm font-extrabold">{ad.description || ad.offer}</Text>
                </View>
                {ad.promoCode || ad.code ? (
                  <View className="bg-[#7F3DFF] px-3 py-1.5 rounded-xl shadow-xs">
                    <Text className="text-white text-xs font-black">{ad.promoCode || ad.code}</Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity className="bg-[#7F3DFF] py-3.5 rounded-full items-center shadow-md shadow-[#7F3DFF]/25 active:scale-98">
                <Text className="text-white text-xs font-black uppercase tracking-widest">Claim Offer</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};
