import React from "react";
import { View, Text, TouchableOpacity, Image, Linking } from "react-native";
import { MapPin, Instagram, Facebook, Mail } from "lucide-react-native";

interface WebFooterProps {
  onNavigateTab?: (tabIndex: number) => void;
  onOpenRegisterShop?: () => void;
  onOpenLegal?: (type: 'privacy' | 'terms') => void;
}

export const WebFooter: React.FC<WebFooterProps> = ({
  onNavigateTab,
  onOpenRegisterShop,
  onOpenLegal
}) => {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <View className="mx-auto max-w-[1440px] px-6 py-12 md:px-10 flex-row flex-wrap justify-between gap-8">
        {/* Brand Info */}
        <View className="w-full md:w-1/4">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
              <Text className="text-sm font-black text-white">L</Text>
            </View>
            <Text className="text-xl font-black text-slate-900">LineUp</Text>
          </View>
          <Text className="max-w-xs text-sm text-slate-500 font-semibold leading-relaxed">
            Rezervime online për berberë dhe sallone bukurie në Kosovë.
          </Text>
        </View>

        {/* Platforma */}
        <View className="w-1/2 md:w-1/5">
          <Text className="text-sm font-black text-slate-900 mb-3">Platforma</Text>
          <View className="gap-y-2">
            <TouchableOpacity onPress={() => onNavigateTab && onNavigateTab(0)}>
              <Text className="text-sm text-slate-500 font-bold hover:text-slate-900">Ballina</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigateTab && onNavigateTab(1)}>
              <Text className="text-sm text-slate-500 font-bold hover:text-slate-900">Kërko</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigateTab && onNavigateTab(2)}>
              <Text className="text-sm text-slate-500 font-bold hover:text-slate-900">Aktiviteti</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigateTab && onNavigateTab(3)}>
              <Text className="text-sm text-slate-500 font-bold hover:text-slate-900">Profili</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Për bizneset */}
        <View className="w-1/2 md:w-1/5">
          <Text className="text-sm font-black text-slate-900 mb-3">Për bizneset</Text>
          <View className="gap-y-2">
            <TouchableOpacity onPress={() => onNavigateTab && onNavigateTab(3)}>
              <Text className="text-sm text-slate-500 font-bold hover:text-slate-900">Planet e çmimeve</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onOpenRegisterShop && onOpenRegisterShop()}>
              <Text className="text-sm text-[#3473ef] font-black hover:underline">Bëhu partner 🚀</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigateTab && onNavigateTab(3)}>
              <Text className="text-sm text-slate-500 font-bold hover:text-slate-900">Ndihmë</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Kontakt */}
        <View className="w-full md:w-1/5">
          <Text className="text-sm font-black text-slate-900 mb-3">Kontakt</Text>
          <View className="gap-y-2">
            <Text className="text-sm text-slate-500 font-bold">info@lineup.ks</Text>
            <Text className="text-sm text-slate-500 font-bold">+383 44 000 000</Text>
            <Text className="text-sm text-slate-500 font-bold">Prishtinë, Kosovë</Text>
          </View>
        </View>
      </View>

      <View className="border-t border-slate-200 py-5 text-center">
        <Text className="text-xs text-slate-400 font-bold">
          © {new Date().getFullYear()} LineUp. Të gjitha të drejtat e rezervuara.
        </Text>
      </View>
    </footer>
  );
};
