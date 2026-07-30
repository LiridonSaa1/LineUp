import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, ActivityIndicator, Keyboard, Alert, Modal, KeyboardAvoidingView, Platform, StyleSheet, Switch } from "react-native";
import {
  User,
  Settings,
  CreditCard,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Calendar,
  Heart,
  Award,
  Store,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MessageSquare,
  FileText,
  Globe,
  Headphones,
  CheckCircle2,
  Users,
  TrendingUp,
  X,
  Star,
  UserPlus,
  CreditCard as PlansIcon,
  Crown,
  Phone,
  Info,
  Trash2,
  ChevronLeft,
  Briefcase,
  AlertTriangle,
  Clock,
  Flag
} from "lucide-react-native";
import Animated, { FadeInUp, FadeInDown, useAnimatedStyle, withSpring, useSharedValue, SlideInRight } from "react-native-reanimated";
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { supabase } from "@/config/supabase";
import { RegisterScreen } from "./RegisterScreen";

const { width, height } = Dimensions.get("window");

const REGISTRATION_PLANS = [
  {
    id: 'solo',
    name: 'Solo',
    price: '15€',
    employees: '1 berber',
    desc: 'Ideale për berberët individualë',
    features: ['300 rezervime/muaj', '1 profil stafi', 'Kalendari i rezervimeve', 'Njoftime me email']
  },
  {
    id: 'duo',
    name: 'Duo',
    price: '20€',
    employees: '2 berberë',
    desc: 'Për ekipe të vogla',
    features: ['Rezervime pa limit', '2 profile stafi', 'Njoftime me SMS & Email', 'Statistika & Raporte']
  },
  {
    id: 'team',
    name: 'Team',
    price: '25€+',
    employees: '3+ berberë',
    desc: 'Për ekipe në rritje',
    features: ['Gjithçka nga Duo', 'Staf pa limit', 'Marketing me SMS', 'Landing page e personalizuar']
  }
];

const KOSOVO_HOLIDAYS_2026 = [
  { date: '1 Janar', name: 'Viti i Ri', icon: '🎆' },
  { date: '7 Janar', name: 'Krishtlindjet Ortodokse', icon: '⛪' },
  { date: '17 Shkurt', name: 'Dita e Pavarësisë', icon: '🇽🇰' },
  { date: '30 Mars', name: 'Fitër Bajrami*', icon: '🌙' },
  { date: '5 Prill', name: 'Pashkët Katolike', icon: '✝️' },
  { date: '9 Prill', name: 'Dita e Kushtetutës', icon: '📜' },
  { date: '12 Prill', name: 'Pashkët Ortodokse', icon: '☦️' },
  { date: '1 Maj', name: 'Dita Ndökombëtare e Punës', icon: '🛠️' },
  { date: '9 Maj', name: 'Dita e Evropës', icon: '🇪🇺' },
  { date: '6 Qershor', name: 'Kurban Bajrami*', icon: '🐑' },
  { date: '25 Dhjetor', name: 'Krishtlindjet Katolike', icon: '🎄' },
];

interface ProfileScreenProps {
  user: any;
  onLogin: (userData?: any) => void;
  onLogout: () => void;
  onOpenRegisterShop: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogin, onLogout, onOpenRegisterShop }) => {
  const [profileStats, setProfileStats] = useState({
    appointmentsCount: 0,
    staffCount: 0,
    favoritesCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Modal States
  const [activeModal, setActiveModal] = useState<string | null>(null); // 'profile', 'plans', 'favorites', 'messages', 'appointments', 'forms', 'settings', 'support', 'language', 'orari'
  const [settingsView, setSettingsIndex] = useState<'main' | 'notifications' | 'password' | 'legal'>('main');
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | 'use'>('privacy');

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>('solo');
  const [teamEmployeeCount, setTeamEmployeeCount] = useState(3);

  const calculateTeamPrice = (count: number) => {
    return 25 + (Math.max(3, count) - 3) * 5;
  };

  // Edit Profile State
  const [editData, setEditData] = useState({
    name: user?.name || "",
    phone: "",
    bio: ""
  });

  // Database Data States
  const [dbFavorites, setDbFavorites] = useState<any[]>([]);
  const [dbMessages, setDbMessages] = useState<any[]>([]);
  const [dbAppointments, setDbAppointments] = useState<any[]>([]);
  const [dbForms, setDbForms] = useState<any[]>([]);

  // Feedback Form States
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);

  // Employee Service & Schedule States
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedEmployeeSubcats, setSelectedEmployeeSubcats] = useState<string[]>([]);
  const [employeeSchedule, setEmployeeSchedule] = useState<any[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const fetchEmployeeServicesData = async () => {
    try {
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      const { data: subs } = await supabase.from('subcategories').select('*').order('name');
      setCategories(cats || []);
      setSubcategories(subs || []);

      const { data: myServices } = await supabase
        .from('barber_services')
        .select('subcategory_id')
        .eq('barber_id', user.id);
      
      const subcatIds = myServices?.map(s => s.subcategory_id) || [];
      setSelectedEmployeeSubcats(subcatIds);
    } catch (err) {
      console.warn("Error fetching employee services:", err);
    }
  };

  const toggleEmployeeService = async (subcatId: string) => {
    const isSelected = selectedEmployeeSubcats.includes(subcatId);
    let updated = [...selectedEmployeeSubcats];
    
    try {
      if (isSelected) {
        const { error } = await supabase
          .from('barber_services')
          .delete()
          .eq('barber_id', user.id)
          .eq('subcategory_id', subcatId);
        if (error) throw error;
        updated = updated.filter(id => id !== subcatId);
      } else {
        const { error } = await supabase
          .from('barber_services')
          .insert({
            barber_id: user.id,
            subcategory_id: subcatId
          });
        if (error) throw error;
        updated.push(subcatId);
      }
      setSelectedEmployeeSubcats(updated);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err: any) {
      Alert.alert("Gabim", err.message || "Dështoi përditësimi i shërbimit.");
    }
  };

  const fetchEmployeeSchedule = async () => {
    try {
      const { data: barberData } = await supabase
        .from('barbers')
        .select('weekly_schedule')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const defaultSchedule = [
        { day: "E Hënë", is_working: true, start_time: "09:00", end_time: "17:00" },
        { day: "E Martë", is_working: true, start_time: "09:00", end_time: "17:00" },
        { day: "E Mërkurë", is_working: true, start_time: "09:00", end_time: "17:00" },
        { day: "E Enjte", is_working: true, start_time: "09:00", end_time: "17:00" },
        { day: "E Premte", is_working: true, start_time: "09:00", end_time: "17:00" },
        { day: "E Shtunë", is_working: false, start_time: "09:00", end_time: "15:00" },
        { day: "E Diel", is_working: false, start_time: "09:00", end_time: "15:00" }
      ];

      setEmployeeSchedule(barberData?.weekly_schedule || defaultSchedule);
    } catch (err) {
      console.warn("Error fetching employee schedule:", err);
    }
  };

  const saveEmployeeSchedule = async (updatedSched = employeeSchedule) => {
    setSavingSchedule(true);
    try {
      const { error } = await supabase
        .from('barbers')
        .update({ weekly_schedule: updatedSched })
        .eq('user_id', user.id);
      
      if (error) throw error;
      setEmployeeSchedule(updatedSched);
      Alert.alert("Sukses", "Orari juaj i punës u ruajt me sukses.");
      setActiveModal(null);
    } catch (err: any) {
      Alert.alert("Gabim", err.message || "Dështoi ruajtja e orarit.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackSubject.trim() || !feedbackContent.trim()) {
      Alert.alert("Gabim", "Ju lutem plotësoni të gjitha fushat.");
      return;
    }
    setSendingFeedback(true);
    try {
      const { error } = await supabase.from('system_feedback').insert({
        user_id: user.id,
        subject: feedbackSubject.trim(),
        content: feedbackContent.trim()
      });
      if (error) throw error;
      Alert.alert("Sukses", "Sugjerimi juaj u dërgua me sukses. Ju faleminderit për kontributin tuaj!");
      setFeedbackSubject("");
      setFeedbackContent("");
      setActiveModal(null);
    } catch (e: any) {
      Alert.alert("Gabim", e.message || "Dështoi dërgimi i sugjerimit.");
    } finally {
      setSendingFeedback(false);
    }
  };

  // Orari & Festat States
  const [shopSchedule, setShopSchedule] = useState<any[]>([]);
  const [realShopId, setRealShopId] = useState<string | null>(null);

  const toggleDaySchedule = async (dayIdx: number, currentIsClosed: boolean) => {
    if (!realShopId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const updatedSchedule = [...shopSchedule];
    const existingIndex = updatedSchedule.findIndex(s => s.day_of_week === dayIdx);
    
    const newIsClosed = !currentIsClosed;
    
    if (existingIndex > -1) {
      updatedSchedule[existingIndex] = {
        ...updatedSchedule[existingIndex],
        is_closed: newIsClosed
      };
    } else {
      updatedSchedule.push({
        barber_id: realShopId,
        day_of_week: dayIdx,
        is_closed: newIsClosed,
        start_time: '09:00',
        end_time: '18:00'
      });
    }
    
    setShopSchedule(updatedSchedule);
    
    try {
      if (existingIndex > -1) {
        await supabase
          .from('barber_schedules')
          .update({ is_closed: newIsClosed })
          .eq('barber_id', realShopId)
          .eq('day_of_week', dayIdx);
      } else {
        await supabase
          .from('barber_schedules')
          .insert({
            barber_id: realShopId,
            day_of_week: dayIdx,
            is_closed: newIsClosed,
            start_time: '09:00',
            end_time: '18:00'
          });
      }
    } catch (err) {
      console.warn("Failed to update schedule in Supabase:", err);
      fetchOwnerStats();
    }
  };

  const fetchOwnerStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const isBusiness = user.role === 'owner' || user.role === 'barber' || user.role === 'employee';
      
      let shopId = null;
      let apptsRes: any = { data: [] };
      let staffRes: any = { count: 0 };
      let schedulesRes: any = { data: [] };
      
      if (isBusiness) {
        const { data: shopData } = await supabase
          .from('barbershops')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();
        shopId = shopData?.id;
      }

      const favQuery = (isBusiness && shopId)
        ? supabase.from('favorites').select('*, users(*)').eq('shop_id', shopId)
        : supabase.from('favorites').select('*, barbershops(*)').eq('user_id', user.id);

      const promises: any[] = [favQuery];

      if (isBusiness && shopId) {
        promises.push(
          supabase.from('appointments').select('*').eq('shop_id', shopId).neq('status', 'cancelled').order('date', { ascending: false }),
          supabase.from('barbers').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
          supabase.from('barber_schedules').select('*').eq('barber_id', shopId)
        );
      }

      // Add customer check for plans
      promises.push(
        supabase.from('customers').select('customer_id').eq('email', user.email).maybeSingle()
      );

      const results = await Promise.all(promises);
      const favsRes = results[0];
      let customerData: any = null;

      if (isBusiness && shopId) {
        apptsRes = results[1];
        staffRes = results[2];
        schedulesRes = results[3];
        customerData = results[4];
      } else {
        customerData = results[1];
      }

      if (customerData?.data?.customer_id) {
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('product_id')
          .eq('customer_id', customerData.data.customer_id)
          .eq('status', 'active')
          .maybeSingle();
        if (subData) setCurrentPlan(subData.product_id);
      }

      setDbAppointments(apptsRes.data || []);
      setDbFavorites(favsRes.data || []);
      setShopSchedule(schedulesRes.data || []);
      if (shopId) {
        setRealShopId(shopId);
      }
      
      setProfileStats({
        appointmentsCount: apptsRes.data?.length || 0,
        staffCount: staffRes.count || 0,
        favoritesCount: favsRes.data?.length || 0
      });

      // Also update edit data with user info if available
      const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
      if (userData) {
        setEditData({
          name: userData.name || user.name,
          phone: userData.phone || "",
          bio: userData.bio || ""
        });
      }

    } catch (e) {
      console.warn("Failed to fetch owner profile data:", e);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchOwnerStats();
  }, [user, fetchOwnerStats]);

  const handleAuthSubmit = async () => {
    if (!authEmail || !authPassword) {
      setErrorMessage("Ju lutemi plotësoni email-in dhe fjalëkalimin.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      const cleanEmail = authEmail.trim().toLowerCase();
      if (cleanEmail === "lineup@admin.com" && authPassword === "lineup12.@") {
        onLogin({ id: "admin_1", name: "LineUp Super Admin", email: "lineup@admin.com", role: "super_admin" });
        setLoading(false); return;
      }
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: authPassword });
      if (authError) { setErrorMessage("E-mail ose fjalëkalimi është i gabuar."); setLoading(false); return; }
      if (authData?.user) {
        const { data: dbUser } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();
        const { data: dbShop } = await supabase.from('barbershops').select('*').eq('email', cleanEmail).maybeSingle();
        if (dbShop) onLogin({ id: dbShop.owner_id || dbShop.id, name: dbShop.name, email: dbShop.email || cleanEmail, role: 'owner' });
        else if (dbUser) onLogin({ id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role || 'client' });
      }
    } catch (e) { setErrorMessage("Ndodhi një gabim gjatë kyçjes."); } finally { setLoading(false); }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('users').update({
        name: editData.name,
        phone: editData.phone
      }).eq('id', user.id);
      if (error) throw error;

      if (user.role === 'owner') {
        const { error: shopErr } = await supabase.from('barbershops').update({
          name: editData.name,
          phone: editData.phone
        }).eq('owner_id', user.id);
        if (shopErr) console.warn("Failed to update barbershop in Supabase:", shopErr);
      }

      Alert.alert("Sukses", "Profili u përditësua me sukses.");
      setActiveModal(null);
      fetchOwnerStats();
    } catch (e: any) {
      Alert.alert("Gabim", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Fshirja e Llogarisë",
      "Jeni të sigurt? Ky veprim do të fshijë llogarinë tuaj, biznesin dhe gjithë stafin tuaj përgjithmonë.",
      [
        { text: "Anulo", style: "cancel" },
        {
          text: "Fshij Përgjithmonë",
          style: "destructive",
          onPress: async () => {
            try {
              // Note: Cascading delete should be handled in Supabase DB triggers/foreign keys
              // or manually here: delete appointments -> delete staff -> delete shop -> delete user
              await supabase.from('users').delete().eq('id', user.id);
              onLogout();
            } catch (e) {
              Alert.alert("Gabim", "Nuk u mundësua fshirja e llogarisë.");
            }
          }
        }
      ]
    );
  };

  const handleAction = (label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (label === 'Profile') setActiveModal('profile');
    if (label === 'Plans') setActiveModal('plans');
    if (label === 'Favorites') setActiveModal('favorites');
    if (label === 'Messages') setActiveModal('messages');
    if (label === 'Appointments') setActiveModal('appointments');
    if (label === 'Forms') setActiveModal('forms');
    if (label === 'Settings') { setActiveModal('settings'); setSettingsIndex('main'); }
    if (label === 'Support') setActiveModal('support');
    if (label === 'Language') setActiveModal('language');
    if (label === 'Orari') setActiveModal('orari');
    if (label === 'EmployeeServices') {
      fetchEmployeeServicesData();
      setActiveModal('employeeServices');
    }
    if (label === 'EmployeeSchedule') {
      fetchEmployeeSchedule();
      setActiveModal('employeeSchedule');
    }
  };

  if (!user) {
    return (
      <View className="flex-1 bg-white">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <Animated.View entering={FadeInUp} className="items-center mb-10">
             <View className="w-20 h-20 bg-[#3473ef]/10 rounded-3xl items-center justify-center mb-6">
                <Store size={40} color="#3473ef" />
             </View>
             <Text className="text-3xl font-black text-[#161719] text-center">Kyçja e Biznesit</Text>
             <Text className="text-slate-400 font-bold text-center mt-2">Menaxho sallonin tënd me LineUp</Text>
          </Animated.View>
          <View className="gap-y-4">
             {errorMessage !== "" && (
               <View className="bg-rose-50 p-4 rounded-2xl border border-rose-100 mb-2">
                 <Text className="text-rose-600 font-bold text-xs text-center">{errorMessage}</Text>
               </View>
             )}
             <View className="bg-slate-50 rounded-2xl px-4 h-16 flex-row items-center border border-slate-100">
                <Mail size={20} color="#94A3B8" />
                <TextInput placeholder="Email" value={authEmail} onChangeText={setAuthEmail} className="flex-1 ml-3 font-bold text-[#161719]" placeholderTextColor="#CBD5E1" />
             </View>
             <View className="bg-slate-50 rounded-2xl px-4 h-16 flex-row items-center border border-slate-100">
                <Lock size={20} color="#94A3B8" />
                <TextInput placeholder="Fjalëkalimi" value={authPassword} onChangeText={setAuthPassword} secureTextEntry={!showPassword} className="flex-1 ml-3 font-bold text-[#161719]" placeholderTextColor="#CBD5E1" />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                   {showPassword ? <EyeOff size={20} color="#94A3B8" /> : <Eye size={20} color="#94A3B8" />}
                </TouchableOpacity>
             </View>
             <TouchableOpacity onPress={handleAuthSubmit} disabled={loading} className="bg-[#161719] h-16 rounded-2xl items-center justify-center mt-4 shadow-xl shadow-black/20">
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">Kyçu</Text>}
             </TouchableOpacity>
             <TouchableOpacity onPress={() => setShowRegisterModal(true)} className="items-center py-4">
                <Text className="text-[#3473ef] font-black">Nuk keni llogari? Regjistroni dyqanin</Text>
             </TouchableOpacity>
          </View>
        </ScrollView>
        <Modal visible={showRegisterModal} animationType="slide">
          <RegisterScreen onClose={() => setShowRegisterModal(false)} onSuccess={(u) => { setShowRegisterModal(false); onLogin(u); }} />
        </Modal>
      </View>
    );
  }

  const isBusinessRole = user?.role === 'owner' || user?.role === 'barber' || user?.role === 'employee';

  return (
    <View className="flex-1 bg-[#ECEEF2]">
      {/* Background Decorative Blobs */}
      <View className="absolute top-[-50] left-[-50] w-64 h-64 bg-[#3473ef]/15 rounded-full blur-3xl" />
      <View className="absolute top-[200] right-[-100] w-80 h-80 bg-[#f47458]/15 rounded-full blur-3xl" />

      {/* ── HEADER ───────────────────────────── */}
      <View className="pt-16 pb-12 px-8 bg-white/40 rounded-b-[50px] relative overflow-hidden">
        <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        <Animated.View entering={FadeInDown} className="flex-row items-center">
          <View className="relative">
            <View className="w-24 h-24 rounded-[32px] bg-[#161719] items-center justify-center shadow-lg">
              <Text className="text-white text-4xl font-black">{user.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <View className="absolute bottom-[-4] right-[-4] w-8 h-8 bg-[#3473ef] rounded-2xl items-center justify-center border-white shadow-sm">
               <Award size={14} color="white" strokeWidth={2.5} />
            </View>
          </View>
          <View className="ml-6 flex-1">
            <Text className="text-slate-400 font-black text-[10px] uppercase tracking-[2px] mb-1">
              {user.role === 'owner' ? 'Pronar i Biznesit' : user.role === 'barber' ? 'Berber' : user.role === 'super_admin' ? 'Super Admin' : 'Klient'}
            </Text>
            <Text className="text-3xl font-black text-[#161719] tracking-tight mb-1">{user.name}</Text>
            <View className="flex-row items-center bg-indigo-50 px-2.5 py-1 rounded-full self-start">
               <CheckCircle2 size={12} color="#3473ef" strokeWidth={3} />
               <Text className="text-[#3473ef] font-black text-[10px] ml-1.5 uppercase">Partner i Verifikuar</Text>
            </View>
          </View>
        </Animated.View>

        <View className="flex-row justify-between mt-10 px-2">
           <View className="items-center">
              <Text className="text-2xl font-black text-[#161719]">{profileStats.appointmentsCount}</Text>
              <Text className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">Rezervime</Text>
           </View>
           <View className="w-[1px] h-8 bg-slate-200 self-center" />
           <View className="items-center">
              <Text className="text-2xl font-black text-[#161719]">{profileStats.staffCount}</Text>
              <Text className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">Staf</Text>
           </View>
           <View className="w-[1px] h-8 bg-slate-200 self-center" />
           <View className="items-center">
              <View className="flex-row items-center">
                <Text className="text-2xl font-black text-[#161719]">{profileStats.favoritesCount}</Text>
                <View className="ml-1 mb-1">
                  <Heart size={14} color="#ef4444" fill="#ef4444" />
                </View>
              </View>
              <Text className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">Të Ruajtura</Text>
           </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-6 pt-10">
           <Text className="text-slate-400 font-black text-[11px] uppercase tracking-[2px] mb-4 ml-2">Personal</Text>
           <View className="bg-white/40 rounded-[32px] overflow-hidden shadow-sm">
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
              <ProfileMenuButton icon={User} label="Profili im" onPress={() => handleAction('Profile')} />
              
              {user.role === 'employee' ? (
                <>
                  <ProfileMenuButton icon={FileText} label="Lista e Shërbimeve" onPress={() => handleAction('EmployeeServices')} />
                  <ProfileMenuButton icon={Clock} label="Organizimi i Orarit" onPress={() => handleAction('EmployeeSchedule')} />
                  <ProfileMenuButton icon={Settings} label="Cilësimet" isLast onPress={() => handleAction('Settings')} />
                </>
              ) : (
                <>
                  {isBusinessRole && (
                    <ProfileMenuButton icon={Clock} label="Orari & Festat" onPress={() => handleAction('Orari')} />
                  )}
                  <ProfileMenuButton
                    icon={PlansIcon}
                    label="Planet e Abonimit"
                    rightElement={
                      <View className="flex-row items-center">
                        <View className="bg-emerald-500/10 px-3 py-1 rounded-full mr-2">
                           <Text className="text-emerald-600 font-black text-[10px] uppercase">{currentPlan || 'Solo'}</Text>
                        </View>
                        <ChevronRight size={18} color="#94A3B8" />
                      </View>
                    }
                    onPress={() => handleAction('Plans')}
                  />
                  <ProfileMenuButton icon={Heart} label="Të Ruajtura" onPress={() => handleAction('Favorites')} />
                  <ProfileMenuButton icon={MessageSquare} label="Mesazhet" onPress={() => handleAction('Messages')} />
                  <ProfileMenuButton icon={Calendar} label="Rezervimet e Mia" onPress={() => handleAction('Appointments')} />
                  <ProfileMenuButton icon={FileText} label="Formularët" onPress={() => handleAction('Forms')} />
                  <ProfileMenuButton icon={Settings} label="Cilësimet" isLast={!isBusinessRole} onPress={() => handleAction('Settings')} />
                </>
              )}
           </View>

           {user.role !== 'employee' && (
             <>
               <Text className="text-slate-400 font-black text-[11px] uppercase tracking-[2px] mt-10 mb-4 ml-2">Suporti & Detajet</Text>
               <View className="bg-white/40 rounded-[32px] overflow-hidden shadow-sm">
                  <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                  <ProfileMenuButton icon={Headphones} label="Suporti" onPress={() => handleAction('Support')} />
                  <ProfileMenuButton
                    icon={Globe}
                    label="Shqip (Kosovë)"
                    isLast
                    rightElement={<ChevronRight size={18} color="#94A3B8" />}
                    onPress={() => handleAction('Language')}
                  />
               </View>
             </>
           )}

           <TouchableOpacity
            onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); onLogout(); }}
            activeOpacity={0.8}
            className="mt-10 mb-8 bg-[#161719] h-16 rounded-[24px] flex-row items-center justify-center shadow-xl shadow-black/20"
           >
              <LogOut size={20} color="white" className="mr-3" />
              <Text className="text-white font-black text-base">Dil</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── SHARED MODAL COMPONENT ── */}
      <Modal visible={activeModal !== null} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/60 justify-end">
           <TouchableOpacity activeOpacity={1} onPress={() => setActiveModal(null)} className="absolute inset-0" />
           <Animated.View entering={FadeInUp} className="bg-[#F8FAFC] rounded-t-[50px] p-8 pb-12 h-[90%]">
              <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mb-8" />

              {activeModal === 'profile' && (
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-10">
                    <Text className="text-3xl font-black text-[#161719]">Ndrysho Profilin</Text>
                    <TouchableOpacity onPress={() => setActiveModal(null)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm"><X size={24} color="#161719" /></TouchableOpacity>
                  </View>
                  <View className="gap-y-6">
                    <View>
                      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Emri i plotë</Text>
                      <TextInput value={editData.name} onChangeText={(val) => setEditData({...editData, name: val})} className="bg-white h-14 rounded-2xl px-5 font-bold border border-slate-100" />
                    </View>
                    <View>
                      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Numri i Telefonit</Text>
                      <TextInput value={editData.phone} onChangeText={(val) => setEditData({...editData, phone: val})} placeholder="+383 4X XXX XXX" className="bg-white h-14 rounded-2xl px-5 font-bold border border-slate-100" />
                    </View>
                    <TouchableOpacity onPress={handleUpdateProfile} className="bg-[#3473ef] h-16 rounded-2xl items-center justify-center shadow-lg shadow-blue-200 mt-4">
                      {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">Ruaj Ndryshimet</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {activeModal === 'plans' && (
                <View className="flex-1">
                   <View className="flex-row justify-between items-center mb-10">
                    <Text className="text-3xl font-black text-[#161719]">Abonimet</Text>
                    <TouchableOpacity onPress={() => setActiveModal(null)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm"><X size={24} color="#161719" /></TouchableOpacity>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="gap-y-6">
                      {REGISTRATION_PLANS.map((plan) => {
                        const isTeam = plan.id === 'team';
                        const displayPrice = isTeam ? `${calculateTeamPrice(teamEmployeeCount)}€` : plan.price;
                        const displayEmployees = isTeam ? `${teamEmployeeCount} berberë` : plan.employees;

                        return (
                          <View key={plan.id} className={`bg-white p-6 rounded-[32px] shadow-sm border ${currentPlan === plan.id ? 'border-[#3473ef]' : 'border-transparent'}`}>
                            <View className="flex-row justify-between items-center mb-4">
                              <View>
                                <Text className="text-xl font-black text-[#161719]">{plan.name}</Text>
                                {isTeam ? (
                                  <View className="flex-row items-center gap-2 mt-1">
                                    <TouchableOpacity
                                      onPress={() => setTeamEmployeeCount(prev => Math.max(3, prev - 1))}
                                      className="w-6 h-6 bg-slate-100 rounded-md items-center justify-center"
                                    >
                                      <Text className="font-black text-xs">-</Text>
                                    </TouchableOpacity>
                                    <Text className="text-[#161719] font-bold text-xs">{teamEmployeeCount} berberë</Text>
                                    <TouchableOpacity
                                      onPress={() => setTeamEmployeeCount(prev => prev + 1)}
                                      className="w-6 h-6 bg-slate-100 rounded-md items-center justify-center"
                                    >
                                      <Text className="font-black text-xs">+</Text>
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <Text className="text-slate-400 font-bold text-xs">{plan.employees}</Text>
                                )}
                              </View>
                              <View className="items-end">
                                <Text className="text-2xl font-black text-[#3473ef]">{displayPrice}</Text>
                                <Text className="text-slate-300 font-bold text-[9px] uppercase">/muaj</Text>
                              </View>
                            </View>
                            <View className="bg-slate-50 p-4 rounded-2xl mb-6">
                              {plan.features.map((f, i) => (<View key={i} className="flex-row items-center mb-2"><CheckCircle2 size={14} color="#10b981" strokeWidth={3} /><Text className="text-slate-600 font-bold text-xs ml-2">{f}</Text></View>))}
                            </View>
                            <TouchableOpacity
                              disabled={currentPlan === plan.id}
                              onPress={() => {
                                setCurrentPlan(plan.id);
                                Alert.alert("Sukses", `Plani u ndryshua në ${plan.name} (${displayEmployees}).`);
                              }}
                              className={`h-14 rounded-2xl items-center justify-center ${currentPlan === plan.id ? 'bg-slate-100' : 'bg-[#161719]'}`}
                            >
                              <Text className={`font-black text-sm ${currentPlan === plan.id ? 'text-slate-400' : 'text-white'}`}>{currentPlan === plan.id ? 'Plani Aktiv' : 'Zgjidh Planin'}</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}

              {activeModal === 'favorites' && (
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-8">
                    <Text className="text-3xl font-black text-[#161719]">Të Ruajtura</Text>
                    <TouchableOpacity onPress={() => setActiveModal(null)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm"><X size={24} color="#161719" /></TouchableOpacity>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {dbFavorites.length > 0 ? dbFavorites.map((fav, i) => {
                      if (isBusinessRole) {
                        return (
                          <View key={i} className="bg-white p-5 rounded-[28px] flex-row items-center mb-4 border border-slate-100 shadow-sm">
                            <View className="w-12 h-12 rounded-2xl bg-indigo-50 items-center justify-center">
                              <User size={24} color="#6366f1" />
                            </View>
                            <View className="flex-1 ml-4">
                               <Text className="font-black text-[#161719] text-base">{fav.users?.name || 'Klient i LineUp'}</Text>
                               <Text className="text-slate-400 font-bold text-xs">{fav.users?.email}</Text>
                               {fav.users?.phone && <Text className="text-slate-400 font-bold text-[10px] mt-0.5">{fav.users?.phone}</Text>}
                            </View>
                            <View className="p-3 bg-indigo-50/50 rounded-full">
                              <Heart size={18} color="#6366f1" fill="#6366f1" />
                            </View>
                          </View>
                        );
                      }
                      
                      return (
                        <View key={i} className="bg-white p-4 rounded-[28px] flex-row items-center mb-4 border border-slate-100 shadow-sm">
                          <Image source={{ uri: fav.barbershops?.image_url || 'https://via.placeholder.com/100' }} className="w-16 h-16 rounded-2xl bg-slate-50" />
                          <View className="flex-1 ml-4">
                             <Text className="font-black text-[#161719] text-base">{fav.barbershops?.name}</Text>
                             <Text className="text-slate-400 font-bold text-xs">{fav.barbershops?.city}</Text>
                          </View>
                          <TouchableOpacity className="p-3 bg-rose-50 rounded-full"><Heart size={18} color="#ef4444" fill="#ef4444" /></TouchableOpacity>
                        </View>
                      );
                    }) : (
                      <View className="items-center justify-center py-20">
                         <Heart size={64} color="#CBD5E1" strokeWidth={1} />
                         <Text className="text-slate-400 font-bold mt-4">
                           {isBusinessRole ? 'Salloni juaj nuk ka ende asnjë favorit.' : 'Nuk keni asnjë sallon të ruajtur.'}
                         </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}

              {activeModal === 'forms' && (
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3">
                        <FileText size={22} color="#6366f1" />
                      </View>
                      <View>
                        <Text className="text-2xl font-black text-[#161719]">Sugerime për Sistemin</Text>
                        <Text className="text-slate-400 font-bold text-xs">Na ndihmoni ta avancojmë LineUp</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setActiveModal(null)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm">
                      <X size={24} color="#161719" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    <View className="gap-y-6">
                      <View>
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Subjekti / Titulli</Text>
                        <TextInput 
                          value={feedbackSubject} 
                          onChangeText={setFeedbackSubject} 
                          placeholder="p.sh. Opsion i ri për rezervime, etj." 
                          className="bg-white h-14 rounded-2xl px-5 font-bold border border-slate-100" 
                        />
                      </View>
                      <View>
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sugjerimi juaj për avancim</Text>
                        <TextInput 
                          value={feedbackContent} 
                          onChangeText={setFeedbackContent} 
                          multiline 
                          numberOfLines={6} 
                          placeholder="Përshkruani këtu këshillën ose idenë tuaj për përmirësimin e sistemit..." 
                          className="bg-white h-40 rounded-2xl px-5 py-4 font-bold border border-slate-100 text-left align-top"
                          style={{ textAlignVertical: 'top' }}
                        />
                      </View>
                      <TouchableOpacity 
                        onPress={handleSubmitFeedback} 
                        disabled={sendingFeedback} 
                        className="bg-[#3473ef] h-16 rounded-2xl items-center justify-center shadow-lg shadow-blue-200 mt-4"
                      >
                        {sendingFeedback ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">Dërgo Sugjerimin</Text>}
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              )}

              {activeModal === 'messages' && (
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-8">
                    <Text className="text-3xl font-black text-[#161719]">Mesazhet</Text>
                    <TouchableOpacity onPress={() => setActiveModal(null)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm"><X size={24} color="#161719" /></TouchableOpacity>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="bg-indigo-50 p-5 rounded-[28px] border border-indigo-100 mb-4">
                       <View className="flex-row items-center mb-2">
                          <Info size={16} color="#3473ef" />
                          <Text className="text-[#3473ef] font-black text-xs uppercase ml-2">Update Sistemi</Text>
                       </View>
                       <Text className="text-[#161719] font-black text-base leading-5">Mirësevini në versionin e ri të LineUp 2.0!</Text>
                       <Text className="text-slate-500 font-bold text-xs mt-2">Kemi shtuar panelin e ri të menaxhimit dhe performancë më të lartë.</Text>
                    </View>
                  </ScrollView>
                </View>
              )}

              {activeModal === 'appointments' && (
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-8">
                    <Text className="text-3xl font-black text-[#161719]">Rezervimet</Text>
                    <TouchableOpacity onPress={() => setActiveModal(null)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm"><X size={24} color="#161719" /></TouchableOpacity>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="gap-y-4">
                      {dbAppointments.length > 0 ? dbAppointments.map((appt, i) => (
                        <View key={i} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
                           <View className="flex-row justify-between mb-3">
                              <Text className="font-black text-[#161719] text-base">{appt.users?.name || 'Klient'}</Text>
                              <Text className="text-[#3473ef] font-black">{appt.price}€</Text>
                           </View>
                           <View className="flex-row items-center">
                              <Calendar size={12} color="#8789A3" />
                              <Text className="text-[#8789A3] font-bold text-xs ml-2">{appt.date} • {appt.time}</Text>
                           </View>
                           <View className="mt-4 pt-4 border-t border-slate-50 flex-row justify-between items-center">
                              <View className="bg-slate-100 px-3 py-1 rounded-full"><Text className="text-slate-500 font-black text-[10px] uppercase">{appt.service}</Text></View>
                              <View className={`px-3 py-1 rounded-full ${appt.status === 'confirmed' ? 'bg-emerald-50' : 'bg-amber-50'}`}><Text className={`font-black text-[10px] uppercase ${appt.status === 'confirmed' ? 'text-emerald-500' : 'text-amber-500'}`}>{appt.status}</Text></View>
                           </View>
                        </View>
                      )) : (
                        <View className="items-center justify-center py-20"><Calendar size={64} color="#CBD5E1" strokeWidth={1} /><Text className="text-slate-400 font-bold mt-4">Nuk keni rezervime aktive.</Text></View>
                      )}
                    </View>
                  </ScrollView>
                </View>
              )}

              {activeModal === 'settings' && (
                <View className="flex-1">
                  <View className="flex-row items-center mb-8">
                    {settingsView !== 'main' && <TouchableOpacity onPress={() => setSettingsIndex('main')} className="mr-4"><ChevronLeft size={24} color="#161719" /></TouchableOpacity>}
                    <Text className="text-3xl font-black text-[#161719]">{settingsView === 'main' ? 'Cilësimet' : settingsView === 'notifications' ? 'Njoftimet' : settingsView === 'password' ? 'Fjalëkalimi' : 'Legal'}</Text>
                    <View className="flex-1" />
                    <TouchableOpacity onPress={() => setActiveModal(null)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm"><X size={24} color="#161719" /></TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {settingsView === 'main' && (
                      <View className="gap-y-4">
                        <TouchableOpacity onPress={() => setSettingsIndex('notifications')} className="bg-white h-16 rounded-[24px] px-6 flex-row items-center justify-between shadow-sm"><View className="flex-row items-center"><Bell size={20} color="#161719" /><Text className="font-black text-sm ml-4">Cilësimet e Njoftimeve</Text></View><ChevronRight size={18} color="#CBD5E1" /></TouchableOpacity>
                        <TouchableOpacity onPress={() => setSettingsIndex('password')} className="bg-white h-16 rounded-[24px] px-6 flex-row items-center justify-between shadow-sm"><View className="flex-row items-center"><Lock size={20} color="#161719" /><Text className="font-black text-sm ml-4">Ndrysho Fjalëkalimin</Text></View><ChevronRight size={18} color="#CBD5E1" /></TouchableOpacity>
                        <TouchableOpacity onPress={() => {setSettingsIndex('legal'); setLegalType('privacy');}} className="bg-white h-16 rounded-[24px] px-6 flex-row items-center justify-between shadow-sm"><View className="flex-row items-center"><Shield size={20} color="#161719" /><Text className="font-black text-sm ml-4">Politika e Privatësisë</Text></View><ChevronRight size={18} color="#CBD5E1" /></TouchableOpacity>
                        <TouchableOpacity onPress={() => {setSettingsIndex('legal'); setLegalType('terms');}} className="bg-white h-16 rounded-[24px] px-6 flex-row items-center justify-between shadow-sm"><View className="flex-row items-center"><FileText size={20} color="#161719" /><Text className="font-black text-sm ml-4">Kushtet e Shërbimit</Text></View><ChevronRight size={18} color="#CBD5E1" /></TouchableOpacity>

                        <TouchableOpacity onPress={handleDeleteAccount} className="mt-10 h-16 rounded-[24px] bg-rose-50 flex-row items-center justify-center border border-rose-100"><Trash2 size={20} color="#ef4444" /><Text className="text-[#ef4444] font-black ml-2 uppercase tracking-widest text-xs">Fshi Llogarinë</Text></TouchableOpacity>
                      </View>
                    )}

                    {settingsView === 'notifications' && (
                      <View className="gap-y-6">
                        <View className="flex-row items-center justify-between bg-white p-6 rounded-[28px]"><View><Text className="font-black text-[#161719]">Njoftimet për Rezervime</Text><Text className="text-slate-400 font-bold text-xs mt-1">Kur dikush rezervon ose anulon</Text></View><Switch value={true} /></View>
                        <View className="flex-row items-center justify-between bg-white p-6 rounded-[28px]"><View><Text className="font-black text-[#161719]">Njoftimet për të Ruajtura</Text><Text className="text-slate-400 font-bold text-xs mt-1">Kur dikush ruan sallonin tuaj</Text></View><Switch value={true} /></View>
                        <View className="flex-row items-center justify-between bg-white p-6 rounded-[28px]"><View><Text className="font-black text-[#161719]">Përditësimet e Sistemit</Text><Text className="text-slate-400 font-bold text-xs mt-1">Lajme dhe rregullime të rëndësishme</Text></View><Switch value={true} /></View>
                      </View>
                    )}

                    {settingsView === 'password' && (
                      <View className="gap-y-6">
                        <View><Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email (Llogaria)</Text><TextInput value={user.email} editable={false} className="bg-slate-100 h-14 rounded-2xl px-5 font-bold text-slate-400" /></View>
                        <View><Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fjalëkalimi i Ri</Text><TextInput secureTextEntry placeholder="••••••••" className="bg-white h-14 rounded-2xl px-5 font-bold border border-slate-100" /></View>
                        <View><Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Konfirmo Fjalëkalimin</Text><TextInput secureTextEntry placeholder="••••••••" className="bg-white h-14 rounded-2xl px-5 font-bold border border-slate-100" /></View>
                        <TouchableOpacity className="bg-black h-16 rounded-2xl items-center justify-center mt-4"><Text className="text-white font-black text-lg">Ndrysho Fjalëkalimin</Text></TouchableOpacity>
                      </View>
                    )}

                    {settingsView === 'legal' && (
                      <View className="bg-white p-6 rounded-[32px] shadow-sm">
                        <Text className="font-black text-lg text-[#161719] mb-4">{legalType === 'privacy' ? 'Politika e Privatësisë' : 'Kushtet e Shërbimit'}</Text>
                        <Text className="text-slate-500 font-bold leading-6">LineUp respekton privatësinë tuaj. Të dhënat tuaja përdoren vetëm për të siguruar mbarëvajtjen e rezervimeve dhe për të përmirësuar eksperiencën tuaj në aplikacion. Ne nuk i shesim të dhënat tuaja tek palët e treta.</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}

              {activeModal === 'support' && (
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-8">
                    <Text className="text-3xl font-black text-[#161719]">Suporti</Text>
                    <TouchableOpacity onPress={() => setActiveModal(null)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm"><X size={24} color="#161719" /></TouchableOpacity>
                  </View>
                  <View className="gap-y-6">
                    <View className="bg-blue-50 p-6 rounded-[28px] border border-blue-100 flex-row items-center"><Headphones size={24} color="#3473ef" /><View className="ml-4"><Text className="font-black text-[#161719]">Na Kontaktoni</Text><Text className="text-slate-400 font-bold text-xs mt-0.5">Përgjigje brenda 24 orëve</Text></View></View>
                    <View><Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Subjekti</Text><TextInput placeholder="Psh. Problem me pagesë" className="bg-white h-14 rounded-2xl px-5 font-bold border border-slate-100" /></View>
                    <View><Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mesazhi</Text><TextInput multiline numberOfLines={5} placeholder="Shkruani mesazhin tuaj këtu..." className="bg-white h-32 rounded-2xl px-5 py-4 font-bold border border-slate-100" /></View>
                    <TouchableOpacity onPress={() => { Alert.alert("Dërguar", "Mesazhi juaj u dërgua me sukses përmes Brevo."); setActiveModal(null); }} className="bg-[#3473ef] h-16 rounded-2xl items-center justify-center shadow-lg shadow-blue-200 mt-4"><Text className="text-white font-black text-lg">Dërgo Mesazhin</Text></TouchableOpacity>
                  </View>
                </View>
              )}

              {activeModal === 'language' && (
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-8">
                    <Text className="text-3xl font-black text-[#161719]">Gjuha</Text>
                    <TouchableOpacity onPress={() => setActiveModal(null)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm"><X size={24} color="#161719" /></TouchableOpacity>
                  </View>
                  <View className="gap-y-4">
                    {['Shqip (Kosovë)', 'English (United States)', 'Deutsch (Deutschland)'].map((lang, idx) => (
                      <TouchableOpacity key={idx} onPress={() => { Alert.alert("Ndryshuar", `Gjuha u ndryshua në ${lang}`); setActiveModal(null); }} className={`h-16 rounded-2xl px-6 flex-row items-center justify-between ${idx === 0 ? 'bg-indigo-50 border border-indigo-100' : 'bg-white border border-slate-100'}`}>
                        <Text className={`font-black ${idx === 0 ? 'text-[#3473ef]' : 'text-[#161719]'}`}>{lang}</Text>
                        {idx === 0 && <CheckCircle2 size={20} color="#3473ef" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {activeModal === 'orari' && (
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3">
                        <Clock size={22} color="#6366f1" />
                      </View>
                      <View>
                        <Text className="text-2xl font-black text-[#161719]">Orari & Festat</Text>
                        <Text className="text-slate-400 font-bold text-xs">Përcakto orët e punës dhe shiko festat</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setActiveModal(null)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm">
                      <X size={24} color="#161719" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                    <View className="mb-8">
                      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Orari i Sallonit</Text>
                      <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                        {['E Hënë', 'E Martë', 'E Mërkurë', 'E Enjte', 'E Premte', 'E Shtunë', 'E Diel'].map((day, idx) => {
                          const daySched = shopSchedule.find(s => s.day_of_week === idx) || { is_closed: idx === 6, start_time: '09:00', end_time: '18:00' };
                          return (
                            <View key={idx} className={`flex-row items-center py-4 ${idx < 6 ? 'border-b border-slate-50' : ''}`}>
                              <Text className="flex-1 font-black text-[#161719] text-sm">{day}</Text>
                              <View className="flex-row items-center gap-3">
                                {!daySched.is_closed ? (
                                  <View className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                    <Text className="font-bold text-[#161719] text-[10px]">{daySched.start_time} - {daySched.end_time}</Text>
                                  </View>
                                ) : (
                                  <Text className="text-rose-500 font-black text-[10px] uppercase mr-2">Mbyllur</Text>
                                )}
                                <Switch 
                                  value={!daySched.is_closed} 
                                  onValueChange={() => toggleDaySchedule(idx, daySched.is_closed)}
                                  trackColor={{ false: '#e2e8f0', true: '#3473ef' }} 
                                />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    <View className="mb-6">
                      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Festat Zyrtare 2026 (Kosova)</Text>
                      <View className="bg-white rounded-[32px] p-2 shadow-sm border border-slate-100">
                         {KOSOVO_HOLIDAYS_2026.map((h, i) => (
                           <View key={i} className={`flex-row items-center p-5 ${i < KOSOVO_HOLIDAYS_2026.length - 1 ? 'border-b border-slate-50' : ''}`}>
                              <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center mr-4">
                                <Text className="text-2xl">{h.icon}</Text>
                              </View>
                              <View className="flex-1">
                                <Text className="font-black text-[#161719] text-base">{h.name}</Text>
                                <Text className="text-[#3473ef] font-black text-[10px] uppercase tracking-wider mt-1">{h.date}</Text>
                              </View>
                              <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center">
                                <CheckCircle2 size={14} color="#10b981" />
                              </View>
                           </View>
                         ))}
                      </View>
                    </View>
                  </ScrollView>
                </View>
              )}

              {activeModal === 'employeeServices' && (
                 <View className="flex-1">
                   <View className="flex-row justify-between items-center mb-6">
                     <View className="flex-row items-center">
                       <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3">
                         <FileText size={22} color="#6366f1" />
                       </View>
                       <View>
                         <Text className="text-2xl font-black text-[#161719]">Lista e Shërbimeve</Text>
                         <Text className="text-slate-400 font-bold text-xs">Cilët shërbime ofroni në sallon</Text>
                       </View>
                     </View>
                     <TouchableOpacity onPress={() => setActiveModal(null)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm">
                       <X size={24} color="#161719" />
                     </TouchableOpacity>
                   </View>

                   <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                     {categories.map((cat) => {
                       const catSubs = subcategories.filter(s => s.category_id === cat.id);
                       if (catSubs.length === 0) return null;
                       
                       return (
                         <View key={cat.id} className="mb-6">
                           <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">{cat.name}</Text>
                           <View className="bg-white rounded-[32px] p-2 shadow-sm border border-slate-100">
                             {catSubs.map((sub, idx) => {
                               const isChecked = selectedEmployeeSubcats.includes(sub.id);
                               return (
                                 <TouchableOpacity 
                                   key={sub.id} 
                                   onPress={() => toggleEmployeeService(sub.id)}
                                   className={`flex-row items-center p-4 ${idx < catSubs.length - 1 ? 'border-b border-slate-50' : ''}`}
                                 >
                                   <Text className="flex-1 font-bold text-[#161719] text-sm">{sub.name}</Text>
                                   <View className={`w-6 h-6 rounded-full border items-center justify-center ${isChecked ? 'bg-[#3473ef] border-[#3473ef]' : 'border-slate-200'}`}>
                                     {isChecked && <CheckCircle2 size={14} color="white" />}
                                   </View>
                                 </TouchableOpacity>
                               );
                             })}
                           </View>
                         </View>
                       );
                     })}
                   </ScrollView>
                 </View>
               )}

               {activeModal === 'employeeSchedule' && (
                 <View className="flex-1">
                   <View className="flex-row justify-between items-center mb-6">
                     <View className="flex-row items-center">
                       <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3">
                         <Clock size={22} color="#6366f1" />
                       </View>
                       <View>
                         <Text className="text-2xl font-black text-[#161719]">Organizimi i Orarit</Text>
                         <Text className="text-slate-400 font-bold text-xs">Përcakto orët e punës suaj</Text>
                       </View>
                     </View>
                     <TouchableOpacity onPress={() => setActiveModal(null)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm">
                       <X size={24} color="#161719" />
                     </TouchableOpacity>
                   </View>

                   <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                     <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 mb-6">
                       {employeeSchedule.map((sched, idx) => (
                         <View key={idx} className={`py-4 ${idx < 6 ? 'border-b border-slate-50' : ''}`}>
                           <View className="flex-row items-center justify-between">
                             <Text className="font-black text-[#161719] text-sm">{sched.day}</Text>
                             <Switch 
                               value={sched.is_working} 
                               onValueChange={(val) => {
                                 const updated = [...employeeSchedule];
                                 updated[idx].is_working = val;
                                 setEmployeeSchedule(updated);
                               }}
                               trackColor={{ false: '#e2e8f0', true: '#3473ef' }} 
                             />
                           </View>
                           {sched.is_working && (
                             <View className="flex-row items-center gap-x-3 mt-3">
                               <View className="flex-1">
                                 <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nga</Text>
                                 <TextInput 
                                   value={sched.start_time} 
                                   onChangeText={(val) => {
                                     const updated = [...employeeSchedule];
                                     updated[idx].start_time = val;
                                     setEmployeeSchedule(updated);
                                   }}
                                   placeholder="09:00"
                                   className="bg-slate-50 h-10 rounded-xl px-3 font-bold border border-slate-100 text-center text-[#161719]" 
                                 />
                               </View>
                               <View className="flex-1">
                                 <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Deri</Text>
                                 <TextInput 
                                   value={sched.end_time} 
                                   onChangeText={(val) => {
                                     const updated = [...employeeSchedule];
                                     updated[idx].end_time = val;
                                     setEmployeeSchedule(updated);
                                   }}
                                   placeholder="17:00"
                                   className="bg-slate-50 h-10 rounded-xl px-3 font-bold border border-slate-100 text-center text-[#161719]" 
                                 />
                               </View>
                             </View>
                           )}
                         </View>
                       ))}
                     </View>

                     <TouchableOpacity 
                       onPress={() => saveEmployeeSchedule()} 
                       disabled={savingSchedule} 
                       className="bg-[#3473ef] h-16 rounded-[24px] items-center justify-center shadow-lg shadow-blue-200 mb-6"
                     >
                       {savingSchedule ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">Ruaj Orarin</Text>}
                     </TouchableOpacity>
                   </ScrollView>
                 </View>
               )}

           </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const ProfileMenuButton = ({ icon: Icon, label, isLast, onPress, rightElement }: any) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className={`flex-row items-center px-6 py-5 ${!isLast ? 'border-b border-white/20' : ''}`}
  >
    <View className="w-11 h-11 rounded-2xl bg-white/80 items-center justify-center mr-4 shadow-sm shadow-slate-100">
      <Icon size={20} color="#161719" strokeWidth={2.5} />
    </View>
    <Text className="flex-1 text-[#161719] font-black text-[15px]">{label}</Text>
    {rightElement || <ChevronRight size={18} color="#94A3B8" />}
  </TouchableOpacity>
);
