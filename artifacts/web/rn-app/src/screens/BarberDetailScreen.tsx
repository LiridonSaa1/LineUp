import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable, Image, Dimensions, Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard, Linking, Share } from "react-native";
import { ArrowLeft, Share2, Star, MapPin, Phone, MessageSquare, Compass, Globe, Heart, Calendar, Check, X, User as UserIcon, Clock, Scissors as ScissorsIcon, Mail, Lock, ChevronRight, Hash, AlertCircle, Instagram, Sparkles } from "lucide-react-native";
import Animated, { FadeInUp, FadeIn, FadeInDown } from "react-native-reanimated";
import { supabase } from "@/config/supabase";
import { getShopCardImage } from "../utils/imageUtils";
import { sendTwilioOTP, verifyTwilioOTP } from "@/config/twilio";
import { DEFAULT_CATEGORIES, DEFAULT_SUBCATEGORIES } from "../config/defaultCategories";
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get("window");

interface BarberDetailScreenProps {
  shop: any;
  user: any;
  onLogin: (userData: any) => void;
  onBack: () => void;
  favorites?: any[];
  onToggleFavorite?: (shop: any) => void;
}

const SERVICE_ICONS: Record<string, any> = {
  'Qethet & Stilizim': ScissorsIcon,
  'Mjekërr & Rrojë': UserIcon,
  'Pako Combo (Flokë + Mjekërr)': Star,
  'Trajtime Fytyre & Larje': Sparkles,
  'Shërbime Standarde': ScissorsIcon,
  'Të tjera': ScissorsIcon
};

export const BarberDetailScreen: React.FC<BarberDetailScreenProps> = ({ shop, user, onLogin, onBack, favorites = [], onToggleFavorite }) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedBarberSchedule, setSelectedBarberSchedule] = useState<any[]>([]);
  const [availableSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [groupedServices, setGroupedServices] = useState<{ [key: string]: any[] }>({});
  const [loadingServices, setLoadingServices] = useState(false);
  const [calendarDates, setCalendarDates] = useState<any[]>([]);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [activePhotoCategory, setActivePhotoCategory] = useState("Të gjitha");
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [isFavLocal, setIsFavLocal] = useState<boolean>(() => {
    return favorites?.some(f => f.shop_id === shop?.id || f.shop_id === Number(shop?.id)) || false;
  });

  // Auth & OTP states
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    setIsFavLocal(favorites?.some(f => f.shop_id === shop?.id || f.shop_id === Number(shop?.id)) || false);
  }, [favorites, shop]);

  const handleFavoriteToggle = async () => {
    const nextFavState = !isFavLocal;
    setIsFavLocal(nextFavState);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}

    if (onToggleFavorite) {
      onToggleFavorite(shop);
    }

    if (user?.id && shop?.id) {
      try {
        if (nextFavState) {
          const { error } = await supabase.from('favorites').upsert({ user_id: user.id, shop_id: shop.id });
          if (error) {
            await supabase.from('favorites').upsert({ user_id: user.id, shop_id: String(shop.id) });
          }
          Alert.alert("Ruajtur", "Salloni u ruajt me sukses tek 'Të Ruajtura' në profil!");
        } else {
          await supabase.from('favorites').delete().eq('user_id', user.id).eq('shop_id', shop.id);
          Alert.alert("Hequr", "Salloni u hoq nga të ruajturat.");
        }
      } catch (e) {
        console.warn("Error updating favorite in Supabase:", e);
      }
    } else {
      Alert.alert("Të ruajtura", nextFavState ? "Salloni u ruajt te faqja e profilit!" : "Salloni u hoq nga të ruajtura.");
    }
  };

  const handleShare = async () => {
    try {
      const name = shop?.name || "Sallon Berberie";
      const city = shop?.city ? ` në ${shop.city}` : "";
      const address = shop?.address ? `, ${shop.address}` : "";
      
      await Share.share({
        title: name,
        message: `Rezervo takimin tënd në sallonin "${name}"${city}${address} me aplikacionin LineUp!`,
        url: shop?.website || `https://lineup.ks/barbershops/${shop?.id}`
      });
    } catch (e) {
      console.warn("Share error:", e);
    }
  };

  const safeOpenUrl = async (url: string, fallbackMessage: string = "Nuk mund të hapej lidhja.") => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }

      const supported = await Linking.canOpenURL(url).catch(() => false);
      if (supported) {
        await Linking.openURL(url);
      } else {
        if (url.startsWith('tel:')) {
          Alert.alert("Numri i Telefonit", `Numri: ${url.replace('tel:', '')}`);
        } else if (typeof window !== 'undefined') {
          window.open(url, '_blank');
        } else {
          Alert.alert("Informacion", fallbackMessage);
        }
      }
    } catch (err) {
      console.warn("Failed to open URL:", url, err);
      if (url.startsWith('tel:')) {
        Alert.alert("Numri i Telefonit", `Numri: ${url.replace('tel:', '')}`);
      } else {
        Alert.alert("Informacion", fallbackMessage);
      }
    }
  };

  const [bookingOtpSent, setBookingOtpSent] = useState(false);
  const [bookingOtpCode, setBookingOtpCode] = useState("");
  const [verifyingBookingOtp, setVerifyingBookingOtp] = useState(false);

  useEffect(() => {
    if (user) {
      async function loadUserPhone() {
        const { data } = await supabase
          .from('users')
          .select('phone')
          .eq('id', user.id)
          .maybeSingle();
        if (data?.phone) {
          setPhone(data.phone);
        }
      }
      loadUserPhone();
    }
  }, [user]);

  const sendTwilioOtp = async () => {
    const targetPhone = phone || user?.phone;
    if (!targetPhone) {
      Alert.prompt(
        "Numri i Telefonit",
        "Ju lutem shkruani numrin tuaj të telefonit për të marrë kodin e verifikimit OTP:",
        [
          { text: "Anulo", style: "cancel" },
          {
            text: "Dërgo OTP",
            onPress: (val?: string) => {
              if (val) {
                setPhone(val);
                triggerTwilioOtpSend(val);
              }
            }
          }
        ]
      );
      return;
    }
    triggerTwilioOtpSend(targetPhone);
  };

  const triggerTwilioOtpSend = async (num: string) => {
    Keyboard.dismiss();
    setLoading(true);
    try {
      await sendTwilioOTP(num);
      console.log(`Twilio OTP sent successfully to ${num}`);
      setBookingOtpSent(true);
      Alert.alert("SMS e Dërguar", `Kemi dërguar kodin e verifikimit në numrin tuaj: ${num}`);
      return true;
    } catch (err: any) {
      Alert.alert("Gabim", err.message || "Dështoi dërgimi i SMS verifikimit.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyTwilioOtpAndSubmit = async () => {
    Keyboard.dismiss();
    if (!bookingOtpCode) {
      Alert.alert("Gabim", "Ju lutem shkruani kodin OTP.");
      return;
    }
    setVerifyingBookingOtp(true);
    try {
      const targetPhone = phone || user?.phone;
      if (!targetPhone) throw new Error("Numri i telefonit nuk u gjet.");

      await verifyTwilioOTP(targetPhone, bookingOtpCode);

      await handleBookingSubmit();
      setBookingOtpSent(false);
      setBookingOtpCode("");
    } catch (err: any) {
      Alert.alert("Gabim", err.message || "Kodi i verifikimit është i pasaktë.");
    } finally {
      setVerifyingBookingOtp(false);
    }
  };

  const DEFAULT_SHOP_SERVICES = [
    { id: 'srv_1', name: "Prerje Flokësh", price: 10, duration: "30 min", durationMinutes: 30 },
    { id: 'srv_2', name: "Formësim Mjekre", price: 5, duration: "20 min", durationMinutes: 20 },
    { id: 'srv_3', name: "Combo VIP (Flokë + Mjekërr)", price: 15, duration: "45 min", durationMinutes: 45 },
    { id: 'srv_4', name: "Peshqir i Nxehtë & Rrojë", price: 7, duration: "25 min", durationMinutes: 25 },
    { id: 'srv_5', name: "Maskë e Zezë & Larje", price: 6, duration: "20 min", durationMinutes: 20 }
  ];

  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const toggleCategoryExpand = (catName: string) => {
    setExpandedCategories(prev => ({ ...prev, [catName]: prev[catName] === false ? true : false }));
  };

  useEffect(() => {
    async function fetchServices() {
      setLoadingServices(true);
      try {
        const [{ data: allSubcats }, { data: allCats }] = await Promise.all([
          supabase.from('subcategories').select('*'),
          supabase.from('categories').select('*')
        ]);

        const subcatMap = new Map();
        (allSubcats || []).forEach(sc => subcatMap.set(String(sc.id).trim(), sc));

        const catMap = new Map();
        (allCats || []).forEach(c => catMap.set(String(c.id).trim(), c.name));

        let finalServices: any[] = [];

        // 1. If we have a selected barber, try to get their specific services first
        if (selectedEmployee) {
          const barberId = selectedEmployee.user_id || selectedEmployee.id;
          const { data: barberServices } = await supabase
            .from('barber_services')
            .select('*')
            .eq('barber_id', barberId);

          if (barberServices && barberServices.length > 0) {
            finalServices = barberServices.map((bs, idx) => {
              const sc = subcatMap.get(String(bs.subcategory_id).trim());
              const catName = catMap.get(String(sc?.category_id).trim()) || "Shërbime";
              return {
                id: bs.subcategory_id || bs.id || `barber_srv_${idx}`,
                name: sc?.name || bs.name || "Shërbim",
                price: parseFloat(String(bs.price)) || 0,
                duration: `${bs.duration_minutes || sc?.duration_minutes || 30} min`,
                durationMinutes: bs.duration_minutes || sc?.duration_minutes || 30,
                category: catName
              };
            });
          }
        }

        // 2. Fallback: Load services from the Shop's subcategories list (Always visible on profile)
        if (finalServices.length === 0) {
          const shopSubIds = shop?.subcategories || [];
          if (Array.isArray(shopSubIds) && shopSubIds.length > 0) {
            finalServices = shopSubIds.map((scId, idx) => {
              const sc = subcatMap.get(String(scId).trim());
              const catName = catMap.get(String(sc?.category_id).trim()) || "Shërbime";
              const price = parseFloat(String(sc?.estimated_price)) || 0;
              return {
                id: scId || `shop_srv_${idx}`,
                name: sc?.name || "Shërbim",
                price: price,
                duration: `${sc?.duration_minutes || 30} min`,
                durationMinutes: sc?.duration_minutes || 30,
                category: catName
              };
            });
          }
        }

        // 3. Static fallback
        if (finalServices.length === 0) {
          finalServices = DEFAULT_SHOP_SERVICES.map(s => ({ ...s, category: "Shërbime Standarde" }));
        }

        const grouped: any = {};
        finalServices.forEach(m => {
          if (!grouped[m.category]) grouped[m.category] = [];
          grouped[m.category].push(m);
        });
        setAvailableServices(finalServices);
        setGroupedServices(grouped);
      } catch (e) {
        console.warn("Error loading services:", e);
      } finally {
        setLoadingServices(false);
      }
    }
    fetchServices();
  }, [selectedEmployee, shop?.id, shop?.subcategories]);

  const isServiceSelected = useCallback((srv: any) => {
    if (!srv || !srv.id) return false;
    return selectedServices.some(s => s && String(s.id) === String(srv.id));
  }, [selectedServices]);

  const handleToggleService = (srv: any) => {
    if (!srv || !srv.id) return;
    const srvId = String(srv.id);

    setSelectedServices(prev => {
      const isSelected = prev.some(s => s && String(s.id) === srvId);
      if (isSelected) {
        return prev.filter(s => s && String(s.id) !== srvId);
      } else {
        return [...prev, srv];
      }
    });

    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
  };

  useEffect(() => {
    async function loadShopData() {
      if (!shop?.id) return;
      try {
        const { data: barbers } = await supabase
          .from('barbers')
          .select('*')
          .eq('shop_id', shop.id);

        if (barbers) setStaff(barbers);
      } catch (e) {
        console.warn("Error loading barbers:", e);
      }
    }
    async function fetchReviews() {
      setLoadingReviews(true);
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select(`
            *,
            users (
              name
            )
          `)
          .eq('shop_id', shop.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReviews(data || []);
      } catch (e) {
        console.error("Error fetching reviews:", e);
      } finally {
        setLoadingReviews(false);
      }
    }
    loadShopData();
    fetchReviews();
  }, [shop]);

  const MOCK_SERVICES = [
    { id: 1, name: "Prerje Flokësh", price: 15, duration: "30 min" },
    { id: 2, name: "Rregullim Mjekrre", price: 10, duration: "15 min" },
    { id: 3, name: "Flokë & Mjekërr", price: 22, duration: "45 min" },
    { id: 4, name: "Larje & Stilim", price: 8, duration: "20 min" }
  ];

  const [bookedAppointments, setBookedAppointments] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBookedAppointments() {
      if (!shop?.id || !selectedEmployee?.id || !selectedDate) {
        setBookedAppointments([]);
        return;
      }
      try {
        const { data } = await supabase
          .from('appointments')
          .select('time, service')
          .eq('shop_id', shop.id)
          .eq('barber_id', selectedEmployee.id)
          .eq('date', selectedDate)
          .neq('status', 'cancelled');

        if (data) {
          setBookedAppointments(data);
        } else {
          setBookedAppointments([]);
        }
      } catch (e) {
        console.warn("Error fetching booked appointments:", e);
      }
    }
    fetchBookedAppointments();
  }, [shop, selectedEmployee, selectedDate]);

  const totalDurationMinutes = selectedServices.reduce((sum, s) => sum + (s.durationMinutes || parseInt(String(s.duration)) || 30), 0) || 30;

  const timeToMins = (tStr: string) => {
    if (!tStr) return 0;
    const parts = tStr.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };

  const isSlotDisabled = useCallback((slotTime: string) => {
    // 1. Disable past slots for today
    const dateObj = calendarDates.find(d => d.fullDate === selectedDate);
    const isToday = dateObj?.label === 'Sot';

    if (isToday) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const slotMins = timeToMins(slotTime);
      if (slotMins < currentMins) return true;
    }

    // 2. Check for overlapping booked appointments
    const candidateStart = timeToMins(slotTime);
    const candidateEnd = candidateStart + totalDurationMinutes;

    for (const app of bookedAppointments) {
      const bookedStart = timeToMins(app.time);
      const bookedDuration = 30; // Default since column is missing in DB
      const bookedEnd = bookedStart + bookedDuration;

      // Overlap condition: candidateStart < bookedEnd AND candidateEnd > bookedStart
      if (candidateStart < bookedEnd && candidateEnd > bookedStart) {
        return true;
      }
    }
    return false;
  }, [bookedAppointments, totalDurationMinutes, selectedDate, calendarDates]);

  const handleBookingSubmit = async (authenticatedUser = user) => {
    if (!authenticatedUser || !selectedEmployee || !selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      const totalMins = totalDurationMinutes;
      const serviceNames = selectedServices.map(s => s.name).join(", ");
      const clientName = authenticatedUser.name || `${firstName} ${lastName}`.trim() || 'Klient i ri';

      const { data: insertedAppt, error } = await supabase.from('appointments').insert({
        shop_id: shop.id,
        user_id: authenticatedUser.id,
        barber_id: selectedEmployee.id,
        date: selectedDate,
        time: selectedTime,
        service: serviceNames,
        status: 'confirmed',
        created_at: new Date().toISOString()
      }).select().maybeSingle();

      if (error) throw error;

      // Send real-time notification to Supabase notifications table for shop & barber
      try {
        await supabase.from('notifications').insert({
          shop_id: shop.id,
          barber_id: selectedEmployee.id,
          type: 'booking',
          title: 'Rezervim i ri takimi 📅',
          message: `${clientName} rezervoi takim te ${selectedEmployee.name} për datën ${selectedDate} në orën ${selectedTime} (${totalMins} min)`,
          created_at: new Date().toISOString()
        });
      } catch (notifErr) {
        console.warn("Notification insert warning:", notifErr);
      }

      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}
      Alert.alert(
        "Sukses! 🎉",
        `Takimi juaj te ${selectedEmployee.name} u konfirmua për datën ${selectedDate} në orën ${selectedTime} (${totalMins} min). Njoftimi u dërgua te berberi!`
      );

      setShowBookingModal(false);
      setBookingStep(1);
      setSelectedEmployee(null);
      setSelectedServices([]);
      setSelectedTime("");
    } catch (e: any) {
      Alert.alert("Gabim në rezervim", e.message || "Dështoi rezervimi.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthAction = async () => {
    Keyboard.dismiss();
    setLoading(true);
    try {
      if (authMode === 'login') {
        const authPromise = supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Lidhja me serverin zgjati shumë. Ju lutem provoni përsëri.")), 10000)
        );

        const { data, error }: any = await Promise.race([authPromise, timeoutPromise]);

        if (error) throw error;

        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();

        const userData = {
          id: dbUser?.id || data.user?.id,
          name: dbUser?.name || email,
          email: email,
          phone: dbUser?.phone,
          role: 'client'
        };
        onLogin(userData);
      } else if (authMode === 'signup') {
        const authPromise = supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: `${firstName} ${lastName}`,
              phone: phone
            }
          }
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Lidhja me serverin zgjati shumë. Ju lutem provoni përsëri.")), 10000)
        );

        const { data, error }: any = await Promise.race([authPromise, timeoutPromise]);

        if (error) throw error;

        const userUuid = data.user?.id;
        if (userUuid) {
          await supabase.from('users').upsert({
            id: userUuid,
            name: `${firstName} ${lastName}`,
            email: email.trim().toLowerCase(),
            phone: phone,
            role: 'client'
          });
        }

        const userData = {
          id: userUuid,
          name: `${firstName} ${lastName}`,
          email: email,
          phone: phone,
          role: 'client'
        };
        onLogin(userData);
      }
    } catch (e: any) {
      Alert.alert("Gabim", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadBarberSchedule() {
      if (!selectedEmployee?.id) return;
      try {
        const { data: schedule } = await supabase
          .from('barber_schedules')
          .select('*')
          .eq('barber_id', selectedEmployee.id);

        if (schedule) {
          setSelectedBarberSchedule(schedule);
          generateAvailableDates(schedule);
        } else {
          // Default schedule if none found
          const defaults = Array.from({ length: 7 }, (_, i) => ({
            day_of_week: i,
            start_time: '09:00',
            end_time: '18:00',
            is_closed: i === 6 // Sunday
          }));
          setSelectedBarberSchedule(defaults);
          generateAvailableDates(defaults);
        }
      } catch (e) {
        console.warn("Error loading schedule:", e);
      }
    }
    loadBarberSchedule();
  }, [selectedEmployee]);

  const generateAvailableDates = (schedule: any[]) => {
    const dates = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const endOfYear = new Date(currentYear, 11, 31); // December 31st
    
    const diffTime = Math.abs(endOfYear.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    for (let i = 0; i < diffDays; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);

      const jsDay = d.getDay();
      const dbDayIndex = jsDay === 0 ? 6 : jsDay - 1;

      const dayConfig = schedule.find(s => s.day_of_week === dbDayIndex);

      dates.push({
        fullDate: d.toISOString().split('T')[0],
        label: i === 0 ? 'Sot' : i === 1 ? 'Nesër' : d.toLocaleDateString('sq-AL', { day: 'numeric', month: 'short' }),
        isClosed: dayConfig ? dayConfig.is_closed : false,
        dbDayIndex
      });
    }
    setCalendarDates(dates);
    if (dates.length > 0 && !selectedDate) setSelectedDate(dates[0].fullDate);
  };

  useEffect(() => {
    if (selectedDate && selectedBarberSchedule.length > 0) {
      const dateObj = calendarDates.find(d => d.fullDate === selectedDate);
      if (dateObj) {
        const dayConfig = selectedBarberSchedule.find(s => s.day_of_week === dateObj.dbDayIndex);
        if (dayConfig && !dayConfig.is_closed) {
          generateTimeSlots(dayConfig.start_time, dayConfig.end_time);
        } else {
          setAvailableTimeSlots([]);
        }
      }
    }
  }, [selectedDate, selectedBarberSchedule]);

  const generateTimeSlots = (start: string, end: string) => {
    const slots = [];
    let current = parseInt(start.split(':')[0]);
    const endH = parseInt(end.split(':')[0]);

    while (current < endH) {
      slots.push(`${current.toString().padStart(2, '0')}:00`);
      slots.push(`${current.toString().padStart(2, '0')}:30`);
      current++;
    }
    setAvailableTimeSlots(slots);
  };
  const shopName = shop?.name || "Salloni";
  const address = shop?.address || "Prishtinë, Kosovë";
  const rating = shop?.rating ? parseFloat(String(shop.rating)).toFixed(1) : "0.0";
  const imageUrl = getShopCardImage(shop);
  const rawPortfolioData = shop?.portfolio_urls || [];
  const portfolioData = rawPortfolioData.filter((p: any) => typeof p === 'object' && p !== null ? p.category !== 'Kartela' : true);
  const photos = portfolioData.map((p: any) => typeof p === 'string' ? p : p.url);

  const availablePhotoCategories = ["Të gjitha", ...new Set(portfolioData.map((p: any) => p.category).filter(Boolean))];

  const filteredPhotos = activePhotoCategory === "Të gjitha"
    ? portfolioData
    : portfolioData.filter((p: any) => p.category === activePhotoCategory);

  return (
    <View className="flex-1 bg-[#F8F9FE]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Full Image Banner with Floating Header Controls */}
        <View className="h-80 relative bg-slate-900">
          <TouchableOpacity activeOpacity={0.95} onPress={() => setZoomImage(imageUrl)} className="w-full h-full">
            <Image source={{ uri: imageUrl }} className="w-full h-full object-cover" />
          </TouchableOpacity>
          
          {/* Header Action Row */}
          <View className="absolute top-14 left-6 right-6 flex-row items-center justify-between z-20">
            <TouchableOpacity 
              onPress={onBack}
              className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-lg"
            >
              <ArrowLeft size={22} color="#161719" strokeWidth={2.5} />
            </TouchableOpacity>

            <Text className="text-white text-lg font-black tracking-tight drop-shadow-md">Detajet</Text>

            <View className="flex-row gap-2">
              <TouchableOpacity 
                onPress={handleFavoriteToggle}
                className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-lg active:scale-95"
              >
                <Heart size={20} color={isFavLocal ? "#ef4444" : "#161719"} fill={isFavLocal ? "#ef4444" : "transparent"} strokeWidth={2.5} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShare}
                className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-lg active:scale-95"
              >
                <Share2 size={20} color="#161719" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dots Indicator */}
          <View className="absolute bottom-6 left-0 right-0 flex-row justify-center gap-1.5 z-20">
            <View className="w-2 h-2 rounded-full bg-white opacity-40" />
            <View className="w-5 h-2 rounded-full bg-[#3473ef]" />
            <View className="w-2 h-2 rounded-full bg-white opacity-40" />
            <View className="w-2 h-2 rounded-full bg-white opacity-40" />
          </View>
        </View>

        {/* Shop Details Content */}
        <View className="px-6 pt-6 pb-6">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-2xl font-black text-[#161719] flex-1 mr-2">{shopName}</Text>
            <View className="bg-[#3473ef] px-4 py-1.5 rounded-full">
              <Text className="text-white text-xs font-black">Hapur</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1.5 mb-2">
            <MapPin size={16} color="#3473ef" />
            <Text className="text-[#8789A3] text-xs font-bold">{address}</Text>
          </View>

          <View className="flex-row items-center gap-1.5 mb-6">
            <Star size={16} color="#FFC107" fill="#FFC107" />
            <Text className="text-[#161719] text-sm font-black">{rating}</Text>
            <Text className="text-[#8789A3] text-xs font-medium">({reviews.length > 0 ? reviews.length : (shop?.total_reviews || shop?.reviews_count || 0)} Shqyrtime)</Text>
          </View>

          {/* Dynamic Action Buttons: Display only for filled contact fields */}
          {(() => {
            const phoneVal = shop.phone || shop.phone_number || shop.contact_phone || shop.mobile;
            const instaVal = shop.instagram || shop.instagram_url || shop.social_instagram;
            const webVal = shop.website || shop.website_url || shop.web;
            const addrVal = shop.address || shop.location || shop.city;

            const actions = [];

            if (phoneVal) {
              actions.push({
                key: 'phone',
                label: 'Telefon',
                sublabel: phoneVal,
                icon: Phone,
                color: '#10b981',
                bgColor: '#ecfdf5',
                borderColor: '#10b981/20',
                action: () => safeOpenUrl(`tel:${String(phoneVal).replace(/\s+/g, '')}`, `Numri: ${phoneVal}`)
              });
            }

            if (instaVal) {
              const cleanInsta = String(instaVal).replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace('@', '').replace(/\/$/, '');
              actions.push({
                key: 'instagram',
                label: 'Instagram',
                sublabel: `@${cleanInsta}`,
                icon: Instagram || MessageSquare,
                color: '#e1306c',
                bgColor: '#fdf2f8',
                borderColor: '#e1306c/20',
                action: () => safeOpenUrl(`https://instagram.com/${cleanInsta}`, `Instagram: @${cleanInsta}`)
              });
            }

            if (webVal) {
              let cleanWeb = String(webVal).trim();
              if (!cleanWeb.startsWith('http')) cleanWeb = 'https://' + cleanWeb;
              actions.push({
                key: 'website',
                label: 'Uebfaqja',
                sublabel: webVal.replace(/^https?:\/\//, '').replace(/\/$/, ''),
                icon: Globe,
                color: '#6366f1',
                bgColor: '#eef2ff',
                borderColor: '#6366f1/20',
                action: () => safeOpenUrl(cleanWeb, `Uebfaqja: ${cleanWeb}`)
              });
            }

            if (addrVal) {
              actions.push({
                key: 'address',
                label: 'Vendndodhja',
                sublabel: addrVal,
                icon: Compass,
                color: '#3473ef',
                bgColor: '#EBF2FF',
                borderColor: '#3473ef/20',
                action: () => {
                  const encoded = encodeURIComponent(addrVal);
                  safeOpenUrl(`https://www.google.com/maps/search/?api=1&query=${encoded}`, `Vendndodhja: ${addrVal}`);
                }
              });
            }

            if (actions.length === 0) return null;

            return (
              <View className="flex-row flex-wrap gap-3 mb-8">
                {actions.map((act) => {
                  const Icon = act.icon;
                  return (
                    <TouchableOpacity
                      key={act.key}
                      onPress={act.action}
                      style={{ backgroundColor: act.bgColor }}
                      className="flex-1 min-w-[140px] p-3.5 rounded-2xl flex-row items-center border border-slate-100 shadow-sm active:scale-95 mb-1"
                    >
                      <View className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-white shadow-sm">
                        <Icon size={20} color={act.color} strokeWidth={2.5} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[#161719] text-xs font-black">{act.label}</Text>
                        <Text className="text-[#8789A3] text-[10px] font-bold" numberOfLines={1}>{act.sublabel}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })()}

          {/* Our Recent Work Section */}
          {photos.length > 0 && (
            <>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-black text-[#161719]">Puna jonë e fundit</Text>
                <TouchableOpacity onPress={() => setShowAllPhotos(true)}>
                  <Text className="text-xs font-black text-[#3473ef]">Shiko të gjitha »</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-4" snapToInterval={192} decelerationRate="fast">
                {photos.map((img: string, idx: number) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.9}
                    onPress={() => setZoomImage(img)}
                    className="w-44 h-32 rounded-2xl overflow-hidden mr-4 relative bg-slate-200"
                  >
                    <Image source={{ uri: img }} className="w-full h-full object-cover" />
                    <TouchableOpacity
                      onPress={(e: any) => {
                        e?.stopPropagation?.();
                        handleFavoriteToggle();
                      }}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 items-center justify-center active:scale-95 z-10"
                    >
                      <Heart size={14} color={isFavLocal ? "#ef4444" : "#3473ef"} fill={isFavLocal ? "#ef4444" : "transparent"} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Stafi ynë Section */}
          <View className="mt-10">
            <Text className="text-lg font-black text-[#161719] mb-4">Stafi ynë</Text>
            <View className="flex-row flex-wrap gap-4">
              {staff.map(emp => (
                <TouchableOpacity
                  key={emp.id}
                  onPress={() => {
                    setSelectedEmployee(emp);
                    setSelectedServices([]); // Clear selection
                    setBookingStep(2);
                    setShowBookingModal(true);
                  }}
                  className="w-[30%] items-center mb-6"
                >
                  <View className="w-20 h-20 rounded-[28px] bg-[#3473ef]/5 items-center justify-center mb-3 border border-[#3473ef]/10 shadow-sm">
                    <UserIcon size={32} color="#3473ef" />
                  </View>
                  <Text className="font-black text-[#161719] text-[11px] text-center" numberOfLines={1}>{emp.name}</Text>
                  <View className="flex-row items-center mt-1">
                    <Star size={10} color="#FFC107" fill="#FFC107" />
                    <Text className="text-[9px] font-black text-slate-400 ml-1">{emp.rating ? parseFloat(String(emp.rating)).toFixed(1) : "5.0"}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {staff.length === 0 && (
                <View className="w-full py-4 items-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Text className="text-slate-400 font-bold text-xs italic">Nuk u gjet asnjë berber.</Text>
                </View>
              )}
            </View>
          </View>

          {/* Vlerësimet e Klientëve Section */}
          <View className="mt-6 mb-24">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-black text-[#161719]">Vlerësimet e Klientëve</Text>
              <View className="flex-row items-center bg-amber-50 px-2.5 py-1 rounded-xl">
                 <Star size={14} color="#fbbf24" fill="#fbbf24" />
                 <Text className="text-[#161719] font-black text-xs ml-1.5">{rating}</Text>
              </View>
            </View>

            {loadingReviews ? (
              <ActivityIndicator color="#3473ef" className="py-10" />
            ) : reviews.length > 0 ? (
              <View className="gap-y-4">
                {reviews.map((rev) => (
                  <View key={rev.id} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
                    <View className="flex-row justify-between items-center mb-3">
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3">
                          <Text className="font-black text-[#161719]">{rev.users?.name?.charAt(0) || 'K'}</Text>
                        </View>
                        <View>
                          <Text className="font-black text-[#161719] text-sm">{rev.users?.name || 'Klient i LineUp'}</Text>
                          <Text className="text-slate-400 font-bold text-[10px]">
                            {new Date(rev.created_at).toLocaleDateString('sq-AL', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={12} color={s <= rev.rating ? "#fbbf24" : "#e2e8f0"} fill={s <= rev.rating ? "#fbbf24" : "transparent"} />
                        ))}
                      </View>
                    </View>
                    {rev.comment ? (
                      <Text className="text-slate-600 font-medium text-xs leading-5">"{rev.comment}"</Text>
                    ) : (
                      <Text className="text-slate-400 font-bold text-xs italic">Pa koment.</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-slate-50 p-8 rounded-[32px] items-center border border-dashed border-slate-200">
                <Star size={32} color="#CBD5E1" strokeWidth={1} />
                <Text className="text-slate-400 font-bold mt-4 text-center text-xs">Nuk ka ende vlerësime për këtë sallon.</Text>
              </View>
            )}
          </View>

        </View>
      </ScrollView>

      {/* Sticky Book Appointment Bottom Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-5 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.06)]">
        <TouchableOpacity
          onPress={() => setShowBookingModal(true)}
          className="bg-[#3473ef] py-4 rounded-full items-center justify-center shadow-lg shadow-[#3473ef]/30 active:scale-98"
        >
          <Text className="text-white text-base font-extrabold">Rezervo Takimin</Text>
        </TouchableOpacity>
      </View>

      {/* ── BOOKING MODAL FLOW ───────────────────────────── */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View className="bg-black/60 justify-end flex-1">
          <View className="bg-white rounded-t-[48px] flex-1 mt-20 overflow-hidden">
              <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mt-3 mb-2" />

              {/* Modal Header */}
              <View className="flex-row items-center justify-between px-8 py-4 border-b border-slate-50">
                {bookingStep > 1 ? (
                  <TouchableOpacity onPress={() => setBookingStep(bookingStep - 1)} className="p-2 bg-slate-50 rounded-full">
                    <ArrowLeft size={20} color="#161719" />
                  </TouchableOpacity>
                ) : <View className="w-10" />}

                <Text className="text-lg font-black text-[#161719]">
                  {bookingStep === 1 ? '1. Zgjidh Berberin' :
                  bookingStep === 2 ? '2. Zgjidh Shërbimet' :
                  bookingStep === 3 ? '3. Koha & Data' :
                  bookingStep === 4 ? '4. Konfirmimi' :
                  '5. Verifikimi OTP'}
                </Text>

                <TouchableOpacity onPress={() => { setShowBookingModal(false); setBookingStep(1); setBookingOtpSent(false); Keyboard.dismiss(); }} className="p-2 bg-slate-50 rounded-full">
                  <X size={20} color="#161719" />
                </TouchableOpacity>
              </View>

              <ScrollView
                className="flex-1 px-8 pt-6"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled={true}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                removeClippedSubviews={false}
              >

              {/* HAPI 1: Zgjidh Berberin */}
              {bookingStep === 1 && (
                <View>
                  <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Zgjidh Berberin e Sallonit</Text>
                  
                  <View className="flex-row flex-wrap gap-4 mb-8">
                    {staff.map(emp => {
                      const isSelected = selectedEmployee?.id === emp.id;
                      return (
                        <TouchableOpacity
                          key={emp.id}
                          onPress={() => {
                            setSelectedEmployee(emp);
                            setSelectedServices([]); // Clear selection when barber changes
                            setBookingStep(2);
                          }}
                          className={`w-[47%] items-center p-5 rounded-3xl border-2 ${isSelected ? 'border-[#3473ef] bg-[#3473ef]/5 shadow-md' : 'border-slate-100 bg-white'}`}
                        >
                          <View className="w-16 h-16 rounded-2xl bg-slate-100 items-center justify-center mb-3">
                            <UserIcon size={32} color={isSelected ? "#3473ef" : "#94A3B8"} />
                          </View>
                          <Text className="font-black text-[#161719] text-sm text-center mb-1" numberOfLines={1}>{emp.name}</Text>
                          <View className="flex-row items-center">
                            <Star size={12} color="#FFC107" fill="#FFC107" />
                            <Text className="text-xs font-bold text-[#161719] ml-1">{emp.rating ? parseFloat(String(emp.rating)).toFixed(1) : "5.0"}</Text>
                          </View>
                          <View className="mt-3 bg-[#3473ef] px-4 py-1.5 rounded-full">
                            <Text className="text-white text-[10px] font-black uppercase">Zgjidh Berberin</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* HAPI 2: Zgjidh Shërbimet (Simple Flat List) */}
              {bookingStep === 2 && (
                <View>
                  <View className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-row items-center justify-between mb-6">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-[#3473ef]/10 items-center justify-center mr-3">
                        <UserIcon size={20} color="#3473ef" />
                      </View>
                      <View>
                        <Text className="font-black text-[#161719] text-xs">{selectedEmployee?.name}</Text>
                        <Text className="text-slate-400 font-bold text-[9px] uppercase">Berberi i zgjedhur</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={() => {
                        setSelectedEmployee(null);
                        setBookingStep(1);
                      }} 
                      className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100"
                    >
                      <Text className="text-slate-500 font-black text-[10px]">Ndrysho</Text>
                    </TouchableOpacity>
                  </View>

                  <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Shërbimet e Berberit (me minuta)</Text>

                  {loadingServices ? (
                    <View className="py-10 items-center">
                      <ActivityIndicator color="#3473ef" />
                    </View>
                  ) : (
                    <View className="flex-row flex-wrap justify-between gap-y-3 mb-6">
                      {availableServices.map((srv, idx) => {
                        const isSelected = isServiceSelected(srv);
                        const srvId = `srv-${srv.id || idx}`;
                        const duration = srv.duration || `${srv.durationMinutes || 30} min`;
                        return (
                          <TouchableOpacity
                            key={srvId}
                            activeOpacity={0.6}
                            onPress={() => handleToggleService(srv)}
                            className={`w-[48%] p-4 rounded-[24px] border-2 justify-between shadow-sm ${isSelected ? 'border-[#3473ef] bg-[#3473ef]/5' : 'border-slate-100 bg-white'}`}
                            style={{ minHeight: 110 }}
                          >
                            <View className="flex-row items-start justify-between">
                              <View className="flex-1 mr-2">
                                <Text className={`text-[13px] font-black leading-4 ${isSelected ? 'text-[#3473ef]' : 'text-[#161719]'}`} numberOfLines={2}>{srv.name}</Text>
                              </View>
                              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-white border-slate-200'}`}>
                                {isSelected && <Check size={12} color="white" strokeWidth={4} />}
                              </View>
                            </View>

                            <View className="flex-row items-center justify-between mt-auto">
                              <View className="flex-row items-center">
                                <Clock size={12} color={isSelected ? '#3473ef' : '#94A3B8'} />
                                <Text className={`text-[10px] font-bold ml-1 ${isSelected ? 'text-[#3473ef]' : 'text-[#8789A3]'}`}>{duration}</Text>
                              </View>
                              {srv.price > 0 && (
                                <Text className={`text-sm font-black ${isSelected ? 'text-[#3473ef]' : 'text-[#161719]'}`}>{srv.price}€</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                      {availableServices.length === 0 && (
                        <View className="w-full py-10 items-center">
                          <Text className="text-slate-400 font-bold">Nuk u gjet asnjë shërbim.</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* HAPI 3: Koha dhe Data me Llogaritje të Kohëzgjatjes & Ndalimit të Përputhjes */}
              {bookingStep === 3 && (
                <View>
                  <View className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Clock size={18} color="#3473ef" />
                      <Text className="text-[#3473ef] text-xs font-black ml-2">Kohëzgjatja totale: {totalDurationMinutes} min</Text>
                    </View>
                    <Text className="text-slate-400 text-[10px] font-bold">{selectedServices.length} shërbime</Text>
                  </View>

                  <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Data e Rezervimit</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3 mb-8">
                    {calendarDates.map(date => (
                      <TouchableOpacity
                        key={date.fullDate}
                        onPress={() => setSelectedDate(date.fullDate)}
                        disabled={date.isClosed}
                        className={`px-6 py-4 rounded-[24px] items-center justify-center border-2 ${selectedDate === date.fullDate ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-white border-slate-100'} ${date.isClosed ? 'opacity-30' : ''}`}
                      >
                        <Text className={`font-black text-sm ${selectedDate === date.fullDate ? 'text-white' : 'text-[#161719]'}`}>{date.label}</Text>
                        {date.isClosed && <Text className="text-[8px] font-bold text-rose-500 mt-1 uppercase">Pushim</Text>}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Oraret e Lira (llogaritur me {totalDurationMinutes} min)</Text>
                  {availableSlots.length > 0 ? (
                    <View className="flex-row flex-wrap gap-3 mb-6">
                      {availableSlots.map(time => {
                        const disabled = isSlotDisabled(time);
                        const isSelected = selectedTime === time;
                        return (
                          <TouchableOpacity
                            key={time}
                            onPress={() => !disabled && setSelectedTime(time)}
                            disabled={disabled}
                            className={`w-[30%] py-4 rounded-[20px] border-2 items-center justify-center ${
                              disabled
                                ? 'bg-slate-100 border-slate-200 opacity-50'
                                : isSelected
                                ? 'bg-[#161719] border-[#161719]'
                                : 'bg-slate-50 border-slate-50'
                            }`}
                          >
                            <Text className={`font-black text-sm ${disabled ? 'text-slate-400 line-through' : isSelected ? 'text-white' : 'text-[#161719]'}`}>{time}</Text>
                            {disabled && <Text className="text-[8px] font-black text-rose-500 mt-0.5 uppercase">E nxënë</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <View className="bg-rose-50 p-6 rounded-3xl items-center border border-rose-100 mb-6">
                       <AlertCircle size={32} color="#ef4444" />
                       <Text className="text-rose-600 font-black text-sm mt-3 text-center">Nuk ka orare të lira për këtë ditë.</Text>
                    </View>
                  )}
                </View>
              )}

              {/* HAPI 4: Konfirmimi (Pa Çmim / Pa Total) */}
              {bookingStep === 4 && (
                <View>
                  {!user ? (
                    <View>
                      <View className="mb-6 items-center">
                        <Text className="text-2xl font-black text-[#161719] mb-2">
                          {authMode === 'login' ? 'Identifikohu' : 'Regjistrohu'}
                        </Text>
                        <Text className="text-slate-400 font-bold text-xs text-center">
                          {authMode === 'login'
                            ? 'Shënoni të dhënat tuaja për të vazhduar me verifikimin OTP'
                            : 'Krijoni një llogari për të përfunduar rezervimin'}
                        </Text>
                      </View>

                      {authMode === 'signup' && (
                        <View className="flex-row gap-x-3 mb-4">
                          <View className="flex-1 h-14 bg-slate-50 rounded-2xl px-4 flex-row items-center border border-slate-100">
                            <UserIcon size={18} color="#94A3B8" />
                            <TextInput placeholder="Emri" className="flex-1 ml-3 font-bold text-[#161719]" value={firstName} onChangeText={setFirstName} />
                          </View>
                          <View className="flex-1 h-14 bg-slate-50 rounded-2xl px-4 flex-row items-center border border-slate-100">
                            <TextInput placeholder="Mbiemri" className="flex-1 font-bold text-[#161719]" value={lastName} onChangeText={setLastName} />
                          </View>
                        </View>
                      )}

                      <View className="gap-y-4">
                        <View className="h-14 bg-slate-50 rounded-2xl px-4 flex-row items-center border border-slate-100">
                          <Mail size={18} color="#94A3B8" />
                          <TextInput placeholder="Email Adresa" className="flex-1 ml-3 font-bold text-[#161719]" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
                        </View>

                        {authMode === 'signup' && (
                          <View className="h-14 bg-slate-50 rounded-2xl px-4 flex-row items-center border border-slate-100">
                            <Phone size={18} color="#94A3B8" />
                            <TextInput
                              placeholder="Numri i telefonit (+383)"
                              className="flex-1 ml-3 font-bold text-[#161719]"
                              keyboardType="phone-pad"
                              value={phone}
                              onChangeText={(val) => {
                                const cleaned = val.replace(/\D/g, "");
                                let formatted = val;
                                if (cleaned.length > 0) {
                                  let numberPart = cleaned;
                                  if (cleaned.startsWith("383")) {
                                    numberPart = cleaned.substring(3);
                                  } else if (cleaned.startsWith("0")) {
                                    numberPart = cleaned.substring(1);
                                  }

                                  if (numberPart.length > 5) {
                                    formatted = `+383 ${numberPart.substring(0, 2)} ${numberPart.substring(2, 5)} ${numberPart.substring(5, 8)}`;
                                  } else if (numberPart.length > 2) {
                                    formatted = `+383 ${numberPart.substring(0, 2)} ${numberPart.substring(2)}`;
                                  } else {
                                    formatted = `+383 ${numberPart}`;
                                  }
                                } else {
                                  // Keep the prefix even if cleared if the user started typing
                                  formatted = val.length > 0 ? "+383 " : "";
                                }
                                setPhone(formatted);
                              }}
                            />
                          </View>
                        )}

                        <View className="h-14 bg-slate-50 rounded-2xl px-4 flex-row items-center border border-slate-100">
                          <Lock size={18} color="#94A3B8" />
                          <TextInput placeholder="Fjalëkalimi" className="flex-1 ml-3 font-bold text-[#161719]" secureTextEntry value={password} onChangeText={setPassword} />
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={handleAuthAction}
                        disabled={loading}
                        className={`bg-[#3473ef] h-16 rounded-[28px] items-center justify-center mt-8 shadow-xl shadow-[#3473ef]/30 active:scale-95 ${loading ? 'opacity-70' : ''}`}
                      >
                        {loading ? <ActivityIndicator color="white" /> : (
                          <Text className="text-white font-black text-lg">
                            {authMode === 'login' ? 'Identifikohu & Vazhdo' : 'Krijo Llogarinë & Vazhdo'}
                          </Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          Keyboard.dismiss();
                          const nextMode = authMode === 'login' ? 'signup' : 'login';
                          setAuthMode(nextMode);
                          if (nextMode === 'signup' && !phone) {
                            setPhone("+383 ");
                          }
                        }}
                        className="mt-4 py-2 items-center"
                      >
                        <Text className="text-[#3473ef] font-black text-sm">
                          {authMode === 'login' ? 'Nuk keni llogari? Regjistrohuni' : 'Keni llogari? Identifikohuni'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      <View className="bg-[#3473ef]/5 rounded-[32px] p-6 border-2 border-[#3473ef]/10 mb-8">
                        <Text className="text-center text-slate-400 font-black text-[10px] uppercase tracking-widest mb-6">Përmbledhja e Takimit</Text>

                        <View className="gap-y-4">
                          <View className="flex-row justify-between items-center">
                            <Text className="text-slate-500 font-bold text-xs">Berberi</Text>
                            <Text className="text-[#161719] font-black text-sm">{selectedEmployee?.name}</Text>
                          </View>

                          <View className="flex-row justify-between items-center">
                            <Text className="text-slate-500 font-bold text-xs">Data & Ora</Text>
                            <Text className="text-[#161719] font-black text-sm">{calendarDates.find(d => d.fullDate === selectedDate)?.label || selectedDate}, {selectedTime}</Text>
                          </View>

                          <View className="h-[1px] bg-slate-200/60" />

                          <View>
                            <Text className="text-slate-500 font-bold text-xs mb-2">Shërbimet e zgjedhura</Text>
                            {selectedServices.map(s => (
                              <View key={s.id} className="flex-row justify-between mb-1.5">
                                <Text className="text-[#161719] text-xs font-black">• {s.name}</Text>
                                <Text className="text-[#8789A3] text-xs font-bold">⏱️ {s.duration || `${s.durationMinutes || 30} min`}</Text>
                              </View>
                            ))}
                          </View>

                          <View className="h-[1px] bg-slate-200/60" />

                          <View className="flex-row justify-between items-center">
                            <Text className="text-sm font-black text-[#161719]">Kohëzgjatja Totale</Text>
                            <Text className="text-xl font-black text-[#3473ef]">⏱️ {totalDurationMinutes} min</Text>
                          </View>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={async () => {
                          const targetPhone = phone || user?.phone;
                          if (targetPhone) {
                            const success = await triggerTwilioOtpSend(targetPhone);
                            if (success) setBookingStep(5);
                          }
                        }}
                        disabled={loading}
                        className={`bg-[#3473ef] h-16 rounded-[28px] items-center justify-center shadow-xl shadow-blue-200 active:scale-95 ${loading ? 'opacity-70' : ''}`}
                      >
                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-base">Vazhdo me Verifikim OTP →</Text>}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* HAPI 5: Verifikimi me Kod OTP */}
              {bookingStep === 5 && (
                <View>
                  <View className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm items-center">
                    <View className="w-16 h-16 bg-indigo-50 rounded-2xl items-center justify-center mb-6">
                      <Hash size={32} color="#6366f1" />
                    </View>
                    <Text className="text-xl font-black text-[#161719] mb-2 text-center">Verifikimi me Kod OTP</Text>
                    <Text className="text-[#8789A3] text-center font-bold text-xs mb-8 px-4">
                      Kemi dërguar një kod verifikimi në numrin tuaj {phone || user?.phone}.
                    </Text>

                    <View className="w-full bg-slate-50 rounded-2xl p-2 border border-slate-100 mb-6">
                      <TextInput
                        placeholder="Kodi 6-shifror"
                        className="h-14 text-center text-xl font-black tracking-[10px] text-[#161719]"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={bookingOtpCode}
                        onChangeText={setBookingOtpCode}
                      />
                    </View>

                    <TouchableOpacity
                      onPress={verifyTwilioOtpAndSubmit}
                      disabled={verifyingBookingOtp}
                      className="bg-black w-full h-16 rounded-[24px] items-center justify-center shadow-xl active:scale-95 flex-row"
                    >
                      {verifyingBookingOtp ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <>
                          <Text className="text-white font-black text-base mr-2">Verifiko & Përfundo Rezervimin</Text>
                          <Check size={18} color="white" strokeWidth={3} />
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setBookingStep(4)}
                      className="mt-4"
                    >
                      <Text className="text-slate-400 font-bold text-xs underline">Kthehu te konfirmimi</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View className="h-32" />
            </ScrollView>

            {/* Bottom Actions for Steps 1 - 3 */}
            {bookingStep <= 3 && (
              <View className="p-6 bg-white border-t border-slate-50">
                <TouchableOpacity
                  onPress={() => setBookingStep(bookingStep + 1)}
                  disabled={
                    (bookingStep === 1 && !selectedEmployee) ||
                    (bookingStep === 2 && selectedServices.length === 0) ||
                    (bookingStep === 3 && (!selectedDate || !selectedTime))
                  }
                  className={`h-16 rounded-[28px] items-center justify-center shadow-xl flex-row ${
                    ((bookingStep === 1 && !selectedEmployee) ||
                     (bookingStep === 2 && selectedServices.length === 0) ||
                     (bookingStep === 3 && (!selectedDate || !selectedTime)))
                    ? 'bg-slate-200' : 'bg-[#3473ef] shadow-[#3473ef]/30 active:scale-98'
                  }`}
                >
                  <Text className="text-white text-lg font-black mr-2">
                    {bookingStep === 1 ? 'Vazhdo te Shërbimet' : bookingStep === 2 ? 'Vazhdo te Data & Ora' : 'Vazhdo te Konfirmimi'}
                  </Text>
                  <ChevronRight size={20} color="white" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* --- ALL PHOTOS MODAL --- */}
      <Modal
        visible={showAllPhotos}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAllPhotos(false)}
      >
        <View className="flex-1 bg-black justify-center">
          <View className="flex-row justify-between items-center px-6 pt-14 pb-4 absolute top-0 left-0 right-0 z-50 bg-black/50">
            <TouchableOpacity onPress={() => setShowAllPhotos(false)} className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <X size={20} color="white" />
            </TouchableOpacity>
            <Text className="text-white font-black text-base">Portofoli ({photos.length})</Text>
            <View className="w-10" />
          </View>

          <View className="absolute top-32 left-0 right-0 z-50">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 py-2">
              {(availablePhotoCategories as string[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActivePhotoCategory(cat)}
                  className={`mr-3 px-6 py-2.5 rounded-full border ${activePhotoCategory === cat ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-white/10 border-white/20'}`}
                >
                  <Text className={`font-black text-xs ${activePhotoCategory === cat ? 'text-white' : 'text-slate-300'}`}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 200, paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row flex-wrap justify-between">
              {filteredPhotos.map((p: any, i: number) => {
                const url = typeof p === 'string' ? p : p.url;
                return (
                  <TouchableOpacity key={i} activeOpacity={0.88} onPress={() => setZoomImage(url)} className="w-[48%] aspect-square rounded-3xl overflow-hidden mb-4 bg-slate-800 border border-slate-700/50">
                    <Image source={{ uri: url }} className="w-full h-full object-cover" />
                    {p.category && (
                      <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-lg">
                        <Text className="text-[8px] text-white font-black uppercase">{p.category}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
              {filteredPhotos.length === 0 && (
                <View className="w-full py-20 items-center">
                  <Text className="text-slate-400 font-bold">Nuk u gjet asnjë foto për këtë kategori.</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ── SINGLE BULLETPROOF FULLSCREEN IMAGE LIGHTBOX OVERLAY ── */}
      {!!zoomImage && (
        <View className="absolute inset-0 z-[999999] bg-black/95 justify-center items-center">
          <TouchableOpacity
            onPress={() => setZoomImage(null)}
            className="absolute top-14 right-6 z-[1000000] w-12 h-12 rounded-full bg-white/20 items-center justify-center border border-white/30 active:scale-95"
          >
            <X size={24} color="white" strokeWidth={2.5} />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={1} onPress={() => setZoomImage(null)} className="w-full h-full justify-center items-center p-4">
            <Image
              source={{ uri: zoomImage }}
              className="w-full h-full"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
};
