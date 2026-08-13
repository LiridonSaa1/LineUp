import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { AlertCircle, CreditCard, LogOut, RefreshCw } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface SubscriptionExpiredScreenProps {
  planName: string;
  expiryDate: string;
  onRenew: () => void;
  onLogout: () => void;
}

export const SubscriptionExpiredScreen: React.FC<SubscriptionExpiredScreenProps> = ({
  planName,
  expiryDate,
  onRenew,
  onLogout
}) => {
  const formattedDate = new Date(expiryDate).toLocaleDateString('sq-AL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <View className="flex-1 bg-[#F8FAFC] items-center justify-center px-8">
      <View className="absolute top-[-100] right-[-50] w-64 h-64 bg-rose-500/10 rounded-full blur-3xl" />
      <View className="absolute bottom-[-100] left-[-50] w-64 h-64 bg-[#3473ef]/10 rounded-full blur-3xl" />

      <Animated.View entering={FadeInUp} className="w-full">
        <View className="bg-white rounded-[48px] p-8 shadow-2xl shadow-rose-200/50 border border-rose-100 items-center">
          <View className="w-20 h-20 bg-rose-50 rounded-[28px] items-center justify-center mb-6">
            <AlertCircle size={40} color="#EF4444" strokeWidth={2.5} />
          </View>

          <Text className="text-3xl font-black text-slate-900 text-center mb-2">Abonimi ka Skaduar</Text>
          <Text className="text-slate-500 font-bold text-center mb-8 leading-5">
            Qasja në të gjitha funksionet e biznesit është kufizuar për shkak të përfundimit të planit <Text className="text-rose-500">{planName}</Text> më {formattedDate}.
          </Text>

          <View className="w-full bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100">
             <View className="flex-row justify-between items-center mb-4">
                <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Plani i Fundit</Text>
                <Text className="text-slate-900 font-black text-sm uppercase">{planName}</Text>
             </View>
             <View className="flex-row justify-between items-center">
                <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Statusi</Text>
                <View className="bg-rose-100 px-2 py-0.5 rounded-md">
                   <Text className="text-rose-600 font-black text-[10px] uppercase">I Skaduar</Text>
                </View>
             </View>
          </View>

          <TouchableOpacity
            onPress={onRenew}
            activeOpacity={0.8}
            className="w-full bg-[#161719] h-16 rounded-2xl flex-row items-center justify-center shadow-xl shadow-black/20 mb-4"
          >
            <RefreshCw size={20} color="white" className="mr-3" />
            <Text className="text-white font-black text-base">Rinovo Abonimin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onLogout}
            className="py-4 items-center"
          >
            <Text className="text-slate-400 font-black text-xs uppercase tracking-widest">Dil nga llogaria</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-8 flex-row items-center justify-center bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
           <CreditCard size={16} color="#6366f1" />
           <Text className="text-[#6366f1] font-bold text-[11px] ml-2">Pagesë e sigurt përmes Paddle</Text>
        </View>
      </Animated.View>
    </View>
  );
};
