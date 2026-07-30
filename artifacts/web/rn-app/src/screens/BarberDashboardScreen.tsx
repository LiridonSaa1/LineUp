import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, Platform, Alert, Switch, TextInput } from 'react-native';
import {
  Users,
  Calendar,
  TrendingUp,
  Plus,
  ChevronRight,
  Bell,
  Clock,
  DollarSign,
  Scissors,
  CheckCircle2,
  AlertCircle,
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
  Globe,
  Instagram,
  MapPin,
  MessageCircle,
  Phone
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
import { supabase } from '@/config/supabase';
import { AddStaffModal } from '../components/AddStaffModal';
import { DEFAULT_CATEGORIES } from '../config/defaultCategories';
import * as ImagePicker from 'expo-image-picker';
import { uploadFile } from '../utils/storage';
import { PaddleCheckout } from '../components/PaddleCheckout';
import { createPaddleTransaction } from '../config/paddle';

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
  const [currentPlan, setCurrentPlan] = useState<string | null>('solo');
  const [employeeLimit, setEmployeeLimit] = useState(1);
  const [shopSchedule, setShopSchedule] = useState<any[]>([]);
  const [portfolioPhotos, setPortfolioPhotos] = useState<any[]>([]); // Array of {url, category}
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [savingPortfolio, setSavingPortfolio] = useState(false);

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

  const isOwner = user?.role === 'owner' || user?.role === 'super_admin' || user?.role === 'barber'; // Assuming owner
  const tabs = isOwner ? ['Pasqyra', 'Stafi', 'Portfolio'] : ['Pasqyra', 'Takimet'];
  const TAB_WIDTH = (width - 48) / tabs.length;
  const tabPosition = useSharedValue(0);

  const [stats, setStats] = useState({
    todayRevenue: 0,
    activeBookings: 0,
    totalStaff: 0,
    targetRevenue: 500
  });
  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [realShopId, setRealShopId] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let sId = null;
      let employeeBarberId = null;

      if (user.role === 'employee') {
        const { data: barberData } = await supabase
          .from('barbers')
          .select('id, shop_id')
          .eq('user_id', user.id)
          .maybeSingle();
        sId = barberData?.shop_id;
        employeeBarberId = barberData?.id;
      } else {
        const { data: shopData } = await supabase.from('barbershops').select('*').eq('owner_id', user.id).maybeSingle();
        sId = shopData?.id || user.id;
        if (shopData) {
          setPortfolioPhotos(shopData.portfolio_urls || []);
          setShopImageUrl(shopData.image_url);
        }
      }
      setRealShopId(sId);

      // Fetch Plan & Limit
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('product_id, employee_limit')
        .eq('customer_id', user.id) // Or use a way to link customer to shop
        .maybeSingle();

      if (subData) {
        setCurrentPlan(subData.product_id);
        setEmployeeLimit(subData.employee_limit || (subData.product_id === 'solo' ? 1 : subData.product_id === 'duo' ? 2 : 100));
      } else {
        // Fallback for demo
        setEmployeeLimit(user.role === 'owner' ? 2 : 1);
      }

      const { data: dbBarbers } = await supabase.from('barbers').select('*').eq('shop_id', sId);
      setEmployees(dbBarbers || []);

      const { data: dbSchedules } = await supabase.from('barber_schedules').select('*').eq('barber_id', sId);
      setShopSchedule(dbSchedules || []);

      let apptsQuery = supabase.from('appointments').select('*, users(name, phone, email)').eq('shop_id', sId).neq('status', 'cancelled');
      if (user.role === 'employee' && employeeBarberId) {
        apptsQuery = apptsQuery.eq('barber_id', employeeBarberId);
      }
      const { data: appts } = await apptsQuery.order('time', { ascending: true });
      setAppointments(appts || []);

      const today = new Date().toISOString().split('T')[0];
      const todayAppts = appts?.filter((a: any) => a.date === today) || [];
      const confirmedAppts = todayAppts.filter((a: any) => a.status === 'confirmed');
      const revenue = confirmedAppts.reduce((sum: number, a: any) => sum + (parseInt(a.price) || 15), 0);

      setStats({
        todayRevenue: revenue,
        activeBookings: todayAppts.length,
        totalStaff: dbBarbers?.length || 0,
        targetRevenue: 500
      });
    } catch (e) {
      console.warn("Dashboard data error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);
  useEffect(() => { tabPosition.value = withSpring(activeTabIndex * TAB_WIDTH, { damping: 15, stiffness: 120 }); }, [activeTabIndex, TAB_WIDTH]);

  const handleTabPress = (index: number) => { setActiveTabIndex(index); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };
  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tabPosition.value }] }));

  const handleAddPortfolioPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0].uri) {
        setSavingPortfolio(true);
        const publicUrl = await uploadFile(result.assets[0].uri);
        const newPhoto = { url: publicUrl, category: selectedPhotoCategory };
        const updated = [...portfolioPhotos, newPhoto];

        const { error } = await supabase
          .from('barbershops')
          .update({ portfolio_urls: updated })
          .eq('id', realShopId);

        if (error) throw error;
        setPortfolioPhotos(updated);
        Alert.alert("Sukses", "Fotoja u shtua në portofol.");
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
    try {
      const { error } = await supabase
        .from('barbershops')
        .update({ portfolio_urls: updated })
        .eq('id', realShopId);

      if (error) throw error;
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        setUpdatingCardPhoto(true);
        const publicUrl = await uploadFile(result.assets[0].uri);

        const { error } = await supabase
          .from('barbershops')
          .update({ image_url: publicUrl })
          .eq('id', realShopId);

        if (error) throw error;
        setShopImageUrl(publicUrl);
        Alert.alert("Sukses", "Fotoja e kartelës u përditësua.");
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
      console.log(`[Dashboard] Triggering direct upgrade to ${nextPlanId}...`);
      const res = await createPaddleTransaction({
        email: user.email,
        planId: nextPlanId,
        amount: plan.price,
        customerName: user.name
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

  const handleUpgradeSuccess = async () => {
    setLoading(true);
    try {
      // Update subscription in DB
      const { error } = await supabase.from('subscriptions').upsert({
        customer_id: user.id,
        status: 'active',
        product_id: targetUpgradePlan.id,
        subscription_id: upgradeTransactionId || `txn_${Date.now()}`,
        employee_limit: targetUpgradePlan.id === 'duo' ? 2 : 100,
        updated_at: new Date().toISOString()
      }, { onConflict: 'customer_id' });

      if (error) throw error;

      setShowUpgradeModal(false);
      Alert.alert("Sukses", `Plani u përmirësua me sukses në ${targetUpgradePlan.name}!`);
      loadDashboardData();
    } catch (e: any) {
      Alert.alert("Gabim", "Pagesa u krye por dështoi përditësimi i limitit: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color="#3473ef" />
      </View>
    );
  }

  const revenueProgress = Math.min((stats.todayRevenue / stats.targetRevenue) * 100, 100);

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* ── HEADER ───────────────────────────── */}
      <View className="pt-16 pb-6 px-6 relative overflow-hidden">
        <View className="absolute top-[-100] right-[-50] w-64 h-64 bg-[#3473ef]/10 rounded-full blur-3xl" />
        <View className="flex-row items-center justify-between z-10">
          <View>
            <Text className="text-[#8789A3] text-[11px] font-black uppercase tracking-[2px] mb-1">Admin Control</Text>
            <Text className="text-3xl font-black text-[#161719] tracking-tight">{user.name}</Text>
          </View>
          <TouchableOpacity className="w-11 h-11 bg-white rounded-2xl items-center justify-center shadow-sm border border-slate-100 active:scale-95">
            <Bell size={22} color="#161719" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── TABS ───────────────────────────── */}
      <View className="px-6 mb-8">
        <View className="bg-slate-100 p-1.5 rounded-[24px] flex-row relative h-[60px]">
          <Animated.View style={[indicatorStyle, { position: 'absolute', width: TAB_WIDTH - 4, height: 48, backgroundColor: 'white', borderRadius: 18, left: 6, top: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }]} />
          {tabs.map((label, index) => (
            <TouchableOpacity key={index} onPress={() => handleTabPress(index)} className="flex-1 items-center justify-center z-10">
              <Text className={`font-black text-[10px] ${activeTabIndex === index ? 'text-[#161719]' : 'text-[#8789A3]'}`}>{label}</Text>
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

            <View className="flex-row gap-4 mb-8">
              <Animated.View entering={FadeInDown.delay(200)} className="flex-1"><View className="bg-white rounded-[32px] p-5 shadow-lg shadow-slate-100 border border-slate-50 items-center"><View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mb-3"><Calendar size={20} color="#6366f1" strokeWidth={2.5} /></View><Text className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">Takime</Text><Text className="text-2xl font-black text-[#161719]">{stats.activeBookings}</Text></View></Animated.View>
              <Animated.View entering={FadeInDown.delay(300)} className="flex-1"><View className="bg-white rounded-[32px] p-5 shadow-lg shadow-slate-100 border border-slate-50 items-center"><View className="w-10 h-10 bg-purple-50 rounded-xl items-center justify-center mb-3"><Users size={20} color="#a855f7" strokeWidth={2.5} /></View><Text className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">Stafi</Text><Text className="text-2xl font-black text-[#161719]">{stats.totalStaff}</Text></View></Animated.View>
            </View>

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

        {/* TAB 1: Stafi / Takimet */}
        {activeTabIndex === 1 && (
          <View className="px-6">
            {isOwner ? (
              <>
                <View className="flex-row justify-between items-center mb-6 px-1">
                  <View>
                    <Text className="text-xl font-black text-[#161719]">Ekipi juaj</Text>
                    <Text className="text-slate-400 font-bold text-xs">{employees.length} profesionistë aktivë</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      if (employees.length >= employeeLimit) {
                        Alert.alert(
                          "Limit i Arritur",
                          "Keni arritur limitin e berberëve. Duhet ta bësh upgrade për të vazhduar.",
                          [
                            { text: "Anulo", style: "cancel" },
                            { text: "Nrregull", onPress: triggerUpgradeFlow }
                          ]
                        );
                      } else {
                        setShowAddStaffModal(true);
                      }
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
                  {employees.map((emp, i) => (
                    <Animated.View key={emp.id} entering={FadeInDown.delay(i * 100)}>
                      <View className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex-row items-center">
                        <View className="w-16 h-16 rounded-[22px] mr-4 bg-slate-100 items-center justify-center border border-slate-200"><UserIcon size={28} color="#94A3B8" /></View>
                        <View className="flex-1"><Text className="font-black text-[#161719] text-base mb-0.5">{emp.name}</Text><Text className="text-slate-400 font-bold text-xs">{emp.role}</Text></View>
                        <View className="items-end bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100"><Text className="font-black text-lg text-[#3473ef] leading-5">0</Text><Text className="text-[#8789A3] font-bold text-[8px] uppercase tracking-tighter">Termine</Text></View>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </>
            ) : (
              <>
                <View className="mb-4 px-1">
                  <Text className="text-xl font-black text-[#161719]">Kalendari i rezervimeve</Text>
                  <Text className="text-slate-400 font-bold text-xs">Terminet tuaja të caktuara sipas ditëve</Text>
                </View>

                {/* Horizontal Day Selector */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 py-2">
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
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

                {/* Day Appointments list */}
                <View className="gap-y-4">
                  {appointments.filter(a => a.date === selectedDateStr).length > 0 ? (
                    appointments.filter(a => a.date === selectedDateStr).map((appt, i) => (
                      <Animated.View key={appt.id} entering={FadeInDown.delay(i * 100)}>
                        <View className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex-row items-center justify-between">
                          <View className="flex-1 pr-4">
                            <View className="flex-row items-center mb-2">
                              <View className="bg-blue-50 px-2.5 py-1 rounded-lg">
                                <Text className="text-[#3473ef] font-black text-xs">
                                  {appt.time ? appt.time.substring(0, 5) : '00:00'}
                                </Text>
                              </View>
                              <View className="bg-indigo-50 px-2.5 py-1 rounded-lg ml-2">
                                <Text className="text-indigo-600 font-black text-[9px] uppercase tracking-wider">
                                  {appt.status}
                                </Text>
                              </View>
                            </View>
                            <Text className="font-black text-[#161719] text-base mb-1">
                              {appt.users?.name || 'Klient i LineUp'}
                            </Text>
                            <Text className="text-slate-400 font-bold text-xs">
                              {appt.service || 'Shërbim i përgjithshëm'}
                            </Text>
                            {appt.users?.phone && (
                              <Text className="text-slate-400 font-bold text-[10px] mt-1">
                                Tel: {appt.users.phone}
                              </Text>
                            )}
                          </View>
                          <View className="items-end">
                            <Text className="font-black text-lg text-[#161719]">
                              {appt.price ? `${appt.price}€` : '15€'}
                            </Text>
                          </View>
                        </View>
                      </Animated.View>
                    ))
                  ) : (
                    <View className="items-center justify-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                      <Calendar size={48} color="#CBD5E1" strokeWidth={1.5} />
                      <Text className="text-slate-400 font-bold mt-4">
                        Nuk ka rezervime për këtë ditë.
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        )}

        {/* TAB 2: Portfolio */}
        {activeTabIndex === 2 && (
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

              <View className="w-full h-40 rounded-2xl overflow-hidden mb-6 bg-slate-50 border border-slate-100">
                <Image
                  source={{ uri: shopImageUrl || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1000&auto=format&fit=crop&q=80' }}
                  className="w-full h-full object-cover"
                />
                <View className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-lg">
                  <Text className="text-white text-[8px] font-black uppercase">Preview Aktuale</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-x-3">
                <TouchableOpacity
                  onPress={handleUpdateShopImage}
                  disabled={updatingCardPhoto}
                  className={`flex-1 h-14 rounded-2xl flex-row items-center justify-center shadow-lg ${updatingCardPhoto ? 'bg-slate-200' : 'bg-[#161719] shadow-black/20'}`}
                >
                  {updatingCardPhoto ? (
                    <ActivityIndicator size="small" color="white" />
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
        shopId={realShopId || user.id}
        onSuccess={loadDashboardData}
        employeeLimit={employeeLimit}
        currentStaffCount={employees.length}
      />

      {/* Direct Upgrade Modal */}
      <Modal visible={showUpgradeModal} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableOpacity activeOpacity={1} onPress={() => setShowUpgradeModal(false)} className="absolute inset-0" />
          <View className="bg-white rounded-t-[48px] h-[90%] overflow-hidden">
            <View className="w-12 h-1.5 bg-slate-100 rounded-full self-center mt-3 mb-6" />
            <View className="px-8 pb-6 flex-row justify-between items-center">
              <View>
                <Text className="text-2xl font-black text-[#161719]">Upgrade i Shpejtë</Text>
                <Text className="text-slate-400 font-bold text-xs mt-1">Kaloni në planin {targetUpgradePlan?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowUpgradeModal(false)} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                <XCircle size={20} color="#161719" />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <PaddleCheckout
                email={user.email}
                transactionId={upgradeTransactionId || undefined}
                onSuccess={handleUpgradeSuccess}
                onCancel={() => setShowUpgradeModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
