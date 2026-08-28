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
  Check,
  Users,
  TrendingUp,
  X,
  Star,
  UserPlus,
  Crown,
  Phone,
  Info,
  Trash2,
  ChevronLeft,
  ChevronDown,
  Briefcase,
  AlertTriangle,
  AlertCircle,
  Clock,
  Flag,
  DollarSign,
  RefreshCw
} from "lucide-react-native";
import Animated, { FadeInUp, FadeInDown, useAnimatedStyle, withSpring, useSharedValue, SlideInRight } from "react-native-reanimated";
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/config/supabase";
import { RegisterScreen } from "./RegisterScreen";
import { PaddleCheckout } from "../components/PaddleCheckout";
import { createPaddleTransaction, PADDLE_CONFIG } from "../config/paddle";
import { deleteShopAssets } from "../utils/storage";
import { useSubscription } from "../hooks/useSubscription";
import { MobileAppDownloadCard } from "../components/MobileAppDownloadCard";

const { width, height } = Dimensions.get("window");

const REGISTRATION_PLANS = [
  {
    id: 'solo',
    name: 'Solo',
    prices: { month: '15€', year: '150€' },
    employees: '1 berber',
    desc: 'Ideale për berberët individualë',
    features: ['Deri në 300 rezervime/muaj', '1 profil stafi', 'Kalendari i rezervimeve', 'Njoftime me email'],
    paddlePriceId: { month: 'pri_01ky8dvrqajpvkqtcde7ge9fgb', year: 'pri_solo_yr' }
  },
  {
    id: 'duo',
    name: 'Duo',
    prices: { month: '20€', year: '200€' },
    employees: '2 berberë',
    desc: 'Për ekipe të vogla',
    features: ['Rezervime pa limit', '2 profile stafi', 'Njoftime me SMS & Email', 'Statistika & Raporte'],
    paddlePriceId: { month: 'pri_01ky8e821v11dc6f2nf9jnq5v8', year: 'pri_duo_yr' }
  },
  {
    id: 'team',
    name: 'Team',
    prices: { month: '25€+', year: '250€+' },
    employees: '3+ berberë',
    desc: 'Për ekipe në rritje',
    features: ['Gjithçka nga Duo', 'Staf pa limit', 'Marketing me SMS', 'Landing page e personalizuar'],
    paddlePriceId: { month: 'pri_01ky8eh6v1h2snktvp7v6k8yx0', year: 'pri_team_yr' }
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
  favorites?: any[];
  onToggleFavorite?: (shop: any) => void;
  onSelectShop?: (shop: any) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onLogin,
  onLogout,
  onOpenRegisterShop,
  favorites = [],
  onToggleFavorite,
  onSelectShop
}) => {
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

  // Upgrade & Billing State
  const [upgradeStep, setUpgradeStep] = useState(1); // 1: Select Plan, 2: Checkout
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<any>(null);
  const [upgradeTransactionId, setUpgradeTransactionId] = useState<string | null>(null);
  const [isPreparingUpgrade, setIsPreparingUpgrade] = useState(false);
  const [teamEmployeeCount, setTeamEmployeeCount] = useState(3);
  const [isUpdatingCard, setIsUpdatingCard] = useState(false);
  const [subView, setSubView] = useState<'main' | 'card'>('main');
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    holderName: ''
  });
  const [savingCard, setSavingCard] = useState(false);

  // Modal States
  const [activeModal, setActiveModal] = useState<string | null>(null); // 'profile', 'plans', 'favorites', 'messages', 'appointments', 'forms', 'settings', 'support', 'language', 'orari'
  const [settingsView, setSettingsIndex] = useState<'main' | 'notifications' | 'password' | 'legal'>('main');
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | 'use'>('privacy');

  const [realShopId, setRealShopId] = useState<string | null>(user?.shopId || null);
  const [shopSubcategories, setShopSubcategories] = useState<string[]>([]);
  const [shopOfferedServiceIds, setShopOfferedServiceIds] = useState<string[]>([]);
  const { subscription, loading: subLoading, isActivating, setIsActivating, refresh: refreshSub } = useSubscription(realShopId, user?.id);
  const [overrideCancelState, setOverrideCancelState] = useState<boolean | null>(null);
  const isCancelled = overrideCancelState !== null ? overrideCancelState : !!subscription?.cancel_at_period_end;

  const calculateTeamPrice = (count: number) => {
    return 25 + (Math.max(3, count) - 3) * 5;
  };

  // Edit Profile State
  const [editData, setEditData] = useState({
    name: user?.name || "",
    phone: "",
    bio: "",
    website: "",
    instagram: "",
    address: ""
  });

  // Notification Settings State
  const [notifSettings, setNotifSettings] = useState({
    bookings: true,
    favorites: true,
    system: true
  });

  // Change Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Database Data States
  const [dbFavorites, setDbFavorites] = useState<any[]>([]);
  const [dbMessages, setDbMessages] = useState<any[]>([]);
  const [dbAppointments, setDbAppointments] = useState<any[]>([]);
  const [dbForms, setDbForms] = useState<any[]>([]);

  // Feedback Form States
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);

  // Support Form States
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [sendingSupport, setSendingSupport] = useState(false);

  // Employee Service & Schedule States
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedEmployeeSubcats, setSelectedEmployeeSubcats] = useState<string[]>([]);
  const [serviceDurations, setServiceDurations] = useState<Record<string, number>>({});
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({});
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [hasLoadedServices, setHasLoadedServices] = useState(false);
  const [employeeSchedule, setEmployeeSchedule] = useState<any[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const fetchEmployeeServicesData = async () => {
    try {
      const { data: cats } = await supabase.from('categories').select('*').order('name');

      // 1. Fetch authorized services for this Barbershop from pivot table
      const { data: shopPivot } = await supabase
        .from('barbershop_services')
        .select('subcategory_id')
        .eq('barbershop_id', realShopId);

      const shopSubIds = (shopPivot || []).map(s => String(s.subcategory_id).trim());

      const { data: allSubs } = await supabase.from('subcategories').select('*').order('name');

      // 2. Identify authorized services for marking
      const authorizedIds = shopSubIds.length > 0
        ? shopSubIds
        : (shopSubcategories || []);

      setCategories(cats || []);
      setSubcategories(allSubs || []);
      setShopOfferedServiceIds(authorizedIds);

      if (!user?.id) return;

      const { data: myServices, error } = await supabase
        .from('barber_services')
        .select('*')
        .eq('barber_id', user.id);

      if (error) throw error;

      const subcatIds = myServices?.map(s => s.subcategory_id) || [];
      const durations: Record<string, number> = {};
      const prices: Record<string, number> = {};
      myServices?.forEach(s => {
        if (s.subcategory_id) {
          // Fallback to 30 if column duration_minutes doesn't exist yet
          durations[s.subcategory_id] = (s as any).duration_minutes || 30;
          prices[s.subcategory_id] = (s as any).price || 0;
        }
      });
      setSelectedEmployeeSubcats(subcatIds);
      setServiceDurations(durations);
      setServicePrices(prices);
      setHasLoadedServices(true);
    } catch (err) {
      console.warn("Error fetching employee services:", err);
    }
  };

  useEffect(() => {
    if (activeModal === 'employeeServices' && user?.id) {
      fetchEmployeeServicesData();
    }
  }, [activeModal, user?.id]);

  const updateServiceDuration = async (subcatId: string, durationMinutes: number) => {
    setServiceDurations(prev => ({ ...prev, [subcatId]: durationMinutes }));
    try {
      // We use a safe update that won't crash if the column is missing
      // (though it will still return an error from Supabase)
      const { error } = await supabase
        .from('barber_services')
        .update({ duration_minutes: durationMinutes } as any)
        .eq('barber_id', user.id)
        .eq('subcategory_id', subcatId);

      if (error) {
        console.warn("[Profile] Could not save duration. Did you add the column in Supabase?", error.message);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.error("[Profile] updateServiceDuration error:", e);
    }
  };

  const updateServicePrice = async (subcatId: string, price: number) => {
    setServicePrices(prev => ({ ...prev, [subcatId]: price }));
    try {
      const { error } = await supabase
        .from('barber_services')
        .update({ price: price } as any)
        .eq('barber_id', user.id)
        .eq('subcategory_id', subcatId);

      if (error) {
        console.warn("[Profile] Could not save price:", error.message);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.error("[Profile] updateServicePrice error:", e);
    }
  };

  const toggleEmployeeService = async (subcatId: string, defaultDuration: number = 30) => {
    // Check local state first for instant UI feedback
    const isCurrentlySelected = selectedEmployeeSubcats.includes(subcatId);
    const isShopService = shopOfferedServiceIds.includes(String(subcatId).trim());

    if (!isCurrentlySelected && !isShopService) {
      if (realShopId) {
        try {
          const subIdStr = String(subcatId).trim();
          // 1. Add to barbershop_services pivot table
          await supabase.from('barbershop_services').upsert({
            barbershop_id: realShopId,
            subcategory_id: subIdStr
          }, { onConflict: 'barbershop_id,subcategory_id' });

          // 2. Update barbershops subcategories array
          const updatedShopSubcats = Array.from(new Set([...shopOfferedServiceIds, subIdStr]));
          await supabase.from('barbershops').update({
            subcategories: updatedShopSubcats
          }).eq('id', realShopId);

          // 3. Update local state
          setShopOfferedServiceIds(updatedShopSubcats);
          setShopSubcategories(updatedShopSubcats);
        } catch (pivotErr) {
          console.warn("[Profile] Error auto-adding service to barbershop:", pivotErr);
        }
      }
    }

    try {
      if (isCurrentlySelected) {
        // Deselect: Remove from DB
        const { error } = await supabase
          .from('barber_services')
          .delete()
          .eq('barber_id', user.id)
          .eq('subcategory_id', subcatId);

        if (error) throw error;

        setSelectedEmployeeSubcats(prev => prev.filter(id => id !== subcatId));
      } else {
        // Select: Use UPSERT to handle potential existing records and avoid unique constraint error
        const currentDur = serviceDurations[subcatId] || defaultDuration;
        const currentPrice = servicePrices[subcatId] || 0;

        const insertData: any = {
          barber_id: user.id,
          subcategory_id: subcatId,
          duration_minutes: currentDur,
          price: currentPrice
        };

        // Try full upsert (with price and duration)
        const { error } = await supabase
          .from('barber_services')
          .upsert(insertData, { onConflict: 'barber_id,subcategory_id' });

        if (error) {
          console.warn("[Profile] First upsert attempt failed:", error.message);

          // Fallback 1: Try without 'price' if it's missing from DB
          if (error.message.includes('price')) {
            const { price, ...rest } = insertData;
            const { error: err2 } = await supabase
              .from('barber_services')
              .upsert(rest, { onConflict: 'barber_id,subcategory_id' });

            if (err2) throw err2;
          } else {
            throw error;
          }
        }

        if (!selectedEmployeeSubcats.includes(subcatId)) {
          setSelectedEmployeeSubcats(prev => [...prev, subcatId]);
        }
        if (!serviceDurations[subcatId]) {
          setServiceDurations(prev => ({ ...prev, [subcatId]: currentDur }));
        }
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err: any) {
      console.error("[Profile] toggleEmployeeService error:", err);

      if (err.code === '23503') {
        Alert.alert(
          "Llogaria nuk u gjet",
          "Profili juaj nuk u gjet në databazë. Duke u përpjekur ta rregullojmë...",
          [{ text: "Në rregull", onPress: () => fetchOwnerStats() }]
        );
      } else {
        Alert.alert("Gabim", "Dështoi përditësimi i shërbimit: " + err.message);
      }

      // Re-fetch to sync state with DB if error occurred
      fetchEmployeeServicesData();
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

  const handleSendSupportMessage = async () => {
    if (!supportSubject.trim() || !supportMessage.trim()) {
      Alert.alert("Gabim", "Ju lutem plotësoni subjektin dhe mesazhin.");
      return;
    }

    setSendingSupport(true);
    try {
      const { error } = await supabase.from('system_feedback').insert({
        user_id: user.id,
        subject: `SUPPORT: ${supportSubject.trim()}`,
        content: supportMessage.trim()
      });

      if (error) throw error;

      Alert.alert("Sukses! ✉️", "Mesazhi juaj u dërgua me sukses. Ekipi ynë do t'ju përgjigjet së shpejti.");
      setSupportSubject("");
      setSupportMessage("");
      setActiveModal(null);
    } catch (e: any) {
      console.error("[Profile] Support Message Error:", e);
      Alert.alert("Gabim", "Dështoi dërgimi i mesazhit: " + (e.message || "Provoni përsëri më vonë."));
    } finally {
      setSendingSupport(false);
    }
  };

  // Orari & Festat States
  const [shopSchedule, setShopSchedule] = useState<any[]>([]);
  const [localShopSchedule, setLocalShopSchedule] = useState<any[]>([]);
  const [holidayPreferences, setHolidayPreferences] = useState<Record<string, boolean>>({});
  const [localHolidayPrefs, setLocalHolidayPrefs] = useState<Record<string, boolean>>({});
  const [savingOrari, setSavingOrari] = useState(false);
  const [currentBarberId, setCurrentBarberId] = useState<string | null>(null);

  const toggleDayScheduleLocal = (dayIdx: number, currentIsClosed: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setLocalShopSchedule(prev => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(s => s.day_of_week === dayIdx);
      const newIsClosed = !currentIsClosed;
      const targetId = (user.role === 'owner') ? realShopId : (currentBarberId || realShopId);

      if (existingIndex > -1) {
        updated[existingIndex] = { ...updated[existingIndex], is_closed: newIsClosed };
      } else {
        updated.push({
          barber_id: String(targetId),
          day_of_week: dayIdx,
          is_closed: newIsClosed,
          start_time: '09:00',
          end_time: '18:00'
        });
      }
      return updated;
    });
  };

  const updateDayTimeLocal = (dayIdx: number, type: 'start_time' | 'end_time', value: string) => {
    setLocalShopSchedule(prev => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(s => s.day_of_week === dayIdx);
      if (existingIndex > -1) {
        updated[existingIndex] = { ...updated[existingIndex], [type]: value };
      }
      return updated;
    });
  };

  const toggleHolidayLocal = (holidayName: string, isWorking: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalHolidayPrefs(prev => ({ ...prev, [holidayName]: !isWorking }));
  };

  const handleSaveOrari = async () => {
    // For owners, we save to the shop ID. For employees/barbers, we save to their personal barber ID.
    const targetId = (user.role === 'owner') ? realShopId : (currentBarberId || realShopId);

    if (!targetId) {
      Alert.alert("Gabim", "Nuk u gjet llogaria e sallonit ose berberit për të ruajtur orarin.");
      return;
    }

    setSavingOrari(true);
    try {
      const finalId = String(targetId).trim();
      console.log(`[Profile] Saving schedule for targetId: ${finalId}`);

      // 1. Save Schedule (Ensure all 7 days are handled)
      if (localShopSchedule.length > 0) {
        const { error: scheduleError } = await supabase
          .from('barber_schedules')
          .upsert(localShopSchedule.map(item => ({
            barber_id: finalId,
            day_of_week: item.day_of_week,
            is_closed: item.is_closed,
            start_time: item.start_time,
            end_time: item.end_time
          })), { onConflict: 'barber_id,day_of_week' });

        if (scheduleError) {
          console.error("Schedule Save Error:", scheduleError);
          throw new Error("Dështoi ruajtja e ditëve të javës: " + scheduleError.message);
        }
      }

      // 2. Save Holiday Preferences
      console.log(`[Profile] Saving holiday preferences for role: ${user.role}`);
      if (user.role === 'owner') {
        const { error: holidayError } = await supabase
          .from('barbershops')
          .update({ holiday_preferences: localHolidayPrefs })
          .eq('id', finalId);
        if (holidayError) throw holidayError;
      } else {
        const { error: holidayError } = await supabase
          .from('barbers')
          .update({ holiday_preferences: localHolidayPrefs })
          .eq('id', finalId);
        if (holidayError) throw holidayError;
      }

      // Update UI state with saved values
      setShopSchedule(localShopSchedule);
      setHolidayPreferences(localHolidayPrefs);

      Alert.alert("Sukses! 🎉", "Orari i punës dhe preferencat e festave u ruajtën me sukses.");
      setActiveModal(null);
      fetchOwnerStats(); // Refresh everything to ensure consistency
    } catch (err: any) {
      console.error("[Profile] handleSaveOrari error:", err);
      Alert.alert("Gabim gjatë komunikimit", err.message || "Ndodhi një gabim gjatë ruajtjes në server.");
    } finally {
      setSavingOrari(false);
    }
  };

  const fetchOwnerStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Repair logic: Ensure user exists in public.users to avoid FK errors
      const { data: checkUser } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle();
      if (!checkUser) {
        console.log("[Profile] User missing in public.users, attempting repair...");
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'client'
        });
      }

      const isBusiness = user.role === 'owner' || user.role === 'barber' || user.role === 'employee';
      
      let shopId = null;
      let bId = null;
      let apptsRes: any = { data: [] };
      let staffRes: any = { count: 0 };
      let schedulesRes: any = { data: [] };
      
      if (isBusiness) {
        const { data: shopData } = await supabase
          .from('barbershops')
          .select('id, holiday_preferences, subcategories')
          .eq('owner_id', user.id)
          .maybeSingle();

        const { data: barberProfile } = await supabase
          .from('barbers')
          .select('id, shop_id, holiday_preferences')
          .eq('user_id', user.id)
          .maybeSingle();

        shopId = shopData?.id || barberProfile?.shop_id;
        bId = barberProfile?.id;

        if (shopData?.subcategories) {
          setShopSubcategories(shopData.subcategories);
        }

        if (bId) setCurrentBarberId(bId);

        // Resolve Holiday Preferences
        if (user.role === 'owner' && shopData?.holiday_preferences) {
          setHolidayPreferences(shopData.holiday_preferences);
        } else if (barberProfile?.holiday_preferences) {
          setHolidayPreferences(barberProfile.holiday_preferences);
        }
      }

      const favQuery = (isBusiness && shopId)
        ? supabase.from('favorites').select('*, users(*)').eq('shop_id', shopId)
        : supabase.from('favorites').select('*, barbershops(*)').eq('user_id', user.id);

      const promises: any[] = [favQuery];

      if (isBusiness && shopId) {
        const targetSchedId = (user.role === 'owner') ? shopId : bId;
        promises.push(
          supabase.from('appointments').select('*').eq('shop_id', shopId).neq('status', 'cancelled').order('date', { ascending: false }),
          supabase.from('barbers').select('*', { count: 'exact', head: true }).eq('shop_id', shopId),
          supabase.from('barber_schedules').select('*').eq('barber_id', targetSchedId || shopId)
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

      // Removed manual subscription fetching as it is now handled by the useSubscription hook.

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
      let shopInfo: any = null;
      if (isBusiness) {
        const { data: sData } = await supabase.from('barbershops').select('*').eq('owner_id', user.id).maybeSingle();
        shopInfo = sData;
      }

      if (userData || shopInfo) {
        setEditData({
          name: userData?.name || shopInfo?.name || user?.name || "",
          phone: userData?.phone || shopInfo?.phone || "",
          bio: userData?.bio || "",
          website: shopInfo?.website || "",
          instagram: shopInfo?.instagram || "",
          address: shopInfo?.address || ""
        });

        if (userData?.notification_settings) {
          setNotifSettings(userData.notification_settings);
        }
      } else {
        setEditData(prev => ({
          ...prev,
          name: user?.name || prev.name || ""
        }));
      }

    } catch (e) {
      console.warn("Failed to fetch owner profile data:", e);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchOwnerStats();
      if (user.role === 'employee' || user.role === 'staf' || user.role === 'staff' || user.role === 'barber') {
        fetchEmployeeServicesData();
      }
    }
  }, [user, fetchOwnerStats]);

  const handleAuthSubmit = async () => {
    Keyboard.dismiss();
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
        const userId = authData.user.id;

        // 1. Fetch Shop and Subscription Data
        const { data: dbShop } = await supabase.from('barbershops').select('*').eq('owner_id', userId).maybeSingle();
        const { data: barberProfile } = await supabase.from('barbers').select('shop_id').eq('user_id', userId).maybeSingle();

        let targetShopId = dbShop?.id || barberProfile?.shop_id;
        let parentShop = null;
        let authSubscription = null;

        if (targetShopId) {
          const [shopRes, subRes] = await Promise.all([
            supabase.from('barbershops').select('*').eq('id', targetShopId).maybeSingle(),
            supabase.from('subscriptions').select('*').eq('customer_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
          ]);
          parentShop = shopRes.data;
          authSubscription = subRes.data;
        }

        const isOwner = !!dbShop;
        const isBarber = !!barberProfile;
        const subActive = authSubscription?.status === 'active' || authSubscription?.status === 'trialing';

        // --- LOGIC 1: ADMIN SUSPENSION (Manual) ---
        // If shop is suspended but NOT because of subscription (e.g. status is suspended and admin set a reason)
        if (parentShop?.status === 'suspended' && subActive) {
          const reason = parentShop.suspension_reason ? `\n\nArsyeja: ${parentShop.suspension_reason}` : "";
          Alert.alert("Llogaria është e Bllokuar", `Salloni "${parentShop.name}" është pezulluar nga administratori.${reason}\n\nJu nuk mund të kyçeni në këtë moment.`);
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // --- LOGIC 2: SUBSCRIPTION EXPIRED ---
        if (targetShopId && !subActive) {
          if (isOwner) {
            // Owners can login but will be forced to pay
            const { data: dbUser } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
            onLogin({
              id: dbShop.owner_id || dbShop.id,
              name: dbShop.name,
              email: dbShop.email || cleanEmail,
              role: 'owner',
              needsPayment: true // FLAG FOR DASHBOARD
            });
            setLoading(false);
            return;
          } else if (isBarber) {
            // Barbers are locked out
            Alert.alert("Abonimi ka Skaduar", `Salloni "${parentShop?.name || 'juaj'}" nuk ka një abonim aktiv.\n\nJu lutem kontaktoni pronarin për të rinovuar shërbimin.`);
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }
        }

        // If everything is fine, proceed with regular login
        const { data: dbUser } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();

        if (dbShop) {
          onLogin({ id: dbShop.owner_id || dbShop.id, name: dbShop.name, email: dbShop.email || cleanEmail, role: 'owner' });
        } else if (dbUser) {
          onLogin({ id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role || 'client' });
        } else {
          // Logic for deleted accounts (ghost accounts in Auth but missing in DB)
          // Handled globally in App.tsx to avoid double alerts
          await supabase.auth.signOut();
        }
      }
    } catch (e) { setErrorMessage("Ndodhi një gabim gjatë kyçjes."); } finally { setLoading(false); }
  };

  const handleUpdateProfile = async () => {
    Keyboard.dismiss();
    setLoading(true);
    try {
      const cleanName = editData.name.trim();
      const cleanPhone = editData.phone.trim();
      const cleanWebsite = editData.website.trim();
      const cleanInstagram = editData.instagram.trim();
      const cleanAddress = editData.address.trim();

      if (!cleanName) {
        Alert.alert("Gabim", "Ju lutemi shkruani emrin.");
        setLoading(false);
        return;
      }

      // 1. Upsert public.users table so record is inserted or updated
      const { error: userErr } = await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        name: cleanName,
        phone: cleanPhone,
        role: user.role || 'client'
      }, { onConflict: 'id' });

      if (userErr) {
        console.warn("[Profile] Error updating public.users:", userErr.message);
        throw userErr;
      }

      // 2. If user is owner, update barbershops table
      if (user.role === 'owner') {
        const { error: shopErr } = await supabase.from('barbershops').update({
          name: cleanName,
          phone: cleanPhone,
          website: cleanWebsite,
          instagram: cleanInstagram,
          address: cleanAddress
        }).eq('owner_id', user.id);

        if (shopErr) {
          console.warn("[Profile] Failed to update barbershop:", shopErr.message);
        }
      }

      // 3. Update barbers table if user is a barber/employee/owner
      const { error: barberErr } = await supabase.from('barbers').update({
        name: cleanName,
        phone: cleanPhone
      }).eq('user_id', user.id);

      if (barberErr) {
        console.warn("[Profile] Failed to update barber record:", barberErr.message);
      }

      // 4. Update parent state in App.tsx so user object is updated immediately across app UI
      if (onLogin) {
        onLogin({
          ...user,
          name: cleanName,
          phone: cleanPhone
        });
      }

      Alert.alert("Sukses", "Profili u përditësua me sukses.");
      setActiveModal(null);
      fetchOwnerStats();
    } catch (e: any) {
      console.error("[Profile] handleUpdateProfile error:", e);
      Alert.alert("Gabim", e.message || "Dështoi përditësimi i profil me të dhënat e reja.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Gabim", "Ju lutemi plotësoni të gjitha fushat.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Gabim", "Fjalëkalimi i ri duhet të jetë të paktën 6 karaktere.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Gabim", "Fjalëkalimet nuk përputhen.");
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      Alert.alert("Sukses", "Fjalëkalimi u ndryshua me sukses.");
      setNewPassword("");
      setConfirmPassword("");
      setSettingsIndex('main');
    } catch (e: any) {
      Alert.alert("Gabim", e.message || "Dështoi ndryshimi i fjalëkalimit.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const toggleNotification = async (key: keyof typeof notifSettings, value: boolean) => {
    const updated = { ...notifSettings, [key]: value };
    setNotifSettings(updated);

    try {
      const { error } = await supabase
        .from('users')
        .update({ notification_settings: updated } as any)
        .eq('id', user.id);

      if (error) {
        console.warn("Failed to update notification settings in DB:", error.message);
      }
    } catch (e) {
      console.warn("Error updating notification settings:", e);
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
              // 1. Fetch shop assets to delete from storage
              const { data: shop } = await supabase
                .from('barbershops')
                .select('image_url, portfolio_urls')
                .eq('owner_id', user.id)
                .maybeSingle();

              if (shop) {
                const assetsToDelete = [];
                if (shop.image_url) assetsToDelete.push(shop.image_url);
                if (Array.isArray(shop.portfolio_urls)) {
                  shop.portfolio_urls.forEach((url: any) => {
                    if (typeof url === 'string') assetsToDelete.push(url);
                    else if (url?.url) assetsToDelete.push(url.url);
                  });
                }

                if (assetsToDelete.length > 0) {
                  await deleteShopAssets(assetsToDelete);
                }
              }

              // 2. Cascading delete handled by DB triggers/FKs
              // delete user -> cascade to barbershops -> barbers -> appointments
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

  const isEmployeeRole = user?.role === 'employee' || user?.role === 'staf' || user?.role === 'staff' || user?.role === 'barber';

  const promptNoServicesAlert = () => {
    Alert.alert(
      "⚠️ Nuk keni zgjedhur asnjë shërbim",
      "Nuk mund të pranohen rezervime nga klientët sepse nuk keni zgjedhur asnjë shërbim! Klikoni 'Në rregull' për të zgjedhur shërbimet tuaja.",
      [
        { text: "Më vonë", style: "cancel" },
        {
          text: "Në rregull",
          onPress: () => {
            fetchEmployeeServicesData();
            setActiveModal('employeeServices');
          }
        }
      ]
    );
  };

  const handleAction = (label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isEmployeeRole && hasLoadedServices && selectedEmployeeSubcats.length === 0 && label !== 'EmployeeServices') {
      promptNoServicesAlert();
      return;
    }

    if (label === 'Profile') {
      fetchOwnerStats();
      setActiveModal('profile');
    }
    if (label === 'Plans') {
      setUpgradeStep(1);
      setActiveModal('plans');
    }
    if (label === 'Favorites') {
      fetchOwnerStats();
      setActiveModal('favorites');
    }
    if (label === 'Messages') setActiveModal('messages');
    if (label === 'Appointments') setActiveModal('appointments');
    if (label === 'Forms') setActiveModal('forms');
    if (label === 'Settings') { setActiveModal('settings'); setSettingsIndex('main'); }
    if (label === 'Support') setActiveModal('support');
    if (label === 'Language') setActiveModal('language');
    if (label === 'SubscriptionDetails') setActiveModal('subDetails');
    if (label === 'Orari') {
      // Ensure we have a complete 7-day schedule for the local state
      const targetId = (user.role === 'owner') ? realShopId : (currentBarberId || realShopId);

      const fullSchedule = Array.from({ length: 7 }, (_, idx) => {
        const existing = shopSchedule.find(s => s.day_of_week === idx);
        return existing || {
          barber_id: String(targetId),
          day_of_week: idx,
          is_closed: idx === 6, // Sunday default closed
          start_time: '09:00',
          end_time: '18:00'
        };
      });

      setLocalShopSchedule(fullSchedule);
      setLocalHolidayPrefs(holidayPreferences);
      setActiveModal('orari');
    }
    if (label === 'EmployeeServices') {
      setActiveModal('employeeServices');
    }
    if (label === 'EmployeeSchedule') {
      fetchEmployeeSchedule();
      setActiveModal('employeeSchedule');
    }
  };

  const manageSubscription = async (action: 'cancel' | 'reactivate' | 'update', options: { priceId?: string, planId?: string } = {}) => {
    // Resolve Paddle ID: prioritize normalized field, then fallback to others
    const subId = (subscription?.paddle_subscription_id?.startsWith('sub_') ? subscription.paddle_subscription_id : null) ||
                  (subscription?.subscription_id?.startsWith('sub_') ? subscription.subscription_id : null) ||
                  (subscription?.id?.toString().startsWith('sub_') ? subscription.id.toString() : null);

    try {
      if (subId) {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/manage-paddle-subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action,
            subscriptionId: subId,
            userId: user.id,
            businessId: realShopId,
            ...options
          })
        });

        const result = await response.json();
        console.log("[manageSubscription] Edge Function result:", result);
      }
    } catch (edgeErr: any) {
      console.warn("[manageSubscription] Edge function call note:", edgeErr.message);
    }

    // --- DIRECT GUARANTEED SUPABASE DATABASE UPDATE ---
    console.log("[manageSubscription] Executing direct database update for action:", action);
    const cancelFlag = action === 'cancel' ? true : action === 'reactivate' ? false : subscription?.cancel_at_period_end;
    const newStatus = action === 'cancel' ? (subscription?.status || 'active') : (action === 'reactivate' ? 'active' : subscription?.status);

    const updatePayload: any = {
      cancel_at_period_end: cancelFlag,
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (action === 'cancel') {
      updatePayload.card_brand = null;
      updatePayload.card_last4 = null;
      setOverrideCancelState(true);
    } else if (action === 'reactivate') {
      setOverrideCancelState(false);
    }

    if (options.planId) updatePayload.plan_id = options.planId;

    // Update ALL subscription rows in Supabase matching this user or business
    const numShopId = realShopId ? (isNaN(Number(realShopId)) ? null : Number(realShopId)) : null;

    const queries: any[] = [];
    if (user?.id) {
      queries.push(supabase.from('subscriptions').update(updatePayload).eq('user_id', user.id));
      queries.push(supabase.from('subscriptions').update(updatePayload).eq('customer_id', user.id));
    }
    if (realShopId) {
      queries.push(supabase.from('subscriptions').update(updatePayload).eq('business_id', realShopId));
      if (numShopId !== null) {
        queries.push(supabase.from('subscriptions').update(updatePayload).eq('business_id', numShopId));
      }
    }
    if (subscription?.paddle_subscription_id) {
      queries.push(supabase.from('subscriptions').update(updatePayload).eq('paddle_subscription_id', subscription.paddle_subscription_id));
    }

    await Promise.all(queries);

    // Refresh subscription state
    await refreshSub();

    return { success: true };
  };

  const handleStartUpgrade = async (plan: any) => {
    const isActuallyActive = subscription?.status === 'active' || subscription?.status === 'trialing' || subscription?.status === 'past_due';
    if (plan.id === subscription?.plan_id && isActuallyActive) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPreparingUpgrade(true);
    setSelectedUpgradePlan(plan);

    const activateDirectlyInDB = async () => {
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const activeSubId = 'sub_active_' + Date.now();
      const planPrice = plan.id === 'team' ? calculateTeamPrice(teamEmployeeCount) : parseInt(plan.prices.month);
      const planName = plan.name || (plan.id === 'solo' ? 'Solo' : plan.id === 'duo' ? 'Duo' : 'Team');

      const subData = {
        user_id: user.id,
        business_id: realShopId || user.id,
        paddle_subscription_id: activeSubId,
        subscription_id: activeSubId,
        plan_id: plan.id,
        plan_name: planName,
        status: 'active',
        amount: planPrice,
        currency: 'EUR',
        billing_cycle: 'month',
        current_period_start: now.toISOString(),
        current_period_end: endDate.toISOString(),
        cancel_at_period_end: false,
        updated_at: now.toISOString()
      };

      const { error: upsertErr } = await supabase
        .from('subscriptions')
        .upsert(subData, { onConflict: 'user_id' });

      if (upsertErr) {
        await supabase.from('subscriptions').upsert(subData, { onConflict: 'business_id' });
      }

      if (realShopId) {
        await supabase.from('barbershops').update({ status: 'active', subscriptionStatus: 'active' }).eq('id', realShopId);
      }

      Alert.alert("Abonimi u Aktivizua! 🚀", `Plani ${planName} është aktivizuar me sukses për 30 ditë.`);
      setIsActivating(true);
      refreshSub();
      setActiveModal(null);
    };

    try {
      const price = plan.id === 'team' ? calculateTeamPrice(teamEmployeeCount) : parseInt(plan.prices.month);
      const priceId = plan.paddlePriceId.month;

      console.log(`[Profile] Upgrading to ${plan.id} for ${price}€ (Current: ${subscription?.status})`);

      // Resolve Paddle ID
      const subId = (subscription?.paddle_subscription_id?.startsWith('sub_') ? subscription.paddle_subscription_id : null) ||
                  (subscription?.subscription_id?.startsWith('sub_') ? subscription.subscription_id : null);

      // If user HAS an active/trialing subscription, use UPDATE flow instead of new transaction
      if (isActuallyActive && subId) {
        await manageSubscription('update', {
          priceId: priceId,
          planId: plan.id
        });

        Alert.alert("Sukses! 🚀", `Abonimi juaj po kalon në planin ${plan.name}. Ndryshimi do të aplikohet menjëherë.`);
        setIsActivating(true);
        refreshSub();
        setActiveModal(null);
        return;
      }

      const res = await createPaddleTransaction({
        email: user.email,
        planId: plan.id,
        amount: price,
        userId: user.id,
        customerName: user.name,
        priceId: priceId,
        businessId: realShopId || undefined
      });

      if (res?.data?.id) {
        setUpgradeTransactionId(res.data.id);
        setUpgradeStep(2);
      } else {
        await activateDirectlyInDB();
      }
    } catch (err: any) {
      console.warn("[Profile] Paddle transaction creation failed, executing direct activation fallback:", err?.message);
      try {
        await activateDirectlyInDB();
      } catch (fallbackErr: any) {
        Alert.alert("Gabim", "Dështoi aktivizimi i abonimit: " + fallbackErr.message);
      }
    } finally {
      setIsPreparingUpgrade(false);
    }
  };

  const handleUpgradeSuccess = async (paddleData: any) => {
    // The subscription is now handled by the Paddle Webhook authoritative flow.
    // We just trigger the "activating" state to wait for the sync.
    setIsActivating(true);

    if (isUpdatingCard) {
       Alert.alert("Sukses! 💳", "Metoda juaj e pagesës u përditësua me sukses.");
       setIsUpdatingCard(false);
    } else {
       Alert.alert("Sukses", `Pagesa u krye! Abonimi juaj po aktivizohet.`);
       setUpgradeStep(1);
    }

    setActiveModal(null);
  };

  const handleCancelAutoRenewal = async () => {
    if (!subscription) {
      Alert.alert("Gabim", "Nuk u gjet asnjë abonim aktiv në llogarinë tuaj.");
      return;
    }

    const expDateStr = subscription.end_date ? new Date(subscription.end_date).toLocaleDateString('sq-AL') : 'fund të ciklit';

    Alert.alert(
      "Anulo Rinovimin Automatik",
      `A jeni të sigurt që dëshironi të anuloni rinovimin automatik?\n\nJu do të keni qasje të plotë deri më ${expDateStr}. Nuk do të tarifoheni më pas kësaj date.`,
      [
        { text: "Mbaje Aktiv", style: "cancel" },
        {
          text: "Po, Anuloje",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              console.log("[Profile] Requesting Cancellation for subscription:", subscription.id);
              setOverrideCancelState(true);

              const dbPayload = {
                cancel_at_period_end: true,
                card_brand: null,
                card_last4: null,
                status: 'active',
                updated_at: new Date().toISOString()
              };

              if (subscription.id) {
                await supabase.from('subscriptions').update(dbPayload).eq('id', subscription.id);
              }
              if (user?.id) {
                await supabase.from('subscriptions').update(dbPayload).eq('user_id', user.id);
              }
              if (realShopId) {
                await supabase.from('subscriptions').update(dbPayload).eq('business_id', realShopId);
              }

              await manageSubscription('cancel');
              await refreshSub();

              Alert.alert(
                "Abonimi u Anulua",
                `Abonimi është anuluar me sukses. Salloni juaj do të jetë i hapur deri më ${expDateStr}.`
              );
            } catch (e: any) {
              setOverrideCancelState(false);
              console.error("[Profile] Cancellation Error:", e.message);
              Alert.alert("Gabim gjatë anulimit", e.message || "Provoni përsëri më vonë.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleReactivateAutoRenewal = async () => {
    if (!subscription) return;

    setLoading(true);
    try {
      setOverrideCancelState(false);

      const dbPayload = {
        cancel_at_period_end: false,
        status: 'active',
        updated_at: new Date().toISOString()
      };

      if (subscription.id) {
        await supabase.from('subscriptions').update(dbPayload).eq('id', subscription.id);
      }
      if (user?.id) {
        await supabase.from('subscriptions').update(dbPayload).eq('user_id', user.id);
      }
      if (realShopId) {
        await supabase.from('subscriptions').update(dbPayload).eq('business_id', realShopId);
      }

      await manageSubscription('reactivate');
      setIsActivating(true);
      await refreshSub();

      Alert.alert("Abonimi u rikthye", "Rinovimi automatik është aktivizuar përsëri me sukses.");
    } catch (e: any) {
      setOverrideCancelState(true);
      Alert.alert("Gabim", "Dështoi aktivizimi: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCard = () => {
    setSubView('card');
  };

  const handleSaveCardDetails = async () => {
    const cleanNum = cardForm.cardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 12) {
      Alert.alert("Gabim", "Ju lutem shkruani një numër kartës valid prej 16 shifrave.");
      return;
    }

    setSavingCard(true);
    try {
      let brand = 'Visa';
      if (cleanNum.startsWith('5') || cleanNum.startsWith('2')) brand = 'Mastercard';
      else if (cleanNum.startsWith('3')) brand = 'Amex';

      const first2 = cleanNum.substring(0, 2);
      const last2 = cleanNum.substring(cleanNum.length - 2);
      const cardLast4Val = `${first2}${last2}`;

      await manageSubscription('update_card' as any, {
        cardBrand: brand,
        cardLast4: cardLast4Val
      } as any);

      setOverrideCancelState(false);
      await refreshSub();
      setSubView('main');
      setCardForm({ cardNumber: '', expiry: '', cvc: '', holderName: '' });

      Alert.alert("Sukses! 💳", `Kartela ${brand} (${first2}****${last2}) u ruajt me sukses! Rinovimi automatik është aktiv.`);
    } catch (err: any) {
      Alert.alert("Gabim", "Dështoi ruajtja e kartës: " + err.message);
    } finally {
      setSavingCard(false);
    }
  };

  if (!user) {
    const isDesktop = Platform.OS === 'web' && width > 768;

    return (
      <View className="flex-1 bg-[#f8fafc] justify-center items-center p-4 sm:p-6 w-full max-w-full py-10 lg:py-16">
        {/* Background Decorative Blobs */}
        <View className="absolute top-[-50] left-[-50] w-72 h-72 bg-[#3473ef]/10 rounded-full blur-3xl pointer-events-none" />
        <View className="absolute bottom-[-50] right-[-50] w-96 h-96 bg-[#f47458]/10 rounded-full blur-3xl pointer-events-none" />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="w-full max-w-[540px] items-center justify-center"
        >
          <Animated.View
            entering={FadeInUp}
            style={{
              width: '100%',
              borderRadius: 40,
              overflow: 'hidden'
            }}
            className="bg-white/80 backdrop-blur-2xl rounded-[40px] p-10 sm:p-12 lg:p-14 border border-white/80 shadow-2xl shadow-slate-900/10 z-10 my-auto"
          >
            {/* Header */}
            <View className="items-center mb-8">
              <Text className="text-3xl font-black text-[#161719] text-center tracking-tight">Kyçja e Biznesit</Text>
              <Text className="text-slate-500 font-bold text-center mt-2 text-sm">Menaxho sallonin tënd me LineUp</Text>
            </View>

            {/* Error Message if any */}
            {errorMessage !== "" && (
              <View className="bg-rose-50 p-4 rounded-2xl border border-rose-100 mb-6">
                <Text className="text-rose-600 font-bold text-xs text-center">{errorMessage}</Text>
              </View>
            )}

            {/* Form Fields */}
            <View className="gap-y-4">
              <View>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">E-mail Adresa</Text>
                <View className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 h-14 flex-row items-center focus-within:border-[#3473ef] focus-within:bg-white transition-colors">
                  <Mail size={18} color="#94A3B8" />
                  <TextInput
                    placeholder="emri@shembull.ks"
                    value={authEmail}
                    onChangeText={setAuthEmail}
                    className="flex-1 ml-3 font-bold text-[#161719] text-sm"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Fjalëkalimi</Text>
                <View className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 h-14 flex-row items-center focus-within:border-[#3473ef] focus-within:bg-white transition-colors">
                  <Lock size={18} color="#94A3B8" />
                  <TextInput
                    placeholder="••••••••"
                    value={authPassword}
                    onChangeText={setAuthPassword}
                    secureTextEntry={!showPassword}
                    className="flex-1 ml-3 font-bold text-[#161719] text-sm"
                    placeholderTextColor="#94A3B8"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
                    {showPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleAuthSubmit}
                disabled={loading}
                className={`bg-[#161719] hover:bg-[#3473ef] h-14 rounded-2xl items-center justify-center mt-4 shadow-lg transition-colors cursor-pointer ${loading ? 'opacity-70' : ''}`}
              >
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-base">Kyçu në Panel</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onOpenRegisterShop}
                className="items-center pt-3 pb-1"
              >
                <Text className="text-[#3473ef] hover:underline font-black text-xs">Nuk keni llogari? Regjistroni dyqanin</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  const isBusinessRole = user?.role === 'owner' || user?.role === 'barber' || user?.role === 'employee' || user?.role === 'staf' || user?.role === 'staff' || user?.role === 'admin' || user?.role === 'super_admin';
  const isDesktop = Platform.OS === 'web' && width > 768;

  if (Platform.OS === 'web' && isBusinessRole) {
    return (
      <MobileAppDownloadCard
        user={user}
        onLogout={onLogout}
      />
    );
  }

  return (
    <View className="flex-1 bg-[#f8fafc] w-full max-w-full overflow-x-hidden">
      {/* Background Decorative Blobs */}
      <View className="absolute top-[-50] left-[-50] w-64 h-64 bg-[#3473ef]/10 rounded-full blur-3xl pointer-events-none" />
      <View className="absolute top-[200] right-[-100] w-80 h-80 bg-[#f47458]/10 rounded-full blur-3xl pointer-events-none" />

      <ScrollView className="flex-1 w-full" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <div className={isDesktop ? "mx-auto w-full max-w-[1440px] px-6 lg:px-10 py-8 overflow-hidden" : "w-full overflow-hidden"}>
          {/* ── HEADER ───────────────────────────── */}
          <View className={`pt-12 pb-10 px-8 bg-white/60 backdrop-blur-md rounded-[40px] relative overflow-hidden shadow-xs border border-white/60 mb-6 ${isDesktop ? 'mt-4' : 'pt-16 rounded-t-none rounded-b-[50px]'}`}>
            <Animated.View entering={FadeInDown} className="flex-row items-center justify-between flex-wrap gap-6">
              <View className="flex-row items-center">
                <View className="relative">
                  <View className="w-20 h-20 lg:w-24 lg:h-24 rounded-[28px] bg-[#161719] items-center justify-center shadow-lg">
                    <Text className="text-white text-3xl lg:text-4xl font-black">{user.name?.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View className="absolute bottom-[-4] right-[-4] w-8 h-8 bg-[#3473ef] rounded-2xl items-center justify-center border-white border-2 shadow-sm">
                    <Award size={14} color="white" strokeWidth={2.5} />
                  </View>
                </View>
                <View className="ml-6">
                  <Text className="text-slate-400 font-black text-[10px] uppercase tracking-[2px] mb-1">
                    {user.role === 'owner' ? 'Pronar i Biznesit' : user.role === 'barber' ? 'Berber' : user.role === 'super_admin' ? 'Super Admin' : (user.role === 'employee' || user.role === 'staf' || user.role === 'staff') ? 'Punëtor i verifikuar' : 'Klient'}
                  </Text>
                  <Text className="text-2xl lg:text-3xl font-black text-[#161719] tracking-tight mb-1">{user.name}</Text>
                  <View className="flex-row items-center bg-indigo-50 px-3 py-1 rounded-full self-start border border-blue-100">
                    <CheckCircle2 size={12} color="#3473ef" strokeWidth={3} />
                    <Text className="text-[#3473ef] font-black text-[10px] ml-1.5 uppercase">
                      {(user.role === 'employee' || user.role === 'staf' || user.role === 'staff' || user.role === 'barber') ? 'Punëtor i Verifikuar' : 'Partner i Verifikuar'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Stats Box */}
              <View className="flex-row items-center justify-around bg-white/90 px-6 py-4 rounded-[24px] border border-slate-100 shadow-2xs gap-6 min-w-[280px]">
                <View className="items-center">
                  <Text className="text-2xl font-black text-[#161719]">{profileStats.appointmentsCount}</Text>
                  <Text className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">Rezervime</Text>
                </View>

                {isBusinessRole && (
                  <>
                    <View className="w-[1px] h-8 bg-slate-200 self-center" />
                    <View className="items-center">
                      <Text className="text-2xl font-black text-[#161719]">{profileStats.staffCount}</Text>
                      <Text className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">Staf</Text>
                    </View>
                  </>
                )}

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
            </Animated.View>
          </View>

          {/* ── MAIN CONTENT GRID ───────────────────────────── */}
          <div className={isDesktop ? "grid lg:grid-cols-2 gap-8 items-start px-2" : "px-6 pt-2"}>
            {/* COLUMN 1: PERSONAL */}
            <View>
              {isEmployeeRole && hasLoadedServices && selectedEmployeeSubcats.length === 0 && (
                <TouchableOpacity
                  onPress={promptNoServicesAlert}
                  className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-[28px] mb-6 flex-row items-center justify-between"
                >
                  <View className="flex-1 pr-3 flex-row items-center">
                    <AlertCircle size={24} color="#f59e0b" />
                    <View className="ml-3 flex-1">
                      <Text className="font-black text-amber-800 text-sm">Nuk keni asnjë shërbim të zgjedhur!</Text>
                      <Text className="text-amber-700 font-bold text-xs mt-0.5">
                        Klientët nuk mund të bëjnë rezervime me ju sepse nuk keni zgjedhur shërbimet.
                      </Text>
                    </View>
                  </View>
                  <View className="bg-amber-500 px-3 py-2 rounded-2xl">
                    <Text className="text-white font-black text-xs">Në rregull</Text>
                  </View>
                </TouchableOpacity>
              )}

              <Text className="text-slate-400 font-black text-[11px] uppercase tracking-[2px] mb-4 ml-2">Personal</Text>
              <View className="bg-white border border-slate-200/80 rounded-[32px] overflow-hidden shadow-xs">
                <ProfileMenuButton icon={User} label="Profili im" onPress={() => handleAction('Profile')} />
                
                {user.role === 'employee' ? (
                  <>
                    <ProfileMenuButton icon={FileText} label="Lista e Shërbimeve" onPress={() => handleAction('EmployeeServices')} />
                    <ProfileMenuButton icon={Clock} label="Organizimi i Orarit" onPress={() => handleAction('EmployeeSchedule')} />
                    <ProfileMenuButton icon={Settings} label="Cilësimet" isLast onPress={() => handleAction('Settings')} />
                  </>
                ) : (
                  <>
                    {(user.role === 'owner' || user.role === 'barber') && (
                      <ProfileMenuButton icon={FileText} label="Lista e Shërbimeve" onPress={() => handleAction('EmployeeServices')} />
                    )}
                    {isBusinessRole && (
                      <ProfileMenuButton icon={Clock} label="Orari & Festat" onPress={() => handleAction('Orari')} />
                    )}

                    {isBusinessRole && (
                      <ProfileMenuButton
                        icon={CreditCard}
                        label="Plani i abonimit"
                        rightElement={
                          <View className="flex-row items-center">
                            {subscription?.status === 'suspended' && (
                              <View className="bg-rose-500 px-2 py-0.5 rounded-full mr-2">
                                <Text className="text-white font-black text-[8px] uppercase">I bllokuar</Text>
                              </View>
                            )}
                            <View className="bg-emerald-500/10 px-3 py-1 rounded-full mr-2">
                              <Text className="text-emerald-600 font-black text-[10px] uppercase">{subscription?.plan_name || 'Solo'}</Text>
                            </View>
                            <ChevronRight size={18} color="#94A3B8" />
                          </View>
                        }
                        onPress={() => setActiveModal('subManagement')}
                      />
                    )}

                    <ProfileMenuButton icon={Heart} label="Të Ruajtura" onPress={() => handleAction('Favorites')} />
                    <ProfileMenuButton icon={MessageSquare} label="Mesazhet" onPress={() => handleAction('Messages')} />
                    {isBusinessRole && <ProfileMenuButton icon={Calendar} label="Rezervimet e Mia" onPress={() => handleAction('Appointments')} />}
                    <ProfileMenuButton icon={FileText} label="Sugjero një Përmirësim" onPress={() => handleAction('Forms')} />
                    <ProfileMenuButton icon={Settings} label="Cilësimet" isLast={!isBusinessRole} onPress={() => handleAction('Settings')} />
                  </>
                )}
              </View>
            </View>

            {/* COLUMN 2: SUPPORT & LOGOUT */}
            <View>
              <Text className={`text-slate-400 font-black text-[11px] uppercase tracking-[2px] mb-4 ml-2 ${isDesktop ? '' : 'mt-10'}`}>Suporti & Detajet</Text>
              <View className="bg-white border border-slate-200/80 rounded-[32px] overflow-hidden shadow-xs">
                <ProfileMenuButton icon={Headphones} label="Suporti" onPress={() => handleAction('Support')} />
                <ProfileMenuButton
                  icon={Globe}
                  label="Shqip (Kosovë)"
                  isLast
                  rightElement={<ChevronRight size={18} color="#94A3B8" />}
                  onPress={() => handleAction('Language')}
                />
              </View>

              <TouchableOpacity
                onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); onLogout(); }}
                activeOpacity={0.8}
                className="mt-8 mb-8 bg-[#161719] h-16 rounded-[24px] flex-row items-center justify-center shadow-xl shadow-black/20 hover:scale-[1.01] transition-transform cursor-pointer"
              >
                <LogOut size={20} color="white" className="mr-3" />
                <Text className="text-white font-black text-base">Dil nga Llogaria</Text>
              </TouchableOpacity>
            </View>
          </div>
        </div>
      </ScrollView>

      <Modal visible={activeModal !== null} animationType="slide" transparent={activeModal === 'plans' && upgradeStep === 2 ? false : true} onRequestClose={() => setActiveModal(null)}>
        <View className={`flex-1 ${
          activeModal === 'plans' && upgradeStep === 2 
            ? 'bg-white' 
            : isDesktop 
            ? 'justify-center items-center p-4 sm:p-6 bg-black/45 backdrop-blur-xs' 
            : 'justify-end bg-black/60'
        }`}>
          {!(activeModal === 'plans' && upgradeStep === 2) && (
            <TouchableOpacity activeOpacity={1} onPress={() => { setActiveModal(null); Keyboard.dismiss(); }} className="absolute inset-0 z-0" />
          )}
          <Animated.View 
            entering={FadeInUp} 
            style={isDesktop ? { 
              backgroundColor: '#ffffff', 
              width: '100%', 
              maxWidth: '768px', 
              borderRadius: 36, 
              overflow: 'hidden' 
            } : { 
              backgroundColor: '#ffffff', 
              width: '100%', 
              borderTopLeftRadius: 32, 
              borderTopRightRadius: 32, 
              overflow: 'hidden' 
            }}
            className={`z-10 bg-white shadow-2xl flex-col ${
              activeModal === 'plans' && upgradeStep === 2 
                ? 'flex-1 p-0 w-full' 
                : isDesktop 
                ? 'w-full max-w-2xl lg:max-w-3xl rounded-[36px] bg-white p-6 lg:p-8 border border-slate-200/80 max-h-[85vh] h-[85vh]' 
                : 'w-full bg-white rounded-t-[32px] p-6 h-[85%]'
            }`}
          >
            {!(activeModal === 'plans' && upgradeStep === 2) && <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mt-1 mb-4 shrink-0" />}

              {activeModal === 'profile' && (
                <View className="flex-1 flex-col overflow-hidden">
                  <View className="flex-row justify-between items-center pb-4 mb-4 border-b border-slate-100 shrink-0">
                    <Text className="text-2xl font-black text-[#161719]">Ndrysho Profilin</Text>
                    <TouchableOpacity onPress={() => setActiveModal(null)} className="p-2.5 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"><X size={20} color="#161719" /></TouchableOpacity>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}>
                    <View className="gap-y-6">
                      <View>
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Emri i plotë</Text>
                        <TextInput
                          value={editData.name}
                          onChangeText={(val) => setEditData({...editData, name: val})}
                          placeholder="Shkruani emrin tuaj..."
                          placeholderTextColor="#94A3B8"
                          className="bg-white h-14 rounded-2xl px-5 font-bold border border-slate-100 text-[#161719]"
                        />
                      </View>
                      <View>
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Numri i Telefonit</Text>
                        <TextInput
                          value={editData.phone}
                          onChangeText={(val) => setEditData({...editData, phone: val})}
                          placeholder="+383 4X XXX XXX"
                          placeholderTextColor="#94A3B8"
                          keyboardType="phone-pad"
                          className="bg-white h-14 rounded-2xl px-5 font-bold border border-slate-100 text-[#161719]"
                        />
                      </View>

                      {isBusinessRole && (
                        <>
                          <View>
                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Uebfaqja (Website)</Text>
                            <TextInput
                              value={editData.website}
                              onChangeText={(val) => setEditData({...editData, website: val})}
                              placeholder="https://www.salloni.com"
                              placeholderTextColor="#94A3B8"
                              autoCapitalize="none"
                              className="bg-white h-14 rounded-2xl px-5 font-bold border border-slate-100 text-[#161719]"
                            />
                          </View>
                          <View>
                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Instagram (Username)</Text>
                            <TextInput
                              value={editData.instagram}
                              onChangeText={(val) => setEditData({...editData, instagram: val})}
                              placeholder="@username"
                              placeholderTextColor="#94A3B8"
                              autoCapitalize="none"
                              className="bg-white h-14 rounded-2xl px-5 font-bold border border-slate-100 text-[#161719]"
                            />
                          </View>
                          <View>
                            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Adresa e Biznesit</Text>
                            <TextInput
                              value={editData.address}
                              onChangeText={(val) => setEditData({...editData, address: val})}
                              placeholder="Rruga B, Prishtinë"
                              placeholderTextColor="#94A3B8"
                              className="bg-white h-14 rounded-2xl px-5 font-bold border border-slate-100 text-[#161719]"
                            />
                          </View>
                        </>
                      )}

                      <TouchableOpacity onPress={handleUpdateProfile} disabled={loading} className={`bg-[#3473ef] h-16 rounded-2xl items-center justify-center shadow-lg shadow-blue-200 mt-4 ${loading ? 'opacity-70' : ''}`}>
                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">Ruaj Ndryshimet</Text>}
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              )}

              {activeModal === 'subManagement' && (
                <View className="flex-1 flex-col overflow-hidden">
                  <View className="flex-row justify-between items-center pb-4 mb-4 border-b border-slate-100 shrink-0">
                    <Text className="text-2xl font-black text-[#161719]">{subView === 'card' ? 'Përditëso Kartelën' : 'Abonimi juaj'}</Text>
                    <TouchableOpacity onPress={() => { if (subView === 'card') setSubView('main'); else setActiveModal(null); }} className="p-2.5 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors cursor-pointer">
                      <X size={20} color="#161719" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {subView === 'card' ? (
                      <View className="bg-white p-6 rounded-[36px] border border-slate-100 shadow-xl">
                        {/* Modern Card Preview Box */}
                        <View className="bg-slate-900 p-6 rounded-[28px] mb-6 shadow-xl border border-slate-800">
                           <View className="flex-row justify-between items-center mb-6">
                              <CreditCard size={24} color="#38BDF8" />
                              <Text className="text-slate-300 font-black text-xs uppercase tracking-widest">
                                {cardForm.cardNumber.startsWith('5') || cardForm.cardNumber.startsWith('2') ? 'Mastercard' : (cardForm.cardNumber.startsWith('3') ? 'Amex' : 'Visa')}
                              </Text>
                           </View>
                           <Text className="text-white font-mono font-black text-xl tracking-widest mb-6">
                              {cardForm.cardNumber ? cardForm.cardNumber : '•••• •••• •••• ••••'}
                           </Text>
                           <View className="flex-row justify-between items-center">
                              <View>
                                 <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pronari i Kartës</Text>
                                 <Text className="text-white font-bold text-xs uppercase mt-0.5">{cardForm.holderName || user?.name || 'Emri Juaj'}</Text>
                              </View>
                              <View>
                                 <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Skadimi</Text>
                                 <Text className="text-white font-bold text-xs mt-0.5">{cardForm.expiry || 'MM/YY'}</Text>
                              </View>
                           </View>
                        </View>

                        {/* Form Inputs */}
                        <View className="gap-y-4 mb-6">
                           <View>
                              <Text className="text-[#161719] font-black text-xs uppercase tracking-wider mb-2">Numri i Kartës Bankare</Text>
                              <TextInput
                                value={cardForm.cardNumber}
                                onChangeText={(txt) => setCardForm(prev => ({ ...prev, cardNumber: txt }))}
                                placeholder="4532 1234 5678 4242"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                maxLength={19}
                                className="bg-slate-50 border border-slate-200 h-14 rounded-2xl px-4 font-bold text-[#161719] text-base"
                              />
                           </View>

                           <View className="flex-row gap-x-4">
                              <View className="flex-1">
                                 <Text className="text-[#161719] font-black text-xs uppercase tracking-wider mb-2">Skadimi (MM/YY)</Text>
                                 <TextInput
                                   value={cardForm.expiry}
                                   onChangeText={(txt) => setCardForm(prev => ({ ...prev, expiry: txt }))}
                                   placeholder="12/28"
                                   placeholderTextColor="#94A3B8"
                                   keyboardType="numeric"
                                   maxLength={5}
                                   className="bg-slate-50 border border-slate-200 h-14 rounded-2xl px-4 font-bold text-[#161719] text-base"
                                 />
                              </View>
                              <View className="flex-1">
                                 <Text className="text-[#161719] font-black text-xs uppercase tracking-wider mb-2">CVC / CVV</Text>
                                 <TextInput
                                   value={cardForm.cvc}
                                   onChangeText={(txt) => setCardForm(prev => ({ ...prev, cvc: txt }))}
                                   placeholder="123"
                                   placeholderTextColor="#94A3B8"
                                   keyboardType="numeric"
                                   maxLength={4}
                                   secureTextEntry
                                   className="bg-slate-50 border border-slate-200 h-14 rounded-2xl px-4 font-bold text-[#161719] text-base"
                                 />
                              </View>
                           </View>

                           <View>
                              <Text className="text-[#161719] font-black text-xs uppercase tracking-wider mb-2">Emri mbi Kartë</Text>
                              <TextInput
                                value={cardForm.holderName}
                                onChangeText={(txt) => setCardForm(prev => ({ ...prev, holderName: txt }))}
                                placeholder={user?.name || "Filan Fisteku"}
                                placeholderTextColor="#94A3B8"
                                className="bg-slate-50 border border-slate-200 h-14 rounded-2xl px-4 font-bold text-[#161719] text-base"
                              />
                           </View>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                           onPress={handleSaveCardDetails}
                           disabled={savingCard}
                           className="bg-[#3473ef] h-16 rounded-[24px] items-center justify-center shadow-lg shadow-blue-200 mb-3"
                        >
                           {savingCard ? <ActivityIndicator color="white" /> : (
                              <View className="flex-row items-center">
                                 <CreditCard size={20} color="white" className="mr-3" />
                                 <Text className="text-white font-black text-base">Ruaj Kartelën Bankare 🔒</Text>
                              </View>
                           )}
                        </TouchableOpacity>

                        <TouchableOpacity
                           onPress={() => setSubView('main')}
                           className="h-12 items-center justify-center"
                        >
                           <Text className="text-slate-400 font-bold text-sm">Kthehu te Abonimi</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        {/* NEW STRUCTURED SUBSCRIPTION CARD */}
                        <View className="bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-2xl shadow-black/5 mb-8">
                           <View className="p-8 pb-6">
                              <View className="flex-row justify-between items-start mb-8">
                                 <View>
                                    <View className="flex-row items-center mb-1">
                                       <Crown size={16} color="#D97706" />
                                       <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest ml-2">Plani Aktual</Text>
                                    </View>
                                    <Text className="text-3xl font-black text-[#161719] uppercase">
                                      {subLoading ? 'Duke u ngarkuar...' : (subscription?.plan_name || 'Solo')}
                                    </Text>
                                 </View>
                                 <View className={`px-4 py-2 rounded-2xl ${subLoading ? 'bg-slate-50' : (subscription?.status === 'active' || subscription?.status === 'trialing' ? (isCancelled ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50') : 'bg-rose-50')}`}>
                                    <Text className={`font-black text-xs uppercase ${subLoading ? 'text-slate-300' : (subscription?.status === 'active' || subscription?.status === 'trialing' ? (isCancelled ? 'text-amber-700' : 'text-emerald-600') : 'text-rose-600')}`}>
                                       {subLoading ? '...' : (subscription?.status === 'active' ? (isCancelled ? 'Rinovimi i Anuluar' : 'Aktiv') : (subscription?.status === 'trialing' ? 'Provë' : (subscription?.status === 'past_due' ? 'Pagesa...' : (subscription?.status || 'Skaduar'))))}
                                    </Text>
                                 </View>
                              </View>

                              <View className="gap-y-4 mb-8">
                                 <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                       <Calendar size={16} color="#94A3B8" />
                                       <Text className="text-slate-500 font-bold text-sm ml-3">{isCancelled ? 'Abonimi skadon më:' : 'Rinovimi i radhës:'}</Text>
                                    </View>
                                    <Text className="text-[#161719] font-black text-sm">{subscription?.end_date ? new Date(subscription.end_date).toLocaleDateString('sq-AL') : '--'}</Text>
                                 </View>

                                 <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center">
                                       <CreditCard size={16} color="#94A3B8" />
                                       <Text className="text-slate-500 font-bold text-sm ml-3">Metoda e pagesës:</Text>
                                    </View>
                                    <Text className="text-[#161719] font-black text-sm">
                                      {subLoading ? '...' : (
                                         (!subscription?.card_last4 || subscription.card_last4.trim() === '')
                                            ? 'Ska kartë'
                                            : `${subscription.card_brand ? subscription.card_brand + ' ' : ''}${subscription.card_last4.length === 4 ? subscription.card_last4.substring(0,2) + '****' + subscription.card_last4.substring(2,4) : '****' + subscription.card_last4}`
                                      )}
                                    </Text>
                                 </View>
                              </View>

                              {!subLoading && subscription?.status === 'active' && (
                                 <View className="mb-6">
                                    <View className="flex-row justify-between items-center mb-3">
                                       <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Koha e mbetur</Text>
                                       <Text className={`font-black text-xs ${subscription.daysRemaining < 7 ? 'text-rose-500' : 'text-[#3473ef]'}`}>{subscription.daysRemaining} ditë</Text>
                                    </View>
                                    <View className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                       <View
                                          className={`h-full rounded-full ${subscription.daysRemaining < 7 ? 'bg-rose-500' : 'bg-[#3473ef]'}`}
                                          style={{ width: `${Math.min(100, (subscription.daysRemaining / 30) * 100)}%` }}
                                       />
                                    </View>
                                 </View>
                              )}
                           </View>

                           <TouchableOpacity
                              onPress={handleUpdateCard}
                              disabled={subLoading}
                              className={`bg-slate-50 py-5 items-center justify-center border-t border-slate-100 active:bg-slate-100 ${subLoading ? 'opacity-50' : ''}`}
                           >
                              <View className="flex-row items-center">
                                 <RefreshCw size={14} color="#64748B" />
                                 <Text className="text-slate-500 font-black text-[11px] uppercase tracking-widest ml-2">Përditëso / Shto Kartelën 💳</Text>
                              </View>
                           </TouchableOpacity>
                        </View>

                        <View className="gap-y-4">
                           {(subscription?.status === 'expired' || subscription?.status === 'past_due' || !subscription) ? (
                              <TouchableOpacity
                                 onPress={() => setActiveModal('plans')}
                                 className="bg-[#161719] h-16 rounded-[24px] flex-row items-center justify-center shadow-xl shadow-black/20"
                              >
                                 <TrendingUp size={20} color="white" className="mr-3" />
                                 <Text className="text-white font-black text-base">Rinovoni Abonimin</Text>
                              </TouchableOpacity>
                           ) : (
                              <>
                                 {isCancelled ? (
                                    <View className="gap-y-3">
                                       <TouchableOpacity
                                          onPress={handleReactivateAutoRenewal}
                                          disabled={loading}
                                          className="bg-emerald-500 h-16 rounded-[24px] flex-row items-center justify-center shadow-lg shadow-emerald-200"
                                       >
                                          {loading ? (
                                            <View className="flex-row items-center">
                                              <ActivityIndicator color="white" />
                                              <Text className="text-white font-black text-base ml-3">Duke aktivizuar rinovimin...</Text>
                                            </View>
                                          ) : (
                                            <>
                                              <RefreshCw size={20} color="white" className="mr-3" />
                                              <Text className="text-white font-black text-base">Aktivizo Rinovimin Automatik</Text>
                                            </>
                                          )}
                                       </TouchableOpacity>
                                    </View>
                                 ) : (
                                    <TouchableOpacity
                                       onPress={handleCancelAutoRenewal}
                                       disabled={loading}
                                       className="bg-rose-50 h-16 rounded-[24px] flex-row items-center justify-center border border-rose-100"
                                    >
                                       {loading ? (
                                         <View className="flex-row items-center">
                                           <ActivityIndicator color="#F43F5E" />
                                           <Text className="text-rose-500 font-black text-base ml-3">Duke anuluar rinovimin...</Text>
                                         </View>
                                       ) : (
                                         <>
                                           <X size={20} color="#F43F5E" className="mr-3" />
                                           <Text className="text-rose-500 font-black text-base">Anulo Rinovimin Automatik</Text>
                                         </>
                                       )}
                                    </TouchableOpacity>
                                 )}

                                 <TouchableOpacity
                                    onPress={() => setActiveModal('plans')}
                                    className="bg-white h-16 rounded-[24px] flex-row items-center justify-center border border-slate-100 shadow-sm"
                                 >
                                    <TrendingUp size={20} color="#161719" className="mr-3" />
                                    <Text className="text-[#161719] font-black text-base">Ndrysho Planin</Text>
                                 </TouchableOpacity>
                              </>
                           )}
                        </View>

                        {subscription?.cancel_at_period_end && (
                           <View className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 mt-8">
                              <View className="flex-row items-center mb-2">
                                 <AlertTriangle size={18} color="#D97706" />
                                 <Text className="text-amber-800 font-black text-sm ml-2">Abonimi po skadon!</Text>
                              </View>
                              <Text className="text-amber-700 font-bold text-xs leading-5">
                                 Ju keni ndalur rinovimin automatik. Salloni juaj do të jetë i dukshëm deri më {new Date(subscription.end_date).toLocaleDateString('sq-AL')}. Pas kësaj date, të dhënat tuaja do të ruhen por salloni nuk do të shfaqet për klientët.
                              </Text>
                           </View>
                        )}
                      </>
                    )}

                    {/* DEBUG INFO - SMALL AND SUBTLE */}
                    <View className="mt-12 items-center opacity-30">
                       <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">
                          Debug: {subscription?.status || 'no_sub'} | {subscription?.plan_id || 'no_id'} | {subscription?.paddle_subscription_id ? String(subscription.paddle_subscription_id).substring(0, 10) : 'no_paddle_id'} | U:{user?.id ? String(user.id).substring(0, 8) : 'null'} | B:{realShopId ? String(realShopId).substring(0, 8) : 'null'}
                       </Text>
                       {(!subscription || subscription.status === 'expired') && (
                         <TouchableOpacity onPress={() => refreshSub()} className="mt-2">
                           <Text className="text-[8px] font-bold text-blue-500 uppercase">Rifresko Sinkronizimin</Text>
                         </TouchableOpacity>
                       )}
                    </View>
                  </ScrollView>
                </View>
              )}

              {activeModal === 'plans' && (
                <View className="flex-1">
                   <View className="flex-row justify-between items-center mb-10">
                    <TouchableOpacity onPress={() => setActiveModal('subManagement')} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm"><ChevronLeft size={24} color="#161719" /></TouchableOpacity>
                    <Text className="text-3xl font-black text-[#161719]">{upgradeStep === 1 ? 'Planet' : 'Pagesa'}</Text>
                    <TouchableOpacity onPress={() => setActiveModal(null)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm"><X size={24} color="#161719" /></TouchableOpacity>
                  </View>

                  {upgradeStep === 1 ? (
                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                      <View className="gap-y-6">
                        {REGISTRATION_PLANS.map((plan) => {
                          const isTeam = plan.id === 'team';
                          const displayPrice = isTeam ? `${calculateTeamPrice(teamEmployeeCount)}€` : `${plan.prices.month}€`;
                          const isActuallyActive = subscription?.status === 'active' || subscription?.status === 'trialing' || subscription?.status === 'past_due';

                          // Aggressive matching: check local ID, Paddle Product ID, and Name
                          const isCurrent = (
                            subscription?.plan_id === plan.id ||
                            subscription?.plan_id === PADDLE_CONFIG.PRODUCTS[plan.id as keyof typeof PADDLE_CONFIG.PRODUCTS] ||
                            subscription?.plan_name?.toLowerCase() === plan.name.toLowerCase()
                          ) && isActuallyActive && !subLoading;

                          return (
                           <View key={plan.id} className={`bg-white p-6 rounded-[32px] shadow-sm border ${isCurrent ? 'border-[#3473ef] bg-[#3473ef]/5' : 'border-transparent'}`}>
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
                                disabled={isCurrent || isPreparingUpgrade}
                                onPress={() => handleStartUpgrade(plan)}
                                className={`h-14 rounded-2xl items-center justify-center ${isCurrent ? 'bg-slate-100' : 'bg-[#161719]'}`}
                              >
                                {isPreparingUpgrade && selectedUpgradePlan?.id === plan.id ? (
                                  <ActivityIndicator color="white" />
                                ) : (
                                  <Text className={`font-black text-sm ${isCurrent ? 'text-slate-400' : 'text-white'}`}>
                                    {isCurrent ? 'Plani juaj aktual' : 'Zgjidhni këtë Plan'}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  ) : (
                    <View className="flex-1">
                      <View className="mb-6 px-2">
                        <Text className="text-slate-500 font-bold text-sm text-center">
                          Duke hapur dritaren e sigurt për planin <Text className="text-[#3473ef] font-black">{selectedUpgradePlan?.name}</Text>
                        </Text>
                      </View>
                      <View className="flex-1 bg-white rounded-[40px] overflow-hidden border border-slate-100 shadow-2xl">
                        <PaddleCheckout
                          email={user.email}
                          transactionId={upgradeTransactionId || undefined}
                          onSuccess={handleUpgradeSuccess}
                          onCancel={() => setUpgradeStep(1)}
                        />
                      </View>
                    </View>
                  )}
                </View>
              )}

              {activeModal === 'favorites' && (
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-8">
                    <Text className="text-3xl font-black text-[#161719]">Të Ruajtura</Text>
                    <TouchableOpacity onPress={() => setActiveModal(null)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm"><X size={24} color="#161719" /></TouchableOpacity>
                  </View>
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {(() => {
                      const displayFavs = isBusinessRole ? dbFavorites : (dbFavorites.length > 0 ? dbFavorites : (favorites || []));
                      if (displayFavs.length === 0) {
                        return (
                          <View className="items-center justify-center py-20">
                             <Heart size={64} color="#CBD5E1" strokeWidth={1} />
                             <Text className="text-slate-400 font-bold mt-4">
                               {isBusinessRole ? 'Salloni juaj nuk ka ende asnjë favorit.' : 'Nuk keni asnjë sallon të ruajtur.'}
                             </Text>
                          </View>
                        );
                      }

                      return displayFavs.map((fav, i) => {
                        const targetShop = fav.barbershops || fav;
                        if (isBusinessRole && fav.users) {
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

                        const shopImg = targetShop?.image_card || targetShop?.card_image || targetShop?.image_url || targetShop?.cover_image || targetShop?.image || targetShop?.avatar || targetShop?.imageUrl || (Array.isArray(targetShop?.photos) && targetShop.photos[0] ? targetShop.photos[0] : null) || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1000&auto=format&fit=crop&q=80';
                        
                        return (
                          <TouchableOpacity
                            key={i}
                            activeOpacity={0.8}
                            onPress={() => {
                              if (targetShop) {
                                setActiveModal(null);
                                onSelectShop?.(targetShop);
                              }
                            }}
                            className="bg-white p-4 rounded-[28px] flex-row items-center mb-4 border border-slate-100 shadow-sm"
                          >
                            <Image source={{ uri: shopImg }} className="w-16 h-16 rounded-2xl bg-slate-50" />
                            <View className="flex-1 ml-4">
                               <Text className="font-black text-[#161719] text-base">{targetShop?.name || 'Sallon'}</Text>
                               <Text className="text-slate-400 font-bold text-xs">{targetShop?.city || 'Kosovë'}</Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => {
                                if (targetShop) {
                                  onToggleFavorite?.(targetShop);
                                }
                              }}
                              className="p-3 bg-rose-50 rounded-full"
                            >
                              <Heart size={18} color="#ef4444" fill="#ef4444" />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        );
                      });
                    })()}
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

                  <ScrollView showsVerticalScrollIndicator={false} className="flex-1" keyboardShouldPersistTaps="handled">
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
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <View className="gap-y-4">
                      {dbAppointments.length > 0 ? dbAppointments.map((appt, i) => (
                        <View key={i} className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
                           <View className="flex-row justify-between mb-3">
                              <Text className="font-black text-[#161719] text-base">{appt.users?.name || 'Klient'}</Text>
                              {appt.price > 0 && (
                                <Text className="text-[#3473ef] font-black">{appt.price}€</Text>
                              )}
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

                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                        <View className="flex-row items-center justify-between bg-white p-6 rounded-[28px]">
                          <View>
                            <Text className="font-black text-[#161719]">Njoftimet për Rezervime</Text>
                            <Text className="text-slate-400 font-bold text-xs mt-1">Kur dikush rezervon ose anulon</Text>
                          </View>
                          <Switch
                            value={notifSettings.bookings}
                            onValueChange={(val) => toggleNotification('bookings', val)}
                          />
                        </View>
                        <View className="flex-row items-center justify-between bg-white p-6 rounded-[28px]">
                          <View>
                            <Text className="font-black text-[#161719]">Njoftimet për të Ruajtura</Text>
                            <Text className="text-slate-400 font-bold text-xs mt-1">Kur dikush ruan sallonin tuaj</Text>
                          </View>
                          <Switch
                            value={notifSettings.favorites}
                            onValueChange={(val) => toggleNotification('favorites', val)}
                          />
                        </View>
                        <View className="flex-row items-center justify-between bg-white p-6 rounded-[28px]">
                          <View>
                            <Text className="font-black text-[#161719]">Përditësimet e Sistemit</Text>
                            <Text className="text-slate-400 font-bold text-xs mt-1">Lajme dhe rregullime të rëndësishme</Text>
                          </View>
                          <Switch
                            value={notifSettings.system}
                            onValueChange={(val) => toggleNotification('system', val)}
                          />
                        </View>
                      </View>
                    )}

                    {settingsView === 'password' && (
                      <View className="gap-y-6">
                        <View>
                          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email (Llogaria)</Text>
                          <TextInput value={user.email} editable={false} className="bg-slate-100 h-14 rounded-2xl px-5 font-bold text-slate-400" />
                        </View>
                        <View>
                          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fjalëkalimi i Ri</Text>
                          <TextInput
                            secureTextEntry
                            placeholder="••••••••"
                            className="bg-white h-14 rounded-2xl px-5 font-bold border border-slate-100"
                            value={newPassword}
                            onChangeText={setNewPassword}
                          />
                        </View>
                        <View>
                          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Konfirmo Fjalëkalimin</Text>
                          <TextInput
                            secureTextEntry
                            placeholder="••••••••"
                            className="bg-white h-14 rounded-2xl px-5 font-bold border border-slate-100"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                          />
                        </View>
                        <TouchableOpacity
                          onPress={handleUpdatePassword}
                          disabled={updatingPassword}
                          className={`bg-black h-16 rounded-2xl items-center justify-center mt-4 ${updatingPassword ? 'opacity-70' : ''}`}
                        >
                          {updatingPassword ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">Ndrysho Fjalëkalimin</Text>}
                        </TouchableOpacity>
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
                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
                    <View className="gap-y-6">
                      <View className="bg-blue-50 p-6 rounded-[28px] border border-blue-100 flex-row items-center"><Headphones size={24} color="#3473ef" /><View className="ml-4"><Text className="font-black text-[#161719]">Na Kontaktoni</Text><Text className="text-slate-400 font-bold text-xs mt-0.5">Përgjigje brenda 24 orëve</Text></View></View>
                      <View><Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Subjekti</Text><TextInput value={supportSubject} onChangeText={setSupportSubject} placeholder="Psh. Problem me pagesë" className="bg-white h-14 rounded-2xl px-5 font-bold border border-slate-100" /></View>
                      <View><Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mesazhi</Text><TextInput value={supportMessage} onChangeText={setSupportMessage} multiline numberOfLines={5} placeholder="Shkruani mesazhin tuaj këtu..." className="bg-white h-32 rounded-2xl px-5 py-4 font-bold border border-slate-100 text-left align-top" style={{ textAlignVertical: 'top' }} /></View>
                      <TouchableOpacity onPress={handleSendSupportMessage} disabled={sendingSupport} className={`bg-[#3473ef] h-16 rounded-2xl items-center justify-center shadow-lg shadow-blue-200 mt-4 ${sendingSupport ? 'opacity-70' : ''}`}>
                        {sendingSupport ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">Dërgo Mesazhin</Text>}
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
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
                <View className="flex-1 flex-col overflow-hidden">
                  <View className="flex-row justify-between items-center pb-4 mb-4 border-b border-slate-100 shrink-0">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3">
                        <Clock size={22} color="#6366f1" />
                      </View>
                      <View>
                        <Text className="text-2xl font-black text-[#161719]">Orari & Festat</Text>
                        <Text className="text-slate-400 font-bold text-xs">Përcakto orët e punës dhe shiko festat</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setActiveModal(null)} className="p-2.5 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors cursor-pointer">
                      <X size={20} color="#161719" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                    <View className="mb-8">
                      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Orari i Sallonit</Text>
                      <View className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                        {['E Hënë', 'E Martë', 'E Mërkurë', 'E Enjte', 'E Premte', 'E Shtunë', 'E Diel'].map((day, idx) => {
                          const daySched = localShopSchedule.find(s => s.day_of_week === idx) || { is_closed: idx === 6, start_time: '09:00', end_time: '18:00' };
                          const isWorking = !daySched.is_closed;

                          return (
                            <View key={idx} className={`py-4 ${idx < 6 ? 'border-b border-slate-50' : ''}`}>
                              <View className="flex-row items-center justify-between">
                                <Text className="font-black text-[#161719] text-sm">{day}</Text>
                                <View className="flex-row items-center gap-3">
                                  {!isWorking && (
                                    <Text className="text-rose-500 font-black text-[10px] uppercase mr-2">Mbyllur</Text>
                                  )}
                                  <Switch
                                    value={isWorking}
                                    onValueChange={() => toggleDayScheduleLocal(idx, daySched.is_closed)}
                                    trackColor={{ false: '#e2e8f0', true: '#3473ef' }}
                                  />
                                </View>
                              </View>

                              {isWorking && (
                                <View className="flex-row items-center gap-x-3 mt-3">
                                  <View className="flex-1">
                                    <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nga</Text>
                                    <TextInput
                                      value={daySched.start_time}
                                      onChangeText={(val) => updateDayTimeLocal(idx, 'start_time', val)}
                                      placeholder="09:00"
                                      className="bg-slate-50 h-10 rounded-xl px-3 font-bold border border-slate-100 text-center text-[#161719]"
                                    />
                                  </View>
                                  <View className="flex-1">
                                    <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Deri</Text>
                                    <TextInput
                                      value={daySched.end_time}
                                      onChangeText={(val) => updateDayTimeLocal(idx, 'end_time', val)}
                                      placeholder="18:00"
                                      className="bg-slate-50 h-10 rounded-xl px-3 font-bold border border-slate-100 text-center text-[#161719]"
                                    />
                                  </View>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    <View className="mb-10">
                      <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Festat Zyrtare - Preferencat e Punës</Text>
                      <View className="bg-white rounded-[32px] p-2 shadow-sm border border-slate-100">
                         {KOSOVO_HOLIDAYS_2026.map((h, i) => {
                           const isWorking = localHolidayPrefs[h.name] || false;
                           return (
                             <View key={i} className={`flex-row items-center p-5 ${i < KOSOVO_HOLIDAYS_2026.length - 1 ? 'border-b border-slate-50' : ''}`}>
                                <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center mr-4">
                                  <Text className="text-2xl">{h.icon}</Text>
                                </View>
                                <View className="flex-1">
                                  <Text className="font-black text-[#161719] text-base">{h.name}</Text>
                                  <Text className="text-[#3473ef] font-black text-[10px] uppercase tracking-wider mt-1">{h.date}</Text>
                                </View>
                                <View className="items-center">
                                  <Text className={`text-[8px] font-black uppercase mb-1 ${isWorking ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    {isWorking ? 'Punoj' : 'Pushim'}
                                  </Text>
                                  <Switch
                                    value={isWorking}
                                    onValueChange={() => toggleHolidayLocal(h.name, isWorking)}
                                    trackColor={{ false: '#e2e8f0', true: '#10b981' }}
                                  />
                                </View>
                             </View>
                           );
                         })}
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={handleSaveOrari}
                      disabled={savingOrari}
                      className="bg-[#3473ef] h-16 rounded-[24px] items-center justify-center shadow-lg shadow-blue-200 mb-10"
                    >
                      {savingOrari ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">Ruaj Ndryshimet</Text>}
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}

              {activeModal === 'employeeServices' && (
                 <View className="flex-1 flex-col overflow-hidden">
                   <View className="flex-row justify-between items-center pb-4 mb-4 border-b border-slate-100 shrink-0">
                     <View className="flex-row items-center">
                       <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3">
                         <FileText size={22} color="#6366f1" />
                       </View>
                       <View>
                         <Text className="text-2xl font-black text-[#161719]">Lista e Shërbimeve</Text>
                         <Text className="text-slate-400 font-bold text-xs">Aktivizo shërbimet që ofroni në sallon</Text>
                       </View>
                     </View>
                     <TouchableOpacity onPress={() => setActiveModal(null)} className="p-2.5 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors cursor-pointer">
                       <X size={20} color="#161719" />
                     </TouchableOpacity>
                   </View>

                   <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                     {categories.map((cat) => {
                       const catSubs = subcategories.filter(s => s.category_id === cat.id)
                       if (catSubs.length === 0) return null

                       const isExpanded = expandedCategories.includes(cat.id);
                       const selectedCount = catSubs.filter(s => selectedEmployeeSubcats.includes(s.id)).length;

                       return (
                         <View key={cat.id} className="mb-4">
                           <TouchableOpacity
                             activeOpacity={0.7}
                             onPress={() => {
                               setExpandedCategories(isExpanded ? [] : [cat.id]);
                               Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                             }}
                             className={`flex-row items-center justify-between p-5 rounded-[24px] border ${isExpanded ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100 shadow-sm'}`}
                           >
                             <View className="flex-row items-center flex-1">
                               <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isExpanded ? 'bg-white' : 'bg-slate-50'}`}>
                                 <Briefcase size={20} color={isExpanded ? '#3473ef' : '#94A3B8'} />
                               </View>
                               <View>
                                 <Text className={`text-base font-black ${isExpanded ? 'text-[#161719]' : 'text-[#161719]'}`}>{cat.name}</Text>
                                 {selectedCount > 0 && (
                                   <Text className="text-[10px] font-black text-[#3473ef] uppercase tracking-widest mt-0.5">{selectedCount} shërbime të zgjedhura</Text>
                                 )}
                               </View>
                             </View>
                             <View className={`w-8 h-8 rounded-full items-center justify-center ${isExpanded ? 'bg-indigo-100' : 'bg-slate-50'}`}>
                               {isExpanded ? <ChevronDown size={18} color="#3473ef" /> : <ChevronRight size={18} color="#94A3B8" />}
                             </View>
                           </TouchableOpacity>

                           {isExpanded && (
                             <Animated.View entering={FadeInDown} className="mt-2 bg-white rounded-[32px] p-2 shadow-sm border border-slate-100">
                               {catSubs.map((sub, idx) => {
                                 const isChecked = selectedEmployeeSubcats.includes(sub.id)
                                 const currentDuration = serviceDurations[sub.id] || 30;
                                 const currentPrice = servicePrices[sub.id] || 0;
                                 const isShopService = shopOfferedServiceIds.includes(String(sub.id).trim());

                                 return (
                                   <View
                                     key={sub.id}
                                     className={`p-4 ${idx < catSubs.length - 1 ? 'border-b border-slate-50' : ''}`}
                                   >
                                     <TouchableOpacity
                                       onPress={() => toggleEmployeeService(sub.id, currentDuration)}
                                       className="flex-row items-center justify-between"
                                     >
                                       <View className="flex-1 pr-3">
                                         <View className="flex-row items-center flex-wrap gap-2 mb-1">
                                            <Text className="font-bold text-[#161719] text-sm">{sub.name}</Text>
                                            {isShopService && (
                                              <View className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                <Text className="text-emerald-600 font-black text-[8px] uppercase">Zgjedhur nga Salloni</Text>
                                              </View>
                                            )}
                                         </View>
                                         <Text className="text-xs font-semibold text-[#3473ef]">
                                           ⏱️ {currentDuration} min {currentPrice > 0 ? `• 💰 ${currentPrice}€` : ''}
                                         </Text>
                                       </View>
                                       <View className={`w-7 h-7 rounded-full border items-center justify-center ${isChecked ? 'bg-[#3473ef] border-[#3473ef]' : 'border-slate-200 bg-slate-50'}`}>
                                         {isChecked && <Check size={16} color="white" strokeWidth={3} />}
                                       </View>
                                     </TouchableOpacity>

                                     {isChecked && (
                                       <View className="mt-4 pt-4 border-t border-slate-100">
                                         <View className="flex-row items-center mb-3">
                                           <Clock size={13} color="#3473ef" />
                                           <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1.5">Zgjidh kohëzgjatjen e punës:</Text>
                                         </View>

                                         <View className="flex-row items-center gap-x-2">
                                           <TouchableOpacity
                                             onPress={() => updateServiceDuration(sub.id, Math.max(5, currentDuration - 5))}
                                             className="w-10 h-10 bg-slate-100 rounded-xl items-center justify-center active:bg-slate-200 shadow-sm"
                                           >
                                             <Text className="font-black text-xl text-[#161719]">-</Text>
                                           </TouchableOpacity>

                                           <View className="flex-row items-center h-10 rounded-xl px-4 border border-[#3473ef] bg-[#3473ef]/5 shadow-sm">
                                             <TextInput
                                               keyboardType="numeric"
                                               value={currentDuration > 0 ? String(currentDuration) : ''}
                                               onChangeText={(text) => {
                                                 const cleanText = text.replace(/[^0-9]/g, '')
                                                 const num = parseInt(cleanText, 10)
                                                 if (!isNaN(num) && num > 0) {
                                                   updateServiceDuration(sub.id, num)
                                                 } else if (cleanText === '') {
                                                   setServiceDurations(prev => ({...prev, [sub.id]: 0}))
                                                 }
                                               }}
                                               className="font-black text-sm text-[#161719] min-w-[40px] text-center p-0"
                                               placeholder="0"
                                               placeholderTextColor="#94a3b8"
                                             />
                                             <Text className="text-[11px] font-black text-[#3473ef] ml-1">min</Text>
                                           </View>

                                           <TouchableOpacity
                                             onPress={() => updateServiceDuration(sub.id, currentDuration + 5)}
                                             className="w-10 h-10 bg-slate-100 rounded-xl items-center justify-center active:bg-slate-200 shadow-sm"
                                           >
                                             <Text className="font-black text-xl text-[#161719]">+</Text>
                                           </TouchableOpacity>
                                         </View>

                                         {/* Price Section */}
                                         <View className="flex-row items-center mb-3 mt-6">
                                           <DollarSign size={13} color="#3473ef" />
                                           <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1.5">Çmimi i punës (Opsionale):</Text>
                                         </View>

                                         <View className="flex-row items-center h-12 rounded-2xl px-4 border border-slate-100 bg-white shadow-sm">
                                             <TextInput
                                               keyboardType="numeric"
                                               value={currentPrice > 0 ? String(currentPrice) : ''}
                                               onChangeText={(text) => {
                                                 const cleanText = text.replace(/[^0-9]/g, '')
                                                 const num = parseInt(cleanText, 10)
                                                 updateServicePrice(sub.id, isNaN(num) ? 0 : num)
                                               }}
                                               className="font-black text-sm text-[#161719] flex-1"
                                               placeholder="Shëno çmimin (psh. 10)"
                                               placeholderTextColor="#94a3b8"
                                             />
                                             <Text className="text-[11px] font-black text-[#3473ef] ml-2">EUR (€)</Text>
                                         </View>
                                       </View>
                                     )}
                                   </View>
                                 )
                               })}
                             </Animated.View>
                           )}
                         </View>
                       )
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

                   <ScrollView showsVerticalScrollIndicator={false} className="flex-1" keyboardShouldPersistTaps="handled">
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
                   </ScrollView>
                 </View>
               )}

             </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const ProfileMenuButton = ({ icon: Icon, label, isLast, onPress, rightElement }: any) => {
  return (
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
};
