import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Sparkles, Megaphone, Star, MapPin, Gift, PhoneCall, ArrowUpRight, CheckCircle2 } from "lucide-react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { GlassCard } from "@/components/GlassCard";
import { fetchFromAPI } from "@/config/api";

export const AdsScreen = () => {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAds() {
      setLoading(true);
      try {
        const data = await fetchFromAPI("/api/ads");
        if (Array.isArray(data) && data.length > 0) {
          setAds(data);
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
    <ScrollView className="flex-1 bg-[#050608]" showsVerticalScrollIndicator={false}>
      <View className="pt-16 pb-44 px-8">
        
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(200).duration(800)}>
          <View className="flex-row items-center gap-2 border border-amber-400/20 bg-amber-400/10 px-5 py-2.5 rounded-full self-start mb-6">
            <Megaphone size={16} color="#fbbf24" />
            <Text className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Sponsorizuar & Oferta</Text>
          </View>

          <Text className="text-5xl font-black text-white leading-tight mb-4 tracking-tighter">
            Reklama &{"\n"}
            <Text className="text-[#3472ef]">Oferta Ekskluzive</Text>
          </Text>

          <Text className="text-base text-white/40 font-medium mb-10 leading-6">
            Zbulo zbritjet më të reja nga berberët top në Kosovë ose reklamo biznesin tënd.
          </Text>
        </Animated.View>

        {/* Big Sponsor Banner */}
        <GlassCard intensity={35} className="p-8 rounded-[36px] border border-[#3472ef]/40 bg-[#3472ef]/10 mb-10">
          <View className="flex-row items-center gap-2 mb-4 bg-[#3472ef]/30 px-4 py-1.5 rounded-full self-start">
            <Sparkles size={14} color="#60a5fa" />
            <Text className="text-[#60a5fa] text-[10px] font-black uppercase tracking-widest">Super Ofertë për Berberët</Text>
          </View>
          <Text className="text-white text-2xl font-black mb-3">Reklamo Berberinë Tënd në LineUP</Text>
          <Text className="text-white/50 text-xs leading-5 mb-6">
            Arrij mijëra klientë të rinj në Prishtinë, Prizren, Pejë & Ferizaj. 30 ditët e para janë 100% FALAS.
          </Text>
          <TouchableOpacity className="bg-[#3472ef] py-4 rounded-2xl items-center flex-row justify-center gap-2 shadow-lg shadow-[#3472ef]/40">
            <Text className="text-white text-xs font-black uppercase tracking-widest">Fillo Tani 30 Ditë Falas</Text>
            <ArrowUpRight size={16} color="white" />
          </TouchableOpacity>
        </GlassCard>

        {/* Featured Ads Section */}
        <Text className="text-xl font-black text-white uppercase tracking-tighter mb-6">Zbritjet e Javës</Text>

        {loading && ads.length === 0 ? (
          <ActivityIndicator size="large" color="#3472ef" className="my-10" />
        ) : (
          (ads.length > 0 ? ads : [
            {
              title: "Barber Lab Prishtinë",
              description: "20% Zbritje për Terminet e Mëngjesit",
              promoCode: "LINEUP20",
              location: "Prishtinë, Rr. UÇK",
              rating: "4.9",
              tag: "Ekskluzive"
            },
            {
              title: "Gentlemen's Club Pejë",
              description: "Prerje Flokësh + Maskë Fytyre Falas",
              promoCode: "FREEMASK",
              location: "Pejë, Qendër",
              rating: "4.8",
              tag: "Top Oferta"
            }
          ]).map((ad, i) => (
            <GlassCard key={i} intensity={20} className="p-7 rounded-[32px] mb-6 border border-white/10">
              <View className="flex-row items-center justify-between mb-4">
                <View className="bg-amber-400/10 border border-amber-400/25 px-4 py-1.5 rounded-full flex-row items-center gap-1.5">
                  <Gift size={14} color="#fbbf24" />
                  <Text className="text-amber-400 text-[10px] font-black uppercase tracking-widest">{ad.tag || ad.badge || "Ekskluzive"}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Star size={16} color="#fbbf24" fill="#fbbf24" />
                  <Text className="text-white font-black text-sm">{ad.rating || "5.0"}</Text>
                </View>
              </View>

              <Text className="text-white text-xl font-black mb-1">{ad.title || ad.salon}</Text>
              <View className="flex-row items-center gap-2 mb-4">
                <MapPin size={14} color="#3472ef" />
                <Text className="text-white/40 text-xs font-semibold">{ad.location || ad.city || "Kosovo"}</Text>
              </View>

              <View className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-5 flex-row items-center justify-between">
                <View className="flex-1 mr-2">
                  <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-0.5">Detajet e ofertës</Text>
                  <Text className="text-white text-sm font-bold">{ad.description || ad.offer}</Text>
                </View>
                {ad.promoCode || ad.code ? (
                  <View className="bg-[#3472ef]/20 border border-[#3472ef]/40 px-3 py-1.5 rounded-xl">
                    <Text className="text-[#3472ef] text-xs font-black">{ad.promoCode || ad.code}</Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity className="bg-white/10 py-3.5 rounded-xl items-center border border-white/10">
                <Text className="text-white text-xs font-black uppercase tracking-widest">Përdor Ofertën</Text>
              </TouchableOpacity>
            </GlassCard>
          ))
        )}

        {/* Contact Ads Team */}
        <GlassCard intensity={30} className="p-7 rounded-[32px] border border-white/10 mt-4">
          <View className="flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-2xl bg-emerald-500/20 items-center justify-center border border-emerald-500/30">
              <PhoneCall size={22} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-black">Ekipi i Reklamave</Text>
              <Text className="text-white/40 text-xs font-medium">Dëshironi baner apo ofertë me prioritet?</Text>
            </View>
          </View>
        </GlassCard>

      </View>
    </ScrollView>
  );
};
