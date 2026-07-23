import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions } from "react-native";
import { Calendar, Clock, ChevronRight, MessageSquare, History, Lock, Search, Star } from "lucide-react-native";
import { BlurView } from 'expo-blur';
import { supabase } from "@/config/supabase";

const { width } = Dimensions.get("window");

interface ActivityScreenProps {
  user: any;
  onLogin: () => void;
  onNavigateToSearch: () => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({ user, onLogin, onNavigateToSearch }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    async function loadAppointments() {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            barbershops (
              name
            )
          `)
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) throw error;

        const now = new Date();
        const formatted = data?.map(item => {
          const apptDate = new Date(`${item.date}T${item.time}`);
          const isPast = apptDate < now || item.status === 'completed' || item.status === 'cancelled';
          return {
            ...item,
            isPast,
            shopName: item.barbershops?.name || "Barber Shop",
            imageUrl: item.imageUrl || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400"
          };
        });

        const filtered = formatted?.filter(item =>
          activeTab === 'upcoming' ? !item.isPast : item.isPast
        );

        setAppointments(filtered || []);
      } catch (e) {
        console.error("Error loading activity:", e);
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, [activeTab, user]);

  if (!user) {
    return (
      <View className="flex-1 bg-[#F5F5F5]">
        {/* Background Decorative Blobs */}
        <View className="absolute top-[-50] left-[-50] w-64 h-64 bg-[#3473ef]/15 rounded-full blur-3xl" />
        <View className="absolute top-[200] right-[-100] w-80 h-80 bg-[#f47458]/15 rounded-full blur-3xl" />

        <View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 rounded-full bg-white items-center justify-center shadow-xl mb-8">
            <Lock size={40} color="#3473ef" strokeWidth={2.5} />
          </View>

          <Text className="text-3xl font-black text-[#161719] text-center mb-4">Kyçu në Llogari</Text>
          <Text className="text-[#8789A3] font-bold text-center leading-6 mb-10">
            Për të parë terminet tuaja dhe për të rezervuar shërbime të reja, ju duhet të jeni të kyçur në llogarinë tuaj.
          </Text>

          <TouchableOpacity
            onPress={onLogin}
            activeOpacity={0.9}
            className="w-full h-16 bg-black rounded-3xl items-center justify-center shadow-xl"
          >
            <Text className="text-white text-lg font-black">Kyçu Tani</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      {/* Background Decorative Blobs */}
      <View className="absolute top-[-50] left-[-50] w-64 h-64 bg-[#3473ef]/15 rounded-full blur-3xl" />
      <View className="absolute top-[200] right-[-100] w-80 h-80 bg-[#f47458]/15 rounded-full blur-3xl" />

      {/* Header - Glassmorphism */}
      <View className="pt-14 pb-6 px-6 bg-white/70 z-10 shadow-sm border-b border-white/50 overflow-hidden">
        <BlurView intensity={80} tint="light" className="absolute inset-0" />
        <View className="relative">
          <View className="mb-6">
            <Text className="text-3xl font-black text-[#161719] tracking-tight">Aktiviteti</Text>
            <Text className="text-[#8789A3] font-bold text-sm mt-1">Menaxho rezervimet tuaja</Text>
          </View>

          {/* Tab Switcher - Pill Style */}
          <View className="flex-row bg-slate-100/50 p-1 rounded-2xl border border-slate-200 shadow-inner">
            <TouchableOpacity
              onPress={() => setActiveTab('upcoming')}
              className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'upcoming' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`font-black text-xs uppercase ${activeTab === 'upcoming' ? 'text-[#3473ef]' : 'text-[#8789A3]'}`}>Të ardhshme</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('past')}
              className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'past' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`font-black text-xs uppercase ${activeTab === 'past' ? 'text-[#3473ef]' : 'text-[#8789A3]'}`}>Historia</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#3473ef" className="mt-20" />
        ) : appointments.length > 0 ? (
          appointments.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="bg-white rounded-3xl p-4 mb-5 shadow-sm border border-slate-100"
            >
              <View className="flex-row items-center mb-4">
                <Image source={{ uri: item.imageUrl }} className="w-14 h-14 rounded-2xl mr-4" />
                <View className="flex-1">
                  <Text className="text-lg font-black text-[#161719]">{item.shopName}</Text>
                  <Text className="text-[#8789A3] font-bold text-xs">{item.service}</Text>
                </View>
                <View className={`px-3 py-1.5 rounded-full ${item.status === 'confirmed' || item.status === 'Konfirmuar' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  <Text className={`text-[10px] font-black uppercase ${item.status === 'confirmed' || item.status === 'Konfirmuar' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <View className="h-[1px] bg-slate-50 w-full mb-4" />

              <View className="flex-row justify-between items-center">
                <View>
                  <View className="flex-row items-center mb-1">
                    <Calendar size={14} color="#8789A3" />
                    <Text className="text-[#161719] font-bold text-xs ml-1.5">{item.date}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Clock size={14} color="#8789A3" />
                    <Text className="text-[#161719] font-bold text-xs ml-1.5">{item.time}</Text>
                  </View>
                </View>

                {activeTab === 'past' ? (
                   <TouchableOpacity className="bg-black px-5 py-2.5 rounded-xl flex-row items-center gap-2">
                      <Star size={14} color="#fbbf24" fill="#fbbf24" />
                      <Text className="text-white font-black text-xs">Vlerëso</Text>
                   </TouchableOpacity>
                ) : (
                   <Text className="text-[#3473ef] font-black text-lg">{item.price}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View className="items-center justify-center py-20">
            <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-6 shadow-md border border-slate-50">
              <Search size={32} color="#CBD5E1" />
            </View>
            <Text className="text-[#161719] font-black text-xl mb-2 text-center">
              {activeTab === 'upcoming' ? "Nuk ka terminet të rezervuara" : "Historia është e zbrazët"}
            </Text>
            <Text className="text-[#8789A3] font-bold text-sm text-center mb-8 px-8 leading-5">
              {activeTab === 'upcoming'
                ? "Ju ende nuk keni rezervuar asnjë shërbim. Zbuloni sallonet më të mira pranë jush."
                : "Ju ende nuk keni përfunduar asnjë termin."}
            </Text>

            {activeTab === 'upcoming' && (
              <TouchableOpacity
                onPress={onNavigateToSearch}
                className="bg-[#3473ef] px-10 py-4 rounded-2xl shadow-lg shadow-[#3473ef]/30"
              >
                <Text className="text-white font-black text-sm uppercase tracking-widest">Kërko një Sallon</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
