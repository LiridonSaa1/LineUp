import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable, Image, Dimensions, Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Keyboard, Linking, Share } from "react-native";
import { ArrowLeft, Share2, Star, MapPin, Phone, MessageSquare, Compass, Globe, Heart, Calendar, Check, X, User as UserIcon, Clock, Scissors as ScissorsIcon, Mail, Lock, ChevronRight, Hash, AlertCircle, Instagram, Sparkles, Store, Palette, Eye, Hand, Smile, Shield, Zap, Smartphone } from "lucide-react-native";
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
  'Flokët & Trajtimet': ScissorsIcon,
  'Ngjyrosja e Flokëve': Palette,
  'Mjekra & Rruajtja': UserIcon,
  'Vetulla & Qerpikë': Eye,
  'Thonjtë': Hand,
  'Makeup': Smile,
  'Fytyra & Kujdesi i Lëkurës': Shield,
  'Depilim & Trup': Zap,
  'Shërbime Standarde': ScissorsIcon,
  'Të tjera': ScissorsIcon
};

const PACKAGE_DETAILS: Record<string, string[]> = {
  'Paketa e Nuses': [
    'Konsultim paraprak',
    'Modelim i flokëve (Proba e parë)',
    'Grim profesional (Full HD)',
    'Vendosja e vellos & aksesorëve',
    'Qerpikë artificialë cilësorë',
    'Fiksim i grimit (Long-lasting)',
    'Touch-up & Kujdesi final'
  ],
  'Paketa e Dhëndrit': [
    'Prerje flokësh sipas dëshirës',
    'Stilim flokësh profesional',
    'Rregullim & Formësim mjekre',
    'Trajtim fytyre me peshqir',
    'Stilim final me produkte VIP'
  ]
};

const KOSOVO_HOLIDAYS_2026 = [
  { day: 1, month: 0, name: 'Viti i Ri' },
  { day: 7, month: 0, name: 'Krishtlindjet Ortodokse' },
  { day: 17, month: 1, name: 'Dita e Pavarësisë' },
  { day: 30, month: 2, name: 'Fitër Bajrami*' },
  { day: 5, month: 3, name: 'Pashkët Katolike' },
  { day: 9, month: 3, name: 'Dita e Kushtetutës' },
  { day: 12, month: 3, name: 'Pashkët Ortodokse' },
  { day: 1, month: 4, name: 'Dita Ndërkombëtare e Punës' },
  { day: 9, month: 4, name: 'Dita e Evropës' },
  { day: 6, month: 5, name: 'Kurban Bajrami*' },
  { day: 25, month: 11, name: 'Krishtlindjet Katolike' },
];

export const BarberDetailScreen: React.FC<BarberDetailScreenProps> = ({ shop, user, onLogin, onBack, favorites = [], onToggleFavorite }) => {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [widgetStep, setWidgetStep] = useState<number>(1);
  const bookingScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (showBookingModal) {
      bookingScrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [bookingStep, showBookingModal]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedBarberSchedule, setSelectedBarberSchedule] = useState<any[]>([]);
  const [shopSchedule, setShopSchedule] = useState<any[]>([]);
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

  // Celebration success state
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [confirmedBookingDetails, setConfirmedBookingDetails] = useState<any>(null);

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

  useEffect(() => {
    async function loadShopSchedule() {
      if (!shop?.id) return;
      try {
        const { data: schedule } = await supabase
          .from('barber_schedules')
          .select('*')
          .eq('barber_id', String(shop.id));
        if (schedule) setShopSchedule(schedule);
      } catch (e) {
        console.warn("Error loading shop schedule:", e);
      }
    }
    loadShopSchedule();
  }, [shop?.id]);

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

  const handleConfirmOtpAndReserve = async () => {
    setLoading(true);
    try {
      let targetUser = user;

      // 1. If user is not logged in, authenticate or sign up inline first
      if (!targetUser) {
        if (authMode === 'login') {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password
          });
          if (authError) throw authError;

          const { data: dbUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user?.id)
            .maybeSingle();

          if (dbUser) {
            targetUser = {
              id: dbUser.id,
              name: dbUser.name || email,
              email: email,
              phone: dbUser.phone || phone,
              role: dbUser.role || 'client'
            };
            onLogin(targetUser);
          } else {
            targetUser = {
              id: authData.user?.id,
              name: email,
              email: email,
              phone: phone,
              role: 'client'
            };
            onLogin(targetUser);
          }
        } else if (authMode === 'signup') {
          const fullNameStr = `${firstName} ${lastName}`.trim() || 'Klient i Ri';
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: {
              data: { full_name: fullNameStr, phone }
            }
          });
          if (authError) throw authError;

          const userUuid = authData.user?.id;
          if (userUuid) {
            await supabase.from('users').upsert({
              id: userUuid,
              name: fullNameStr,
              email: email.trim().toLowerCase(),
              phone: phone,
              role: 'client'
            });
          }

          targetUser = {
            id: userUuid,
            name: fullNameStr,
            email: email,
            phone: phone,
            role: 'client'
          };
          onLogin(targetUser);
        }
      }

      // 2. Fetch target phone number for Twilio SMS OTP
      const targetPhone = phone || targetUser?.phone || user?.phone;
      if (!targetPhone) {
        Alert.alert("Numri i Telefonit", "Ju lutem shkruani numrin tuaj të telefonit për të marrë SMS OTP.");
        setLoading(false);
        return;
      }

      // 3. Trigger Twilio SMS OTP send
      await sendTwilioOTP(targetPhone);
      setBookingOtpSent(true);
      Alert.alert("SMS e Dërguar 📱", `Kodi i verifikimit OTP u dërgua me SMS në numrin: ${targetPhone}`);
    } catch (err: any) {
      Alert.alert("Gabim", err.message || "Gabim gjatë procesit të kyçjes ose dërgimit të SMS.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async () => {
    if (!bookingOtpCode || bookingOtpCode.trim().length < 4) {
      Alert.alert("Kodi OTP", "Ju lutem shkruani kodin e verifikimit nga SMS.");
      return;
    }

    setVerifyingBookingOtp(true);
    try {
      const targetPhone = phone || user?.phone;
      if (!targetPhone) throw new Error("Numri i telefonit nuk u gjet.");

      await verifyTwilioOTP(targetPhone, bookingOtpCode.trim());
      await handleBookingSubmit(user);

      setBookingOtpSent(false);
      setBookingOtpCode("");
      Alert.alert("Rezervimi u Krye! 📅", `Takimi juaj te ${shopName} u konfirmua me sukses.`);
    } catch (err: any) {
      Alert.alert("Verifikimi dështoi", err.message || "Kodi i verifikimit OTP është i pasaktë ose ka skaduar.");
    } finally {
      setVerifyingBookingOtp(false);
    }
  };

  const DEFAULT_SHOP_SERVICES = [
    { id: 'srv_1', name: "Prerje flokësh", price: 0, duration: "30 min", durationMinutes: 30 },
    { id: 'srv_2', name: "Skin Fade", price: 0, duration: "45 min", durationMinutes: 45 },
    { id: 'srv_3', name: "Formësim mjekre", price: 0, duration: "20 min", durationMinutes: 20 },
    { id: 'srv_4', name: "Manikyr", price: 0, duration: "30 min", durationMinutes: 30 },
    { id: 'srv_5', name: "Pastrim fytyre", price: 0, duration: "45 min", durationMinutes: 45 }
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

        // 1. Primary Source: Barber Specific Services (Authoritative for Booking)
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
        } else {
          // 2. Secondary Source: Barbershop Global Menu (From Pivot Table)
          const { data: shopPivot } = await supabase
            .from('barbershop_services')
            .select('subcategory_id')
            .eq('barbershop_id', shop.id);

          if (shopPivot && shopPivot.length > 0) {
            const shopSubIds = shopPivot.map(p => String(p.subcategory_id).trim());
            finalServices = shopSubIds.map((scId, idx) => {
              const sc = subcatMap.get(scId);
              const catName = catMap.get(String(sc?.category_id).trim()) || "Shërbime";
              return {
                id: scId,
                name: sc?.name || "Shërbim",
                price: parseFloat(String(sc?.estimated_price)) || 0,
                duration: `${sc?.duration_minutes || 30} min`,
                durationMinutes: sc?.duration_minutes || 30,
                category: catName
              };
            });
          } else {
            // 3. Fallback for legacy shops using JSON/Array column
            const shopSubIds = shop?.subcategories || [];
            if (Array.isArray(shopSubIds) && shopSubIds.length > 0) {
              finalServices = shopSubIds.map((scId, idx) => {
                const sc = subcatMap.get(String(scId).trim());
                const catName = catMap.get(String(sc?.category_id).trim()) || "Shërbime";
                return {
                  id: scId,
                  name: sc?.name || "Shërbim",
                  price: parseFloat(String(sc?.estimated_price)) || 0,
                  duration: `${sc?.duration_minutes || 30} min`,
                  durationMinutes: sc?.duration_minutes || 30,
                  category: catName
                };
              });
            }
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
          .select('*, users(role)')
          .eq('shop_id', shop.id);

        if (barbers && barbers.length > 0) {
          const onlyEmployees = barbers.filter((b: any) => b.users?.role === 'employee');
          const finalStaff = onlyEmployees.length > 0 ? onlyEmployees : barbers;
          setStaff(finalStaff);
          if (finalStaff.length > 0) {
            setSelectedEmployee((prev: any) => prev || finalStaff[0]);
          }
        } else {
          const defaultStaff = [{ id: shop?.id || 1, name: shop?.name || "Stafi i Sallonit", rating: shop?.rating || 5.0 }];
          setStaff(defaultStaff);
          setSelectedEmployee((prev: any) => prev || defaultStaff[0]);
        }
      } catch (e) {
        console.warn("Error loading barbers:", e);
        const defaultStaff = [{ id: shop?.id || 1, name: shop?.name || "Stafi i Sallonit", rating: shop?.rating || 5.0 }];
        setStaff(defaultStaff);
        setSelectedEmployee((prev: any) => prev || defaultStaff[0]);
      }
    }
    async function fetchReviews() {
      if (!shop?.id) return;
      setLoadingReviews(true);
      try {
        const sId = shop.id;
        // 1. Try relational query first
        let { data, error } = await supabase
          .from('reviews')
          .select('*, users(name, email)')
          .eq('shop_id', sId)
          .order('created_at', { ascending: false });

        // 2. Fallback to basic query if relation error occurs (e.g. missing FK)
        if (error || !data || data.length === 0) {
          const basicRes = await supabase
            .from('reviews')
            .select('*')
            .eq('shop_id', sId)
            .order('created_at', { ascending: false });

          if (basicRes.data && basicRes.data.length > 0) {
            data = basicRes.data;
          }
        }

        // 3. Populate missing user names if users relation wasn't returned
        if (data && data.length > 0) {
          const userIdsToFetch = data
            .filter((r: any) => !r.users?.name && r.user_id)
            .map((r: any) => r.user_id);

          if (userIdsToFetch.length > 0) {
            const { data: userData } = await supabase
              .from('users')
              .select('id, name')
              .in('id', userIdsToFetch);

            if (userData && userData.length > 0) {
              const userMap = new Map(userData.map(u => [u.id, u.name]));
              data = data.map((r: any) => ({
                ...r,
                users: r.users?.name ? r.users : { name: userMap.get(r.user_id) || 'Klient i verifikuar' }
              }));
            }
          }
        }

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
    const todayStr = new Date().toISOString().split('T')[0];
    const dateObj = calendarDates.find(d => d.fullDate === selectedDate);
    const isToday = selectedDate === todayStr || dateObj?.label === 'Sot';

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const candidateStart = timeToMins(slotTime);
    const candidateEnd = candidateStart + totalDurationMinutes;

    // 1. Disable past slots for today (including slots starting within next 10 minutes)
    if (isToday && candidateStart < currentMins + 10) {
      return true;
    }

    // 2. Disable slots that run past the day's closing time
    const dbDayIndex = dateObj ? dateObj.dbDayIndex : (new Date(selectedDate).getDay() === 0 ? 6 : new Date(selectedDate).getDay() - 1);
    const dayConfig = selectedBarberSchedule.find(s => s.day_of_week === dbDayIndex);
    const closingTimeStr = dayConfig?.end_time || '20:00';
    const dayClosingMins = timeToMins(closingTimeStr);

    if (candidateEnd > dayClosingMins) {
      return true;
    }

    // 3. Disable break time slots if barber has a scheduled break (e.g. 13:00 - 14:00)
    if (dayConfig?.break_start && dayConfig?.break_end) {
      const breakStart = timeToMins(dayConfig.break_start);
      const breakEnd = timeToMins(dayConfig.break_end);
      if (candidateStart < breakEnd && candidateEnd > breakStart) {
        return true;
      }
    }

    // 4. Check for overlapping booked appointments
    for (const app of bookedAppointments) {
      const bookedStart = timeToMins(app.time);
      const bookedDuration = app.duration_minutes || app.durationMinutes || app.duration || 30;
      const bookedEnd = bookedStart + bookedDuration;

      // Overlap condition: candidateStart < bookedEnd AND candidateEnd > bookedStart
      if (candidateStart < bookedEnd && candidateEnd > bookedStart) {
        return true;
      }
    }
    return false;
  }, [bookedAppointments, totalDurationMinutes, selectedDate, calendarDates, selectedBarberSchedule]);

  const handleBookingSubmit = async (authenticatedUser = user) => {
    if (!authenticatedUser || !selectedEmployee || !selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      const totalMins = totalDurationMinutes;
      const serviceNames = selectedServices.map(s => s.price > 0 ? `${s.name} (${s.price}€)` : s.name).join(", ");
      const clientName = authenticatedUser.name || `${firstName} ${lastName}`.trim() || 'Klient i ri';

      const totalPrice = selectedServices.reduce((sum, s) => sum + (parseFloat(String(s.price)) || 0), 0);

      const { data: insertedAppt, error } = await supabase.from('appointments').insert({
        shop_id: shop.id,
        user_id: authenticatedUser.id,
        barber_id: selectedEmployee.id,
        date: selectedDate,
        time: selectedTime,
        service: serviceNames,
        price: totalPrice,
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
      
      setConfirmedBookingDetails({
        shopName: shop?.name || "Salloni",
        barberName: selectedEmployee?.name || "Stafi i Sallonit",
        services: selectedServices.map(s => s.name).join(", "),
        date: selectedDate,
        time: selectedTime,
        price: totalPrice
      });
      setBookingSuccess(true);
      setShowBookingModal(false);
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

        if (!dbUser) {
          // Check if it's a shop owner instead
          const { data: dbShop } = await supabase
            .from('barbershops')
            .select('*')
            .eq('email', email.trim().toLowerCase())
            .maybeSingle();

          if (!dbShop) {
            // Handled globally in App.tsx to avoid double alerts
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }

          // If it's a shop owner, we can construct the object
          onLogin({
            id: dbShop.owner_id || dbShop.id,
            name: dbShop.name,
            email: dbShop.email,
            role: 'owner'
          });
        } else {
          const userData = {
            id: dbUser.id,
            name: dbUser.name || email,
            email: email,
            phone: dbUser.phone,
            role: dbUser.role || 'client'
          };
          onLogin(userData);
        }
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
      const defaults = Array.from({ length: 7 }, (_, i) => ({
        day_of_week: i,
        start_time: '09:00',
        end_time: '20:00',
        is_closed: i === 6 // Sunday
      }));

      if (!selectedEmployee?.id) {
        setSelectedBarberSchedule(defaults);
        generateAvailableDates(defaults);
        return;
      }
      try {
        const { data: schedule } = await supabase
          .from('barber_schedules')
          .select('*')
          .eq('barber_id', String(selectedEmployee.id));

        if (schedule && schedule.length > 0) {
          setSelectedBarberSchedule(schedule);
          generateAvailableDates(schedule);
        } else {
          setSelectedBarberSchedule(defaults);
          generateAvailableDates(defaults);
        }
      } catch (e) {
        console.warn("Error loading schedule:", e);
        setSelectedBarberSchedule(defaults);
        generateAvailableDates(defaults);
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

      // Check if this date is an official holiday and what the shop/barber preference is
      const holiday = KOSOVO_HOLIDAYS_2026.find(h => h.day === d.getDate() && h.month === d.getMonth());

      // If employee is selected, check their preferences first. Fallback to shop if no employee selected.
      const targetHolidayPrefs = selectedEmployee ? selectedEmployee.holiday_preferences : shop?.holiday_preferences;
      const isWorkingOnHoliday = holiday ? (targetHolidayPrefs?.[holiday.name] === true) : true;

      let isClosed = dayConfig ? dayConfig.is_closed : false;

      // Check if barber or shop is on vacation/pushim
      if (selectedEmployee?.is_on_vacation || shop?.is_on_vacation) {
        isClosed = true;
      } else if (selectedEmployee?.vacation_start && selectedEmployee?.vacation_end) {
        const dStr = d.toISOString().split('T')[0];
        if (dStr >= selectedEmployee.vacation_start && dStr <= selectedEmployee.vacation_end) {
          isClosed = true;
        }
      }

      // Disable today if working hours have passed
      if (i === 0) {
        const endTimeStr = dayConfig?.end_time || '20:00';
        const [endHour, endMin] = endTimeStr.split(':').map(Number);
        const closingMinutes = (endHour || 20) * 60 + (endMin || 0);
        const currentMinutes = today.getHours() * 60 + today.getMinutes();

        if (currentMinutes >= closingMinutes - 15) {
          isClosed = true;
        }
      }

      if (holiday && !isWorkingOnHoliday) {
        isClosed = true;
      }

      dates.push({
        fullDate: d.toISOString().split('T')[0],
        label: i === 0 ? 'Sot' : i === 1 ? 'Nesër' : d.toLocaleDateString('sq-AL', { day: 'numeric', month: 'short' }),
        isClosed: isClosed,
        holidayName: holiday?.name,
        dbDayIndex
      });
    }
    setCalendarDates(dates);
    const firstOpen = dates.find(d => !d.isClosed);
    if (firstOpen) {
      setSelectedDate(firstOpen.fullDate);
    } else if (dates.length > 0) {
      setSelectedDate(dates[0].fullDate);
    }
  };

  useEffect(() => {
    const activeSchedule = selectedBarberSchedule.length > 0 ? selectedBarberSchedule : Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      start_time: '09:00',
      end_time: '20:00',
      is_closed: i === 6
    }));

    if (selectedDate) {
      const dateObj = calendarDates.find(d => d.fullDate === selectedDate);
      const dbDayIndex = dateObj ? dateObj.dbDayIndex : (new Date(selectedDate).getDay() === 0 ? 6 : new Date(selectedDate).getDay() - 1);
      const dayConfig = activeSchedule.find(s => s.day_of_week === dbDayIndex);

      if (dayConfig && !dayConfig.is_closed) {
        generateTimeSlots(dayConfig.start_time || '09:00', dayConfig.end_time || '20:00');
      } else if (!dayConfig) {
        generateTimeSlots('09:00', '20:00');
      } else {
        setAvailableTimeSlots([]);
      }
    }
  }, [selectedDate, selectedBarberSchedule, calendarDates]);

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

  const calculatedRating = useMemo(() => {
    if (reviews && reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + (parseFloat(String(r.rating)) || 5), 0) / reviews.length;
      return avg.toFixed(1);
    }
    if (shop?.rating) {
      return parseFloat(String(shop.rating)).toFixed(1);
    }
    return "5.0";
  }, [reviews, shop?.rating]);

  const realOpeningHours = useMemo(() => {
    if (shop?.opening_hours) return shop.opening_hours;
    if (shop?.working_hours) return shop.working_hours;
    if (shop?.open_time && shop?.close_time) return `${shop.open_time} - ${shop.close_time}`;

    if (selectedBarberSchedule && selectedBarberSchedule.length > 0) {
      const openDay = selectedBarberSchedule.find((s: any) => !s.is_closed);
      if (openDay?.start_time && openDay?.end_time) {
        return `${openDay.start_time} - ${openDay.end_time}`;
      }
    }
    return "09:00 - 20:00";
  }, [shop, selectedBarberSchedule]);

  const rating = calculatedRating;
  const imageUrl = getShopCardImage(shop);
  const rawPortfolioData = shop?.portfolio_urls || [];
  const portfolioData = rawPortfolioData.filter((p: any) => typeof p === 'object' && p !== null ? p.category !== 'Kartela' : true);
  const photos = portfolioData.map((p: any) => typeof p === 'string' ? p : p.url);

  const availablePhotoCategories = ["Të gjitha", ...new Set(portfolioData.map((p: any) => p.category).filter(Boolean))];

  const filteredPhotos = activePhotoCategory === "Të gjitha"
    ? portfolioData
    : portfolioData.filter((p: any) => p.category === activePhotoCategory);

  const isDesktop = Platform.OS === 'web' && width > 768;

  if (isDesktop) {
    return (
      <View className="flex-1 bg-[#f8fafc] overflow-y-auto">
        <View className="mx-auto w-full max-w-[1440px] px-6 lg:px-10 py-8">
          {/* Top Desktop Breadcrumb & Navigation */}
          <View className="mb-6 flex items-center justify-between">
            <TouchableOpacity
              type="button"
              onPress={onBack}
              className="group inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 font-display text-sm font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft size={18} className="text-slate-500 group-hover:text-slate-900" />
              <Text>← Kthehu te Kërkimi</Text>
            </TouchableOpacity>

            <View className="flex items-center gap-3">
              <TouchableOpacity
                type="button"
                onPress={handleFavoriteToggle}
                className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 font-display text-sm font-bold text-slate-700 shadow-2xs transition-transform hover:scale-105 cursor-pointer"
              >
                <Heart size={18} color={isFavLocal ? "#ef4444" : "#64748b"} fill={isFavLocal ? "#ef4444" : "transparent"} />
                <Text>{isFavLocal ? "Në të ruajtura" : "Ruaj"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                type="button"
                onPress={handleShare}
                className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 font-display text-sm font-bold text-slate-700 shadow-2xs transition-transform hover:scale-105 cursor-pointer"
              >
                <Share2 size={18} className="text-slate-500" />
                <Text>Shpërndaj</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 2-COLUMN MAIN SPLIT LAYOUT AT TOP */}
          <View className="grid gap-8 lg:grid-cols-[1fr_440px] items-start">
            {/* LEFT COLUMN: Hero Cover, About, Services Menu, Reviews */}
            <View className="flex flex-col gap-8">
              {/* Desktop Hero Image Container */}
              <View 
                onPress={() => setZoomImage(imageUrl)}
                className="group relative cursor-pointer overflow-hidden rounded-3xl bg-slate-900 h-[380px] shadow-lg"
              >
                <Image source={{ uri: imageUrl }} className="h-full w-full rounded-3xl" resizeMode="cover" />
                <View className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                <View className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <View>
                    <Text className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3 py-1 font-display text-xs font-bold text-slate-900 mb-2">
                      <Star size={14} color="#fbbf24" fill="#fbbf24" />
                      {rating} ({reviews.length > 0 ? reviews.length : 12} vlerësime)
                    </Text>
                    <Text className="font-display text-3xl font-bold text-white drop-shadow-md">{shopName}</Text>
                    <Text className="flex items-center gap-1.5 font-medium text-slate-200 text-sm mt-1">
                      <MapPin size={16} className="text-white" />
                      {address}
                    </Text>
                  </View>
                  {photos.length > 0 && (
                    <View className="hidden sm:flex items-center gap-2">
                      {photos.slice(0, 3).map((photoUrl: any, idx: number) => {
                        const pUrl = typeof photoUrl === 'string' ? photoUrl : photoUrl.url;
                        return (
                          <View 
                            key={idx}
                            onPress={(e) => {
                              e.stopPropagation();
                              setZoomImage(pUrl);
                            }}
                            className="h-12 w-12 rounded-xl overflow-hidden border-2 border-white/80 shadow-xs transition-transform hover:scale-110"
                          >
                            <Image source={{ uri: pUrl }} className="h-full w-full rounded-2xl" resizeMode="cover" />
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>

              {/* About & Shop Info */}
              <View className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xs">
                <Text className="font-display text-xl font-bold text-slate-900 mb-3">Rreth {shopName}</Text>
                <Text className="text-sm font-medium text-slate-600 leading-relaxed mb-6">
                  {shop?.description || `${shopName} është një nga sallonet më premium në zonë, duke ofruar shërbime profesionale të prerjes së flokëve, stilimit të mjekrës dhe kujdesit për lëkurën.`}
                </Text>

                <View className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                  <View className="flex items-center gap-3">
                    <View className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#3473ef]">
                      <Clock size={20} />
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-slate-400 uppercase">Orari</Text>
                      <Text className="font-display text-sm font-bold text-slate-900">{realOpeningHours}</Text>
                    </View>
                  </View>
                  <View className="flex items-center gap-3">
                    <View className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <Star size={20} fill="#fbbf24" color="#fbbf24" />
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-slate-400 uppercase">Vlerësimi</Text>
                      <Text className="font-display text-sm font-bold text-slate-900">{rating} / 5.0</Text>
                    </View>
                  </View>
                  <View className="flex items-center gap-3">
                    <View className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Shield size={20} />
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-slate-400 uppercase">Statusi</Text>
                      <Text className="font-display text-sm font-bold text-emerald-600">Verifikuar ✓</Text>
                    </View>
                  </View>
                </View>
              </View>



              {/* Customer Reviews Section */}
              <View className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xs">
                <View className="flex items-center justify-between mb-6">
                  <View>
                    <Text className="font-display text-xl font-bold text-slate-900">Vlerësimet nga Klientët</Text>
                    <Text className="text-xs font-medium text-slate-500">Përvojat e klientëve të verifikuar te {shopName}</Text>
                  </View>
                  <Text className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-1 font-display text-sm font-bold text-slate-900 border border-amber-200/60">
                    <Star size={14} color="#fbbf24" fill="#fbbf24" />
                    {rating} / 5.0
                  </Text>
                </View>

                <View className="flex flex-col gap-4">
                  {reviews.length > 0 ? (
                    reviews.map((rev: any, idx: number) => (
                      <View key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                        <View className="flex items-center justify-between mb-2">
                          <View className="flex items-center gap-2">
                            <View className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 font-bold text-white text-xs">
                              {(rev.users?.name || rev.name || "K").charAt(0).toUpperCase()}
                            </View>
                            <Text className="font-display text-sm font-bold text-slate-900">{rev.users?.name || rev.name || "Klient i verifikuar"}</Text>
                          </View>
                          <Text className="flex items-center gap-1 text-xs font-bold text-amber-500">
                            <Star size={12} fill="#f59e0b" color="#f59e0b" />
                            {rev.rating || 5}.0
                          </Text>
                        </View>
                        <Text className="text-xs font-medium text-slate-600 leading-relaxed">{rev.comment}</Text>
                      </View>
                    ))
                  ) : (
                    <View className="py-8 text-center">
                      <Text className="text-sm font-medium text-slate-500">Nuk ka ende vlerësime të shkruara. Bëhu i pari që rezervon dhe vlerëson!</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* RIGHT COLUMN: STICKY BOOKING WIDGET */}
            {/* RIGHT COLUMN: INTERACTIVE STEP-BY-STEP BOOKING WIDGET */}
            <View className="sticky top-24 flex flex-col gap-6">
              <View className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl">
                {bookingSuccess ? (
                  <View className="flex flex-col items-center gap-4 py-4 text-center">
                    <View className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 animate-bounce">
                      <Check size={36} strokeWidth={3} />
                    </View>

                    <View>
                      <Text className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 font-display text-xs font-bold text-emerald-800 mb-2">
                        <Sparkles size={14} className="text-emerald-600" />
                        Rezervimi u krye me sukses! 🎉
                      </Text>
                      <Text className="font-display text-2xl font-bold text-slate-900">Urime! Takimi u konfirmua</Text>
                      <Text className="text-xs font-medium text-slate-600 mt-1">
                        Njoftimi u dërgua me sukses te salloni <Text className="font-bold text-slate-900">{confirmedBookingDetails?.shopName}</Text>.
                      </Text>
                    </View>

                    <View className="w-full rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-left flex flex-col gap-2.5 shadow-2xs">
                      <View className="flex justify-between text-xs font-bold text-slate-800 border-b border-slate-200/60 pb-1.5">
                        <Text className="text-slate-500 font-medium">Berberi:</Text>
                        <Text className="text-slate-900">{confirmedBookingDetails?.barberName}</Text>
                      </View>
                      <View className="flex justify-between text-xs font-bold text-slate-800 border-b border-slate-200/60 pb-1.5">
                        <Text className="text-slate-500 font-medium">Shërbimet:</Text>
                        <Text className="text-slate-900 truncate max-w-[200px]">{confirmedBookingDetails?.services}</Text>
                      </View>
                      <View className="flex justify-between text-xs font-bold text-slate-800 border-b border-slate-200/60 pb-1.5">
                        <Text className="text-slate-500 font-medium">Data & Ora:</Text>
                        <Text className="text-[#3473ef] font-bold">{confirmedBookingDetails?.date} në {confirmedBookingDetails?.time}</Text>
                      </View>
                      <View className="flex justify-between font-display text-sm font-bold text-slate-900 pt-0.5">
                        <Text>Statusi:</Text>
                        <Text className="text-emerald-600 font-bold">✓ Konfirmuar me OTP</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      type="button"
                      onPress={() => {
                        setBookingSuccess(false);
                        setWidgetStep(1);
                        setSelectedServices([]);
                        setSelectedTime("");
                      }}
                      className="w-full rounded-2xl bg-[#3473ef] py-3.5 font-display text-sm font-bold text-white shadow-md hover:bg-blue-600 cursor-pointer transition-all mt-2"
                    >
                      + Bëj një Rezervim të Ri
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    {/* Header & Step Bar */}
                    <View className="mb-4 border-b border-slate-100 pb-4">
                  <View className="flex items-center justify-between">
                    <View>
                      <Text className="text-xs font-bold uppercase tracking-wider text-[#3473ef]">Rezervim me OTP</Text>
                      <Text className="font-display text-xl font-bold text-slate-900">
                        {widgetStep === 1 ? "1. Zgjidh Berberin" :
                         widgetStep === 2 ? "2. Zgjidh Shërbimet" :
                         widgetStep === 3 ? "3. Data & Ora" : "4. Konfirmo Terminin"}
                      </Text>
                    </View>
                    <View className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#3473ef]">
                      <Calendar size={20} />
                    </View>
                  </View>

                  {/* Step Pills Navigation */}
                  <View className="mt-4 flex items-center justify-between gap-1 rounded-2xl bg-slate-100 p-1">
                    {[
                      { step: 1, label: "Berber" },
                      { step: 2, label: "Shërbimi" },
                      { step: 3, label: "Data & Ora" },
                      { step: 4, label: "Konfirmo" }
                    ].map((s) => {
                      const isActive = widgetStep === s.step;
                      const isDone = widgetStep > s.step || (
                        (s.step === 1 && selectedEmployee) ||
                        (s.step === 2 && selectedServices.length > 0) ||
                        (s.step === 3 && selectedDate && selectedTime)
                      );
                      return (
                        <TouchableOpacity
                          key={s.step}
                          type="button"
                          onPress={() => setWidgetStep(s.step)}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer ${
                            isActive
                              ? "bg-[#3473ef] text-white shadow-xs"
                              : isDone
                              ? "bg-blue-50 text-[#3473ef]"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          {s.label}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* STEP 1: SELECT BARBER */}
                {widgetStep === 1 && (
                  <View className="flex flex-col gap-3">
                    <Text className="text-xs font-bold text-slate-400 uppercase">Stafi i sallonit</Text>
                    <View className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {(staff.length > 0 ? staff : [{ id: shop?.id || 1, name: shop?.name || "Stafi i Sallonit", rating: 5.0 }]).map((emp: any) => {
                        const isSelected = selectedEmployee?.id === emp.id;
                        return (
                          <View
                            key={emp.id}
                            onPress={() => {
                              setSelectedEmployee(emp);
                              setWidgetStep(2);
                            }}
                            className={`flex cursor-pointer flex-col items-center rounded-2xl border p-3 transition-all ${
                              isSelected
                                ? 'border-[#3473ef] bg-blue-50/50 ring-2 ring-[#3473ef]/30'
                                : 'border-slate-200/80 bg-slate-50/40 hover:bg-white'
                            }`}
                          >
                            <View className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-2xs">
                              <UserIcon size={20} className={isSelected ? 'text-[#3473ef]' : 'text-slate-400'} />
                            </View>
                            <Text className="font-display text-xs font-bold text-slate-900 text-center truncate w-full">{emp.name}</Text>
                            <Text className="mt-1 text-[10px] font-bold text-amber-500">⭐ {emp.rating ? parseFloat(String(emp.rating)).toFixed(1) : "5.0"}</Text>
                          </View>
                        );
                      })}
                    </View>
                    <TouchableOpacity
                      type="button"
                      onPress={() => setWidgetStep(2)}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3473ef] py-3 text-xs font-bold text-white shadow-md hover:bg-blue-600 cursor-pointer"
                    >
                      <Text>Vazhdo te Shërbimet →</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* STEP 2: SELECT SERVICES */}
                {widgetStep === 2 && (
                  <View className="flex flex-col gap-3">
                    <View className="flex items-center justify-between">
                      <Text className="text-xs font-bold text-slate-400 uppercase">Trajtimet</Text>
                      <Text className="text-xs font-bold text-[#3473ef]">{selectedServices.length} zgjedhur</Text>
                    </View>
                    <View className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
                      {availableServices.length > 0 ? (
                        availableServices.map((srv, idx) => {
                          const selected = isServiceSelected(srv);
                          return (
                            <View
                              key={srv.id || idx}
                              onPress={() => handleToggleService(srv)}
                              className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                                selected ? 'border-[#3473ef] bg-blue-50/50' : 'border-slate-100 bg-slate-50/40 hover:bg-white'
                              }`}
                            >
                              <View className="flex items-center gap-2 min-w-0">
                                <View className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                  selected ? 'border-[#3473ef] bg-[#3473ef] text-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {selected && <Check size={12} strokeWidth={3} />}
                                </View>
                                <View className="min-w-0">
                                  <Text className="text-xs font-bold text-slate-900 truncate">{srv.name}</Text>
                                  <Text className="text-[10px] text-slate-400">⏱️ {srv.duration || `${srv.durationMinutes || 30} min`}</Text>
                                </View>
                              </View>
                              <Text className="text-xs font-bold text-[#3473ef] shrink-0">{srv.price && parseFloat(String(srv.price)) > 0 ? `${srv.price} €` : ''}</Text>
                            </View>
                          );
                        })
                      ) : (
                        DEFAULT_SHOP_SERVICES.map((srv) => {
                          const selected = isServiceSelected(srv);
                          return (
                            <View
                              key={srv.id}
                              onPress={() => handleToggleService(srv)}
                              className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                                selected ? 'border-[#3473ef] bg-blue-50/50' : 'border-slate-100 bg-slate-50/40 hover:bg-white'
                              }`}
                            >
                              <View className="flex items-center gap-2 min-w-0">
                                <View className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                  selected ? 'border-[#3473ef] bg-[#3473ef] text-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {selected && <Check size={12} strokeWidth={3} />}
                                </View>
                                <Text className="text-xs font-bold text-slate-900 truncate">{srv.name}</Text>
                              </View>
                              <Text className="text-xs font-bold text-[#3473ef] shrink-0">{srv.price && parseFloat(String(srv.price)) > 0 ? `${srv.price} €` : ''}</Text>
                            </View>
                          );
                        })
                      )}
                    </View>
                    <View className="flex gap-2 mt-2">
                      <TouchableOpacity
                        type="button"
                        onPress={() => setWidgetStep(1)}
                        className="px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        ← Mbrapa
                      </TouchableOpacity>
                      <TouchableOpacity
                        type="button"
                        onPress={() => {
                          if (selectedServices.length === 0) {
                            Alert.alert("Zgjidhni Shërbimin", "Ju lutem zgjidhni të paktën 1 shërbim te lista.");
                            return;
                          }
                          setWidgetStep(3);
                        }}
                        className="flex-1 py-2.5 rounded-2xl bg-[#3473ef] text-xs font-bold text-white shadow-md hover:bg-blue-600 cursor-pointer text-center"
                      >
                        Vazhdo te Data & Ora →
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* STEP 3: SELECT DATE & TIME */}
                {widgetStep === 3 && (
                  <View className="flex flex-col gap-3">
                    <Text className="text-xs font-bold text-slate-400 uppercase">Data e rezervimit</Text>
                    <View className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {calendarDates.slice(0, 10).map((item, idx) => {
                        const isSelected = selectedDate === item.fullDate;
                        return (
                          <TouchableOpacity
                            key={idx}
                            type="button"
                            disabled={item.isClosed}
                            onPress={() => {
                              if (item.isClosed) return;
                              setSelectedDate(item.fullDate);
                              setSelectedTime("");
                            }}
                            className={`flex min-w-[64px] flex-col items-center justify-center rounded-xl border p-2 transition-all cursor-pointer ${
                              item.isClosed
                                ? "border-slate-100 bg-slate-50 opacity-40 text-slate-400"
                                : isSelected
                                ? "border-[#3473ef] bg-blue-50 text-[#3473ef] font-bold"
                                : "border-slate-200/80 bg-slate-50/40 hover:bg-white text-slate-700"
                            }`}
                          >
                            <Text className="text-[9px] font-bold uppercase">{item.label}</Text>
                            <Text className="text-[10px] font-medium">{item.fullDate.split('-').slice(1).join('/')}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text className="text-xs font-bold text-slate-400 uppercase mt-1">Orari i lirë (Kohëzgjatja: {totalDurationMinutes} min)</Text>
                    <View className="grid grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto">
                      {availableSlots.length > 0 ? (
                        availableSlots.map((time, idx) => {
                          const disabled = isSlotDisabled(time);
                          const isSelected = selectedTime === time;
                          return (
                            <TouchableOpacity
                              key={idx}
                              type="button"
                              disabled={disabled}
                              onPress={() => !disabled && setSelectedTime(time)}
                              title={disabled ? "Kjo fashë orari është e zënë apo nuk mjafton kohëzgjatja" : `Zgjidh orarin ${time}`}
                              className={`rounded-lg border py-2 px-1 text-center text-xs font-bold transition-all ${
                                disabled
                                  ? "border-slate-200/50 bg-slate-100/70 opacity-40 cursor-not-allowed text-slate-400 line-through"
                                  : isSelected
                                  ? "border-[#3473ef] bg-[#3473ef] text-white shadow-xs"
                                  : "border-slate-200/80 bg-slate-50/40 hover:border-slate-300 hover:bg-white text-slate-800 cursor-pointer"
                              }`}
                            >
                              {time}
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <Text className="col-span-4 text-xs font-semibold text-slate-400 py-3 text-center bg-slate-50 rounded-xl">
                          Nuk ka orare të lira për këtë datë.
                        </Text>
                      )}
                    </View>

                    <View className="flex gap-2 mt-2">
                      <TouchableOpacity
                        type="button"
                        onPress={() => setWidgetStep(2)}
                        className="px-3 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        ← Mbrapa
                      </TouchableOpacity>
                      <TouchableOpacity
                        type="button"
                        onPress={() => {
                          if (!selectedDate || !selectedTime) {
                            Alert.alert("Zgjidhni Orarin", "Ju lutem zgjidhni datën dhe orën.");
                            return;
                          }
                          setWidgetStep(4);
                        }}
                        className="flex-1 py-2.5 rounded-2xl bg-[#3473ef] text-xs font-bold text-white shadow-md hover:bg-blue-600 cursor-pointer text-center"
                      >
                        Shiko Konfirmimin →
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* STEP 4: CONFIRMATION & OTP */}
                {widgetStep === 4 && (
                  <View className="flex flex-col gap-3">
                    {/* Selected Summary Card */}
                    <View className="rounded-2xl bg-slate-50 p-4 border border-slate-100 flex flex-col gap-2.5">
                      <Text className="text-xs font-bold text-slate-400 uppercase">Përmbledhje e plotë</Text>
                      
                      <View className="flex justify-between text-xs font-bold text-slate-800 border-b border-slate-200/60 pb-1.5">
                        <Text className="text-slate-500 font-medium">Berberi:</Text>
                        <Text className="text-slate-900">{selectedEmployee?.name || staff[0]?.name || "Stafi i Sallonit"}</Text>
                      </View>

                      <View className="flex flex-col gap-1 border-b border-slate-200/60 pb-1.5">
                        <Text className="text-slate-500 font-medium text-xs">Shërbimet:</Text>
                        {selectedServices.length > 0 ? (
                          selectedServices.map((s, idx) => (
                            <View key={idx} className="flex justify-between text-xs font-bold text-slate-800">
                              <Text>• {s.name}</Text>
                              <Text className="text-[#3473ef]">{s.price && parseFloat(String(s.price)) > 0 ? `${s.price} €` : ''}</Text>
                            </View>
                          ))
                        ) : (
                          <Text className="text-xs font-medium text-amber-600 italic">Zgjidhni të paktën 1 shërbim te Hapi 2</Text>
                        )}
                      </View>

                      <View className="flex justify-between text-xs font-bold text-slate-800 border-b border-slate-200/60 pb-1.5">
                        <Text className="text-slate-500 font-medium">Data & Ora:</Text>
                        <Text className="text-[#3473ef]">{selectedDate && selectedTime ? `${selectedDate} në ${selectedTime}` : selectedDate ? `${selectedDate}` : "Zgjidhni datën & orën"}</Text>
                      </View>

                      <View className="flex justify-between font-display text-sm font-bold text-slate-900 pt-1">
                        <Text>Totali:</Text>
                        <Text className="text-[#3473ef]">
                          {(() => {
                            const totPrice = selectedServices.reduce((sum, s) => sum + (parseFloat(String(s.price)) || 0), 0);
                            return totPrice > 0 ? `${totPrice} € (${totalDurationMinutes} min)` : `${totalDurationMinutes} min`;
                          })()}
                        </Text>
                      </View>
                    </View>

                    {/* USER CREDENTIALS & OTP VERIFICATION SECTION */}
                    {bookingOtpSent ? (
                      <View className="rounded-2xl bg-blue-50/80 p-4 border border-blue-200/80 flex flex-col gap-3">
                        <View className="flex items-center gap-2 text-[#3473ef]">
                          <Smartphone size={18} />
                          <Text className="font-display text-xs font-bold">Kodi SMS u dërgua me sukses!</Text>
                        </View>
                        <Text className="text-xs font-medium text-slate-600 leading-relaxed">
                          Kemi dërguar kodin me 6 shifra në numrin tuaj të telefonit: <Text className="font-bold text-slate-900">{phone || user?.phone}</Text>
                        </Text>

                        <View>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Shkruaj Kodin 6-Shifror (OTP)</label>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="0 0 0 0 0 0"
                            value={bookingOtpCode}
                            onChange={(e) => setBookingOtpCode(e.target.value)}
                            className="w-full text-center tracking-[0.4em] font-mono text-base font-bold rounded-xl border border-blue-300 bg-white px-3 py-2.5 text-slate-900 focus:border-[#3473ef] focus:outline-none shadow-xs"
                          />
                        </View>

                        <View className="flex gap-2 mt-1">
                          <TouchableOpacity
                            type="button"
                            onPress={() => setBookingOtpSent(false)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            ← Mbrapa / Ndrysho
                          </TouchableOpacity>
                          <TouchableOpacity
                            type="button"
                            disabled={verifyingBookingOtp}
                            onPress={handleVerifyOtpSubmit}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#3473ef] py-2.5 font-display text-xs font-bold text-white shadow-md hover:bg-blue-600 cursor-pointer"
                          >
                            {verifyingBookingOtp ? (
                              <Text>Duke verifikuar...</Text>
                            ) : (
                              <Text>Verifiko & Përfundo Rezervimin ✓</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View className="flex flex-col gap-3">
                        <View className="rounded-2xl bg-white p-4 border border-slate-200 shadow-2xs flex flex-col gap-3">
                          {user ? (
                            <View className="flex items-center justify-between bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                              <View>
                                <Text className="text-[10px] font-bold text-slate-400 uppercase">Llogaria e kyçur</Text>
                                <Text className="font-display text-xs font-bold text-slate-900">{user.name || user.email}</Text>
                                {(phone || user.phone) && (
                                  <Text className="text-[11px] font-medium text-[#3473ef] mt-0.5">📱 {phone || user.phone}</Text>
                                )}
                              </View>
                              <Text className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">Aktiv ✓</Text>
                            </View>
                          ) : (
                            <View className="flex flex-col gap-3">
                              {/* Mode Switcher */}
                              <View className="flex rounded-xl bg-slate-100 p-1">
                                <TouchableOpacity
                                  type="button"
                                  onPress={() => setAuthMode('signup')}
                                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                    authMode === 'signup' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                                  }`}
                                >
                                  Klient i Ri
                                </TouchableOpacity>
                                <TouchableOpacity
                                  type="button"
                                  onPress={() => setAuthMode('login')}
                                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                    authMode === 'login' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                                  }`}
                                >
                                  Kam Llogari (Kyçu)
                                </TouchableOpacity>
                              </View>

                              {authMode === 'signup' ? (
                                <View className="flex flex-col gap-2.5">
                                  <View>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Emri & Mbiemri (Full Name)</label>
                                    <input
                                      type="text"
                                      placeholder="e.g. Liridon Salihi"
                                      value={firstName ? `${firstName} ${lastName}`.trim() : ''}
                                      onChange={(e) => {
                                        const parts = e.target.value.split(" ");
                                        setFirstName(parts[0] || "");
                                        setLastName(parts.slice(1).join(" ") || "");
                                      }}
                                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#3473ef] focus:bg-white focus:outline-none"
                                    />
                                  </View>

                                  <View>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Adresa</label>
                                    <input
                                      type="email"
                                      placeholder="email@domain.com"
                                      value={email}
                                      onChange={(e) => setEmail(e.target.value)}
                                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#3473ef] focus:bg-white focus:outline-none"
                                    />
                                  </View>

                                  <View>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Numri i Telefonit (+383)</label>
                                    <input
                                      type="tel"
                                      placeholder="+383 4X XXX XXX"
                                      value={phone}
                                      onChange={(e) => setPhone(e.target.value)}
                                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#3473ef] focus:bg-white focus:outline-none"
                                    />
                                  </View>

                                  <View>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fjalëkalimi (Password)</label>
                                    <input
                                      type="password"
                                      placeholder="••••••••"
                                      value={password}
                                      onChange={(e) => setPassword(e.target.value)}
                                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#3473ef] focus:bg-white focus:outline-none"
                                    />
                                  </View>
                                </View>
                              ) : (
                                <View className="flex flex-col gap-2.5">
                                  <View>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Adresa</label>
                                    <input
                                      type="email"
                                      placeholder="email@domain.com"
                                      value={email}
                                      onChange={(e) => setEmail(e.target.value)}
                                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#3473ef] focus:bg-white focus:outline-none"
                                    />
                                  </View>

                                  <View>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fjalëkalimi (Password)</label>
                                    <input
                                      type="password"
                                      placeholder="••••••••"
                                      value={password}
                                      onChange={(e) => setPassword(e.target.value)}
                                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#3473ef] focus:bg-white focus:outline-none"
                                    />
                                  </View>
                                </View>
                              )}
                            </View>
                          )}
                        </View>

                        {/* Action Button: Triggers OTP Confirmation */}
                        <View className="flex gap-2 mt-1">
                          <TouchableOpacity
                            type="button"
                            onPress={() => setWidgetStep(3)}
                            className="px-3 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            ← Mbrapa
                          </TouchableOpacity>
                          <TouchableOpacity
                            type="button"
                            disabled={loading}
                            onPress={handleConfirmOtpAndReserve}
                            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#3473ef] py-3.5 font-display text-sm font-bold text-white shadow-lg hover:bg-blue-600 cursor-pointer"
                          >
                            {loading ? (
                              <Text>Duke dërguar OTP...</Text>
                            ) : (
                              <>
                                <Calendar size={16} />
                                <Text>Konfirmo me SMS OTP →</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    <Text className="mt-2 text-center text-[11px] font-medium text-slate-400">
                      ⚡ Pa parapagim — konfirmim i menjëhershëm me SMS OTP.
                    </Text>
                  </View>
                )}
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

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
            {(() => {
              const now = new Date();
              const dayIdx = (now.getDay() + 6) % 7;
              const config = shopSchedule.find(s => s.day_of_week === dayIdx);

              const holiday = KOSOVO_HOLIDAYS_2026.find(h => h.day === now.getDate() && h.month === now.getMonth());

              // If employee is selected, check their preferences. Fallback to shop.
              const targetHolidayPrefs = selectedEmployee ? selectedEmployee.holiday_preferences : shop?.holiday_preferences;
              const isWorkingOnHoliday = holiday ? (targetHolidayPrefs?.[holiday.name] === true) : true;

              let isOpen = true;
              if (config) {
                const currentMins = now.getHours() * 60 + now.getMinutes();
                const startMins = timeToMins(config.start_time);
                const endMins = timeToMins(config.end_time);
                isOpen = !config.is_closed && currentMins >= startMins && currentMins <= endMins;
              }

              if (holiday && !isWorkingOnHoliday) {
                isOpen = false;
              }

              return (
                <View className={`${isOpen ? 'bg-emerald-500' : 'bg-rose-500'} px-4 py-1.5 rounded-full shadow-sm`}>
                  <Text className="text-white text-xs font-black">{isOpen ? 'Hapur' : 'Mbyllur'}</Text>
                </View>
              );
            })()}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
                ) : (
                  <View className="w-10" />
                )}

                <Text className="text-lg font-black text-[#161719]">
                  {bookingStep === 1 ? '1. Zgjidh Berberin' :
                   bookingStep === 2 ? '2. Zgjidh Shërbimet' :
                   bookingStep === 3 ? '3. Koha & Data' :
                   bookingStep === 4 ? '4. Konfirmimi' :
                   '5. Verifikimi OTP'}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    setShowBookingModal(false);
                    setBookingStep(1);
                    setBookingOtpSent(false);
                    Keyboard.dismiss();
                  }}
                  className="p-2 bg-slate-50 rounded-full"
                >
                  <X size={20} color="#161719" />
                </TouchableOpacity>
              </View>

              <ScrollView
                ref={bookingScrollRef}
                className="flex-1 px-8 pt-6"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
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
                              setSelectedServices([]);
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

                {/* HAPI 2: Zgjidh Shërbimet */}
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
                          const packageDetails = PACKAGE_DETAILS[srv.name];
                          const isPackage = !!packageDetails;

                          return (
                            <TouchableOpacity
                              key={srvId}
                              activeOpacity={0.6}
                              onPress={() => handleToggleService(srv)}
                              className={`${isPackage ? 'w-full' : 'w-[48%]'} p-4 rounded-[24px] border-2 justify-between shadow-sm ${isSelected ? 'border-[#3473ef] bg-[#3473ef]/5' : 'border-slate-100 bg-white'}`}
                              style={{ minHeight: 110 }}
                            >
                              <View>
                                <View className="flex-row items-start justify-between">
                                  <View className="flex-1 mr-2">
                                    <View className="flex-row items-center">
                                      {isPackage && <Text className="mr-1.5 text-base">{srv.name.includes('Nuse') ? '👰' : '🤵'}</Text>}
                                      <Text className={`text-[13px] font-black leading-4 ${isSelected ? 'text-[#3473ef]' : 'text-[#161719]'}`} numberOfLines={2}>{srv.name}</Text>
                                    </View>
                                  </View>
                                  <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-white border-slate-200'}`}>
                                    {isSelected && <Check size={12} color="white" strokeWidth={4} />}
                                  </View>
                                </View>

                                {isPackage && (
                                  <View className="mt-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                    <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Çfarë përfshihet:</Text>
                                    <View className="flex-row flex-wrap">
                                      {packageDetails.map((detail, i) => (
                                        <View key={i} className="w-1/2 flex-row items-center mb-1.5 pr-2">
                                          <View className={`w-1 h-1 rounded-full mr-1.5 ${isSelected ? 'bg-[#3473ef]' : 'bg-slate-300'}`} />
                                          <Text className={`text-[9px] font-bold flex-1 ${isSelected ? 'text-[#3473ef]' : 'text-slate-500'}`} numberOfLines={1}>{detail}</Text>
                                        </View>
                                      ))}
                                    </View>
                                  </View>
                                )}
                              </View>

                              <View className="flex-row items-center justify-between mt-4">
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

                {/* HAPI 3: Koha dhe Data */}
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
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3 mb-6">
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

                    {/* Orari i Sallonit Section */}
                    {(() => {
                      const dateObj = calendarDates.find(d => d.fullDate === selectedDate);
                      const shopDay = shopSchedule.find(s => s.day_of_week === dateObj?.dbDayIndex);
                      if (!shopDay) return null;

                      return (
                        <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <Store size={16} color="#161719" />
                            <Text className="text-[#161719] text-[11px] font-black ml-2 uppercase tracking-tight">Orari i Sallonit:</Text>
                          </View>
                          <Text className="text-[#3473ef] text-xs font-black">
                            {shopDay.is_closed ? 'Mbyllur' : `${shopDay.start_time} - ${shopDay.end_time}`}
                          </Text>
                        </View>
                      );
                    })()}

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

                {/* HAPI 4: Konfirmimi */}
                {bookingStep === 4 && (
                  <View>
                    {!user ? (
                      <View>
                        <View className="mb-6 items-center">
                          <Text className="text-2xl font-black text-[#161719] mb-2">{authMode === 'login' ? 'Identifikohu' : 'Regjistrohu'}</Text>
                          <Text className="text-slate-400 font-bold text-xs text-center">
                            {authMode === 'login' ? 'Shënoni të dhënat tuaja për të vazhduar me verifikimin OTP' : 'Krijoni një llogari për të përfunduar rezervimin'}
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
                          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-lg">{authMode === 'login' ? 'Identifikohu & Vazhdo' : 'Krijo Llogarinë & Vazhdo'}</Text>}
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
                          <Text className="text-[#3473ef] font-black text-sm">{authMode === 'login' ? 'Nuk keni llogari? Regjistrohuni' : 'Keni llogari? Identifikohuni'}</Text>
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
                      <Text className="text-[#8789A3] text-center font-bold text-xs mb-8 px-4">Kemi dërguar një kod verifikimi në numrin tuaj {phone || user?.phone}.</Text>
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
                      <TouchableOpacity onPress={() => setBookingStep(4)} className="mt-4">
                        <Text className="text-slate-400 font-bold text-xs underline">Kthehu te konfirmimi</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={{ height: 120 }} />
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
