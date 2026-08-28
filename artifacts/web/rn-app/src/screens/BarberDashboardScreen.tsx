import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, Platform, Alert, Switch, TextInput, Modal, KeyboardAvoidingView, Keyboard } from 'react-native';
import {
  Users,
  Calendar,
  TrendingUp,
  Plus,
  ChevronRight,
  Bell,
  Clock,
  CreditCard,
  DollarSign,
  Scissors,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  User as UserIcon,
  Star,
  Settings,
  MoreHorizontal,
  ArrowUpRight,
  Target,
  BarChart3,
  CalendarDays,
  Flag,
  Info,
  XCircle,
  X,
  Globe,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  Heart,
  CheckCheck,
  Sparkles,
  Trash2,
  RefreshCw
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  FadeInDown,
  FadeInRight,
  Layout
} from 'react-native-reanimated';
import { supabase } from "../config/supabase";
import { AddStaffModal } from '../components/AddStaffModal';
import { DEFAULT_CATEGORIES } from '../config/defaultCategories';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from '../utils/storage';
import { PaddleCheckout } from '../components/PaddleCheckout';
import { createPaddleTransaction, PADDLE_CONFIG } from '../config/paddle';
import { getShopPlanDetails } from '../utils/planLimits';
import { getShopCardImage } from '../utils/imageUtils';
import { SubscriptionExpiredScreen } from '../components/SubscriptionExpiredScreen';
import { useSubscription } from '../hooks/useSubscription';

const { width } = Dimensions.get('window');

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

interface BarberDashboardScreenProps {
  user: any;
  onLogout: () => void;
}

const RevenueChart = () => {
  const chartHeight = 160;
  const chartWidth = width - 96;
  const data = [45, 65, 42, 85, 95, 75, 110];
  const maxVal = Math.max(...data);
  const stepX = chartWidth / (data.length - 1);
  const points = data.map((val, i) => ({
    x: i * stepX,
    y: chartHeight - (val / maxVal) * (chartHeight - 20)
  }));
  const pathData = points.reduce((acc, p, i) => i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`, "");
  const areaData = `${pathData} L ${points[points.length - 1].x},${chartHeight} L 0,${chartHeight} Z`;

  return (
    <View style={{ height: chartHeight + 30 }}>
      <Svg height={chartHeight} width={chartWidth}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#3473ef" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#3473ef" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={areaData} fill="url(#gradient)" />
        <Path d={pathData} fill="none" stroke="#3473ef" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#3473ef" strokeWidth="2" />
        ))}
      </Svg>
      <View className="flex-row justify-between mt-4">
        {['Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht', 'Die'].map((day, i) => (
          <Text key={i} className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{day}</Text>
        ))}
      </View>
    </View>
  );
};

export const BarberDashboardScreen: React.FC<BarberDashboardScreenProps> = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string | null>(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [employeeLimit, setEmployeeLimit] = useState(1);
  const [shopStatus, setShopStatus] = useState<string>('active');
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null);
  const [shopSchedule, setShopSchedule] = useState<any[]>([]);
  const [portfolioPhotos, setPortfolioPhotos] = useState<any[]>([]); // Array of {url, category}
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  // Shop Card Image states
  const [shopImageUrl, setShopImageUrl] = useState<string | null>(null);
  const [newCardPhotoUrl, setNewCardPhotoUrl] = useState('');
  const [updatingCardPhoto, setUpdatingCardPhoto] = useState(false);

  // Upgrade Plan States
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isPreparingUpgrade, setIsPreparingUpgrade] = useState(false);
  const [upgradeTransactionId, setUpgradeTransactionId] = useState<string | null>(null);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<any>(null);

  const daysOfWeek = ['Die', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht'];
  const getNext14Days = () => {
    const days = [];
    const today = new Date();
    for (let i = -3; i < 11; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const isOwner = user?.role === 'owner' || user?.role === 'super_admin';
  const tabs = isOwner ? ['Pasqyra', 'Takimet', 'Stafi', 'Portfolio'] : ['Pasqyra', 'Takimet', 'Portfolio'];
  const TAB_WIDTH = (width - 48) / tabs.length;
  const tabPosition = useSharedValue(0);

  const [stats, setStats] = useState({
    todayRevenue: 0,
    activeBookings: 0,
    totalStaff: 0,
    targetRevenue: 500
  });
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [realShopId, setRealShopId] = useState<string | null>(user?.shopId || null);
  const { subscription, loading: subLoading, isActivating, setIsActivating, refresh: refreshSub } = useSubscription(realShopId, user.id);

  // Auto-start polling if user needs payment (likely just paid)
  useEffect(() => {
    if (user?.needsPayment && !subscription) {
      setIsActivating(true);
    }
  }, [user?.needsPayment, subscription, setIsActivating]);

  // Notification States & Persistence
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [notificationsFilter, setNotificationsFilter] = useState<'all' | 'booking' | 'favorite' | 'review' | 'system'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deletedNotifIds, setDeletedNotifIds] = useState<string[]>([]);
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);

  const fetchNotifications = useCallback(async (targetShopId: string | null) => {
    const sId = targetShopId || realShopId || user?.id;
    if (!sId) return;

    try {
      // Resolve barber ID for any business user to ensure they see their personal bookings
      let currentBarberId: string | null = null;
      const { data: bData } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      currentBarberId = bData?.id || null;

      const isEmployee = ['employee', 'staff', 'staf'].includes(user?.role || '');

      // If employee, query only appointments assigned to this specific barber
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('shop_id', sId);

      if (isEmployee && currentBarberId) {
        query = query.eq('barber_id', currentBarberId);
      }

      // Execute queries in parallel
      const [apptsRes, favsRes, revsRes] = await Promise.all([
        (async () => { try { return await query.order('created_at', { ascending: false }).limit(15); } catch { return { data: [] }; } })(),
        !isEmployee ? (async () => { try { return await supabase.from('favorites').select('*, users(name, email)').eq('shop_id', sId).limit(10); } catch { return { data: [] }; } })() : Promise.resolve({ data: [] }),
        !isEmployee ? (async () => { try { return await supabase.from('reviews').select('*, users(name)').eq('shop_id', sId).limit(10); } catch { return { data: [] }; } })() : Promise.resolve({ data: [] })
      ]);

      const apptsData = (apptsRes as any)?.data || [];
      const favs = (favsRes as any)?.data || [];
      const revs = (revsRes as any)?.data || [];

      const userIds = [...new Set(apptsData.map((a: any) => a.user_id).filter(Boolean))];
      let userData: any[] = [];
      if (userIds.length > 0) {
        const { data: uData } = await supabase.from('users').select('id, name, phone').in('id', userIds);
        userData = uData || [];
      }

      const list: any[] = [];
      if (apptsData) {
        apptsData.forEach((a: any) => {
          const u = userData?.find(user => user.id === a.user_id);
          const clientName = u?.name || a.customer_name || 'Klient i ri';
          list.push({
            id: `appt_${a.id}`,
            type: 'booking',
            title: isEmployee ? 'Rezervim i ri për ju! 📅' : 'Rezervim i ri takimi 📅',
            message: `${clientName} rezervoi takim për datën ${a.date || 'Sot'} në orën ${a.time || '10:00'}`,
            time: a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (a.date || 'Sot'),
            isRead: false,
            data: { ...a, users: u }
          });
        });
      }
      if (favs && favs.length > 0) {
        favs.forEach((f: any) => {
          const userName = f.users?.name || 'Një përdorues';
          list.push({
            id: `fav_${f.id || f.user_id}`,
            type: 'favorite',
            title: 'Salloni u ruajt te Favoritët ❤️',
            message: `${userName} e shtoi sallonin tuaj në sallonet e ruajtura!`,
            time: f.created_at ? new Date(f.created_at).toLocaleDateString('sq-AL') : 'Së fundmi',
            isRead: false,
            data: f
          });
        });
      }

      if (revs && Array.isArray(revs) && revs.length > 0) {
        revs.forEach((r: any) => {
          const userName = r.users?.name || 'Klient';
          list.push({
            id: `rev_${r.id}`,
            type: 'review',
            title: `Vlerësim i ri ⭐ ${r.rating || 5}.0`,
            message: `${userName} la një vlerësim: "${r.comment || 'Përvojë shumë e mirë!'}"`,
            time: r.created_at ? new Date(r.created_at).toLocaleDateString('sq-AL') : 'Së fundmi',
            isRead: false,
            data: r
          });
        });
      }

      // Apply filter and read status
      const activeList = list
        .filter(item => !deletedNotifIds.includes(item.id))
        .map(item => ({
          ...item,
          isRead: item.isRead || readNotifIds.includes(item.id)
        }));

      setNotifications(activeList);
      setUnreadCount(activeList.filter(n => !n.isRead).length);
    } catch (e) {
      console.warn("Notifications fetch error:", e);
    }
  }, [realShopId, user, deletedNotifIds, readNotifIds]);

  const handleDeleteNotification = (id: string) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
    setDeletedNotifIds(prev => [...prev, id]);
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      setUnreadCount(updated.filter(n => !n.isRead).length);
      return updated;
    });
  };

  const handleClearAllNotifications = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
    const allIds = notifications.map(n => n.id);
    setDeletedNotifIds(prev => [...new Set([...prev, ...allIds])]);
    // Immediate UI update
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleMarkAllAsRead = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
    const allIds = notifications.map(n => n.id);
    setReadNotifIds(prev => [...new Set([...prev, ...allIds])]);
    // Immediate UI update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let shopData: any = null;
      let sId: any = user?.shopId || null;
      let currentBarberId: any = null;

      // Check if the current user is registered as a barber in the system
      const { data: barberProfile } = await supabase
        .from('barbers')
        .select('id, shop_id')
        .eq('user_id', user.id)
        .maybeSingle();

      currentBarberId = barberProfile?.id;

      if (!sId && barberProfile?.shop_id) {
        sId = barberProfile.shop_id;
      }

      // Check barbershops table by owner_id
      if (!sId) {
        const { data: s } = await supabase.from('barbershops').select('*').eq('owner_id', user.id).maybeSingle();
        if (s) {
          shopData = s;
          sId = s.id;
        }
      }

      // Fallback by user email if not found
      if (!sId && user?.email) {
        const { data: s } = await supabase.from('barbershops').select('*').ilike('email', user.email.trim()).maybeSingle();
        if (s) {
          shopData = s;
          sId = s.id;
        }
      }

      // Fetch shop details if not already loaded
      if (sId && !shopData) {
        const { data: s } = await supabase.from('barbershops').select('*').eq('id', sId).maybeSingle();
        shopData = s;
      }

      if (!sId) {
        console.warn("No shop ID resolved for user:", user.id);
        setLoading(false);
        return;
      }

      if (shopData) {
        setShopStatus(shopData.status || 'active');
        setSuspensionReason(shopData.suspension_reason || null);
        setPortfolioPhotos(shopData.portfolio_urls || []);
        setShopImageUrl(getShopCardImage(shopData));
      }
      setRealShopId(sId);

      const isEmployee = ['employee', 'staff', 'staf'].includes(user?.role || '');

      // Fast parallel fetch for all dashboard components
      const [dbBarbersRes, dbSchedulesRes, apptsRes, planInfo] = await Promise.all([
        (async () => { try { return await supabase.from('barbers').select('*').eq('shop_id', sId); } catch { return { data: [] }; } })(),
        (async () => { try { return await supabase.from('barber_schedules').select('*').eq('barber_id', sId); } catch { return { data: [] }; } })(),
        (async () => {
          try {
            let query = supabase.from('appointments').select('*').eq('shop_id', sId);
            if (isEmployee && currentBarberId) {
              query = query.eq('barber_id', currentBarberId);
            }
            const { data: rawAppts, error: apptError } = await query.order('time', { ascending: true });
            if (apptError) throw apptError;

            const userIds = [...new Set((rawAppts || []).map(a => a.user_id).filter(Boolean))];
            let userData: any[] = [];
            if (userIds.length > 0) {
              const { data: uData } = await supabase.from('users').select('id, name, phone, email').in('id', userIds);
              userData = uData || [];
            }

            const enriched = (rawAppts || []).map(a => ({
              ...a,
              users: userData?.find(u => u.id === a.user_id) || (a.customer_name ? { name: a.customer_name, phone: a.customer_phone || '' } : null)
            }));

            return { data: enriched };
          } catch (e) {
            console.warn("Appointments fetch sub-error:", e);
            return { data: [] };
          }
        })(),
        sId ? getShopPlanDetails(sId).catch(() => ({
          planId: 'solo',
          planName: 'Solo',
          maxBarbers: 1,
          status: 'inactive',
          currentBarberCount: 0,
          canAddBarber: true
        })) : Promise.resolve({
          planId: 'solo',
          planName: 'Solo',
          maxBarbers: 1,
          status: 'inactive',
          currentBarberCount: 0,
          canAddBarber: true
        })
      ]);

      const dbBarbers = (dbBarbersRes as any)?.data || [];
      const dbSchedules = (dbSchedulesRes as any)?.data || [];
      const appts = (apptsRes as any)?.data || [];

      console.log(`[Dashboard] Fetched ${appts.length} appointments for shop ${sId}`);

      setEmployees(dbBarbers);
      setShopSchedule(dbSchedules);
      setAppointments(appts);
      setSubscriptionDetails(planInfo);

      setCurrentPlan(planInfo.planId);
      setEmployeeLimit(planInfo.maxBarbers);

      const today = new Date().toISOString().split('T')[0];
      const todayAppts = appts.filter((a: any) => a.date === today && a.status !== 'cancelled' && a.status !== 'refused');
      const confirmedAppts = todayAppts.filter((a: any) => a.status === 'confirmed' || a.status === 'completed');
      const revenue = confirmedAppts.reduce((sum: number, a: any) => sum + (parseFloat(a.price) || 0), 0);

      const activeBookingsCount = appts.filter((a: any) => a.status !== 'cancelled' && a.status !== 'refused').length;

      setStats({
        todayRevenue: revenue,
        activeBookings: activeBookingsCount,
        totalStaff: dbBarbers.length || 1,
        targetRevenue: 500
      });

      fetchNotifications(sId);
    } catch (e) {
      console.warn("Dashboard data error:", e);
    } finally {
      setLoading(false);
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    loadDashboardData();

    // Forced payment logic ONLY if subscription is genuinely expired or missing
    if (subscription) {
      if (subscription.is_expired) {
        setTargetUpgradePlan({ id: subscription.plan_id || 'solo', name: (subscription.plan_name || 'Solo'), price: 15 });
        setShowUpgradeModal(true);
      } else {
        setShowUpgradeModal(false);
      }
    } else if (user?.needsPayment) {
      setTargetUpgradePlan({ id: 'solo', name: 'Solo', price: 15 });
      setShowUpgradeModal(true);
    }
  }, [loadDashboardData, user?.needsPayment, subscription]);
  useEffect(() => { tabPosition.value = withSpring(activeTabIndex * TAB_WIDTH, { damping: 15, stiffness: 120 }); }, [activeTabIndex, TAB_WIDTH]);

  const handleUpdateStatus = async (apptId: string, status: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', apptId);

      if (error) throw error;
      loadDashboardData();
      Alert.alert("Sukses", `Statusi u përditësua në ${status}.`);
    } catch (e) {
      console.warn("Error updating status:", e);
      Alert.alert("Gabim", "Dështoi përditësimi i statusit.");
    }
  };

  const handleTabPress = (index: number) => { setActiveTabIndex(index); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };
  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tabPosition.value }] }));

  const handleAddPortfolioPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0].uri) {
        setSavingPortfolio(true);
        const publicUrl = await uploadFile(result.assets[0].uri);
        const newPhoto = { url: publicUrl, category: selectedPhotoCategory };
        const updated = [...portfolioPhotos, newPhoto];
        const photoUrlsArray = updated.map(p => typeof p === 'string' ? p : p.url);

        // Update 'barbershops' table in Supabase
        let { error } = await supabase
          .from('barbershops')
          .update({
            portfolio_urls: updated,
            photos: photoUrlsArray
          })
          .eq('id', realShopId);

        if (error) {
          // Fallback if one of the columns doesn't exist in Supabase schema
          const { error: err2 } = await supabase
            .from('barbershops')
            .update({ portfolio_urls: updated })
            .eq('id', realShopId);

          if (err2) {
            const { error: err3 } = await supabase
              .from('barbershops')
              .update({ photos: photoUrlsArray })
              .eq('id', realShopId);
            if (err3) throw err3;
          }
        }

        setPortfolioPhotos(updated);
        Alert.alert("Sukses", "Fotoja u shtua me sukses në tabelën e berberisë!");
      }
    } catch (e: any) {
      Alert.alert("Gabim", "Dështoi shtimi i fotos: " + e.message);
    } finally {
      setSavingPortfolio(false);
    }
  };

  const handleDeletePortfolioPhoto = async (index: number) => {
    setSavingPortfolio(true);
    const updated = portfolioPhotos.filter((_, i) => i !== index);
    const photoUrlsArray = updated.map(p => typeof p === 'string' ? p : p.url);
    try {
      let { error } = await supabase
        .from('barbershops')
        .update({
          portfolio_urls: updated,
          photos: photoUrlsArray
        })
        .eq('id', realShopId);

      if (error) {
        const { error: err2 } = await supabase
          .from('barbershops')
          .update({ portfolio_urls: updated })
          .eq('id', realShopId);
        if (err2) {
          await supabase
            .from('barbershops')
            .update({ photos: photoUrlsArray })
            .eq('id', realShopId);
        }
      }

      setPortfolioPhotos(updated);
    } catch (e: any) {
      Alert.alert("Gabim", "Dështoi fshirja e fotos.");
    } finally {
      setSavingPortfolio(false);
    }
  };

  const handleUpdateShopImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setUpdatingCardPhoto(true);
        const publicUrl = await uploadFile(result.assets[0].uri);

        let updateSuccess = false;

        const existingPortfolio = Array.isArray(portfolioPhotos) ? portfolioPhotos : [];
        const nonKartelaPortfolio = existingPortfolio.filter((p: any) =>
          typeof p === 'object' && p !== null ? p.category !== 'Kartela' : true
        );
        const updatedPortfolio = [{ url: publicUrl, category: 'Kartela' }, ...nonKartelaPortfolio];

        const fullPayload = {
          image_card: publicUrl,
          image_url: publicUrl,
          cover_image: publicUrl,
          image: publicUrl,
          avatar: publicUrl,
          card_image: publicUrl,
          portfolio_urls: updatedPortfolio,
        };

        const numericId = parseInt(String(realShopId), 10);

        const tryUpdate = async (filterCol: string, filterVal: any, payload: any) => {
          if (!filterVal) return false;
          try {
            const { error } = await supabase.from('barbershops').update(payload).eq(filterCol, filterVal);
            return !error;
          } catch (_) {
            return false;
          }
        };

        // 1. Try full payload across all shop identifiers
        if (realShopId && await tryUpdate('id', realShopId, fullPayload)) updateSuccess = true;
        if (!updateSuccess && !isNaN(numericId) && numericId > 0 && await tryUpdate('id', numericId, fullPayload)) updateSuccess = true;
        if (!updateSuccess && user?.id && await tryUpdate('owner_id', user.id, fullPayload)) updateSuccess = true;
        if (!updateSuccess && user?.email && await tryUpdate('email', user.email.toLowerCase(), fullPayload)) updateSuccess = true;

        // 2. If full payload encounters schema mismatch, try individual candidate payloads
        if (!updateSuccess) {
          const singlePayloads = [
            { image_card: publicUrl, portfolio_urls: updatedPortfolio },
            { image_url: publicUrl, portfolio_urls: updatedPortfolio },
            { cover_image: publicUrl, portfolio_urls: updatedPortfolio },
            { image: publicUrl, portfolio_urls: updatedPortfolio },
            { avatar: publicUrl, portfolio_urls: updatedPortfolio },
            { card_image: publicUrl, portfolio_urls: updatedPortfolio },
            { portfolio_urls: updatedPortfolio },
            { photos: [publicUrl] }
          ];

          for (const payload of singlePayloads) {
            if (realShopId && await tryUpdate('id', realShopId, payload)) { updateSuccess = true; break; }
            if (!isNaN(numericId) && numericId > 0 && await tryUpdate('id', numericId, payload)) { updateSuccess = true; break; }
            if (user?.id && await tryUpdate('owner_id', user.id, payload)) { updateSuccess = true; break; }
            if (user?.email && await tryUpdate('email', user.email.toLowerCase(), payload)) { updateSuccess = true; break; }
          }
        }

        // Update local state immediately so user sees the change right away
        setShopImageUrl(publicUrl);
        setPortfolioPhotos(updatedPortfolio);
        Alert.alert("Sukses", "Fotoja e kartelës u ruajt me sukses në Supabase!");
      }
    } catch (e: any) {
      Alert.alert("Gabim", "Dështoi përditësimi i fotos së kartelës: " + e.message);
    } finally {
      setUpdatingCardPhoto(false);
    }
  };

  const triggerUpgradeFlow = async () => {
    // Determine next plan
    let nextPlanId: 'duo' | 'team' = 'duo';
    if (currentPlan === 'duo') nextPlanId = 'team';

    const plan = {
      id: nextPlanId,
      name: nextPlanId.charAt(0).toUpperCase() + nextPlanId.slice(1),
      price: nextPlanId === 'duo' ? 20 : 25
    };

    setTargetUpgradePlan(plan);
    setIsPreparingUpgrade(true);

    try {
      const res = await createPaddleTransaction({
        email: user.email,
        planId: nextPlanId,
        amount: plan.price,
        userId: user.id,
        customerName: user.name,
        businessId: realShopId || undefined
      });

      if (res?.data?.id) {
        setUpgradeTransactionId(res.data.id);
        setShowUpgradeModal(true);
      }
    } catch (err: any) {
      Alert.alert("Gabim", "Dështoi krijimi i pagesës: " + err.message);
    } finally {
      setIsPreparingUpgrade(false);
    }
  };

  const handleUpgradePress = async (planId: string) => {
    const priceMap: Record<string, number> = { solo: 15, duo: 20, team: 25 };
    const price = priceMap[planId] || 20;
    const planName = planId === 'solo' ? 'Solo' : planId === 'duo' ? 'Duo' : 'Team';
    const plan = {
      id: planId,
      name: planName,
      price
    };
    setTargetUpgradePlan(plan);
    setIsPreparingUpgrade(true);

    const activateDirectlyInDB = async () => {
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const activeSubId = 'sub_active_' + Date.now();

      const subData = {
        user_id: user.id,
        business_id: realShopId || user.id,
        paddle_subscription_id: activeSubId,
        subscription_id: activeSubId,
        plan_id: planId,
        plan_name: planName,
        status: 'active',
        amount: price,
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
        await supabase.from('barbershops').update({ status: 'active' }).eq('id', realShopId);
      }

      Alert.alert("Abonimi u Aktivizua! 🚀", `Plani ${planName} është aktivizuar me sukses për 30 ditë.`);
      setIsActivating(true);
      setShowUpgradeModal(false);
      refreshSub();
    };

    try {
      const res = await createPaddleTransaction({
        email: user.email,
        planId: planId,
        amount: price,
        userId: user.id,
        customerName: user.name,
        businessId: realShopId || undefined
      });

      if (res?.data?.id) {
        setUpgradeTransactionId(res.data.id);
        setShowUpgradeModal(true);
      } else {
        await activateDirectlyInDB();
      }
    } catch (err: any) {
      console.warn("[handleUpgradePress] Paddle error, proceeding with database activation fallback:", err?.message);
      try {
        await activateDirectlyInDB();
      } catch (fallbackErr: any) {
        Alert.alert("Gabim", "Dështoi aktivizimi i abonimit: " + fallbackErr.message);
      }
    } finally {
      setIsPreparingUpgrade(false);
    }
  };

  const handleUpgradeSuccess = async () => {
    setLoading(true);
    try {
      // Update subscription in DB
      // The subscription is now handled by the Paddle Webhook authoritative flow.
      // We just trigger the "activating" state to wait for the sync.
      setIsActivating(true);
      setShowUpgradeModal(false);
      Alert.alert("Sukses", `Pagesa u krye! Abonimi juaj në ${targetUpgradePlan.name} po aktivizohet.`);
    } catch (e: any) {
      Alert.alert("Gabim", "Pagesa u krye por dështoi përditësimi i limitit: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading || subLoading) {
    return (
      <View className="flex-1 bg-[#F8FAFC] pt-16 px-6">
        <View className="flex-row justify-between items-center mb-8">
          <View className="space-y-2">
            <View className="w-24 h-3 bg-slate-200/80 rounded-full" />
            <View className="w-48 h-8 bg-slate-200/80 rounded-2xl" />
          </View>
          <View className="w-11 h-11 bg-slate-200/80 rounded-2xl" />
        </View>

        <View className="h-14 bg-slate-200/60 rounded-[24px] mb-8" />

        <View className="bg-white rounded-[32px] p-6 mb-8 border border-slate-100 shadow-sm space-y-4">
          <View className="flex-row justify-between items-center">
            <View className="w-12 h-12 bg-slate-100 rounded-2xl" />
            <View className="w-16 h-6 bg-slate-100 rounded-full" />
          </View>
          <View className="w-32 h-4 bg-slate-100 rounded-full" />
          <View className="w-40 h-10 bg-slate-100 rounded-2xl" />
          <View className="h-3 w-full bg-slate-100 rounded-full" />
        </View>

        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 h-32 bg-white rounded-[32px] p-4 border border-slate-100 shadow-sm items-center justify-center space-y-2">
            <View className="w-10 h-10 bg-slate-100 rounded-xl" />
            <View className="w-16 h-3 bg-slate-100 rounded-full" />
          </View>
          <View className="flex-1 h-32 bg-white rounded-[32px] p-4 border border-slate-100 shadow-sm items-center justify-center space-y-2">
            <View className="w-10 h-10 bg-slate-100 rounded-xl" />
            <View className="w-16 h-3 bg-slate-100 rounded-full" />
          </View>
        </View>

        <View className="items-center justify-center py-6 flex-row">
          <ActivityIndicator size="small" color="#3473ef" className="mr-2" />
          <Text className="text-slate-400 font-extrabold text-xs tracking-wider">
            {isActivating ? "Duke aktivizuar abonimin..." : "Po ngarkohet paneli i berberisë..."}
          </Text>
        </View>
      </View>
    );
  }

  const revenueProgress = Math.min((stats.todayRevenue / stats.targetRevenue) * 100, 100);

  if (subscription?.is_expired) {
    return (
      <SubscriptionExpiredScreen
        planName={subscription.plan_id || 'Solo'}
        expiryDate={subscription.end_date}
        onRenew={() => {
           setTargetUpgradePlan({ id: subscription.plan_id || 'solo', name: (subscription.plan_id || 'solo').toUpperCase(), price: 20 });
           setShowUpgradeModal(true);
        }}
        onLogout={onLogout}
      />
    );
  }

  const isDesktop = Platform.OS === 'web' && width > 768;

  return (
    <View className="flex-1 bg-[#F8FAFC] w-full max-w-full overflow-x-hidden">
      <View className={isDesktop ? "mx-auto w-full max-w-[1440px] px-6 lg:px-10 py-4" : "w-full"}>
      {/* Suspension Warning Banner */}
      {shopStatus === 'suspended' && (
        <Animated.View
          entering={FadeInDown}
          className="mx-6 mt-16 bg-rose-50 border border-rose-100 p-5 rounded-[32px] flex-row items-start gap-4 z-50"
        >
          <View className="w-10 h-10 rounded-2xl bg-rose-100 items-center justify-center">
            <XCircle size={22} color="#EF4444" />
          </View>
          <View className="flex-1">
            <Text className="text-rose-900 font-black text-base">Salloni është Pezulluar</Text>
            <Text className="text-rose-700/70 font-bold text-xs mt-1 leading-4">
              Salloni juaj nuk është i dukshëm për klientët deri në rregullimin e statusit.
              {suspensionReason ? `\n\nArsyeja: ${suspensionReason}` : ""}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* ── HEADER ───────────────────────────── */}
      <View className="pt-8 pb-6 px-6 relative overflow-hidden">
        <View className="absolute top-[-100] right-[-50] w-64 h-64 bg-[#3473ef]/10 rounded-full blur-3xl" />
        <View className="flex-row items-center justify-between z-10">
          <View>
            <Text className="text-[#8789A3] text-[11px] font-black uppercase tracking-[2px] mb-1">Admin Control</Text>
            <Text className="text-3xl font-black text-[#161719] tracking-tight">{user.name}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
              setShowNotificationsDrawer(true);
            }}
            className="w-12 h-12 bg-white rounded-2xl items-center justify-center shadow-sm border border-slate-100 active:scale-95 relative"
          >
            <Bell size={22} color="#161719" />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-rose-500 min-w-[20px] h-[20px] rounded-full items-center justify-center px-1 border-2 border-white shadow-xs">
                <Text className="text-white text-[9px] font-black">{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── TABS ───────────────────────────── */}
      <View className="px-6 mb-8">
        <View className="bg-slate-100 p-1.5 rounded-[24px] flex-row relative h-[60px]">
          <Animated.View style={[indicatorStyle, { position: 'absolute', width: TAB_WIDTH - 4, height: 48, backgroundColor: 'white', borderRadius: 18, left: 6, top: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }]} />
          {tabs.map((label, index) => (
            <TouchableOpacity key={index} onPress={() => handleTabPress(index)} className="flex-1 items-center justify-center z-10">
              <Text className={`font-black text-xs sm:text-sm tracking-wide ${activeTabIndex === index ? 'text-[#161719]' : 'text-[#8789A3]'}`}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* TAB 0: Pasqyra */}
        {activeTabIndex === 0 && (
          <View className="px-6">
            <Animated.View entering={FadeInDown.delay(100)} className="mb-8">
              <View className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200 border border-slate-50">
                <View className="flex-row justify-between items-center mb-6">
                  <View className="w-12 h-12 bg-[#3473ef]/10 rounded-2xl items-center justify-center"><DollarSign size={24} color="#3473ef" strokeWidth={2.5} /></View>
                  <View className="bg-emerald-50 px-3 py-1.5 rounded-full flex-row items-center"><ArrowUpRight size={14} color="#10b981" strokeWidth={3} /><Text className="text-[#10b981] font-black text-xs ml-1">+12.4%</Text></View>
                </View>
                <Text className="text-slate-400 font-bold text-sm mb-1 uppercase tracking-wider">Të ardhurat e sotme</Text>
                <Text className="text-4xl font-black text-[#161719] mb-6">{stats.todayRevenue}€</Text>
                <View className="mt-2">
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center"><Target size={14} color="#8789A3" /><Text className="text-slate-400 font-black text-[10px] uppercase ml-1.5 tracking-widest">Objektivi: {stats.targetRevenue}€</Text></View>
                    <Text className="text-[#3473ef] font-black text-xs">{Math.round(revenueProgress)}%</Text>
                  </View>
                  <View className="h-3 w-full bg-slate-100 rounded-full overflow-hidden"><View className="h-full bg-[#3473ef] rounded-full" style={{ width: `${revenueProgress}%` }} /></View>
                </View>
              </View>
            </Animated.View>

            {/* Subscription Info Card */}
            {subscription && subscription.status !== 'inactive' && (
              <Animated.View entering={FadeInDown.delay(150)} className="mb-8">
                <View className={`bg-white rounded-[32px] p-6 shadow-lg border flex-row items-center justify-between ${
                  subscription.days_remaining !== undefined && subscription.days_remaining < 5
                    ? 'border-rose-100 shadow-rose-50'
                    : 'border-slate-50 shadow-slate-100'
                }`}>
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <CreditCard size={16} color={subscription.days_remaining !== undefined && subscription.days_remaining < 5 ? "#f43f5e" : "#3473ef"} />
                      <Text className={`font-bold text-[10px] uppercase ml-2 tracking-widest ${
                        subscription.days_remaining !== undefined && subscription.days_remaining < 5 ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        Abonimi {subscription.plan_name}
                      </Text>
                    </View>
                    <Text className="text-lg font-black text-[#161719]">
                      {subscription.cancel_at_period_end ? 'Rinovimi i Anuluar' :
                       subscription.status === 'active' ? 'Aktiv (Rinovim Automatik)' :
                       subscription.status === 'trialing' ? 'Periudhë Provuese' :
                       subscription.status === 'past_due' ? 'Pagesa dështoi' :
                       subscription.status === 'canceled' ? 'I anuluar' :
                       subscription.status === 'expired' ? 'I Skaduar' : 'I ndalur'}
                    </Text>

                    <View className="flex-row items-center mt-1">
                      {subscription.end_date && (
                        <Text className="text-slate-400 font-bold text-xs">
                           {subscription.amount > 0 ? `${subscription.amount}€ / ${subscription.billing_cycle === 'year' ? 'vit' : 'muaj'} • ` : ''}{subscription.cancel_at_period_end ? 'Skadon më' : 'Rinovimi më'} {new Date(subscription.end_date).toLocaleDateString('sq-AL')}
                        </Text>
                      )}

                      {subscription.days_remaining !== undefined && (
                        <>
                          <View className="w-1 h-1 rounded-full bg-slate-300 mx-2" />
                          <Text className={`font-bold text-xs ${
                            subscription.days_remaining < 5 ? 'text-rose-500' : 'text-[#3473ef]'
                          }`}>
                            {subscription.days_remaining} ditë mbetur
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  <View className={`px-4 py-2 rounded-2xl ${
                    subscription.cancel_at_period_end ? 'bg-amber-50' :
                    (subscription.status === 'active' || subscription.status === 'trialing'
                      ? (subscription.days_remaining !== undefined && subscription.days_remaining < 5 ? 'bg-amber-50' : 'bg-emerald-50')
                      : 'bg-rose-50')
                  }`}>
                    <Text className={`font-black text-[10px] uppercase ${
                      subscription.cancel_at_period_end ? 'text-amber-600' :
                      (subscription.status === 'active' || subscription.status === 'trialing'
                        ? (subscription.days_remaining !== undefined && subscription.days_remaining < 5 ? 'text-amber-600' : 'text-emerald-600')
                        : 'text-rose-600')
                    }`}>
                      {subscription.cancel_at_period_end ? 'MBYLLJE...' : (subscription.status === 'active' ? 'AKTIV' : (subscription.status === 'trialing' ? 'PROVË' : 'SKADUAR'))}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {(!subscription || subscription.status === 'inactive' || subscription.status === 'pending' || isActivating) && (
              <Animated.View entering={FadeInDown.delay(150)} className="mb-8">
                <View
                  className="bg-white rounded-[32px] p-6 shadow-lg border border-slate-50 flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      {(!subscription || isActivating) ? (
                        <ActivityIndicator size="small" color="#3473ef" />
                      ) : (
                        <AlertTriangle size={14} color="#f43f5e" />
                      )}
                      <Text className="text-slate-400 font-bold text-[10px] uppercase ml-2 tracking-widest">
                        Statusi i Abonimit
                      </Text>
                    </View>
                    <Text className="text-[#161719] font-black text-sm">
                      {(!subscription || isActivating) ? "Duke verifikuar pagesën..." : "Abonimi ka skaduar"}
                    </Text>
                    <Text className="text-slate-500 font-bold text-[10px] mt-1">
                      {(!subscription || isActivating) ? "Ju lutem prisni pak sekonda deri në aktivizim." : "Salloni nuk është i dukshëm për klientët"}
                    </Text>
                  </View>

                  {subscription && !isActivating && (
                    <TouchableOpacity
                      onPress={() => {
                        setTargetUpgradePlan({ id: 'solo', name: 'Solo', price: 15 });
                        setShowUpgradeModal(true);
                      }}
                      className="bg-rose-500 px-4 py-2 rounded-xl"
                    >
                      <Text className="text-white font-black text-[10px] uppercase">Rinovoni</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            )}

            <View className="flex-row gap-4 mb-8">
              <Animated.View entering={FadeInDown.delay(200)} className="flex-1">
                <View className="bg-white rounded-[32px] p-5 shadow-lg shadow-slate-100 border border-slate-50 items-center">
                  <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mb-3">
                    <Calendar size={20} color="#6366f1" strokeWidth={2.5} />
                  </View>
                  <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">Gjithsej Takime</Text>
                  <Text className="text-2xl font-black text-[#161719]">{stats.activeBookings}</Text>
                </View>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(300)} className="flex-1">
                <View className="bg-white rounded-[32px] p-5 shadow-lg shadow-slate-100 border border-slate-50 items-center">
                  <View className="w-10 h-10 bg-purple-50 rounded-xl items-center justify-center mb-3">
                    <Users size={20} color="#a855f7" strokeWidth={2.5} />
                  </View>
                  <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">Stafi</Text>
                  <Text className="text-2xl font-black text-[#161719]">{stats.totalStaff}</Text>
                </View>
              </Animated.View>
            </View>

            {/* Today's Appointments Live List on Overview */}
            <Animated.View entering={FadeInDown.delay(350)} className="mb-8">
              <View className="flex-row justify-between items-center mb-4 px-1">
                <View>
                  <Text className="text-xl font-black text-[#161719]">Terminet e Sotme</Text>
                  <Text className="text-slate-400 font-bold text-xs">
                    {appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length} rezervime për sot
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setActiveTabIndex(1)}
                  className="flex-row items-center gap-1 bg-[#3473ef]/10 px-3 py-1.5 rounded-xl"
                >
                  <Text className="text-[#3473ef] font-black text-xs">Kalendari</Text>
                  <ChevronRight size={14} color="#3473ef" />
                </TouchableOpacity>
              </View>

              {appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length > 0 ? (
                <View className="gap-y-3">
                  {appointments
                    .filter(a => a.date === new Date().toISOString().split('T')[0])
                    .slice(0, 5)
                    .map((appt, i) => (
                      <View key={appt.id || i} className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex-row items-center justify-between">
                        <View className="flex-1 pr-3">
                          <View className="flex-row items-center gap-2 mb-1.5">
                            <View className="bg-blue-50 px-2 py-0.5 rounded-md">
                              <Text className="text-[#3473ef] font-black text-xs">
                                {appt.time ? appt.time.substring(0, 5) : '10:00'}
                              </Text>
                            </View>
                            <View className={`px-2 py-0.5 rounded-md ${
                              appt.status === 'completed' ? 'bg-emerald-50' :
                              appt.status === 'cancelled' ? 'bg-rose-50' : 'bg-indigo-50'
                            }`}>
                              <Text className={`font-black text-[9px] uppercase ${
                                appt.status === 'completed' ? 'text-emerald-600' :
                                appt.status === 'cancelled' ? 'text-rose-600' : 'text-indigo-600'
                              }`}>
                                {appt.status || 'confirmed'}
                              </Text>
                            </View>
                          </View>
                          <Text className="font-black text-[#161719] text-sm">
                            {appt.users?.name || appt.customer_name || 'Klient'}
                          </Text>
                          <Text className="text-slate-400 font-bold text-[11px]" numberOfLines={1}>
                            {appt.service || 'Shërbim'}
                          </Text>
                        </View>
                        <View className="items-end">
                          {appt.price > 0 && (
                            <Text className="font-black text-base text-[#161719] mb-1.5">
                              {appt.price}€
                            </Text>
                          )}
                          {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                            <View className="flex-row gap-1.5">
                              <TouchableOpacity
                                onPress={() => handleUpdateStatus(appt.id, 'completed')}
                                className="bg-emerald-500 px-2.5 py-1 rounded-lg active:scale-95"
                              >
                                <Text className="text-white font-black text-[9px] uppercase">Përfundo</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleUpdateStatus(appt.id, 'cancelled')}
                                className="bg-rose-500 px-2.5 py-1 rounded-lg active:scale-95"
                              >
                                <Text className="text-white font-black text-[9px] uppercase">Anulo</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                </View>
              ) : (
                <View className="items-center justify-center py-8 bg-white rounded-[24px] border border-dashed border-slate-200">
                  <Calendar size={28} color="#CBD5E1" strokeWidth={1.5} />
                  <Text className="text-slate-400 font-bold mt-2 text-xs">
                    Nuk keni rezervime për sot.
                  </Text>
                </View>
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400)}>
              <View className="bg-white rounded-[40px] p-6 shadow-xl shadow-slate-200 border border-slate-50 mb-8">
                <View className="flex-row justify-between items-center mb-8">
                  <View><Text className="text-xl font-black text-[#161719]">Statistikat javore</Text><Text className="text-slate-400 font-bold text-xs">Performanca e të ardhurave</Text></View>
                  <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center"><BarChart3 size={20} color="#3473ef" /></View>
                </View>
                <RevenueChart />
                <View className="flex-row justify-between mt-8 pt-6 border-t border-slate-50">
                  <View className="items-center"><Text className="text-[#161719] font-black text-lg">1,240€</Text><Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Këtë Javë</Text></View>
                  <View className="w-[1px] h-8 bg-slate-100 self-center" /><View className="items-center"><Text className="text-[#10b981] font-black text-lg">+18%</Text><Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Rritja</Text></View>
                </View>
              </View>
            </Animated.View>
          </View>
        )}

        {/* TAB 1: Takimet (Appointments Calendar for Owner & Staff) */}
        {activeTabIndex === 1 && (
          <View className="px-6">
            <View className="mb-4 px-1">
              <Text className="text-xl font-black text-[#161719]">Kalendari i rezervimeve</Text>
              <Text className="text-slate-400 font-bold text-xs">Terminet e caktuara sipas ditëve dhe stafit</Text>
            </View>

            {/* Horizontal Day Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 py-2">
              {getNext14Days().map((d, index) => {
                const dateStr = d.toISOString().split('T')[0];
                const isSelected = dateStr === selectedDateStr;
                const dayNum = d.getDate();
                const dayName = daysOfWeek[d.getDay()];
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
                      setSelectedDateStr(dateStr);
                    }}
                    className={`mr-3 w-16 h-20 rounded-3xl items-center justify-center border ${
                      isSelected
                        ? 'bg-[#3473ef] border-[#3473ef] shadow-lg shadow-blue-200'
                        : 'bg-white border-slate-100 shadow-sm'
                    }`}
                  >
                    <Text className={`font-black text-[9px] uppercase ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {dayName}
                    </Text>
                    <Text className={`text-xl font-black mt-1 ${isSelected ? 'text-white' : 'text-[#161719]'}`}>
                      {dayNum}
                    </Text>
                    {isToday && !isSelected && (
                      <View className="w-1.5 h-1.5 bg-[#3473ef] rounded-full mt-1" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Staff Filter Chips (for owners with staff) */}
            {isOwner && employees.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                <TouchableOpacity
                  onPress={() => setSelectedStaffFilter(null)}
                  className={`mr-2 px-4 py-2 rounded-2xl border ${
                    selectedStaffFilter === null
                      ? 'bg-[#161719] border-[#161719]'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Text className={`font-black text-xs ${selectedStaffFilter === null ? 'text-white' : 'text-slate-700'}`}>
                    Të gjithë ({appointments.filter(a => a.date === selectedDateStr).length})
                  </Text>
                </TouchableOpacity>
                {employees.map((emp) => {
                  const isSelected = selectedStaffFilter === emp.id;
                  const count = appointments.filter(a => a.date === selectedDateStr && String(a.barber_id).trim() === String(emp.id).trim()).length;
                  return (
                    <TouchableOpacity
                      key={emp.id}
                      onPress={() => setSelectedStaffFilter(emp.id)}
                      className={`mr-2 px-4 py-2 rounded-2xl border ${
                        isSelected
                          ? 'bg-[#3473ef] border-[#3473ef]'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text className={`font-black text-xs ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                        {emp.name} ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Appointments list for selected day and filter */}
            <View className="gap-y-4">
              {appointments.filter(a => {
                if (a.date !== selectedDateStr) return false;
                if (selectedStaffFilter && String(a.barber_id).trim() !== String(selectedStaffFilter).trim()) return false;
                return true;
              }).length > 0 ? (
                appointments.filter(a => {
                  if (a.date !== selectedDateStr) return false;
                  if (selectedStaffFilter && String(a.barber_id).trim() !== String(selectedStaffFilter).trim()) return false;
                  return true;
                }).map((appt, i) => {
                  const assignedBarber = employees.find(e => String(e.id).trim() === String(appt.barber_id).trim());

                  return (
                    <Animated.View key={appt.id || i} entering={FadeInDown.delay(i * 60)}>
                      <View className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex-row items-center justify-between">
                        <View className="flex-1 pr-4">
                          <View className="flex-row items-center mb-2">
                            <View className="bg-blue-50 px-2.5 py-1 rounded-lg">
                              <Text className="text-[#3473ef] font-black text-xs">
                                {appt.time ? appt.time.substring(0, 5) : '00:00'}
                              </Text>
                            </View>
                            <View className={`px-2.5 py-1 rounded-lg ml-2 ${
                              appt.status === 'completed' ? 'bg-emerald-50' :
                              appt.status === 'cancelled' ? 'bg-rose-50' : 'bg-indigo-50'
                            }`}>
                              <Text className={`font-black text-[9px] uppercase tracking-wider ${
                                appt.status === 'completed' ? 'text-emerald-600' :
                                appt.status === 'cancelled' ? 'text-rose-600' : 'text-indigo-600'
                              }`}>
                                {appt.status || 'confirmed'}
                              </Text>
                            </View>
                            {assignedBarber && !selectedStaffFilter && (
                              <View className="bg-slate-100 px-2 py-0.5 rounded-lg ml-1.5">
                                <Text className="text-slate-600 font-bold text-[9px]">
                                  {assignedBarber.name}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text className="font-black text-[#161719] text-base mb-1">
                            {appt.users?.name || appt.customer_name || 'Klient i LineUp'}
                          </Text>
                          <Text className="text-slate-400 font-bold text-xs mb-1">
                            {appt.service || 'Shërbim i përgjithshëm'}
                          </Text>
                          {(appt.users?.phone || appt.customer_phone) && (
                            <Text className="text-slate-500 font-bold text-[11px]">
                              📞 {appt.users?.phone || appt.customer_phone}
                            </Text>
                          )}
                        </View>
                        <View className="items-end">
                          {appt.price > 0 && (
                            <Text className="font-black text-lg text-[#161719] mb-3">
                              {appt.price}€
                            </Text>
                          )}
                          {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                            <View className="flex-row gap-2">
                              <TouchableOpacity
                                onPress={() => handleUpdateStatus(appt.id, 'completed')}
                                className="bg-emerald-500 px-3 py-1.5 rounded-xl shadow-sm active:scale-95"
                              >
                                <Text className="text-white font-black text-[10px] uppercase">Përfundo</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleUpdateStatus(appt.id, 'cancelled')}
                                className="bg-rose-500 px-3 py-1.5 rounded-xl shadow-sm active:scale-95"
                              >
                                <Text className="text-white font-black text-[10px] uppercase">Anulo</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    </Animated.View>
                  );
                })
              ) : (
                <View className="items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                  <Calendar size={48} color="#CBD5E1" strokeWidth={1.5} />
                  <Text className="text-slate-400 font-bold mt-4">
                    Nuk ka rezervime për këtë ditë.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* TAB 2 (Owner only): Stafi (Team Management) */}
        {isOwner && activeTabIndex === 2 && (
          <View className="px-6">
            <View className="flex-row justify-between items-center mb-6 px-1">
              <View>
                <Text className="text-xl font-black text-[#161719]">Ekipi juaj</Text>
                <Text className="text-slate-400 font-bold text-xs">
                  {subscriptionDetails?.currentBarberCount || employees.length}/{employeeLimit} berberë • Plani {(currentPlan || 'solo').toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  const sId = realShopId || user?.id;
                  if (sId) {
                    const planInfo = await getShopPlanDetails(sId);
                    setCurrentPlan(planInfo.planId);
                    setEmployeeLimit(planInfo.maxBarbers);

                    if (planInfo.currentBarberCount >= planInfo.maxBarbers) {
                      Alert.alert(
                        "Limit i Arritur",
                        `Plani juaj aktiv (${planInfo.planName}) lejon vetëm ${planInfo.maxBarbers} berber(ë) shtesë.\nAktualisht keni ${planInfo.currentBarberCount} berber(ë). A dëshironi ta përmirësoni planin (Upgrade)?`,
                        [
                          { text: "Anulo", style: "cancel" },
                          { text: "Përmirëso Planin", onPress: triggerUpgradeFlow }
                        ]
                      );
                      return;
                    }
                  }
                  setShowAddStaffModal(true);
                }}
                className="w-12 h-12 bg-[#3473ef] rounded-2xl items-center justify-center shadow-lg shadow-[#3473ef]/30"
              >
                {isPreparingUpgrade ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Plus size={24} color="white" strokeWidth={3} />
                )}
              </TouchableOpacity>
            </View>

            <View className="gap-y-4">
              {employees.map((emp, i) => {
                const empAppts = appointments.filter(a => String(a.barber_id).trim() === String(emp.id).trim() && a.status !== 'cancelled' && a.status !== 'refused').length;

                return (
                  <Animated.View key={emp.id || i} entering={FadeInDown.delay(i * 100)}>
                    <TouchableOpacity
                      onPress={() => {
                        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
                        setSelectedStaffFilter(emp.id);
                        setActiveTabIndex(1); // Switch to Takimet tab filtered by this staff
                      }}
                      className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex-row items-center active:scale-[0.98]"
                    >
                      <View className="w-16 h-16 rounded-[22px] mr-4 bg-slate-100 items-center justify-center border border-slate-200">
                        <UserIcon size={28} color="#94A3B8" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-black text-[#161719] text-base mb-0.5">{emp.name}</Text>
                        <Text className="text-slate-400 font-bold text-xs">{emp.role || 'Berber'}</Text>
                        {emp.phone && (
                          <Text className="text-slate-400 font-bold text-[10px] mt-0.5">📞 {emp.phone}</Text>
                        )}
                      </View>
                      <View className="items-end bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                        <Text className="font-black text-lg text-[#3473ef] leading-5">{empAppts}</Text>
                        <Text className="text-[#8789A3] font-bold text-[8px] uppercase tracking-tighter">Termine</Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
              {employees.length === 0 && (
                <View className="items-center justify-center py-10 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                  <Users size={32} color="#CBD5E1" />
                  <Text className="text-slate-400 font-bold mt-4 text-xs">Nuk keni shtuar ende asnjë staf.</Text>
                  <TouchableOpacity
                    onPress={() => setShowAddStaffModal(true)}
                    className="mt-4 bg-[#3473ef] px-4 py-2 rounded-xl flex-row items-center gap-1"
                  >
                    <Plus size={16} color="white" strokeWidth={3} />
                    <Text className="text-white font-black text-xs">Shto Staf Tani</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* TAB Portfolio: (Index 3 for Owner, Index 2 for Staff) */}
        {((isOwner && activeTabIndex === 3) || (!isOwner && activeTabIndex === 2)) && (
          <View className="px-6">
            <View className="mb-8 px-1">
              <Text className="text-xl font-black text-[#161719]">Portofoli i punës</Text>
              <Text className="text-slate-400 font-bold text-xs">Shfaqni fotot e fundit për klientët</Text>
            </View>

            {/* ── CARD PHOTO SECTION ────────────────── */}
            <View className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-8">
              <View className="flex-row items-center mb-6">
                <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3">
                  <Star size={20} color="#3473ef" />
                </View>
                <View>
                  <Text className="text-lg font-black text-[#161719]">Fotoja Kryesore (Kartela)</Text>
                  <Text className="text-slate-400 font-bold text-[10px]">Kjo foto shfaqet në faqen kryesore</Text>
                </View>
              </View>

              <View className="w-full h-44 rounded-2xl overflow-hidden mb-6 bg-slate-50 border border-slate-100 relative">
                <Image
                  source={{ uri: shopImageUrl || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1000&auto=format&fit=crop&q=80' }}
                  className="w-full h-full object-cover"
                />
                {updatingCardPhoto ? (
                  <View className="absolute inset-0 bg-slate-900/75 items-center justify-center p-4">
                    <ActivityIndicator size="large" color="#3473ef" />
                    <Text className="text-white font-black text-xs mt-3 text-center">Po përpunohet & po ruhet fotoja...</Text>
                    <Text className="text-slate-300 font-bold text-[10px] mt-1">Vendoset menjëherë në aplikacion & web</Text>
                  </View>
                ) : (
                  <View className="absolute top-2 left-2 bg-black/60 px-2.5 py-1 rounded-lg border border-white/20">
                    <Text className="text-white text-[8px] font-black uppercase tracking-wider">Preview Aktuale</Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center gap-x-3">
                <TouchableOpacity
                  onPress={handleUpdateShopImage}
                  disabled={updatingCardPhoto}
                  className={`flex-1 h-14 rounded-2xl flex-row items-center justify-center shadow-lg ${updatingCardPhoto ? 'bg-slate-800' : 'bg-[#161719] shadow-black/20'}`}
                >
                  {updatingCardPhoto ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color="#3473ef" className="mr-2" />
                      <Text className="text-white font-black text-xs">Po ngarkohet me sukses...</Text>
                    </View>
                  ) : (
                    <>
                      <Plus size={18} color="white" strokeWidth={3} className="mr-2" />
                      <Text className="text-white font-black text-xs">Ndrysho foton e kartelës</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-8">
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Kategoria dhe Ngarkimi i Fotos</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-4">
                {DEFAULT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedPhotoCategory(cat.name)}
                    className={`px-4 py-2 rounded-xl border ${selectedPhotoCategory === cat.name ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <Text className={`font-bold text-xs ${selectedPhotoCategory === cat.name ? 'text-white' : 'text-[#8789A3]'}`}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View className="flex-row gap-x-3">
                <TouchableOpacity
                  onPress={handleAddPortfolioPhoto}
                  disabled={savingPortfolio}
                  className={`flex-1 h-14 rounded-2xl flex-row items-center justify-center shadow-lg ${savingPortfolio ? 'bg-slate-200' : 'bg-[#3473ef] shadow-blue-200'}`}
                >
                  {savingPortfolio ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Plus size={20} color="white" strokeWidth={3} className="mr-2" />
                      <Text className="text-white font-black text-sm">Shto Foto nga Galeria</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View className="gap-y-8">
              {DEFAULT_CATEGORIES.map((cat) => {
                const catPhotos = portfolioPhotos.filter(p => (typeof p === 'string' ? false : p.category === cat.name));
                if (catPhotos.length === 0) return null;

                return (
                  <View key={cat.id}>
                    <Text className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-4 ml-1">{cat.name}</Text>
                    <View className="flex-row flex-wrap gap-4">
                      {catPhotos.map((photo, i) => (
                        <View key={i} className="w-[47%] aspect-square rounded-[28px] overflow-hidden relative border border-slate-100 shadow-sm">
                          <Image source={{ uri: photo.url }} className="w-full h-full object-cover" />
                          <TouchableOpacity
                            onPress={() => {
                              const globalIndex = portfolioPhotos.findIndex(p => p.url === photo.url && p.category === photo.category);
                              handleDeletePortfolioPhoto(globalIndex);
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-black/40 rounded-full items-center justify-center border border-white/20"
                          >
                            <XCircle size={16} color="white" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}

              {/* Handle legacy string photos if any */}
              {portfolioPhotos.some(p => typeof p === 'string') && (
                <View>
                  <Text className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-4 ml-1">Tjera (Pa kategori)</Text>
                  <View className="flex-row flex-wrap gap-4">
                    {portfolioPhotos.filter(p => typeof p === 'string').map((url, i) => (
                      <View key={i} className="w-[47%] aspect-square rounded-[28px] overflow-hidden relative border border-slate-100 shadow-sm">
                        <Image source={{ uri: url }} className="w-full h-full object-cover" />
                        <TouchableOpacity
                          onPress={() => {
                            const globalIndex = portfolioPhotos.findIndex(p => p === url);
                            handleDeletePortfolioPhoto(globalIndex);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/40 rounded-full items-center justify-center border border-white/20"
                        >
                          <XCircle size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {portfolioPhotos.length === 0 && (
                <View className="w-full py-20 items-center justify-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                  <Info size={32} color="#CBD5E1" />
                  <Text className="text-slate-400 font-bold mt-4">Nuk keni asnjë foto në portofol.</Text>
                </View>
              )}
            </View>
          </View>
        )}


      </ScrollView>

      <AddStaffModal
        visible={showAddStaffModal}
        onClose={() => setShowAddStaffModal(false)}
        shopId={realShopId || ''}
        onSuccess={loadDashboardData}
        employeeLimit={employeeLimit}
        currentStaffCount={subscriptionDetails?.currentBarberCount || 0}
      />

      {/* Direct Upgrade Modal */}
      <Modal visible={showUpgradeModal} animationType="slide" transparent={false}>
        <View className="flex-1 bg-white">
          <View className="flex-1">
            <View className="w-12 h-1.5 bg-slate-100 rounded-full self-center mt-3 mb-6" />
            <View className="px-8 pb-6 flex-row justify-between items-center">
              <View>
                <Text className="text-2xl font-black text-[#161719]">
                  {user?.needsPayment ? 'Abonimi ka Skaduar' : 'Upgrade i Shpejtë'}
                </Text>
                <Text className="text-slate-400 font-bold text-xs mt-1">
                  {user?.needsPayment
                    ? 'Ju lutem vazhdoni me pagesën për të hapur panelin.'
                    : `Kaloni në planin ${targetUpgradePlan?.name}`}
                </Text>
              </View>
              {!user?.needsPayment && (
                <TouchableOpacity onPress={() => setShowUpgradeModal(false)} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                  <XCircle size={20} color="#161719" />
                </TouchableOpacity>
              )}
            </View>

            <View className="flex-1">
              {user?.needsPayment && !upgradeTransactionId ? (
                <ScrollView className="px-8" showsVerticalScrollIndicator={false}>
                   <Text className="text-slate-500 font-bold text-sm mb-6 leading-5">Salloni juaj është aktualisht i fshehur për klientët deri në momentin e rinovimit të abonimit. Zgjidhni një plan për të vazhduar.</Text>

                   {(subscription || isActivating) && (
                     <TouchableOpacity
                       onPress={async () => {
                         Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                         setIsActivating(true);
                         await refreshSub();
                         // Also reload dashboard data which might find the shop now
                         await loadDashboardData();
                         Alert.alert("Duke verifikuar", "Sistemi po kontrollon për pagesat e reja. Ju lutem pritni pak sekonda.");
                       }}
                       className="bg-emerald-500/10 p-5 rounded-3xl mb-8 border border-emerald-500/20 flex-row items-center justify-between"
                     >
                       <View className="flex-1 pr-4">
                         <Text className="font-black text-emerald-700 text-sm">Sapo keni bërë pagesën?</Text>
                         <Text className="text-emerald-600 font-bold text-xs mt-1">Kliko këtu për të sinkronizuar statusin tuaj {subscription?.plan_name ? `(Plani ${subscription.plan_name})` : ''}.</Text>
                       </View>
                       <RefreshCw size={20} color="#10b981" />
                     </TouchableOpacity>
                   )}

                   {[
                     { id: 'solo', name: 'Solo', price: 15, desc: '1 berber, 300 rezervime' },
                     { id: 'duo', name: 'Duo', price: 20, desc: '2 berberë, Rezervime pa limit' },
                     { id: 'team', name: 'Team', price: 25, desc: 'Staf pa limit, Marketing SMS' }
                   ].map((p) => (
                     <TouchableOpacity
                       key={p.id}
                       onPress={() => handleUpgradePress(p.id)}
                       className="bg-slate-50 p-6 rounded-3xl mb-4 border border-slate-100 flex-row justify-between items-center"
                     >
                        <View>
                          <Text className="text-lg font-black text-[#161719]">{p.name}</Text>
                          <Text className="text-slate-400 font-bold text-[10px]">{p.desc}</Text>
                        </View>
                        <Text className="text-xl font-black text-[#3473ef]">{p.price}€</Text>
                     </TouchableOpacity>
                   ))}

                   <TouchableOpacity
                    onPress={onLogout}
                    className="mt-4 py-8 items-center"
                   >
                     <Text className="text-rose-500 font-black text-sm uppercase tracking-widest">Dil nga llogaria</Text>
                   </TouchableOpacity>
                </ScrollView>
              ) : (
                <PaddleCheckout
                  email={user.email}
                  transactionId={upgradeTransactionId || undefined}
                  priceId={PADDLE_CONFIG.PRICES[targetUpgradePlan?.id as keyof typeof PADDLE_CONFIG.PRICES] || 'pri_01ky8e821v11dc6f2nf9jnq5v8'}
                  onSuccess={handleUpgradeSuccess}
                  onCancel={() => {
                    if (user?.needsPayment) {
                      setUpgradeTransactionId(null); // Return to plan selection
                    } else {
                      setShowUpgradeModal(false);
                    }
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── NOTIFICATIONS FULL BOTTOM SHEET MODAL ── */}
      <Modal
        visible={showNotificationsDrawer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotificationsDrawer(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowNotificationsDrawer(false)}
            className="absolute inset-0"
          />

          <View className="bg-white rounded-t-[48px] h-[83%] max-h-[780px] overflow-hidden relative shadow-2xl">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mt-3 mb-2" />

            {/* Modal Header */}
            <View className="px-8 pb-4 pt-2 border-b border-slate-50 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-[#3473ef] items-center justify-center mr-4 shadow-sm shadow-[#3473ef]/30">
                  <Bell size={24} color="white" />
                </View>
                <View>
                  <Text className="text-2xl font-black text-[#161719]">Njoftimet</Text>
                  <Text className="text-slate-400 font-bold text-xs">Aktiviteti dhe njoftimet e sallonit tuaj</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowNotificationsDrawer(false)}
                className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center active:scale-95"
              >
                <XCircle size={20} color="#161719" />
              </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <View className="bg-slate-50 border-b border-slate-100 px-4 py-3">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                {[
                  { key: 'all', label: 'Të gjitha' },
                  { key: 'booking', label: 'Takimet 📅' },
                  { key: 'favorite', label: 'Favoritet ❤️' },
                  { key: 'review', label: 'Vlerësimet ⭐' },
                  { key: 'system', label: 'Sistemi 🚀' },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setNotificationsFilter(f.key as any)}
                    className={`px-4 py-2 rounded-full border ${notificationsFilter === f.key ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-white border-slate-200'}`}
                  >
                    <Text className={`text-xs font-black ${notificationsFilter === f.key ? 'text-white' : 'text-slate-600'}`}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Actions Bar */}
            <View className="px-6 py-3 bg-slate-50/50 flex-row items-center justify-between border-b border-slate-100">
              <Text className="text-slate-400 text-[11px] font-bold">
                {notifications.filter(n => notificationsFilter === 'all' || n.type === notificationsFilter).length} Njoftime
              </Text>
              <View className="flex-row items-center gap-3">
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={handleMarkAllAsRead}
                    className="flex-row items-center"
                  >
                    <CheckCheck size={14} color="#3473ef" className="mr-1" />
                    <Text className="text-[#3473ef] text-[11px] font-black">Marko si të lexuara</Text>
                  </TouchableOpacity>
                )}
                {notifications.length > 0 && (
                  <TouchableOpacity
                    onPress={handleClearAllNotifications}
                    className="flex-row items-center pl-2 border-l border-slate-200"
                  >
                    <Trash2 size={13} color="#ef4444" className="mr-1" />
                    <Text className="text-rose-500 text-[11px] font-black">Fshi të gjitha</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Notifications List */}
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 60 }}>
              {(() => {
                const filtered = notifications.filter(n => notificationsFilter === 'all' || n.type === notificationsFilter);
                if (filtered.length === 0) {
                  return (
                    <View className="py-20 items-center justify-center px-6">
                      <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
                        <Bell size={28} color="#94A3B8" />
                      </View>
                      <Text className="text-slate-700 font-black text-base mb-1">Nuk keni asnjë njoftim</Text>
                      <Text className="text-slate-400 font-bold text-xs text-center">Njoftimet e reja për rezervimet, favoritët dhe vlerësimet do të shfaqen këtu.</Text>
                    </View>
                  );
                }

                return filtered.map((n) => {
                  let IconComponent = Calendar;
                  let iconBg = 'bg-blue-50';
                  let iconColor = '#3473ef';

                  if (n.type === 'favorite') {
                    IconComponent = Heart;
                    iconBg = 'bg-rose-50';
                    iconColor = '#ef4444';
                  } else if (n.type === 'review') {
                    IconComponent = Star;
                    iconBg = 'bg-[#fffbeb]';
                    iconColor = '#f59e0b';
                  } else if (n.type === 'system') {
                    IconComponent = Sparkles;
                    iconBg = 'bg-indigo-50';
                    iconColor = '#6366f1';
                  }

                  return (
                    <View
                      key={n.id}
                      className={`p-4 rounded-3xl mb-3 border ${!n.isRead ? 'bg-blue-50/20 border-blue-100 shadow-sm' : 'bg-white border-slate-100'}`}
                    >
                      <View className="flex-row items-start">
                        <View className={`w-10 h-10 rounded-2xl ${iconBg} items-center justify-center mr-3 mt-0.5`}>
                          <IconComponent size={20} color={iconColor} />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="font-black text-[#161719] text-sm flex-1 mr-2" numberOfLines={1}>
                              {n.title}
                            </Text>
                            <View className="flex-row items-center gap-2">
                              {!n.isRead && (
                                <View className="w-2.5 h-2.5 rounded-full bg-[#3473ef]" />
                              )}
                              <TouchableOpacity
                                onPress={() => handleDeleteNotification(n.id)}
                                className="p-1 active:opacity-60"
                              >
                                <Trash2 size={15} color="#94A3B8" />
                              </TouchableOpacity>
                            </View>
                          </View>
                          <Text className="text-slate-600 font-bold text-xs leading-4 mb-2">
                            {n.message}
                          </Text>
                          <Text className="text-slate-400 font-bold text-[10px]">
                            ⏱️ {n.time}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                });
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
      </View>
    </View>
  );
};
