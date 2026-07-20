import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Dimensions } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Scissors, MapPin, Search, Bell, Sparkles, Star, ArrowRight, Heart } from "lucide-react-native";
import Animated, { FadeInUp, FadeInRight } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import "./global.css";

const { width } = Dimensions.get("window");

export default function App() {
  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-[#050608]">
        <StatusBar style="light" />
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

          {/* ── PREMIUM HERO ─────────────────────────────────── */}
          <View className="h-[90vh] relative justify-end pb-12">
            {/* Background Image Placeholder */}
            <View className="absolute inset-0 opacity-40">
              <View className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-transparent z-10" />
              <View className="bg-zinc-800 w-full h-full" />
            </View>

            {/* Neon Accents */}
            <View className="absolute top-[20%] right-[-10%] w-64 h-64 bg-[#3472ef] opacity-20 rounded-full blur-[100px]" />
            <View className="absolute bottom-[40%] left-[-10%] w-80 h-80 bg-purple-600 opacity-10 rounded-full blur-[120px]" />

            <View className="px-8">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-10">
                <View className="flex-row items-center gap-4">
                  <View className="w-14 h-14 rounded-3xl bg-zinc-800 border border-white/10 overflow-hidden">
                    <View className="flex-1 items-center justify-center">
                      <Text className="text-white font-bold text-xl">V</Text>
                    </View>
                  </View>
                  <View>
                    <Text className="text-[#3472ef] text-[10px] font-black uppercase tracking-[0.2em] mb-1">Eksploro</Text>
                    <Text className="text-white text-lg font-black tracking-tight">Line UP Premium</Text>
                  </View>
                </View>
                <TouchableOpacity className="w-12 h-12 rounded-[20px] bg-white/5 border border-white/10 items-center justify-center">
                  <Bell size={24} color="white" />
                </TouchableOpacity>
              </View>

              <Animated.View entering={FadeInUp.delay(200).duration(800)}>
                <View className="flex-row items-center gap-2 border border-white/10 bg-white/5 px-4 py-2 rounded-full self-start mb-6">
                  <Sparkles size={14} color="#fbbf24" />
                  <Text className="text-white text-[10px] font-black uppercase tracking-widest">Ekskluzive në Kosovë</Text>
                </View>

                <Text className="text-5xl font-black text-white leading-tight mb-4">
                  Stili yt{"\n"}
                  <Text className="text-[#3472ef]">pa kompromis.</Text>
                </Text>

                <Text className="text-base text-white/50 font-medium mb-10 max-w-[260px]">
                  Gjej berberin e duhur dhe rezervo takimin tënd në çast.
                </Text>
              </Animated.View>

              {/* Search Glass Box */}
              <BlurView intensity={20} tint="dark" className="rounded-[32px] p-2 overflow-hidden border border-white/10">
                <View className="bg-white/5 px-5 py-4 rounded-[22px] flex-row items-center gap-4 mb-2">
                  <Search size={20} color="rgba(255,255,255,0.3)" />
                  <Text className="text-white/40 text-base font-bold">Kërko berberi...</Text>
                </View>

                <View className="flex-row gap-2">
                  <View className="flex-1 bg-white/5 px-5 py-4 rounded-[22px] flex-row items-center gap-3">
                    <MapPin size={20} color="#3472ef" />
                    <Text className="text-white text-base font-black">Kudo në Kosovë</Text>
                  </View>
                  <TouchableOpacity className="w-16 h-16 bg-[#3472ef] rounded-[22px] items-center justify-center shadow-lg shadow-[#3472ef]/40">
                    <Search size={28} color="white" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>
          </View>

          {/* ── SERVICES ───────────────────────────────────────── */}
          <View className="mt-12 px-8">
            <View className="flex-row items-center justify-between mb-8">
              <Text className="text-xl font-black text-white uppercase tracking-tight">Shërbimet</Text>
              <Text className="text-xs font-black text-[#3472ef] uppercase tracking-widest">Shih të gjitha</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {['Haircut', 'Shaving', 'Styling', 'Coloring'].map((service, i) => (
                <View key={i} className="items-center mr-6">
                  <TouchableOpacity className="w-20 h-20 bg-[#3472ef]/10 border border-[#3472ef]/20 rounded-[28px] items-center justify-center mb-3">
                    <Scissors size={32} color="#3472ef" strokeWidth={2} />
                  </TouchableOpacity>
                  <Text className="text-white/60 text-[10px] font-black uppercase">{service}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ── TOP SALONS ────────────────────────────────────── */}
          <View className="mt-16 px-8 pb-32">
            <Text className="text-xl font-black text-white uppercase tracking-tight mb-8">Më të vlerësuarit</Text>

            {[1, 2].map((_, i) => (
              <TouchableOpacity key={i} className="bg-white/5 border border-white/10 rounded-[40px] overflow-hidden mb-8 shadow-2xl">
                <View className="h-64 bg-zinc-800 relative">
                  <View className="absolute top-6 left-6 z-10 bg-[#3472ef] px-4 py-1.5 rounded-2xl border border-white/20">
                    <Text className="text-white text-[10px] font-black uppercase tracking-widest">Premium</Text>
                  </View>
                  <View className="absolute top-6 right-6 z-10 w-12 h-12 rounded-[22px] bg-black/40 items-center justify-center border border-white/10">
                    <Heart size={24} color="rgba(255,255,255,0.6)" />
                  </View>
                  <View className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-transparent opacity-80" />
                </View>

                <View className="p-8">
                  <View className="flex-row justify-between items-start mb-6">
                    <View className="flex-1">
                      <Text className="text-2xl font-black text-white mb-2">Barber Lab Prishtina</Text>
                      <View className="flex-row items-center gap-2">
                        <MapPin size={14} color="#3472ef" />
                        <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Rr. UCK, Prishtinë</Text>
                      </View>
                    </View>
                    <View className="bg-amber-400/10 px-3 py-2 rounded-2xl border border-amber-400/20 items-center">
                      <View className="flex-row items-center gap-1">
                        <Star size={14} color="#fbbf24" fill="#fbbf24" />
                        <Text className="text-amber-400 font-black">4.9</Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between pt-6 border-t border-white/5">
                    <View className="flex-row items-center gap-2">
                      <View className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      <Text className="text-xs font-black text-emerald-500 uppercase tracking-widest">Hapur tani</Text>
                    </View>
                    <TouchableOpacity className="bg-[#3472ef] px-6 py-3 rounded-2xl shadow-lg shadow-[#3472ef]/30">
                      <Text className="text-white text-[10px] font-black uppercase tracking-widest">Rezervo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>

        {/* ── CUSTOM BOTTOM BAR ─────────────────────────────── */}
        <View className="absolute bottom-6 left-6 right-6">
          <BlurView intensity={80} tint="dark" className="flex-row h-20 items-center px-4 rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
            {['Ballina', 'Kërko', 'Market', 'Profili'].map((label, i) => (
              <TouchableOpacity key={i} className="flex-1 items-center justify-center gap-1">
                <View className={i === 0 ? "text-[#3472ef]" : "text-white/30"}>
                  <Text style={{ color: i === 0 ? '#3472ef' : 'rgba(255,255,255,0.3)' }}>Icon</Text>
                </View>
                <Text className={`text-[9px] font-black uppercase tracking-tighter ${i === 0 ? 'text-white' : 'text-white/20'}`}>{label}</Text>
              </TouchableOpacity>
            ))}
          </BlurView>
        </View>

      </View>
    </SafeAreaProvider>
  );
}
