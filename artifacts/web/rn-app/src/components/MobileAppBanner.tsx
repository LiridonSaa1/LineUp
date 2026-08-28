import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, Linking, Platform } from "react-native";
import { X, Sparkles } from "lucide-react-native";

export const MobileAppBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      if (isMobileDevice) {
        setVisible(true);
      }
    }
  }, []);

  if (Platform.OS !== 'web' || !visible) return null;

  const APP_URL = "https://apps.apple.com";

  return (
    <View className="z-50 bg-[#161719] px-4 py-2.5 flex-row items-center justify-between shadow-md border-b border-slate-800 w-full">
      <View className="flex-row items-center gap-3 flex-1">
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 32, height: 32 }}
          resizeMode="contain"
          className="rounded-lg bg-white/10 p-0.5"
        />
        <View className="flex-1">
          <View className="flex-row items-center gap-1">
            <Text className="text-xs font-black text-white">Përvojë më e mirë në Aplikacion!</Text>
            <Sparkles size={11} color="#fbbf24" fill="#fbbf24" />
          </View>
          <Text className="text-[10px] font-bold text-slate-400 mt-0.5">Shkarko LineUp falas te App Store / Google Play</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-2 ml-2">
        <TouchableOpacity
          onPress={() => Linking.openURL(APP_URL)}
          className="bg-[#3473ef] px-3 py-1.5 rounded-xl shadow-xs"
        >
          <Text className="text-white font-black text-xs">Hap në App</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setVisible(false)}
          className="p-1"
        >
          <X size={16} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
