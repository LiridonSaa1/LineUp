import React from "react";
import { View, Text, TouchableOpacity, Linking, Platform } from "react-native";
import { Smartphone, Download, CheckCircle2, ArrowRight, ShieldCheck, Star, QrCode, LogOut } from "lucide-react-native";

const logoImg = require('../../assets/logo.png');
const extractUri = (mod: any): string => {
  if (!mod) return "";
  if (typeof mod === "string") return mod;
  if (typeof mod === "object") {
    if (typeof mod.default === "string") return mod.default;
    if (mod.default && typeof mod.default === "object" && typeof mod.default.uri === "string") return mod.default.uri;
    if (typeof mod.uri === "string") return mod.uri;
    if (typeof mod.src === "string") return mod.src;
  }
  return String(mod || "");
};

interface MobileAppDownloadCardProps {
  user?: any;
  title?: string;
  subtitle?: string;
  onLogout?: () => void;
  onBackToHome?: () => void;
}

export const MobileAppDownloadCard: React.FC<MobileAppDownloadCardProps> = ({
  user,
  title = "Menaxhimi bëhet në Aplikacionin Mobile",
  subtitle = "Për të menaxhuar terminet në kohë reale, stafin, njoftimet dhe statistikat e sallonit tuaj, përdorni aplikacionin mobile LineUp.",
  onLogout,
  onBackToHome
}) => {
  const APP_STORE_URL = "https://apps.apple.com";
  const PLAY_STORE_URL = "https://play.google.com";

  return (
    <View className="flex-1 bg-[#f8fafc] justify-center items-center p-4 sm:p-6 w-full max-w-full overflow-x-hidden py-12">
      {/* Background Decorative Blobs */}
      <View className="absolute top-[-50] left-[-50] w-72 h-72 bg-[#3473ef]/10 rounded-full blur-3xl pointer-events-none" />
      <View className="absolute bottom-[-50] right-[-50] w-96 h-96 bg-[#f47458]/10 rounded-full blur-3xl pointer-events-none" />

      <View className="w-full max-w-[580px] bg-white/80 backdrop-blur-2xl rounded-[40px] p-8 sm:p-10 lg:p-12 border border-white/80 shadow-2xl shadow-slate-900/10 z-10 my-auto items-center">
        {/* Logo */}
        <View className="items-center mb-6">
          <Image
            source={require('../../assets/logo.png')}
            style={{ width: 48, height: 48 }}
            resizeMode="contain"
            className="rounded-2xl mb-4 shadow-sm"
          />
          <View className="bg-emerald-50 border border-emerald-200/60 px-4 py-1.5 rounded-full flex-row items-center gap-2 mb-3">
            <CheckCircle2 size={14} color="#10b981" strokeWidth={2.5} />
            <Text className="text-emerald-700 font-black text-xs uppercase tracking-wider">
              {user ? `Llogaria ${user.name || 'Biznes'} është Aktive` : "Regjistrimi u Krye me Sukses 🎉"}
            </Text>
          </View>
        </View>

        {/* Title & Description */}
        <Text className="text-2xl sm:text-3xl font-black text-[#161719] text-center tracking-tight leading-snug mb-3">
          {title}
        </Text>
        <Text className="text-slate-500 font-bold text-center text-sm sm:text-base leading-relaxed mb-8 max-w-md">
          {subtitle}
        </Text>

        {/* Features Checklist */}
        <View className="w-full bg-slate-50/80 rounded-3xl p-5 mb-8 border border-slate-100 gap-y-3">
          <View className="flex-row items-center gap-3">
            <View className="w-6 h-6 rounded-full bg-[#3473ef]/10 items-center justify-center">
              <CheckCircle2 size={14} color="#3473ef" strokeWidth={3} />
            </View>
            <Text className="text-xs sm:text-sm font-bold text-slate-800">Njoftime me zë & SMS për çdo termin të ri</Text>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="w-6 h-6 rounded-full bg-[#3473ef]/10 items-center justify-center">
              <CheckCircle2 size={14} color="#3473ef" strokeWidth={3} />
            </View>
            <Text className="text-xs sm:text-sm font-bold text-slate-800">Kalendari dinamik i rezervimeve për stafin</Text>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="w-6 h-6 rounded-full bg-[#3473ef]/10 items-center justify-center">
              <CheckCircle2 size={14} color="#3473ef" strokeWidth={3} />
            </View>
            <Text className="text-xs sm:text-sm font-bold text-slate-800">Shikoni fitimet dhe statistikat ditore & mujore</Text>
          </View>
        </View>

        {/* Store Download Buttons */}
        <View className="w-full flex-col sm:flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => Linking.openURL(APP_STORE_URL)}
            activeOpacity={0.85}
            className="flex-1 bg-[#161719] hover:bg-[#25282d] h-14 rounded-2xl flex-row items-center justify-center px-4 shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
          >
            <Text className="text-white font-black text-xl mr-2">🍏</Text>
            <View className="items-start">
              <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Shkarko në</Text>
              <Text className="text-white font-black text-sm">App Store</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL(PLAY_STORE_URL)}
            activeOpacity={0.85}
            className="flex-1 bg-[#161719] hover:bg-[#25282d] h-14 rounded-2xl flex-row items-center justify-center px-4 shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
          >
            <Text className="text-white font-black text-xl mr-2">🤖</Text>
            <View className="items-start">
              <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Shkarko në</Text>
              <Text className="text-white font-black text-sm">Google Play</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer Actions (Logout / Back Home) */}
        <View className="flex-row items-center gap-4 mt-2">
          {onBackToHome && (
            <TouchableOpacity onPress={onBackToHome} className="py-2 px-4">
              <Text className="text-[#3473ef] font-bold text-xs hover:underline">Kthehu te Ballina</Text>
            </TouchableOpacity>
          )}

          {onLogout && (
            <TouchableOpacity onPress={onLogout} className="flex-row items-center gap-1.5 py-2 px-4 bg-slate-100 rounded-xl hover:bg-slate-200">
              <LogOut size={14} color="#64748b" />
              <Text className="text-slate-600 font-bold text-xs">Dil nga Llogaria</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};
