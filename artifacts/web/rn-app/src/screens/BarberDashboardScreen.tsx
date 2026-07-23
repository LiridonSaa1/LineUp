import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import {
  Users,
  Calendar,
  TrendingUp,
  Settings,
  Plus,
  ChevronRight,
  Bell,
  Clock,
  DollarSign,
  Scissors,
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { supabase } from '@/config/supabase';
import { GlassCard } from '../components/GlassCard';

const { width } = Dimensions.get('window');

interface BarberDashboardScreenProps {
  user: any;
  onLogout: () => void;
}

export const BarberDashboardScreen: React.FC<BarberDashboardScreenProps> = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    activeBookings: 0,
    totalStaff: 0
  });

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // 1. Fetch Shop Details
        const { data: shop } = await supabase
          .from('barbershops')
          .select('*')
          .eq('id', user.id)
          .single();

        // 2. Fetch today's appointments
        const today = new Date().toISOString().split('T')[0];
        const { data: appts } = await supabase
          .from('appointments')
          .select(`
            id,
            time,
            service,
            status,
            price,
            users (
              name
            )
          `)
          .eq('shop_id', user.id)
          .eq('date', today)
          .order('time', { ascending: true });

        setAppointments(appts || []);

        // 3. Calculate Stats
        const confirmedAppts = appts?.filter(a => a.status === 'confirmed') || [];
        const revenue = confirmedAppts.reduce((sum, a) => sum + (parseInt(a.price) || 15), 0);

        setStats({
          todayRevenue: revenue,
          activeBookings: appts?.length || 0,
          totalStaff: 3
        });
      } catch (e) {
        console.warn("Dashboard data error:", e);
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F5F5F5]">
        <ActivityIndicator size="large" color="#3473ef" />
        <Text className="mt-4 font-bold text-slate-500">Duke ngarkuar panelin...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      {/* Background Decor */}
      <View className="absolute top-[-50] right-[-50] w-72 h-72 bg-[#3473ef]/10 rounded-full blur-3xl" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View className="pt-16 pb-8 px-6 flex-row items-center justify-between">
          <View>
            <Text className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Mirësevini përsëri</Text>
            <Text className="text-3xl font-black text-[#161719] tracking-tight">{user.name}</Text>
          </View>
          <TouchableOpacity className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-slate-200 shadow-sm">
            <Bell size={22} color="#161719" />
            <View className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View className="px-6 flex-row gap-4 mb-8">
          <View className="flex-1 bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
            <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center mb-4">
              <TrendingUp size={20} color="#10b981" />
            </View>
            <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Fitimi Sot</Text>
            <Text className="text-2xl font-black text-[#161719] mt-1">{stats.todayRevenue}€</Text>
          </View>

          <View className="flex-1 bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
            <View className="w-10 h-10 rounded-xl bg-[#3473ef]/5 items-center justify-center mb-4">
              <Calendar size={20} color="#3473ef" />
            </View>
            <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Rezervime</Text>
            <Text className="text-2xl font-black text-[#161719] mt-1">{stats.activeBookings}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-black text-[#161719]">Veprime të Shpejta</Text>
          </View>
          <View className="flex-row gap-3">
             <TouchableOpacity className="flex-1 bg-[#3473ef] h-14 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg shadow-[#3473ef]/30">
                <Plus size={20} color="white" strokeWidth={3} />
                <Text className="text-white font-black text-sm">Shto Termin</Text>
             </TouchableOpacity>
             <TouchableOpacity className="flex-1 bg-black h-14 rounded-2xl flex-row items-center justify-center gap-2">
                <Users size={20} color="white" strokeWidth={2} />
                <Text className="text-white font-black text-sm">Stafi</Text>
             </TouchableOpacity>
          </View>
        </View>

        {/* Agenda / Upcoming Appointments */}
        <View className="px-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-black text-[#161719]">Terminet e Radhës</Text>
            <TouchableOpacity>
               <Text className="text-[#3473ef] font-black text-xs">Shih të gjitha</Text>
            </TouchableOpacity>
          </View>

          {appointments.length === 0 ? (
            <View className="bg-white p-10 rounded-[32px] items-center border border-dashed border-slate-300">
               <Clock size={32} color="#CBD5E1" className="mb-4" />
               <Text className="text-slate-400 font-bold text-center text-sm">Nuk ka rezervime për sot.</Text>
            </View>
          ) : (
            <View className="gap-y-3">
              {appointments.map((item) => (
                <View key={item.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex-row items-center shadow-sm">
                   <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mr-4">
                      <Text className="font-black text-[#3473ef]">{item.time}</Text>
                   </View>
                   <View className="flex-1">
                      <Text className="text-[#161719] font-bold text-base">{item.users?.name || "Klient"}</Text>
                      <Text className="text-slate-400 text-xs font-bold">{item.service || "Qethje & Stilim"}</Text>
                   </View>
                   <View className="bg-emerald-50 px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                      <CheckCircle2 size={12} color="#10b981" />
                      <Text className="text-emerald-600 font-black text-[10px] uppercase">Aktiv</Text>
                   </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Shop Settings Section */}
        <View className="px-6 mt-10">
           <TouchableOpacity className="bg-white p-6 rounded-[32px] border border-slate-100 flex-row items-center shadow-sm">
              <View className="w-12 h-12 rounded-2xl bg-slate-900 items-center justify-center mr-4">
                 <Settings size={22} color="white" />
              </View>
              <View className="flex-1">
                 <Text className="text-[#161719] font-black text-base">Konfigurimi i Sallonit</Text>
                 <Text className="text-slate-400 text-xs font-bold">Orari, Shërbimet, Lokacioni</Text>
              </View>
              <ChevronRight size={20} color="#CBD5E1" />
           </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onLogout}
          className="mt-12 mx-12 py-4 items-center border border-slate-200 rounded-2xl"
        >
          <Text className="text-slate-400 font-black text-xs uppercase tracking-widest">Dil nga paneli</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};
