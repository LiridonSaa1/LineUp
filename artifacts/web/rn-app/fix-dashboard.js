const fs = require('fs');
const path = 'src/screens/BarberDashboardScreen.tsx';

const content = `import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
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
  LogOut,
  User as UserIcon,
  Star
} from 'lucide-react-native';
import { supabase } from '@/config/supabase';

const { width } = Dimensions.get('window');

interface BarberDashboardScreenProps {
  user: any;
  onLogout: () => void;
}

// MOCK DATA FOR STAFF (To be replaced with DB later)
const MOCK_STAFF = [
  { id: 1, name: "Arben B.", role: "Senior Barber", rating: "4.9", image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&auto=format&fit=crop&q=60" },
  { id: 2, name: "Luan M.", role: "Master Barber", rating: "5.0", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=60" },
  { id: 3, name: "Drilon K.", role: "Barber", rating: "4.7", image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&auto=format&fit=crop&q=60" }
];

export const BarberDashboardScreen: React.FC<BarberDashboardScreenProps> = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'appointments'>('overview');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<number | null>(null);

  const [stats, setStats] = useState({
    todayRevenue: 0,
    activeBookings: 0,
    totalStaff: MOCK_STAFF.length
  });

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // Fetch today's appointments
        const today = new Date().toISOString().split('T')[0];
        const { data: appts } = await supabase
          .from('appointments')
          .select(\`
            id,
            time,
            service,
            status,
            price,
            users (
              name
            )
          \`)
          .eq('shop_id', user.id)
          .eq('date', today)
          .order('time', { ascending: true });

        // Mock assigning staff to appointments if they don't have one
        const assignedAppts = (appts || []).map((appt: any, idx: number) => ({
          ...appt,
          staff: MOCK_STAFF[idx % MOCK_STAFF.length] // Round-robin mock assignment
        }));

        setAppointments(assignedAppts);

        // Calculate Stats
        const confirmedAppts = assignedAppts.filter((a: any) => a.status === 'confirmed') || [];
        const revenue = confirmedAppts.reduce((sum: number, a: any) => sum + (parseInt(a.price) || 15), 0);

        setStats(prev => ({
          ...prev,
          todayRevenue: revenue,
          activeBookings: assignedAppts.length
        }));
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

  const filteredAppointments = selectedStaffFilter 
    ? appointments.filter(a => a.staff?.id === selectedStaffFilter)
    : appointments;

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      {/* Background Decor */}
      <View className="absolute top-[-50] right-[-50] w-72 h-72 bg-[#3473ef]/10 rounded-full blur-3xl" />

      {/* Header */}
      <View className="px-6 pt-16 pb-6 flex-row items-center justify-between">
        <View>
          <Text className="text-[#8789A3] text-sm font-bold uppercase tracking-widest mb-1">Paneli i Menaxhimit</Text>
          <Text className="text-2xl font-black text-[#161719]">{user.name}</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
            <Bell size={20} color="#161719" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout} className="w-10 h-10 bg-rose-50 rounded-full items-center justify-center shadow-sm">
            <LogOut size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View className="px-6 mb-6 flex-row">
        {[
          { id: 'overview', label: 'Pasqyra' },
          { id: 'staff', label: 'Stafi' },
          { id: 'appointments', label: 'Takimet' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            className={\`flex-1 py-3 items-center border-b-2 \${activeTab === tab.id ? 'border-[#3473ef]' : 'border-transparent'}\`}
          >
            <Text className={\`font-black \${activeTab === tab.id ? 'text-[#3473ef]' : 'text-[#8789A3]'}\`}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* ===================== OVERVIEW TAB ===================== */}
        {activeTab === 'overview' && (
          <View className="px-6">
            {/* Stats Grid */}
            <View className="flex-row flex-wrap justify-between mb-8">
              {/* Revenue Card */}
              <View className="w-[48%] bg-white rounded-[24px] p-5 shadow-sm mb-4">
                <View className="w-10 h-10 bg-[#3473ef]/10 rounded-xl items-center justify-center mb-4">
                  <DollarSign size={20} color="#3473ef" strokeWidth={2.5} />
                </View>
                <Text className="text-[#8789A3] text-xs font-bold mb-1 uppercase">Të ardhurat</Text>
                <Text className="text-2xl font-black text-[#161719]">{stats.todayRevenue}€</Text>
              </View>

              {/* Bookings Card */}
              <View className="w-[48%] bg-white rounded-[24px] p-5 shadow-sm mb-4">
                <View className="w-10 h-10 bg-emerald-100 rounded-xl items-center justify-center mb-4">
                  <Calendar size={20} color="#10b981" strokeWidth={2.5} />
                </View>
                <Text className="text-[#8789A3] text-xs font-bold mb-1 uppercase">Takime Sot</Text>
                <Text className="text-2xl font-black text-[#161719]">{stats.activeBookings}</Text>
              </View>

              {/* Staff Card */}
              <View className="w-[48%] bg-white rounded-[24px] p-5 shadow-sm">
                <View className="w-10 h-10 bg-purple-100 rounded-xl items-center justify-center mb-4">
                  <Users size={20} color="#8b5cf6" strokeWidth={2.5} />
                </View>
                <Text className="text-[#8789A3] text-xs font-bold mb-1 uppercase">Stafi Aktiv</Text>
                <Text className="text-2xl font-black text-[#161719]">{stats.totalStaff}</Text>
              </View>
              
              <View className="w-[48%] bg-[#161719] rounded-[24px] p-5 shadow-sm items-center justify-center">
                <TrendingUp size={32} color="#3473ef" className="mb-2" />
                <Text className="text-white font-bold text-center text-xs">+12% vs Dje</Text>
              </View>
            </View>
          </View>
        )}


        {/* ===================== STAFF TAB ===================== */}
        {activeTab === 'staff' && (
          <View className="px-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-[#161719]">Punonjësit ({MOCK_STAFF.length})</Text>
              <TouchableOpacity className="flex-row items-center bg-[#3473ef]/10 px-3 py-1.5 rounded-full">
                <Plus size={16} color="#3473ef" />
                <Text className="text-[#3473ef] font-bold text-xs ml-1">Shto</Text>
              </TouchableOpacity>
            </View>

            {MOCK_STAFF.map(emp => {
              const empAppts = appointments.filter(a => a.staff?.id === emp.id).length;
              return (
                <View key={emp.id} className="bg-white p-4 rounded-2xl mb-4 border border-slate-100 shadow-sm flex-row items-center">
                  <Image source={{ uri: emp.image }} className="w-14 h-14 rounded-full mr-4 bg-slate-200" />
                  <View className="flex-1">
                    <Text className="font-black text-[#161719] text-base">{emp.name}</Text>
                    <Text className="text-[#8789A3] font-bold text-xs">{emp.role}</Text>
                    <View className="flex-row items-center mt-1">
                      <Star size={12} color="#FFC107" fill="#FFC107" />
                      <Text className="text-[#161719] font-black text-xs ml-1">{emp.rating}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="font-black text-xl text-[#3473ef]">{empAppts}</Text>
                    <Text className="text-[#8789A3] font-bold text-[10px] uppercase">Takime Sot</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}


        {/* ===================== APPOINTMENTS TAB ===================== */}
        {activeTab === 'appointments' && (
          <View className="px-6">
            {/* Staff Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 flex-row">
              <TouchableOpacity
                onPress={() => setSelectedStaffFilter(null)}
                className={\`px-5 py-2.5 rounded-full mr-3 border \${selectedStaffFilter === null ? 'bg-black border-black' : 'bg-white border-slate-200'}\`}
              >
                <Text className={\`font-bold \${selectedStaffFilter === null ? 'text-white' : 'text-[#161719]'}\`}>Të gjithë</Text>
              </TouchableOpacity>
              {MOCK_STAFF.map(emp => (
                <TouchableOpacity
                  key={emp.id}
                  onPress={() => setSelectedStaffFilter(emp.id)}
                  className={\`px-5 py-2.5 rounded-full mr-3 border \${selectedStaffFilter === emp.id ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-white border-slate-200'}\`}
                >
                  <Text className={\`font-bold \${selectedStaffFilter === emp.id ? 'text-white' : 'text-[#161719]'}\`}>{emp.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text className="text-lg font-black text-[#161719] mb-4">Takimet e Sotme</Text>
            
            {filteredAppointments.length === 0 ? (
              <View className="bg-white p-8 rounded-3xl items-center justify-center border border-slate-100 border-dashed">
                <Calendar size={48} color="#CBD5E1" strokeWidth={1} className="mb-4" />
                <Text className="text-[#161719] font-black text-lg mb-1">Nuk ka takime</Text>
                <Text className="text-[#8789A3] text-center font-bold text-sm">
                  Asnjë takim për stafin e zgjedhur deri tani.
                </Text>
              </View>
            ) : (
              filteredAppointments.map((appt: any, idx: number) => (
                <View key={appt.id || idx} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 mb-4">
                  <View className="flex-row justify-between items-start mb-4 pb-4 border-b border-slate-50">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 bg-slate-50 rounded-full items-center justify-center mr-3 border border-slate-100">
                        <Text className="font-black text-[#3473ef] text-sm">{appt.time}</Text>
                      </View>
                      <View className="flex-1 mr-2">
                        <Text className="font-black text-[#161719] text-base mb-0.5" numberOfLines={1}>
                          {appt.users?.name || 'Klient Anonim'}
                        </Text>
                        <Text className="text-[#8789A3] text-xs font-bold">{appt.service}</Text>
                      </View>
                    </View>
                    <View className={\`px-3 py-1.5 rounded-full \${appt.status === 'confirmed' ? 'bg-emerald-50' : 'bg-amber-50'}\`}>
                      <Text className={\`text-[10px] font-black uppercase tracking-wider \${appt.status === 'confirmed' ? 'text-emerald-600' : 'text-amber-600'}\`}>
                        {appt.status}
                      </Text>
                    </View>
                  </View>

                  {/* Footer of card showing which staff member */}
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Image source={{ uri: appt.staff?.image }} className="w-6 h-6 rounded-full mr-2 bg-slate-200" />
                      <Text className="text-[#64748B] text-xs font-bold">Me <Text className="text-[#161719]">{appt.staff?.name}</Text></Text>
                    </View>
                    <Text className="font-black text-[#161719]">{appt.price}€</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
};
`;

fs.writeFileSync(path, content);
console.log('BarberDashboardScreen completely updated!');
