import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, Platform, Alert, Switch } from 'react-native';
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
  Info
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
  const [shopSchedule, setShopSchedule] = useState<any[]>([]);

  const isOwner = user?.role === 'owner' || user?.role === 'super_admin' || user?.role === 'barber'; // Assuming owner
  const tabs = isOwner ? ['Pasqyra', 'Stafi', 'Orari & Festat'] : ['Pasqyra', 'Takimet', 'Orari'];
  const TAB_WIDTH = (width - 48) / tabs.length;
  const tabPosition = useSharedValue(0);

  const [stats, setStats] = useState({
    todayRevenue: 0,
    activeBookings: 0,
    totalStaff: 0,
    targetRevenue: 500
  });
  const [realShopId, setRealShopId] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: shopData } = await supabase.from('barbershops').select('id').eq('owner_id', user.id).maybeSingle();
      const sId = shopData?.id || user.id;
      setRealShopId(sId);

      const { data: dbBarbers } = await supabase.from('barbers').select('*').eq('shop_id', sId);
      setEmployees(dbBarbers || []);

      const { data: dbSchedules } = await supabase.from('barber_schedules').select('*').eq('barber_id', sId);
      setShopSchedule(dbSchedules || []);

      const today = new Date().toISOString().split('T')[0];
      const { data: appts } = await supabase.from('appointments').select('*, users(name), barbers(name)').eq('shop_id', sId).eq('date', today).order('time', { ascending: true });
      setAppointments(appts || []);

      const confirmedAppts = appts?.filter((a: any) => a.status === 'confirmed') || [];
      const revenue = confirmedAppts.reduce((sum: number, a: any) => sum + (parseInt(a.price) || 15), 0);

      setStats({
        todayRevenue: revenue,
        activeBookings: appts?.length || 0,
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

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
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

        {/* TAB 1: Stafi */}
        {activeTabIndex === 1 && (
          <View className="px-6">
            <View className="flex-row justify-between items-center mb-6 px-1">
              <View><Text className="text-xl font-black text-[#161719]">Ekipi juaj</Text><Text className="text-slate-400 font-bold text-xs">{employees.length} profesionistë aktivë</Text></View>
              <TouchableOpacity onPress={() => setShowAddStaffModal(true)} className="w-12 h-12 bg-[#3473ef] rounded-2xl items-center justify-center shadow-lg shadow-[#3473ef]/30"><Plus size={24} color="white" strokeWidth={3} /></TouchableOpacity>
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
          </View>
        )}

        {/* TAB 2: Orari & Festat */}
        {activeTabIndex === 2 && (
          <View className="px-6">
            <View className="mb-10">
              <View className="flex-row items-center mb-6 ml-1"><View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3"><Clock size={22} color="#6366f1" /></View><View><Text className="text-xl font-black text-[#161719]">Orari i Sallonit</Text><Text className="text-slate-400 font-bold text-xs">Përcakto orët e punës së biznesit</Text></View></View>
              <View className="bg-white rounded-[40px] p-6 shadow-xl shadow-slate-100 border border-slate-50">
                {['E Hënë', 'E Martë', 'E Mërkurë', 'E Enjte', 'E Premte', 'E Shtunë', 'E Diel'].map((day, idx) => {
                  const daySched = shopSchedule.find(s => s.day_of_week === idx) || { is_closed: idx === 6, start_time: '09:00', end_time: '18:00' };
                  return (
                    <View key={idx} className={`flex-row items-center py-4 ${idx < 6 ? 'border-b border-slate-50' : ''}`}>
                      <Text className="flex-1 font-black text-[#161719] text-sm">{day}</Text>
                      <View className="flex-row items-center gap-3">
                        {!daySched.is_closed ? (
                          <View className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><Text className="font-bold text-[#161719] text-[10px]">{daySched.start_time} - {daySched.end_time}</Text></View>
                        ) : (
                          <Text className="text-rose-500 font-black text-[10px] uppercase mr-2">Mbyllur</Text>
                        )}
                        <Switch value={!daySched.is_closed} trackColor={{ false: '#e2e8f0', true: '#3473ef' }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View className="mb-10">
              <View className="flex-row items-center mb-6 ml-1"><View className="w-10 h-10 bg-amber-50 rounded-xl items-center justify-center mr-3"><Flag size={22} color="#f59e0b" /></View><View><Text className="text-xl font-black text-[#161719]">Festat Zyrtare 2026</Text><Text className="text-slate-400 font-bold text-xs">Kosova</Text></View></View>
              <View className="bg-white rounded-[40px] p-2 shadow-xl shadow-slate-100 border border-slate-50">
                 {KOSOVO_HOLIDAYS_2026.map((h, i) => (
                   <View key={i} className={`flex-row items-center p-5 ${i < KOSOVO_HOLIDAYS_2026.length - 1 ? 'border-b border-slate-50' : ''}`}>
                      <View className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center mr-4"><Text className="text-2xl">{h.icon}</Text></View>
                      <View className="flex-1"><Text className="font-black text-[#161719] text-base">{h.name}</Text><Text className="text-[#3473ef] font-black text-[10px] uppercase tracking-wider mt-1">{h.date}</Text></View>
                      <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center"><CheckCircle2 size={14} color="#10b981" /></View>
                   </View>
                 ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <AddStaffModal visible={showAddStaffModal} onClose={() => setShowAddStaffModal(false)} shopId={realShopId || user.id} onSuccess={loadDashboardData} />
    </View>
  );
};
