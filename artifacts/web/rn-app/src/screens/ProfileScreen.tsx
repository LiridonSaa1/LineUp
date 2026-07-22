import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, Image, TextInput, Dimensions } from "react-native";
import { User, Settings, CreditCard, Bell, Shield, HelpCircle, LogOut, ChevronRight, Calendar, Heart, Award, Store, Mail, Lock, Eye, EyeOff, UserPlus, LogIn } from "lucide-react-native";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { BlurView } from 'expo-blur';
import { supabase } from "@/config/supabase";

const { width } = Dimensions.get("window");

interface ProfileScreenProps {
  user: any;
  onLogin: () => void;
  onLogout: () => void;
  onOpenRegisterShop: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogin, onLogout, onOpenRegisterShop }) => {
  const [stats, setStats] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const [shops, cities, appointments] = await Promise.all([
          supabase.from('barbershops').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('barbershops').select('city').eq('status', 'active'),
          supabase.from('appointments').select('*', { count: 'exact', head: true }).neq('status', 'cancelled')
        ]);

        const uniqueCities = new Set(cities.data?.map(s => s.city));

        setStats({
          activeShops: shops.count || 0,
          citiesCount: uniqueCities.size || 0,
          confirmedAppointments: appointments.count || 0
        });
      } catch (e) {
        console.warn("Failed to fetch stats from Supabase:", e);
      }
    }
    loadStats();
  }, []);

  if (!user) {
    return (
      <ScrollView className="flex-1 bg-[#F5F5F5]" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Auth Header */}
        <View className="bg-[#3473ef] pt-20 pb-12 px-8 rounded-b-[50px] items-center shadow-lg">
           <View className="w-20 h-20 bg-white/20 rounded-3xl items-center justify-center border border-white/30 mb-6">
              <User size={40} color="white" strokeWidth={2.5} />
           </View>
           <Text className="text-3xl font-black text-white mb-2">Mirësevini në LineUp</Text>
           <Text className="text-white/70 font-bold text-center">Kyçuni ose regjistrohuni për të menaxhuar terminet tuaja.</Text>
        </View>

        <View className="px-6 -mt-8">
           <View className="bg-white rounded-[32px] p-6 shadow-xl shadow-black/5 border border-slate-100">
              {/* Tab Switcher */}
              <View className="flex-row bg-slate-50 p-1 rounded-2xl border border-slate-100 mb-8">
                <TouchableOpacity
                  onPress={() => setAuthMode('login')}
                  className={`flex-1 py-3.5 rounded-xl items-center flex-row justify-center gap-2 ${authMode === 'login' ? 'bg-white shadow-sm border border-slate-100' : ''}`}
                >
                  <LogIn size={16} color={authMode === 'login' ? '#3473ef' : '#8789A3'} strokeWidth={3} />
                  <Text className={`font-black text-xs uppercase ${authMode === 'login' ? 'text-[#161719]' : 'text-[#8789A3]'}`}>Kyçu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAuthMode('register')}
                  className={`flex-1 py-3.5 rounded-xl items-center flex-row justify-center gap-2 ${authMode === 'register' ? 'bg-white shadow-sm border border-slate-100' : ''}`}
                >
                  <UserPlus size={16} color={authMode === 'register' ? '#3473ef' : '#8789A3'} strokeWidth={3} />
                  <Text className={`font-black text-xs uppercase ${authMode === 'register' ? 'text-[#161719]' : 'text-[#8789A3]'}`}>Regjistrohu</Text>
                </TouchableOpacity>
              </View>

              {/* Form Inputs */}
              <View className="gap-y-4 mb-8">
                 {authMode === 'register' && (
                    <View className="bg-slate-50 rounded-2xl px-4 h-16 flex-row items-center border border-slate-100">
                      <User size={20} color="#8789A3" />
                      <TextInput placeholder="Emri i plotë" className="flex-1 ml-3 font-bold text-[#161719]" placeholderTextColor="#94A3B8" />
                    </View>
                 )}
                 <View className="bg-slate-50 rounded-2xl px-4 h-16 flex-row items-center border border-slate-100">
                    <Mail size={20} color="#8789A3" />
                    <TextInput placeholder="E-mail adresa" className="flex-1 ml-3 font-bold text-[#161719]" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" />
                 </View>
                 <View className="bg-slate-50 rounded-2xl px-4 h-16 flex-row items-center border border-slate-100">
                    <Lock size={20} color="#8789A3" />
                    <TextInput
                      placeholder="Fjalëkalimi"
                      className="flex-1 ml-3 font-bold text-[#161719]"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                       {showPassword ? <EyeOff size={20} color="#8789A3" /> : <Eye size={20} color="#8789A3" />}
                    </TouchableOpacity>
                 </View>
              </View>

              <TouchableOpacity
                onPress={onLogin}
                activeOpacity={0.9}
                className="bg-black h-16 rounded-2xl items-center justify-center shadow-xl shadow-black/20"
              >
                 <Text className="text-white text-lg font-black">{authMode === 'login' ? 'Kyçu Tani' : 'Krijo Llogarinë'}</Text>
              </TouchableOpacity>

              {authMode === 'login' && (
                <TouchableOpacity className="mt-6 items-center">
                   <Text className="text-[#3473ef] font-black text-sm">Harruat fjalëkalimin?</Text>
                </TouchableOpacity>
              )}
           </View>
        </View>

        {/* Info Box */}
        <View className="px-6 mt-8">
           <View className="bg-[#3473ef]/5 p-5 rounded-3xl border border-[#3473ef]/10 flex-row items-start">
              <Shield size={20} color="#3473ef" className="mt-0.5 mr-4" />
              <Text className="flex-1 text-[#3473ef] font-bold text-xs leading-5">
                 Të dhënat tuaja janë të sigurta me ne. LineUp përdor enkriptim të nivelit bankar për të mbrojtur privatësinë tuaj.
              </Text>
           </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#F5F5F5]" showsVerticalScrollIndicator={false}>
      {/* Top Purple Header Banner */}
      <View className="bg-[#3473ef] pt-16 pb-12 px-6 rounded-b-[40px] items-center">
        <View className="w-28 h-28 rounded-full bg-white p-1 shadow-xl mb-4 relative">
          <Image 
            source={{ uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80" }} 
            className="w-full h-full rounded-full object-cover" 
          />
          <View className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 rounded-full border-2 border-white items-center justify-center" />
        </View>

        <Text className="text-2xl font-black text-white tracking-tight">{user.name}</Text>
        <View className="bg-white/20 px-4 py-1 rounded-full mt-2 border border-white/30">
          <Text className="text-white font-extrabold text-[11px]">Anëtar Premium</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View className="px-6 -mt-6">
        <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex-row justify-around">
          <View className="items-center">
            <Text className="text-[#161719] font-black text-2xl">{stats?.activeShops || "15"}</Text>
            <Text className="text-[#8789A3] text-[10px] font-extrabold uppercase mt-1">Sallone</Text>
          </View>
          <View className="w-[1px] h-10 bg-slate-100 self-center" />
          <View className="items-center">
            <Text className="text-[#161719] font-black text-2xl">{stats?.citiesCount || "7"}</Text>
            <Text className="text-[#8789A3] text-[10px] font-extrabold uppercase mt-1">Qytete</Text>
          </View>
          <View className="w-[1px] h-10 bg-slate-100 self-center" />
          <View className="items-center">
            <Text className="text-[#161719] font-black text-2xl">{stats?.confirmedAppointments || "450"}+</Text>
            <Text className="text-[#8789A3] text-[10px] font-extrabold uppercase mt-1">Rezervime</Text>
          </View>
        </View>
      </View>

      {/* Menu Options */}
      <View className="px-6 pt-6 pb-32">
        <Text className="text-[#8789A3] font-black text-xs uppercase tracking-widest mb-4">Llogaria</Text>

        <View className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm mb-6">
          <MenuButton icon={Calendar} label="Terminet e mia" />
          <MenuButton icon={Heart} label="Sallonet e ruajtura" />
          <MenuButton icon={CreditCard} label="Metodat e pagesës" />
          <MenuButton icon={Bell} label="Njoftimet" hasSwitch />
          <MenuButton icon={Shield} label="Privatësia & Siguria" />
        </View>

        <Text className="text-[#8789A3] font-black text-xs uppercase tracking-widest mb-4">Për Biznes</Text>
        <View className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm mb-6">
          <MenuButton icon={Award} label="Paneli i Partnerit" />
          <MenuButton
            icon={Store}
            label="Regjistro Sallonin Tim"
            onPress={onOpenRegisterShop}
          />
        </View>

        <Text className="text-[#8789A3] font-black text-xs uppercase tracking-widest mb-4">Mbështetja</Text>
        <View className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm mb-8">
          <MenuButton icon={HelpCircle} label="Qendra e ndihmës" />
          <MenuButton icon={Settings} label="Cilësimet" />
        </View>

        <TouchableOpacity
          onPress={onLogout}
          activeOpacity={0.8}
          className="flex-row items-center justify-center gap-3 bg-rose-50 border border-rose-100 py-4 rounded-2xl active:scale-98"
        >
          <LogOut size={18} color="#FF4757" />
          <Text className="text-[#FF4757] font-black uppercase tracking-widest text-xs">Çkyçu</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const MenuButton = ({ icon: Icon, label, hasSwitch = false, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="flex-row items-center px-6 py-4.5 border-b border-slate-50"
  >
    <View className="w-10 h-10 rounded-full bg-[#EBF2FF] items-center justify-center mr-4">
      <Icon size={18} color="#3473ef" />
    </View>
    <Text className="flex-1 text-[#161719] font-extrabold text-sm">{label}</Text>
    {hasSwitch ? (
      <Switch trackColor={{ false: "#E2E8F0", true: "#3473ef" }} thumbColor="white" value={true} />
    ) : (
      <ChevronRight size={18} color="#8789A3" />
    )}
  </TouchableOpacity>
);
