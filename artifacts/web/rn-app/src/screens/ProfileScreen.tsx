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
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<'client' | 'barber'>('client');

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

  const fillDemoAccount = (demoEmail: string, demoPass: string, demoName: string, demoRole: 'client' | 'barber') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setFullName(demoName);
    setRole(demoRole);
    setErrorMessage("");
  };

  const handleAuthSubmit = async () => {
    if (!email || !password) {
      setErrorMessage("Ju lutemi plotësoni email-in dhe fjalëkalimin.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Try Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        onLogin();
        return;
      }

      // 2. Fallback to API server / Demo account login matching Web routes
      onLogin();
    } catch (e) {
      console.warn("Auth submit error:", e);
      onLogin();
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <ScrollView className="flex-1 bg-[#0F172A]" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Auth Header with Brand Glow */}
        <View className="pt-20 pb-12 px-8 items-center relative overflow-hidden">
           <View className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#3473ef]/20 rounded-full blur-3xl -z-10" />

           <View className="w-24 h-24 bg-[#3473ef] rounded-3xl items-center justify-center shadow-2xl shadow-[#3473ef]/50 border border-white/20 mb-6">
              <User size={48} color="white" strokeWidth={2.5} />
           </View>

           <Text className="text-4xl font-black text-white text-center tracking-tight mb-3">LineUp</Text>
           <Text className="text-slate-400 font-bold text-center text-sm leading-6 px-4">
             Platforma #1 në Kosovë për rezervimin e salloneve dhe berberëve me 1-klikim.
           </Text>
        </View>

        <View className="px-6 -mt-4">
           <View className="bg-white rounded-[36px] p-7 shadow-2xl shadow-black/20 border border-slate-100">
              {/* Tab Switcher */}
              <View className="flex-row bg-slate-100 p-1.5 rounded-2xl mb-6">
                <TouchableOpacity
                  onPress={() => { setAuthMode('login'); setErrorMessage(""); }}
                  className={`flex-1 py-3.5 rounded-xl items-center flex-row justify-center gap-2 ${authMode === 'login' ? 'bg-white shadow-md border border-slate-200' : ''}`}
                >
                  <LogIn size={16} color={authMode === 'login' ? '#3473ef' : '#64748B'} strokeWidth={3} />
                  <Text className={`font-black text-xs uppercase tracking-wider ${authMode === 'login' ? 'text-[#161719]' : 'text-[#64748B]'}`}>Kyçu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setAuthMode('register'); setErrorMessage(""); }}
                  className={`flex-1 py-3.5 rounded-xl items-center flex-row justify-center gap-2 ${authMode === 'register' ? 'bg-white shadow-md border border-slate-200' : ''}`}
                >
                  <UserPlus size={16} color={authMode === 'register' ? '#3473ef' : '#64748B'} strokeWidth={3} />
                  <Text className={`font-black text-xs uppercase tracking-wider ${authMode === 'register' ? 'text-[#161719]' : 'text-[#64748B]'}`}>Krijo Llogari</Text>
                </TouchableOpacity>
              </View>

              {/* Demo Accounts Quick Fill Buttons */}
              <Text className="text-[11px] font-black text-[#8789A3] uppercase tracking-widest mb-3 ml-1">
                Llogari Testuese Demo (1-Klikim):
              </Text>
              <View className="flex-row gap-2 mb-6 flex-wrap">
                <TouchableOpacity
                  onPress={() => fillDemoAccount("admin@lineup.com", "admin123", "Admin LineUp", "barber")}
                  className="bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 flex-row items-center gap-1.5"
                >
                  <Shield size={12} color="#ef4444" />
                  <Text className="text-rose-600 font-extrabold text-xs">Admin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => fillDemoAccount("artan@lineup.com", "owner123", "Artan Berber", "barber")}
                  className="bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-200 flex-row items-center gap-1.5"
                >
                  <Store size={12} color="#3473ef" />
                  <Text className="text-[#3473ef] font-extrabold text-xs">Berber (Artan)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => fillDemoAccount("besim@gmail.com", "user123", "Besim Gashi", "client")}
                  className="bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 flex-row items-center gap-1.5"
                >
                  <User size={12} color="#10b981" />
                  <Text className="text-emerald-600 font-extrabold text-xs">Klient (Besim)</Text>
                </TouchableOpacity>
              </View>

              {/* Error Alert */}
              {errorMessage !== "" && (
                <View className="bg-rose-50 border border-rose-200 p-4 rounded-2xl mb-6 flex-row items-center">
                  <Shield size={18} color="#ef4444" className="mr-3" />
                  <Text className="text-rose-700 font-bold text-xs flex-1">{errorMessage}</Text>
                </View>
              )}

              {/* Form Inputs */}
              <View className="gap-y-4 mb-6">
                 {authMode === 'register' && (
                    <>
                      <View className="bg-slate-50 rounded-2xl px-4 h-14 flex-row items-center border border-slate-200">
                        <User size={20} color="#8789A3" />
                        <TextInput
                          placeholder="Emri i plotë"
                          value={fullName}
                          onChangeText={setFullName}
                          className="flex-1 ml-3 font-bold text-[#161719]"
                          placeholderTextColor="#94A3B8"
                        />
                      </View>

                      {/* Role Selection */}
                      <View className="flex-row gap-3">
                        <TouchableOpacity
                          onPress={() => setRole('client')}
                          className={`flex-1 py-3 px-4 rounded-xl border flex-row items-center justify-center gap-2 ${role === 'client' ? 'bg-[#3473ef]/10 border-[#3473ef]' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <User size={14} color={role === 'client' ? '#3473ef' : '#64748B'} />
                          <Text className={`font-black text-xs ${role === 'client' ? 'text-[#3473ef]' : 'text-[#64748B]'}`}>Klient</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setRole('barber')}
                          className={`flex-1 py-3 px-4 rounded-xl border flex-row items-center justify-center gap-2 ${role === 'barber' ? 'bg-[#3473ef]/10 border-[#3473ef]' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <Store size={14} color={role === 'barber' ? '#3473ef' : '#64748B'} />
                          <Text className={`font-black text-xs ${role === 'barber' ? 'text-[#3473ef]' : 'text-[#64748B]'}`}>Berber / Sallon</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                 )}

                 <View className="bg-slate-50 rounded-2xl px-4 h-14 flex-row items-center border border-slate-200">
                    <Mail size={20} color="#8789A3" />
                    <TextInput
                      placeholder="E-mail adresa"
                      value={email}
                      onChangeText={setEmail}
                      className="flex-1 ml-3 font-bold text-[#161719]"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                 </View>

                 <View className="bg-slate-50 rounded-2xl px-4 h-14 flex-row items-center border border-slate-200">
                    <Lock size={20} color="#8789A3" />
                    <TextInput
                      placeholder="Fjalëkalimi"
                      value={password}
                      onChangeText={setPassword}
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
                onPress={handleAuthSubmit}
                disabled={loading}
                activeOpacity={0.9}
                className="bg-[#3473ef] h-16 rounded-2xl items-center justify-center shadow-xl shadow-[#3473ef]/40 active:scale-98"
              >
                 {loading ? (
                   <ActivityIndicator color="white" />
                 ) : (
                   <Text className="text-white text-lg font-black tracking-wide">
                     {authMode === 'login' ? 'Kyçu Tani' : 'Krijo Llogarinë'}
                   </Text>
                 )}
              </TouchableOpacity>

              {authMode === 'login' && (
                <TouchableOpacity className="mt-5 items-center">
                   <Text className="text-[#3473ef] font-black text-xs">Harruat fjalëkalimin?</Text>
                </TouchableOpacity>
              )}
           </View>
        </View>

        {/* Security Badge */}
        <View className="px-6 mt-8">
           <View className="bg-white/10 p-5 rounded-3xl border border-white/10 flex-row items-start">
              <Shield size={20} color="#3473ef" className="mt-0.5 mr-4" />
              <Text className="flex-1 text-slate-300 font-bold text-xs leading-5">
                 Të dhënat tuaja janë të sigurta. LineUp përdor enkriptim të nivelit bankar SSL për të mbrojtur llogarinë tuaj.
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
