import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { User, Settings, CreditCard, Bell, Shield, HelpCircle, LogOut, ChevronRight, Calendar } from "lucide-react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { BlurView } from "expo-blur";

export const ProfileScreen = () => {
  return (
    <ScrollView className="flex-1 bg-[#050608]" showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View className="pt-20 px-8 pb-10">
        <Animated.View entering={FadeInUp.duration(800)} className="items-center">
          <View className="w-32 h-32 rounded-[48px] bg-zinc-900 border-2 border-[#3472ef] items-center justify-center shadow-2xl shadow-[#3472ef]/20 mb-6">
            <User size={64} color="white" />
            <View className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#050608]" />
          </View>
          <Text className="text-3xl font-black text-white tracking-tight">Artan Berisha</Text>
          <Text className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-2">Premium Member</Text>
        </Animated.View>

        {/* Stats Row */}
        <View className="flex-row mt-12 gap-4">
          <View className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-5 items-center">
            <Text className="text-white font-black text-2xl">12</Text>
            <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mt-1">Takime</Text>
          </View>
          <View className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-5 items-center">
            <Text className="text-white font-black text-2xl">4</Text>
            <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mt-1">Favorite</Text>
          </View>
          <View className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-5 items-center">
            <Text className="text-white font-black text-2xl">8</Text>
            <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mt-1">Reviews</Text>
          </View>
        </View>
      </View>

      {/* Menu Sections */}
      <View className="px-8 pb-40">
        <Text className="text-white/20 font-black text-[10px] uppercase tracking-[0.25em] mb-6">Llogaria</Text>

        <View className="bg-white/[0.02] border border-white/5 rounded-[40px] overflow-hidden">
          <MenuButton icon={Calendar} label="Rezervimet e mia" />
          <MenuButton icon={CreditCard} label="Metodat e pagesës" />
          <MenuButton icon={Bell} label="Njoftimet" hasSwitch />
          <MenuButton icon={Shield} label="Siguria & Privatësia" />
        </View>

        <Text className="text-white/20 font-black text-[10px] uppercase tracking-[0.25em] mt-10 mb-6">Mbështetja</Text>
        <View className="bg-white/[0.02] border border-white/5 rounded-[40px] overflow-hidden">
          <MenuButton icon={HelpCircle} label="Qendra e ndihmës" />
          <MenuButton icon={Settings} label="Cilësimet" />
        </View>

        <TouchableOpacity className="mt-12 flex-row items-center justify-center gap-3 bg-rose-500/10 border border-rose-500/20 py-6 rounded-[32px]">
          <LogOut size={20} color="#f43f5e" />
          <Text className="text-rose-500 font-black uppercase tracking-widest text-xs">Dil nga Llogaria</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const MenuButton = ({ icon: Icon, label, hasSwitch = false }: any) => (
  <TouchableOpacity className="flex-row items-center px-8 py-6 border-b border-white/5">
    <View className="w-10 h-10 rounded-2xl bg-white/5 items-center justify-center mr-4">
      <Icon size={20} color="white" opacity={0.6} />
    </View>
    <Text className="flex-1 text-white font-bold text-base">{label}</Text>
    {hasSwitch ? (
      <Switch trackColor={{ false: "#1f2937", true: "#3472ef" }} thumbColor="white" value={true} />
    ) : (
      <ChevronRight size={20} color="rgba(255,255,255,0.2)" />
    )}
  </TouchableOpacity>
);
