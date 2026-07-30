import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard, Linking } from "react-native";
import { ArrowLeft, Share2, Star, MapPin, Phone, MessageSquare, Compass, Globe, Heart, Calendar, Check, X, User as UserIcon, Clock, Scissors as ScissorsIcon, Mail, Lock, ChevronRight, Hash, AlertCircle } from "lucide-react-native";
import Animated, { FadeInUp, FadeIn, FadeInDown } from "react-native-reanimated";
import { supabase } from "@/config/supabase";
import { sendTwilioOTP, verifyTwilioOTP } from "@/config/twilio";
import { DEFAULT_CATEGORIES } from "../config/defaultCategories";

const { width } = Dimensions.get("window");

interface BarberDetailScreenProps {
  shop: any;
  user: any;
  onLogin: (userData: any) => void;
  onBack: () => void;
  favorites?: any[];
  onToggleFavorite?: (shop: any) => void;
}

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
  const [calendarDates, setCalendarDates] = useState<any[]>([]);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [activePhotoCategory, setActivePhotoCategory] = useState("Të gjitha");

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
            onPress: (val) => {
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
      setBookingStep(4);
      Alert.alert("SMS e Dërguar", `Kemi dërguar kodin e verifikimit në numrin tuaj: ${num}`);
    } catch (err: any) {
      Alert.alert("Gabim", err.message || "Dështoi dërgimi i SMS verifikimit.");
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

  useEffect(() => {
    async function loadBarberServices() {
      if (!selectedEmployee?.user_id) {
        setAvailableServices(MOCK_SERVICES);
        return;
      }
      try {
        const { data: myServices, error } = await supabase
          .from('barber_services')
          .select('subcategory_id, subcategories(id, name)')
          .eq('barber_id', selectedEmployee.user_id);
        
        if (error) throw error;
        
        if (myServices && myServices.length > 0) {
          const mapped = myServices.map((s: any) => {
            const sub = s.subcategories;
            let price = 15;
            let duration = "30 min";
            
            const name = sub?.name || "";
            if (name.includes("Mjek") || name.includes("Mustaqe") || name.includes("Larje") || name.includes("Riparim")) {
              price = 10;
              duration = "15 min";
            } else if (name.includes("Paketa") || name.includes("Keratinë") || name.includes("Zgjatime") || name.includes("Ngjyrosje")) {
              price = 35;
              duration = "60 min";
            }
            
            return {
              id: sub?.id,
              name: sub?.name,
              price: price,
              duration: duration
            };
          });
          setAvailableServices(mapped);
        } else {
          setAvailableServices(MOCK_SERVICES);
        }
      } catch (err) {
        console.warn("Error loading barber services:", err);
        setAvailableServices(MOCK_SERVICES);
      }
    }
    loadBarberServices();
  }, [selectedEmployee]);

  // Auth States for Booking
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'otp'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

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
    loadShopData();
  }, [shop]);

  const MOCK_SERVICES = [
    { id: 1, name: "Prerje Flokësh", price: 15, duration: "30 min" },
    { id: 2, name: "Rregullim Mjekrre", price: 10, duration: "15 min" },
    { id: 3, name: "Flokë & Mjekërr", price: 22, duration: "45 min" },
    { id: 4, name: "Larje & Stilim", price: 8, duration: "20 min" }
  ];

  const handleBookingSubmit = async (authenticatedUser = user) => {
    if (!authenticatedUser) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('appointments').insert({
        shop_id: shop.id,
        user_id: authenticatedUser.id,
        barber_id: selectedEmployee?.id,
        date: selectedDate,
        time: selectedTime,
        service: selectedServices.map(s => s.name).join(", "),
        price: selectedServices.reduce((sum, s) => sum + s.price, 0),
        status: 'pending'
      });

      if (error) throw error;

      Alert.alert("Sukses!", "Rezervimi juaj u krye me sukses.");
      setShowBookingModal(false);
      setBookingStep(1);
    } catch (e: any) {
      Alert.alert("Gabim", e.message || "Dështoi rezervimi.");
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
        if (dbUser?.phone) triggerTwilioOtpSend(dbUser.phone);
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
        if (phone) triggerTwilioOtpSend(phone);
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
  const rating = shop?.rating || "5.0";
  const imageUrl = shop?.image_url || shop?.imageUrl || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80";
  const portfolioData = shop?.portfolio_urls || [];
  const photos = portfolioData.length > 0
    ? portfolioData.map((p: any) => typeof p === 'string' ? p : p.url)
    : [
        "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=500&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=500&auto=format&fit=crop&q=80",
      ];

  const filteredPhotos = activePhotoCategory === "Të gjitha"
    ? portfolioData
    : portfolioData.filter((p: any) => p.category === activePhotoCategory);

  return (
    <View className="flex-1 bg-[#F8F9FE]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Full Image Banner with Floating Header Controls */}
        <View className="h-80 relative bg-slate-900">
          <Image source={{ uri: imageUrl }} className="w-full h-full object-cover" />
          
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
              {(() => {
                const isFav = favorites?.some(f => f.shop_id === shop.id || f.shop_id === Number(shop.id));
                return (
                  <TouchableOpacity 
                    onPress={() => onToggleFavorite?.(shop)}
                    className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-lg"
                  >
                    <Heart size={20} color={isFav ? "#ef4444" : "#161719"} fill={isFav ? "#ef4444" : "transparent"} strokeWidth={2.5} />
                  </TouchableOpacity>
                );
              })()}

              <TouchableOpacity className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-lg">
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
            <Text className="text-[#8789A3] text-xs font-medium">(292 Shqyrtime)</Text>
          </View>

          {/* Action Row Buttons: Call, Message, Direction, Website */}
          <View className="flex-row gap-3 mb-8">
            {[
              { label: "Thirr", icon: Phone, action: () => {
                if (shop.phone) Linking.openURL(`tel:${shop.phone}`);
                else Alert.alert("Nuk ka numër", "Ky sallon nuk ka regjistruar numër telefoni.");
              }},
              { label: "Mesazh", icon: MessageSquare, action: () => {
                if (shop.instagram) Linking.openURL(`https://instagram.com/${shop.instagram.replace('@', '')}`);
                else Alert.alert("Nuk ka Instagram", "Ky sallon nuk ka regjistruar llogari Instagram.");
              }},
              { label: "Drejtimi", icon: Compass, action: () => {
                const addr = encodeURIComponent(shop.address || shop.city);
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${addr}`);
              }},
              { label: "Uebfaqja", icon: Globe, action: () => {
                if (shop.website) {
                  let url = shop.website;
                  if (!url.startsWith('http')) url = 'https://' + url;
                  Linking.openURL(url);
                } else Alert.alert("Nuk ka uebfaqe", "Ky sallon nuk ka regjistruar uebfaqe.");
              }},
            ].map((btn, i) => {
              const Icon = btn.icon;
              return (
                <TouchableOpacity 
                  key={i} 
                  onPress={btn.action}
                  className="flex-1 bg-[#EBF2FF] py-4 rounded-2xl items-center justify-center border border-[#3473ef]/10 active:scale-95"
                >
                  <Icon size={20} color="#3473ef" strokeWidth={2.2} className="mb-1" />
                  <Text className="text-[#161719] text-[11px] font-extrabold mt-1">{btn.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Our Recent Work Section */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-black text-[#161719]">Puna jonë e fundit</Text>
            <TouchableOpacity onPress={() => setShowAllPhotos(true)}>
              <Text className="text-xs font-black text-[#3473ef]">Shiko të gjitha »</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-4" snapToInterval={192} decelerationRate="fast">
            {photos.map((img: string, idx: number) => (
              <View key={idx} className="w-44 h-32 rounded-2xl overflow-hidden mr-4 relative bg-slate-200">
                <Image source={{ uri: img }} className="w-full h-full object-cover" />
                <TouchableOpacity className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 items-center justify-center">
                  <Heart size={14} color="#3473ef" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          className="bg-black/60 justify-end"
        >
          <View className="bg-white rounded-t-[48px] flex-1 mt-20 overflow-hidden">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mt-3 mb-2" />

            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-8 py-4 border-b border-slate-50">
              {bookingStep > 1 ? (
                <TouchableOpacity onPress={() => setBookingStep(bookingStep - 1)} className="p-2 bg-slate-50 rounded-full">
                  <ArrowLeft size={20} color="#161719" />
                </TouchableOpacity>
              ) : <View className="w-10" />}

              <Text className="text-xl font-black text-[#161719]">
                {bookingStep === 1 ? 'Stafi & Shërbimi' : bookingStep === 2 ? 'Koha & Data' : bookingStep === 3 ? 'Konfirmimi' : 'Verifikimi'}
              </Text>

              <TouchableOpacity onPress={() => { setShowBookingModal(false); setBookingStep(1); setBookingOtpSent(false); }} className="p-2 bg-slate-50 rounded-full">
                <X size={20} color="#161719" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="flex-1 px-8 pt-6"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1 }}
              removeClippedSubviews={false}
            >

              {/* STEP 1: Staff & Service */}
              {bookingStep === 1 && (
                <View>
                  <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Zgjidh Berberin</Text>
                  
                  {!selectedEmployee ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-4 mb-8">
                      {staff.map(emp => (
                        <TouchableOpacity
                          key={emp.id}
                          onPress={() => setSelectedEmployee(emp)}
                          className={`items-center p-4 rounded-3xl border-2 ${selectedEmployee?.id === emp.id ? 'border-[#3473ef] bg-[#3473ef]/5' : 'border-slate-100'}`}
                          style={{ width: 120 }}
                        >
                          <View className="w-16 h-16 rounded-2xl bg-slate-100 items-center justify-center mb-3">
                            <UserIcon size={32} color="#94A3B8" />
                          </View>
                          <Text className="font-black text-[#161719] text-xs text-center" numberOfLines={1}>{emp.name}</Text>
                          <View className="flex-row items-center mt-1">
                            <Star size={10} color="#FFC107" fill="#FFC107" />
                            <Text className="text-[10px] font-bold text-[#161719] ml-1">5.0</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <View className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex-row items-center justify-between mb-8">
                      <View className="flex-row items-center">
                        <View className="w-12 h-12 rounded-xl bg-[#3473ef]/10 items-center justify-center mr-4">
                          <UserIcon size={24} color="#3473ef" />
                        </View>
                        <View>
                          <Text className="font-black text-[#161719] text-sm">{selectedEmployee.name}</Text>
                          <Text className="text-slate-400 font-bold text-[10px] uppercase">Berberi i zgjedhur</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        onPress={() => {
                          setSelectedEmployee(null);
                          setSelectedServices([]);
                        }} 
                        className="bg-slate-50 px-4 py-2 rounded-xl active:scale-95 border border-slate-100"
                      >
                        <Text className="text-slate-500 font-black text-xs">Ndrysho</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedEmployee && (
                    <>
                      <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Zgjidh Shërbimet</Text>
                      <View className="flex-row flex-wrap gap-4 justify-between">
                        {availableServices.map(srv => {
                          const isSelected = selectedServices.find(s => s.id === srv.id);
                          return (
                            <TouchableOpacity
                              key={srv.id}
                              onPress={() => {
                                setSelectedServices(prev => isSelected ? prev.filter(s => s.id !== srv.id) : [...prev, srv]);
                              }}
                              className={`p-5 rounded-[28px] border-2 items-center justify-center ${isSelected ? 'border-[#3473ef] bg-[#3473ef]/5' : 'border-slate-50 bg-slate-50'}`}
                              style={{ width: '47%', aspectRatio: 1 }}
                            >
                              <View className="absolute top-4 right-4">
                                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-white border-slate-200'}`}>
                                  {isSelected && <Check size={12} color="white" strokeWidth={4} />}
                                </View>
                              </View>
                              <Text className="text-sm font-black text-[#161719] text-center mb-1 mt-2" numberOfLines={2}>{srv.name}</Text>
                              <Text className="text-xs font-bold text-[#8789A3] mb-2">{srv.duration}</Text>
                              <Text className="text-lg font-black text-[#3473ef]">{srv.price}€</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* STEP 2: Date & Time */}
              {bookingStep === 2 && (
                <View>
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

                  <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Oraret e Lira</Text>
                  {availableSlots.length > 0 ? (
                    <View className="flex-row flex-wrap gap-3">
                      {availableSlots.map(time => (
                        <TouchableOpacity
                          key={time}
                          onPress={() => setSelectedTime(time)}
                          className={`w-[30%] py-4 rounded-[20px] border-2 items-center justify-center ${selectedTime === time ? 'bg-[#161719] border-[#161719]' : 'bg-slate-50 border-slate-50'}`}
                        >
                          <Text className={`font-black text-sm ${selectedTime === time ? 'text-white' : 'text-[#161719]'}`}>{time}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View className="bg-rose-50 p-6 rounded-3xl items-center border border-rose-100">
                       <AlertCircle size={32} color="#ef4444" />
                       <Text className="text-rose-600 font-black text-sm mt-3 text-center">Ky berber nuk punon në këtë ditë.</Text>
                    </View>
                  )}
                </View>
              )}

              {/* STEP 3: Confirmation / Auth */}
              {bookingStep === 3 && (
                <View>
                  {!user ? (
                    <View>
                      <View>
                        <View className="mb-6 items-center">
                          <Text className="text-2xl font-black text-[#161719] mb-2">
                            {authMode === 'login' ? 'Identifikohu' : 'Regjistrohu'}
                          </Text>
                          <Text className="text-slate-400 font-bold text-xs text-center">
                            {authMode === 'login'
                              ? 'Shënoni të dhënat tuaja për të vazhduar me rezervimin'
                              : 'Krijoni një llogari për të rezervuar takimin tuaj'}
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
                              <TextInput placeholder="Numri i telefonit (+383)" className="flex-1 ml-3 font-bold text-[#161719]" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
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
                          className={`bg-[#3473ef] h-16 rounded-[28px] items-center justify-center mt-10 shadow-xl shadow-[#3473ef]/30 active:scale-95 ${loading ? 'opacity-70' : ''}`}
                        >
                          {loading ? <ActivityIndicator color="white" /> : (
                            <Text className="text-white font-black text-lg">
                              {authMode === 'login' ? 'Identifikohu' : 'Krijo Llogarinë'}
                            </Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            Keyboard.dismiss();
                            setAuthMode(authMode === 'login' ? 'signup' : 'login');
                          }}
                          className="mt-6 py-2 items-center"
                        >
                          <Text className="text-[#3473ef] font-black text-sm">
                            {authMode === 'login' ? 'Nuk keni llogari? Regjistrohuni' : 'Keni llogari? Identifikohuni'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View>
                      <View className="bg-[#3473ef]/5 rounded-[32px] p-8 border-2 border-[#3473ef]/10 mb-8">
                        <Text className="text-center text-slate-400 font-black text-[10px] uppercase tracking-widest mb-6">Përmbledhja e Rezervimit</Text>

                        <View className="gap-y-5">
                          <View className="flex-row justify-between">
                            <Text className="text-slate-500 font-bold">Berberi</Text>
                            <Text className="text-[#161719] font-black">{selectedEmployee?.name}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-slate-500 font-bold">Data & Ora</Text>
                            <Text className="text-[#161719] font-black">{calendarDates.find(d => d.fullDate === selectedDate)?.label || selectedDate}, {selectedTime}</Text>
                          </View>
                          <View className="h-[1px] bg-slate-200/50" />
                          <View>
                            <Text className="text-slate-500 font-bold mb-2">Shërbimet</Text>
                            {selectedServices.map(s => (
                              <View key={s.id} className="flex-row justify-between mb-1.5">
                                <Text className="text-slate-400 text-xs font-bold">{s.name}</Text>
                                <Text className="text-[#161719] text-xs font-black">{s.price}€</Text>
                              </View>
                            ))}
                          </View>
                          <View className="h-[1px] bg-slate-200" />
                          <View className="flex-row justify-between items-center">
                            <Text className="text-lg font-black text-[#161719]">Totali</Text>
                            <Text className="text-3xl font-black text-[#3473ef]">
                              {selectedServices.reduce((sum, s) => sum + s.price, 0)}€
                            </Text>
                          </View>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={sendTwilioOtp}
                        disabled={loading}
                        className={`bg-[#3473ef] h-16 rounded-[28px] items-center justify-center shadow-xl shadow-blue-200 active:scale-95 ${loading ? 'opacity-70' : ''}`}
                      >
                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-base">Vazhdo me Verifikim Twilio</Text>}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* STEP 4: OTP Verification */}
              {bookingStep === 4 && (
                <View>
                  <View className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm items-center">
                    <View className="w-16 h-16 bg-indigo-50 rounded-2xl items-center justify-center mb-6">
                      <Hash size={32} color="#6366f1" />
                    </View>
                    <Text className="text-xl font-black text-[#161719] mb-2 text-center">Verifiko me Twilio</Text>
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
                          <Text className="text-white font-black text-base mr-2">Verifiko & Rezervo</Text>
                          <Check size={18} color="white" strokeWidth={3} />
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setBookingOtpSent(false);
                        setBookingStep(3);
                      }}
                      className="mt-4"
                    >
                      <Text className="text-slate-400 font-bold text-xs underline">Kthehu te përmbledhja</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View className="h-32" />
            </ScrollView>

            {/* Bottom Actions for Step 1 & 2 */}
            {bookingStep < 3 && (
              <View className="p-8 bg-white border-t border-slate-50">
                <TouchableOpacity
                  onPress={() => {
                    if (bookingStep === 2 && user) {
                      const targetPhone = phone || user?.phone;
                      if (targetPhone) {
                        triggerTwilioOtpSend(targetPhone);
                      }
                    }
                    setBookingStep(bookingStep + 1);
                  }}
                  disabled={(bookingStep === 1 && (!selectedEmployee || selectedServices.length === 0)) || (bookingStep === 2 && (!selectedDate || !selectedTime))}
                  className={`h-16 rounded-[28px] items-center justify-center shadow-xl flex-row ${
                    ((bookingStep === 1 && (!selectedEmployee || selectedServices.length === 0)) || (bookingStep === 2 && (!selectedDate || !selectedTime)))
                    ? 'bg-slate-200' : 'bg-[#3473ef] shadow-[#3473ef]/30'
                  }`}
                >
                  <Text className="text-white text-lg font-black mr-2">Vazhdo</Text>
                  <ChevronRight size={20} color="white" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
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
              {["Të gjitha", ...DEFAULT_CATEGORIES.map(c => c.name)].map((cat) => (
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
                  <View key={i} className="w-[48%] aspect-square rounded-3xl overflow-hidden mb-4 bg-slate-800">
                    <Image source={{ uri: url }} className="w-full h-full object-cover" />
                    {p.category && (
                      <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-lg">
                        <Text className="text-[8px] text-white font-black uppercase">{p.category}</Text>
                      </View>
                    )}
                  </View>
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

    </View>
  );
};
