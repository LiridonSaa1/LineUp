import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions, Alert } from "react-native";
import { Calendar, Clock, ChevronRight, MessageSquare, History, Lock, Search, Star, XCircle, AlertCircle } from "lucide-react-native";
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { supabase } from "@/config/supabase";

const { width } = Dimensions.get("window");

interface ActivityScreenProps {
  user: any;
  onLogin: () => void;
  onNavigateToSearch: () => void;
}

export const ActivityScreen: React.FC<ActivityScreenProps> = ({ user, onLogin, onNavigateToSearch }) => {
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
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
        let isPast = false;
        try {
          const apptDate = new Date(`${item.date}T${item.time}`);
          isPast = apptDate < now || item.status === 'completed' || item.status === 'cancelled' || item.status === 'Anuluar' || item.status === 'Përfunduar' || item.status === 'refused';
        } catch (e) {
          isPast = item.status === 'completed' || item.status === 'cancelled' || item.status === 'refused';
        }

        return {
          ...item,
          isPast,
          shopName: item.barbershops?.name || "Sallon",
          imageUrl: item.imageUrl || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400"
        };
      });

      setAllAppointments(formatted || []);
    } catch (e) {
      console.error("Error loading activity:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const handleCancelAppointment = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Anulo Termin",
      "A jeni të sigurt që dëshironi ta anuloni këtë termin?",
      [
        { text: "Jo", style: "cancel" },
        {
          text: "Po, Anulo",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', id);

              if (error) throw error;
              fetchAppointments();
            } catch (e) {
              Alert.alert("Gabim", "Dështoi anulimi i terminit.");
            }
          }
        }
      ]
    );
  };

  const upcomingAppointments = allAppointments.filter(item => !item.isPast);
  const pastAppointments = allAppointments.filter(item => item.isPast);

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
          <View>
            <Text className="text-3xl font-black text-[#161719] tracking-tight">Aktiviteti</Text>
            <Text className="text-[#8789A3] font-bold text-sm mt-1">Shikoni terminet tuaja aktive dhe historinë</Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <ActivityIndicator size="large" color="#3473ef" className="mt-20" />
        ) : (
          <View>
            {/* --- UPCOMING SECTION --- */}
            <View className="mb-8">
              <View className="flex-row items-center mb-4 ml-1">
                <Calendar size={18} color="#3473ef" strokeWidth={2.5} />
                <Text className="text-xl font-black text-[#161719] ml-2">Terminet e Ardhshme</Text>
              </View>

              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((item) => (
                  <View
                    key={item.id}
                    className="bg-white rounded-[32px] p-5 mb-4 shadow-sm border border-slate-100"
                  >
                    <View className="flex-row items-center mb-4">
                      <Image source={{ uri: item.imageUrl }} className="w-14 h-14 rounded-2xl mr-4 bg-slate-50" />
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

                      <TouchableOpacity
                        onPress={() => handleCancelAppointment(item.id)}
                        className="bg-rose-50 px-5 py-2.5 rounded-2xl flex-row items-center gap-2 border border-rose-100"
                      >
                         <XCircle size={14} color="#ef4444" />
                         <Text className="text-[#ef4444] font-black text-xs">Anulo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View className="bg-slate-50 rounded-[32px] p-8 items-center border border-dashed border-slate-200">
                  <Search size={32} color="#CBD5E1" />
                  <Text className="text-slate-400 font-bold mt-4 text-center">Nuk keni asnjë termin të ardhshëm aktiv.</Text>
                  <TouchableOpacity onPress={onNavigateToSearch} className="mt-4"><Text className="text-[#3473ef] font-black text-xs uppercase tracking-widest">Rezervo Tani</Text></TouchableOpacity>
                </View>
              )}
            </View>

            {/* --- PAST SECTION --- */}
            <View>
              <View className="flex-row items-center mb-4 ml-1">
                <History size={18} color="#8789A3" strokeWidth={2.5} />
                <Text className="text-xl font-black text-[#161719] ml-2">Historia e Termineve</Text>
              </View>

              {pastAppointments.length > 0 ? (
                pastAppointments.map((item) => (
                  <View
                    key={item.id}
                    className="bg-white rounded-[32px] p-5 mb-4 shadow-sm border border-slate-100 opacity-80"
                  >
                    <View className="flex-row items-center mb-4">
                      <Image source={{ uri: item.imageUrl }} className="w-14 h-14 rounded-2xl mr-4 bg-slate-50 grayscale" />
                      <View className="flex-1">
                        <Text className="text-lg font-black text-[#161719]">{item.shopName}</Text>
                        <Text className="text-[#8789A3] font-bold text-xs">{item.service}</Text>
                      </View>
                      <View className={`px-3 py-1.5 rounded-full ${item.status === 'cancelled' || item.status === 'Anuluar' || item.status === 'refused' ? 'bg-rose-50' : 'bg-slate-100'}`}>
                        <Text className={`text-[10px] font-black uppercase ${item.status === 'cancelled' || item.status === 'Anuluar' || item.status === 'refused' ? 'text-rose-500' : 'text-slate-500'}`}>
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    <View className="h-[1px] bg-slate-50 w-full mb-4" />

                    <View className="flex-row justify-between items-center">
                      <View>
                        <View className="flex-row items-center mb-1">
                          <Calendar size={14} color="#8789A3" />
                          <Text className="text-[#8789A3] font-bold text-xs ml-1.5">{item.date}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Clock size={14} color="#8789A3" />
                          <Text className="text-[#8789A3] font-bold text-xs ml-1.5">{item.time}</Text>
                        </View>
                      </View>

                      {item.status !== 'cancelled' && item.status !== 'Anuluar' && (
                        <TouchableOpacity className="bg-slate-50 px-5 py-2.5 rounded-2xl flex-row items-center gap-2 border border-slate-100">
                          <Star size={14} color="#fbbf24" fill="#fbbf24" />
                          <Text className="text-[#161719] font-black text-xs">Vlerëso</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View className="bg-slate-50 rounded-[32px] p-8 items-center border border-dashed border-slate-200">
                  <Text className="text-slate-400 font-bold text-center">Historia është e zbrazët.</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
