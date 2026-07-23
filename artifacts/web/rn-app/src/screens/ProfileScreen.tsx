import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, Image, TextInput, Dimensions, ActivityIndicator, Keyboard, Alert, Modal } from "react-native";
import { User, Settings, CreditCard, Bell, Shield, HelpCircle, LogOut, ChevronRight, Calendar, Heart, Award, Store, Mail, Lock, Eye, EyeOff, UserPlus, LogIn, Phone, ChevronDown, Search, ArrowLeft, Check, Zap, Sparkles, MapPin, X } from "lucide-react-native";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { BlurView } from 'expo-blur';
import { supabase } from "@/config/supabase";
import { RegisterScreen } from "./RegisterScreen";

const { width } = Dimensions.get("window");

interface ProfileScreenProps {
  user: any;
  onLogin: (userData?: any) => void;
  onLogout: () => void;
  onOpenRegisterShop: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogin, onLogout, onOpenRegisterShop }) => {
  const [stats, setStats] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  const handleAuthSubmit = async () => {
    if (!email || !password) {
      setErrorMessage("Ju lutemi plotësoni email-in dhe fjalëkalimin.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // --- REAL LOGIN WITH SUPABASE ---
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setErrorMessage("E-mail ose fjalëkalimi është i gabuar. Ju lutem kontrolloni të dhënat.");
        setLoading(false);
        return;
      }

      // Query users or barbershops table in Supabase
      const { data: dbUser } = await supabase.from('users').select('*').eq('email', email.trim().toLowerCase()).maybeSingle();
      const { data: dbBarber } = await supabase.from('barbershops').select('*').eq('email', email.trim().toLowerCase()).maybeSingle();

      if (dbUser) {
        onLogin({
          id: dbUser.id,
          name: dbUser.name || dbUser.full_name || email.split('@')[0],
          email: dbUser.email,
          role: dbUser.role || 'client'
        });
      } else if (dbBarber) {
        onLogin({
          id: dbBarber.id,
          name: dbBarber.name,
          email: dbBarber.email || email,
          role: 'barber'
        });
      } else if (authData?.user) {
        onLogin({
          id: authData.user.id,
          name: authData.user.user_metadata?.full_name || email.split('@')[0],
          email: authData.user.email,
          role: authData.user.user_metadata?.role || 'client'
        });
      } else {
        onLogin({
          name: email.split('@')[0],
          email: email.trim().toLowerCase(),
          role: 'client'
        });
      }
    } catch (e: any) {
      console.warn("Auth submit error:", e);
      setErrorMessage(e?.message || "Ndodhi një gabim gjatë kyçjes.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View className="flex-1">
        <ScrollView className="flex-1 bg-[#F5F5F5]" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 80, paddingTop: 40 }}>
          {/* Background Decorative Ambient Blobs */}
          <View className="absolute top-[-50] left-[-50] w-72 h-72 bg-[#3473ef]/15 rounded-full blur-3xl" />
          <View className="absolute top-[200] right-[-80] w-80 h-80 bg-[#f47458]/10 rounded-full blur-3xl" />

          {/* Auth Header */}
          <View className="pb-8 px-6 items-center">
             <View className="w-20 h-20 bg-[#3473ef] rounded-3xl items-center justify-center shadow-xl shadow-[#3473ef]/30 border border-white mb-4">
                <User size={40} color="white" strokeWidth={2.5} />
             </View>

             <Text className="text-3xl font-black text-[#161719] text-center tracking-tight mb-2">Welcome back</Text>
             <Text className="text-[#64748B] font-bold text-center text-sm leading-5 px-6">
               Sign in to your account to continue
             </Text>
          </View>

          <View className="px-6">
             <View className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/60 border border-slate-100">
                {/* Error Alert */}
                {errorMessage !== "" && (
                  <View className="bg-rose-50 border border-rose-200 p-4 rounded-2xl mb-6 flex-row items-center">
                    <Shield size={18} color="#ef4444" className="mr-3" />
                    <Text className="text-rose-700 font-bold text-xs flex-1">{errorMessage}</Text>
                  </View>
                )}

                {/* Form Inputs */}
                <View className="gap-y-4 mb-6">
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
                  className="bg-black h-14 rounded-2xl items-center justify-center shadow-lg active:scale-98"
                >
                   {loading ? (
                     <ActivityIndicator color="white" />
                   ) : (
                     <Text className="text-white text-base font-black tracking-wide">
                       Kyçu Tani
                     </Text>
                   )}
                </TouchableOpacity>

                <TouchableOpacity className="mt-4 items-center">
                   <Text className="text-[#3473ef] font-black text-xs">Harruat fjalëkalimin?</Text>
                </TouchableOpacity>

                {/* New Business Registration Link */}
                <TouchableOpacity
                  onPress={() => setShowRegisterModal(true)}
                  className="mt-6 py-4 items-center bg-[#3473ef]/10 border border-[#3473ef]/20 rounded-2xl active:scale-98"
                >
                   <Text className="text-[#3473ef] font-black text-xs uppercase tracking-wider">
                      Nuk keni llogari? Regjistro Sallonin Tënd →
                   </Text>
                </TouchableOpacity>
             </View>
          </View>

          {/* Security Guarantee Badge */}
          <View className="px-6 mt-6">
             <View className="bg-white p-4 rounded-2xl border border-slate-200/80 flex-row items-center shadow-sm">
                <Shield size={18} color="#3473ef" className="mr-3" />
                <Text className="flex-1 text-[#64748B] font-bold text-xs leading-4">
                   Të dhënat tuaja ruhen në mënyrë të sigurt me enkriptim të avancuar.
                </Text>
             </View>
          </View>
        </ScrollView>

        {/* Dedicated Fullscreen Registration Modal */}
        <Modal
          visible={showRegisterModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowRegisterModal(false)}
        >
          <RegisterScreen
            onClose={() => setShowRegisterModal(false)}
            onSuccess={(userData) => {
              setShowRegisterModal(false);
              onLogin(userData);
            }}
          />
        </Modal>
      </View>
    );
  }


  return (
    <ScrollView className="flex-1 bg-[#ECEEF2]" showsVerticalScrollIndicator={false}>
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
