import React from "react";
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, Dimensions } from "react-native";
import { Scissors, MapPin, Search, Bell, Sparkles, Star, Heart, Flame } from "lucide-react-native";
import Animated, { FadeInUp, FadeInRight } from "react-native-reanimated";
import { GlassCard } from "@/components/GlassCard";
import { PremiumButton } from "@/components/PremiumButton";

const { width } = Dimensions.get("window");

export const HomeScreen = () => {
  return (
    <ScrollView className="flex-1 bg-[#050608]" showsVerticalScrollIndicator={false}>

      {/* ── PREMIUM HERO ─────────────────────────────────── */}
      <View className="h-[95vh] relative justify-end pb-20">
        {/* Abstract Glows */}
        <View className="absolute top-[20%] right-[-20%] w-80 h-80 bg-[#3472ef] opacity-15 rounded-full blur-[120px]" />
        <View className="absolute bottom-[30%] left-[-20%] w-96 h-96 bg-purple-600 opacity-10 rounded-full blur-[140px]" />

        <View className="px-8">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-16">
            <View className="flex-row items-center gap-4">
              <View className="w-16 h-16 rounded-[28px] bg-zinc-900 border border-white/10 items-center justify-center shadow-2xl">
                <Text className="text-white font-black text-2xl">V</Text>
              </View>
              <View>
                <Text className="text-[#3472ef] text-[10px] font-black uppercase tracking-[0.3em] mb-1">Eksploro</Text>
                <Text className="text-white text-xl font-black tracking-tight">Line UP Premium</Text>
              </View>
            </View>
            <TouchableOpacity className="w-14 h-14 rounded-[22px] bg-white/5 border border-white/10 items-center justify-center shadow-xl">
              <Bell size={28} color="white" />
              <View className="absolute top-4 right-4 w-2 h-2 bg-[#3472ef] rounded-full" />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInUp.delay(300).duration(1000).springify()}>
            <View className="flex-row items-center gap-2 border border-white/10 bg-white/5 px-5 py-2.5 rounded-full self-start mb-8">
              <Sparkles size={16} color="#fbbf24" />
              <Text className="text-white text-[10px] font-black uppercase tracking-widest">Ekskluzive në Kosovë</Text>
            </View>

            <Text className="text-6xl font-black text-white leading-[0.9] mb-6 tracking-tighter">
              Stili yt{"\n"}
              <Text className="text-[#3472ef]">pa kompromis.</Text>
            </Text>

            <Text className="text-lg text-white/40 font-medium mb-12 max-w-[280px] leading-6">
              Gjej berberin e duhur dhe rezervo takimin tënd në çast me teknologji native.
            </Text>
          </Animated.View>

          {/* Search Glass Box */}
          <GlassCard intensity={30} className="p-1">
            <View className="bg-white/5 px-6 py-5 rounded-[24px] flex-row items-center gap-4 mb-3">
              <Search size={24} color="rgba(255,255,255,0.3)" />
              <Text className="text-white/30 text-lg font-bold">Kërko berberi ose shërbim...</Text>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-white/5 px-6 py-5 rounded-[24px] flex-row items-center gap-4">
                <MapPin size={24} color="#3472ef" />
                <Text className="text-white text-lg font-black">Prishtinë</Text>
              </View>
              <TouchableOpacity className="w-20 h-20 bg-[#3472ef] rounded-[24px] items-center justify-center shadow-[0_15px_30px_rgba(52,114,239,0.4)]">
                <Search size={32} color="white" strokeWidth={4} />
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </View>

      {/* ── SERVICES ───────────────────────────────────────── */}
      <View className="mt-16 px-8">
        <View className="flex-row items-center justify-between mb-10">
          <Text className="text-2xl font-black text-white uppercase tracking-tighter">Shërbimet</Text>
          <TouchableOpacity>
            <Text className="text-xs font-black text-[#3472ef] uppercase tracking-widest border-b border-[#3472ef]/30 pb-1">Shih të gjitha</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row overflow-visible">
          {[
            { name: 'Haircut', color: '#60a5fa' },
            { name: 'Shaving', color: '#c084fc' },
            { name: 'Styling', color: '#fbbf24' },
            { name: 'Coloring', color: '#34d399' }
          ].map((service, i) => (
            <Animated.View key={i} entering={FadeInRight.delay(i * 100).duration(800)} className="items-center mr-8">
              <TouchableOpacity
                style={{ backgroundColor: `${service.color}10`, borderColor: `${service.color}20` }}
                className="w-24 h-24 rounded-[32px] border items-center justify-center mb-4 shadow-2xl"
              >
                <Scissors size={40} color={service.color} strokeWidth={2} />
              </TouchableOpacity>
              <Text className="text-white/60 text-[10px] font-black uppercase tracking-widest">{service.name}</Text>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* ── TOP SALONS ────────────────────────────────────── */}
      <View className="mt-20 px-8 pb-48">
        <Text className="text-2xl font-black text-white uppercase tracking-tighter mb-10">Më të vlerësuarit</Text>

        {[1, 2, 3].map((_, i) => (
          <TouchableOpacity key={i} className="bg-white/[0.02] border border-white/5 rounded-[48px] overflow-hidden mb-10 shadow-2xl">
            <View className="h-72 bg-zinc-900 relative">
              {/* Image Placeholder */}
              <View className="absolute inset-0 bg-zinc-800" />

              <View className="absolute top-8 left-8 z-10 bg-[#3472ef] px-5 py-2.5 rounded-[20px] border border-white/20 shadow-2xl">
                <Text className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Premium</Text>
              </View>
              <TouchableOpacity className="absolute top-8 right-8 z-10 w-14 h-14 rounded-[22px] bg-black/40 items-center justify-center border border-white/10 backdrop-blur-md">
                <Heart size={28} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
              <View className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-transparent opacity-90" />

              {/* Popular Badge */}
              <View className="absolute bottom-8 right-8 flex-row items-center gap-2 bg-amber-400/20 px-4 py-2 rounded-full border border-amber-400/30">
                <Flame size={14} color="#fbbf24" />
                <Text className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Më i kërkuari</Text>
              </View>
            </View>

            <View className="p-10">
              <View className="flex-row justify-between items-start mb-8">
                <View className="flex-1">
                  <Text className="text-3xl font-black text-white mb-3 tracking-tight">Barber Lab</Text>
                  <View className="flex-row items-center gap-3">
                    <MapPin size={16} color="#3472ef" />
                    <Text className="text-white/40 text-[12px] font-bold uppercase tracking-widest">Prishtinë, Rr. UCK</Text>
                  </View>
                </View>
                <View className="bg-amber-400/10 px-4 py-3 rounded-2xl border border-amber-400/20 items-center">
                  <View className="flex-row items-center gap-1.5">
                    <Star size={18} color="#fbbf24" fill="#fbbf24" />
                    <Text className="text-amber-400 font-black text-xl">4.9</Text>
                  </View>
                </View>
              </View>

              <View className="flex-row items-center justify-between pt-8 border-t border-white/5">
                <View className="flex-row items-center gap-3">
                  <View className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse" />
                  <Text className="text-sm font-black text-emerald-500 uppercase tracking-widest">Hapur</Text>
                </View>
                <TouchableOpacity className="bg-[#3472ef] px-10 py-5 rounded-[24px] shadow-2xl shadow-[#3472ef]/50 active:scale-95">
                  <Text className="text-white text-[12px] font-black uppercase tracking-[0.15em]">Rezervo Tani</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

    </ScrollView>
  );
};
