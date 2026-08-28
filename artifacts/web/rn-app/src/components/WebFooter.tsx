import React from "react";
import { View, Text, TouchableOpacity, Image, Linking } from "react-native";
import { MapPin, Instagram, Facebook, Mail } from "lucide-react-native";

const logoImg = require('../../assets/logo.png');

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
    <View className="mt-16 border-t border-slate-200 bg-white">
      <View className="mx-auto max-w-[1440px] px-6 py-12 md:px-10 flex-row flex-wrap justify-between gap-8">
        {/* Brand Info */}
        <View className="w-full md:w-1/4">
          <View className="flex-row items-center gap-3 mb-3">
            <Image source={logoImg} className="h-10 w-10 rounded-xl" resizeMode="contain" />
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
              <Text className="text-sm text-slate-500 font-bold hover:text-slate-900">Kërko Sallonet</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onNavigateTab && onNavigateTab(2)}>
              <Text className="text-sm text-slate-500 font-bold hover:text-slate-900">Aktiviteti Im</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Për Bizneset */}
        <View className="w-1/2 md:w-1/5">
          <Text className="text-sm font-black text-slate-900 mb-3">Për Bizneset</Text>
          <View className="gap-y-2">
            <TouchableOpacity onPress={() => onOpenRegisterShop && onOpenRegisterShop()}>
              <Text className="text-sm text-slate-500 font-bold hover:text-slate-900">Regjistro Sallonin</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onOpenRegisterShop && onOpenRegisterShop()}>
              <Text className="text-sm text-slate-500 font-bold hover:text-slate-900">Planet & Çmimet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mbështetja */}
        <View className="w-full md:w-1/4">
          <Text className="text-sm font-black text-slate-900 mb-3">Mbështetja & Kontakt</Text>
          <View className="gap-y-2 mb-4">
            <View className="flex-row items-center gap-2">
              <Mail size={16} color="#64748b" />
              <Text className="text-sm text-slate-500 font-semibold">suport@lineup-ks.com</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <MapPin size={16} color="#64748b" />
              <Text className="text-sm text-slate-500 font-semibold">Prishtinë, Kosovë</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Bar */}
      <View className="border-t border-slate-100 py-6 px-6 md:px-10">
        <View className="mx-auto max-w-[1440px] flex-row flex-wrap items-center justify-between gap-4">
          <Text className="text-xs font-semibold text-slate-400">
            © {new Date().getFullYear()} LineUp. Të gjitha të drejtat të rezervuara.
          </Text>
          <View className="flex-row items-center gap-6">
            <TouchableOpacity onPress={() => onOpenLegal && onOpenLegal('privacy')}>
              <Text className="text-xs font-bold text-slate-500 hover:text-slate-900">Politika e Privatësisë</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onOpenLegal && onOpenLegal('terms')}>
              <Text className="text-xs font-bold text-slate-500 hover:text-slate-900">Kushtet e Përdorimit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};
