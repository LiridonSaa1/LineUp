import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Dimensions, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { Calendar, Clock, ChevronRight, MessageSquare, History, Lock, Search, Star, XCircle, AlertCircle, X, Check } from "lucide-react-native";
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

  // Review Modal States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const isDesktop = Platform.OS === 'web' && width > 768;

  const fetchAppointments = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
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

  const handleSubmitReview = async () => {
    if (!selectedAppt || !user?.id) return;
    setSubmittingReview(true);
    try {
      // 1. Insert review
      const { error: reviewErr } = await supabase
        .from('reviews')
        .insert({
          shop_id: selectedAppt.shop_id,
          user_id: user.id,
          appointment_id: selectedAppt.id,
          rating,
          comment: comment.trim()
        });

      if (reviewErr) throw reviewErr;

      // 2. Mark appointment as reviewed
      const { error: apptErr } = await supabase
        .from('appointments')
        .update({ is_reviewed: true })
        .eq('id', selectedAppt.id);

      if (apptErr) {
        console.warn("Could not mark as reviewed, column might be missing:", apptErr.message);
      }

      Alert.alert("Sukses! ⭐", "Vlerësimi juaj u dërgua me sukses. Ju faleminderit!");
      setShowReviewModal(false);
      setComment("");
      setRating(5);
      fetchAppointments();
    } catch (e: any) {
      console.error("Review Error:", e);
      Alert.alert("Gabim", "Dështoi dërgimi i vlerësimit: " + e.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const upcomingAppointments = allAppointments.filter(item => !item.isPast);
  const pastAppointments = allAppointments.filter(item => item.isPast);

  if (!user) {
    return (
      <View className="flex-1 bg-[#f8fafc] w-full max-w-full overflow-x-hidden">
        {/* Background Decorative Blobs */}
        <View className="absolute top-[-50] left-[-50] w-64 h-64 bg-[#3473ef]/10 rounded-full blur-3xl pointer-events-none" />
        <View className="absolute top-[200] right-[-100] w-80 h-80 bg-[#f47458]/10 rounded-full blur-3xl pointer-events-none" />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <div className={isDesktop ? "mx-auto w-full max-w-[1440px] px-6 lg:px-10 py-8" : "w-full"}>
            <View className="items-center justify-center py-20 bg-white border border-slate-200/80 rounded-[36px] shadow-xs p-8 max-w-xl mx-auto">
              <View className="w-20 h-20 rounded-2xl bg-blue-50 items-center justify-center mb-6">
                <Lock size={36} color="#3473ef" strokeWidth={2.5} />
              </View>

              <Text className="text-3xl font-black text-[#161719] text-center mb-3">Kyçu në Llogari</Text>
              <Text className="text-[#8789A3] font-bold text-center leading-6 mb-8 max-w-md">
                Për të parë terminet tuaja dhe për të rezervuar shërbime të reja, ju duhet të jeni të kyçur në llogarinë tuaj.
              </Text>

              <TouchableOpacity
                onPress={onLogin}
                activeOpacity={0.9}
                className="w-full h-14 bg-[#161719] rounded-2xl items-center justify-center shadow-lg hover:scale-[1.01] transition-transform cursor-pointer"
              >
                <Text className="text-white text-base font-black">Kyçu Tani</Text>
              </TouchableOpacity>
            </View>
          </div>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#f8fafc] w-full max-w-full overflow-x-hidden">
      {/* Background Decorative Blobs */}
      <View className="absolute top-[-50] left-[-50] w-64 h-64 bg-[#3473ef]/10 rounded-full blur-3xl pointer-events-none" />
      <View className="absolute top-[200] right-[-100] w-80 h-80 bg-[#f47458]/10 rounded-full blur-3xl pointer-events-none" />

      <ScrollView
        className="flex-1 w-full"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <div className={isDesktop ? "mx-auto w-full max-w-[1440px] px-6 lg:px-10 py-8" : "w-full px-6 pt-6"}>
          {/* Header - Glassmorphism */}
          <View className={`pt-8 pb-8 px-8 bg-white/70 backdrop-blur-md rounded-[36px] shadow-xs border border-white/80 mb-8 ${isDesktop ? 'mt-4' : 'rounded-t-none'}`}>
            <View className="relative">
              <Text className="text-3xl lg:text-4xl font-black text-[#161719] tracking-tight">Aktiviteti Im</Text>
              <Text className="text-[#8789A3] font-bold text-sm mt-1">Shikoni terminet tuaja aktive dhe historinë e takimeve</Text>
            </View>
          </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3473ef" className="mt-20 self-center" />
        ) : (
          <div className={isDesktop ? "grid lg:grid-cols-2 gap-8 items-start" : "flex flex-col"}>
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

                      {item.status !== 'cancelled' && item.status !== 'Anuluar' && !item.is_reviewed && (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedAppt(item);
                            setShowReviewModal(true);
                          }}
                          className="bg-slate-50 px-5 py-2.5 rounded-2xl flex-row items-center gap-2 border border-slate-100"
                        >
                          <Star size={14} color="#fbbf24" fill="#fbbf24" />
                          <Text className="text-[#161719] font-black text-xs">Vlerëso</Text>
                        </TouchableOpacity>
                      )}
                      {item.is_reviewed && (
                        <View className="bg-emerald-50 px-5 py-2.5 rounded-2xl flex-row items-center gap-2 border border-emerald-100">
                          <Check size={14} color="#10b981" strokeWidth={3} />
                          <Text className="text-[#10b981] font-black text-xs">Vlerësuar</Text>
                        </View>
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
          </div>
        )}
        </div>
      </ScrollView>

      {/* --- REVIEW MODAL --- */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View className={`flex-1 ${isDesktop ? 'justify-center items-center p-4 sm:p-6 bg-black/45 backdrop-blur-xs' : 'justify-end bg-black/60'}`}>
            <TouchableOpacity activeOpacity={1} onPress={() => { setShowReviewModal(false); Keyboard.dismiss(); }} className="absolute inset-0 z-0" />
            <View
              style={isDesktop ? { 
                backgroundColor: '#ffffff', 
                width: '100%', 
                maxWidth: '680px', 
                borderRadius: 36, 
                padding: 32,
                overflow: 'hidden' 
              } : { 
                backgroundColor: '#ffffff', 
                width: '100%', 
                borderTopLeftRadius: 32, 
                borderTopRightRadius: 32, 
                padding: 24,
                overflow: 'hidden' 
              }}
              className={`z-10 bg-white shadow-2xl flex-col ${
                isDesktop 
                  ? 'w-full max-w-2xl lg:max-w-3xl rounded-[36px] bg-white p-8 lg:p-10 border border-slate-200/80 max-h-[85vh]' 
                  : 'w-full bg-white rounded-t-[32px] p-6 h-[85%]'
              }`}
            >
              <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mt-1 mb-6 shrink-0" />

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}>
                <View className="flex-row justify-between items-center pb-4 mb-6 border-b border-slate-50">
                  <View>
                    <Text className="text-2xl font-black text-[#161719] tracking-tight">Vlerëso Sallonin</Text>
                    <Text className="text-slate-400 font-bold text-sm mt-1">{selectedAppt?.shopName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowReviewModal(false)} className="p-2.5 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors cursor-pointer">
                    <X size={20} color="#161719" />
                  </TouchableOpacity>
                </View>

                <View className="items-center mb-10">
                  <View className="flex-row gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setRating(star)}>
                        <Star size={40} color={star <= rating ? "#fbbf24" : "#e2e8f0"} fill={star <= rating ? "#fbbf24" : "transparent"} strokeWidth={2} />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text className="text-slate-500 font-bold">Zgjidhni numrin e yjeve</Text>
                </View>

                <View className="mb-8">
                  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Komenti juaj (opsionale)</Text>
                  <TextInput
                    multiline
                    numberOfLines={4}
                    placeholder="Shkruani mendimin tuaj për shërbimin..."
                    className="bg-slate-50 rounded-3xl p-5 font-bold text-[#161719] border border-slate-100"
                    style={{ textAlignVertical: 'top', height: 120 }}
                    value={comment}
                    onChangeText={setComment}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                  className={`h-16 rounded-[28px] items-center justify-center shadow-xl shadow-blue-200 ${submittingReview ? 'bg-slate-200' : 'bg-[#3473ef]'}`}
                >
                  {submittingReview ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View className="flex-row items-center">
                      <Text className="text-white text-lg font-black mr-2">Dërgo Vlerësimin</Text>
                      <Check size={20} color="white" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};
