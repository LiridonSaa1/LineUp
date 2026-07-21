import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from "react-native";
import { ArrowLeft, Share2, Star, MapPin, Phone, MessageSquare, Compass, Globe, Heart, Calendar } from "lucide-react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface BarberDetailScreenProps {
  shop: any;
  onBack: () => void;
}

export const BarberDetailScreen: React.FC<BarberDetailScreenProps> = ({ shop, onBack }) => {
  const shopName = shop?.name || "Classic Cuts Barber Shop";
  const city = shop?.city || "Prishtinë";
  const address = shop?.address || "10 Oxford Street, Soho, London, UK";
  const rating = shop?.rating || "4.8";
  const imageUrl = shop?.imageUrl || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80";

  return (
    <View className="flex-1 bg-[#F8F9FE]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Full Image Banner with Floating Header Controls */}
        <View className="h-96 relative bg-slate-900">
          <Image source={{ uri: imageUrl }} className="w-full h-full object-cover" />
          
          {/* Header Action Row */}
          <View className="absolute top-14 left-6 right-6 flex-row items-center justify-between z-20">
            <TouchableOpacity 
              onPress={onBack}
              className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-lg"
            >
              <ArrowLeft size={22} color="#161719" strokeWidth={2.5} />
            </TouchableOpacity>

            <Text className="text-white text-lg font-black tracking-tight drop-shadow-md">DetailsProduct</Text>

            <TouchableOpacity className="w-12 h-12 rounded-full bg-white items-center justify-center shadow-lg">
              <Share2 size={20} color="#161719" strokeWidth={2.5} />
            </TouchableOpacity>
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
            <View className="bg-[#3473ef] px-4 py-1.5 rounded-full">
              <Text className="text-white text-xs font-black">Open</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1.5 mb-2">
            <MapPin size={16} color="#3473ef" />
            <Text className="text-[#8789A3] text-xs font-bold">{address}</Text>
          </View>

          <View className="flex-row items-center gap-1.5 mb-6">
            <Star size={16} color="#FFC107" fill="#FFC107" />
            <Text className="text-[#161719] text-sm font-black">{rating}</Text>
            <Text className="text-[#8789A3] text-xs font-medium">(292 Reviews)</Text>
          </View>

          {/* Action Row Buttons: Call, Message, Direction, Website */}
          <View className="flex-row gap-3 mb-8">
            {[
              { label: "Call", icon: Phone },
              { label: "Message", icon: MessageSquare },
              { label: "Direction", icon: Compass },
              { label: "Website", icon: Globe },
            ].map((btn, i) => {
              const Icon = btn.icon;
              return (
                <TouchableOpacity 
                  key={i} 
                  className="flex-1 bg-[#EBF2FF] py-4 rounded-2xl items-center justify-center border border-[#3473ef]/10 active:scale-95"
                >
                  <Icon size={20} color="#3473ef" strokeWidth={2.2} className="mb-1" />
                  <Text className="text-[#161719] text-[11px] font-extrabold mt-1">{btn.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Our Recent Work Section */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-black text-[#161719]">Our Recent Work</Text>
            <TouchableOpacity>
              <Text className="text-xs font-black text-[#3473ef]">See All »</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-4">
            {(shop.photos && shop.photos.length > 0 ? shop.photos : [
              "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=500&auto=format&fit=crop&q=80",
              "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?w=500&auto=format&fit=crop&q=80",
            ]).map((img: string, idx: number) => (
              <View key={idx} className="w-44 h-32 rounded-2xl overflow-hidden mr-4 relative bg-slate-200">
                <Image source={{ uri: img }} className="w-full h-full object-cover" />
                <TouchableOpacity className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 items-center justify-center">
                  <Heart size={14} color="#3473ef" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

        </View>
      </ScrollView>

      {/* Sticky Book Appointment Bottom Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-5 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.06)]">
        <TouchableOpacity className="bg-[#3473ef] py-4 rounded-full items-center justify-center shadow-lg shadow-[#3473ef]/30 active:scale-98">
          <Text className="text-white text-base font-extrabold">Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
