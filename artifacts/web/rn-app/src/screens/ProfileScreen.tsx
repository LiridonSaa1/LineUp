import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, Image } from "react-native";
import { User, Settings, CreditCard, Bell, Shield, HelpCircle, LogOut, ChevronRight, Calendar, Heart, Award } from "lucide-react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { fetchFromAPI } from "@/config/api";

export const ProfileScreen = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchFromAPI("/api/stats/public");
        if (data) setStats(data);
      } catch (e) {
        console.warn("Failed to fetch stats:", e);
      }
    }
    loadStats();
  }, []);

  return (
    <ScrollView className="flex-1 bg-[#F8F9FE]" showsVerticalScrollIndicator={false}>
      {/* Top Purple Header Banner */}
      <View className="bg-[#7F3DFF] pt-16 pb-12 px-6 rounded-b-[40px] items-center">
        <View className="w-28 h-28 rounded-full bg-white p-1 shadow-xl mb-4 relative">
          <Image 
            source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" }} 
            className="w-full h-full rounded-full object-cover" 
          />
          <View className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 rounded-full border-2 border-white items-center justify-center" />
        </View>

        <Text className="text-2xl font-black text-white tracking-tight">Artan Berisha</Text>
        <View className="bg-white/20 px-4 py-1 rounded-full mt-2 border border-white/30">
          <Text className="text-white font-extrabold text-[11px]">Premium Member</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View className="px-6 -mt-6">
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex-row justify-around">
          <View className="items-center">
            <Text className="text-[#161719] font-black text-2xl">{stats?.totalBarbershops || "15"}</Text>
            <Text className="text-[#8789A3] text-[10px] font-extrabold uppercase mt-1">Salons</Text>
          </View>
          <View className="w-[1px] h-10 bg-slate-100 self-center" />
          <View className="items-center">
            <Text className="text-[#161719] font-black text-2xl">{stats?.totalCities || "7"}</Text>
            <Text className="text-[#8789A3] text-[10px] font-extrabold uppercase mt-1">Cities</Text>
          </View>
          <View className="w-[1px] h-10 bg-slate-100 self-center" />
          <View className="items-center">
            <Text className="text-[#161719] font-black text-2xl">{stats?.totalAppointments || "450"}+</Text>
            <Text className="text-[#8789A3] text-[10px] font-extrabold uppercase mt-1">Bookings</Text>
          </View>
        </View>
      </View>

      {/* Menu Options */}
      <View className="px-6 pt-6 pb-32">
        <Text className="text-[#8789A3] font-black text-xs uppercase tracking-widest mb-4">Account</Text>

        <View className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm mb-6">
          <MenuButton icon={Calendar} label="My Appointments" />
          <MenuButton icon={Heart} label="Saved Salons" />
          <MenuButton icon={CreditCard} label="Payment Methods" />
          <MenuButton icon={Bell} label="Notifications" hasSwitch />
          <MenuButton icon={Shield} label="Privacy & Security" />
        </View>

        <Text className="text-[#8789A3] font-black text-xs uppercase tracking-widest mb-4">Support</Text>
        <View className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm mb-8">
          <MenuButton icon={HelpCircle} label="Help Center" />
          <MenuButton icon={Settings} label="Settings" />
        </View>

        <TouchableOpacity className="flex-row items-center justify-center gap-3 bg-rose-50 border border-rose-100 py-4 rounded-2xl active:scale-98">
          <LogOut size={18} color="#FF4757" />
          <Text className="text-[#FF4757] font-black uppercase tracking-widest text-xs">Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const MenuButton = ({ icon: Icon, label, hasSwitch = false }: any) => (
  <TouchableOpacity className="flex-row items-center px-6 py-4.5 border-b border-slate-50">
    <View className="w-10 h-10 rounded-full bg-[#F2EDFF] items-center justify-center mr-4">
      <Icon size={18} color="#7F3DFF" />
    </View>
    <Text className="flex-1 text-[#161719] font-extrabold text-sm">{label}</Text>
    {hasSwitch ? (
      <Switch trackColor={{ false: "#E2E8F0", true: "#7F3DFF" }} thumbColor="white" value={true} />
    ) : (
      <ChevronRight size={18} color="#8789A3" />
    )}
  </TouchableOpacity>
);
