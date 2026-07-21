import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, Dimensions, Image, ActivityIndicator } from "react-native";
import { Scissors, MapPin, Search, Bell, Sparkles, Star, Heart, Flame, Clock, ShieldCheck, CheckCircle2, MessageCircle, Phone, Megaphone } from "lucide-react-native";
import Animated, { FadeInUp, FadeInRight } from "react-native-reanimated";
import { GlassCard } from "@/components/GlassCard";
import { PremiumButton } from "@/components/PremiumButton";
import { fetchFromAPI } from "@/config/api";

const { width } = Dimensions.get("window");

export const HomeScreen = () => {
  const [selectedCity, setSelectedCity] = useState("Prishtinë");
  const [topShops, setTopShops] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [shopsData, adsData, citiesData] = await Promise.all([
          fetchFromAPI("/api/barbershops/top"),
          fetchFromAPI("/api/ads"),
          fetchFromAPI("/api/barbershops/city-stats"),
        ]);

        if (Array.isArray(shopsData) && shopsData.length > 0) {
          setTopShops(shopsData);
        }
        if (Array.isArray(adsData) && adsData.length > 0) {
          setAds(adsData);
        }
        if (Array.isArray(citiesData) && citiesData.length > 0) {
          setCities(citiesData);
        }
      } catch (e) {
        console.warn("Failed to load real data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  return (
    <ScrollView className="flex-1 bg-[#050608]" showsVerticalScrollIndicator={false}>

      {/* ── PREMIUM HERO ─────────────────────────────────── */}
      <View className="pt-16 pb-12 relative">
        {/* Abstract Glows */}
        <View className="absolute top-[20%] right-[-20%] w-80 h-80 bg-[#3472ef] opacity-15 rounded-full blur-[120px]" />
        <View className="absolute bottom-[30%] left-[-20%] w-96 h-96 bg-purple-600 opacity-10 rounded-full blur-[140px]" />

        <View className="px-8">
          {/* Top Header with LINEUP Logo */}
          <View className="flex-row items-center justify-between mb-8">
            <Image 
              source={require("../../assets/logo.png")} 
              style={{ width: 140, height: 44, resizeMode: "contain", tintColor: "#ffffff" }} 
            />
          </View>

          <Animated.View entering={FadeInUp.delay(300).duration(1000).springify()}>
            <View className="flex-row items-center gap-2 border border-white/10 bg-white/5 px-5 py-2.5 rounded-full self-start mb-6">
              <Sparkles size={16} color="#fbbf24" />
              <Text className="text-white text-[10px] font-black uppercase tracking-widest">Ekskluzive në Kosovë</Text>
            </View>

            <Text className="text-5xl font-black text-white leading-tight mb-4 tracking-tight">
              Termini yt ideal{"\n"}
              <Text className="text-[#3472ef]">në sekonda.</Text>
            </Text>

            <Text className="text-base text-white/40 font-medium mb-8 max-w-[280px] leading-6">
              Gjej berberin e duhur dhe rezervo takimin tënd në çast me teknologji native.
            </Text>
          </Animated.View>

          {/* Search Glass Box — City Selector only */}
          <GlassCard intensity={30} className="p-2">
            <View className="flex-row gap-3">
              <View className="flex-1 bg-white/5 px-6 py-5 rounded-[24px] flex-row items-center gap-4">
                <MapPin size={24} color="#3472ef" />
                <Text className="text-white text-lg font-black">Prishtinë</Text>
              </View>
              <TouchableOpacity className="w-20 h-20 bg-[#3472ef] rounded-[24px] items-center justify-center shadow-[0_15px_30px_rgba(52,114,239,0.4)]">
                <Search size={32} color="white" strokeWidth={4} />
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </View>

      {/* ── ADS & PROMOTIONS SLIDER ───────────────────────────── */}
      <View className="mt-12 px-8">
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-2">
            <Megaphone size={18} color="#fbbf24" />
            <Text className="text-xl font-black text-white uppercase tracking-tighter">Oferta & Reklama</Text>
          </View>
          <View className="bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
            <Text className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Sponsorizuar</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row overflow-visible">
          {[
            {
              title: "20% Zbritje në Prishtinë",
              subtitle: "Barber Lab — Çdo mëngjes 08:00 - 11:00",
              code: "LINEUP20",
              tag: "Zbritje",
              color: "#3472ef"
            },
            {
              title: "30 Ditë Provë Falas!",
              subtitle: "Për të gjithë berberët & pronarët e rinj",
              code: "PROMO30",
              tag: "Për Pronarë",
              color: "#10b981"
            },
            {
              title: "Maskë Fytyre Falas",
              subtitle: "Gentlemen's Club Pejë — Me çdo prerje",
              code: "FREEMASK",
              tag: "Dhuratë",
              color: "#a855f7"
            },
            {
              title: "Pako Familjare 12.00€",
              subtitle: "Royal Cut Prizren — Prerje për Babë & Bir",
              code: "FAMILY",
              tag: "Special",
              color: "#f59e0b"
            }
          ].map((ad, i) => (
            <Animated.View key={i} entering={FadeInRight.delay(i * 120).duration(800)} className="mr-5">
              <TouchableOpacity className="w-[300px] p-6 rounded-[32px] border border-white/10 bg-white/5 shadow-2xl relative overflow-hidden justify-between h-48">
                <View className="flex-row justify-between items-start">
                  <View className="px-3 py-1 rounded-full bg-white/10 border border-white/15">
                    <Text className="text-white text-[10px] font-black uppercase tracking-widest">{ad.tag}</Text>
                  </View>
                  <View className="px-3 py-1 rounded-xl bg-white/10 border border-white/20">
                    <Text className="text-white text-[11px] font-black">{ad.code}</Text>
                  </View>
                </View>

                <View>
                  <Text className="text-white text-xl font-black mb-1 leading-tight">{ad.title}</Text>
                  <Text className="text-white/40 text-xs font-medium">{ad.subtitle}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* ── SERVICES & PRICES ─────────────────────────────────── */}
      <View className="mt-16 px-8">
        <View className="flex-row items-center justify-between mb-8">
          <Text className="text-2xl font-black text-white uppercase tracking-tighter">Shërbimet & Çmimet</Text>
          <TouchableOpacity>
            <Text className="text-xs font-black text-[#3472ef] uppercase tracking-widest border-b border-[#3472ef]/30 pb-1">Shih të gjitha</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row overflow-visible">
          {[
            { name: 'Prerje Flokësh', price: 'nga 5.00€', color: '#60a5fa' },
            { name: 'Rregullim Mjekre', price: 'nga 3.00€', color: '#c084fc' },
            { name: 'Paketa Combo', price: 'nga 8.00€', color: '#fbbf24' },
            { name: 'Ngjyrosje & Stilim', price: 'nga 10.00€', color: '#34d399' }
          ].map((service, i) => (
            <Animated.View key={i} entering={FadeInRight.delay(i * 100).duration(800)} className="mr-6">
              <TouchableOpacity
                style={{ backgroundColor: `${service.color}08`, borderColor: `${service.color}25` }}
                className="w-40 p-5 rounded-[28px] border shadow-2xl items-start justify-between h-40"
              >
                <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: `${service.color}20` }}>
                  <Scissors size={24} color={service.color} strokeWidth={2.5} />
                </View>
                <View>
                  <Text className="text-white text-base font-black mb-1">{service.name}</Text>
                  <Text className="text-[#3472ef] text-xs font-bold">{service.price}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* ── HOW IT WORKS (SI FUNKSIONON) ───────────────────── */}
      <View className="mt-20 px-8">
        <View className="mb-10">
          <Text className="text-[#3472ef] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Përdorimi i thjeshtë</Text>
          <Text className="text-3xl font-black text-white uppercase tracking-tighter">Si funksionon LineUP?</Text>
        </View>

        <View className="gap-5">
          {[
            { step: '01', title: 'Zgjidh Qytetin & Berberin', desc: 'Gjej berberët më të vlerësuar afër teje me çmime transparente.', icon: MapPin },
            { step: '02', title: 'Zgjidh Orarin e Lirë', desc: 'Disponueshmëri në kohë reale. Zgjidh datën dhe orën sipas dëshirës.', icon: Clock },
            { step: '03', title: 'Konfirmo me Kod OTP', desc: 'Merr një kod sigurie me SMS. Rezervim i kryer pa asnjë telefonatë!', icon: ShieldCheck }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <GlassCard key={i} intensity={20} className="p-6 rounded-[28px]">
                <View className="flex-row items-center gap-5">
                  <View className="w-14 h-14 rounded-2xl bg-[#3472ef]/15 border border-[#3472ef]/30 items-center justify-center">
                    <Icon size={26} color="#3472ef" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-white text-lg font-black">{item.title}</Text>
                      <Text className="text-[#3472ef]/40 font-black text-xs">{item.step}</Text>
                    </View>
                    <Text className="text-white/40 text-xs leading-5 font-medium">{item.desc}</Text>
                  </View>
                </View>
              </GlassCard>
            );
          })}
        </View>
      </View>

      {/* ── PRICING & PLANS ───────────────────────────────── */}
      <View className="mt-20 px-8">
        <View className="mb-10">
          <Text className="text-[#3472ef] text-[10px] font-black uppercase tracking-[0.3em] mb-2">Transparencë e plotë</Text>
          <Text className="text-3xl font-black text-white uppercase tracking-tighter">Çmimet & Paketat</Text>
        </View>

        <View className="gap-6">
          {/* Client Plan */}
          <GlassCard intensity={25} className="p-8 rounded-[36px] border border-emerald-500/30 bg-emerald-500/5">
            <View className="flex-row justify-between items-center mb-4">
              <View className="bg-emerald-500/20 px-4 py-1.5 rounded-full">
                <Text className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Për Klientët</Text>
              </View>
              <Text className="text-white text-3xl font-black">0€</Text>
            </View>
            <Text className="text-white text-xl font-black mb-2">100% Falas Përgjithmonë</Text>
            <Text className="text-white/40 text-xs leading-5 mb-6">Rezervo sa herë të duash në çdo berber të Kosovës pa asnjë tarifë shtesë.</Text>
            <View className="flex-row items-center gap-2">
              <CheckCircle2 size={16} color="#10b981" />
              <Text className="text-white/70 text-xs font-bold">Rezervime të pakufizuara & OTP Falas</Text>
            </View>
          </GlassCard>

          {/* Owner Plan */}
          <GlassCard intensity={30} className="p-8 rounded-[36px] border border-[#3472ef]/40 bg-[#3472ef]/10">
            <View className="flex-row justify-between items-center mb-4">
              <View className="bg-[#3472ef]/20 px-4 py-1.5 rounded-full">
                <Text className="text-[#3472ef] text-[10px] font-black uppercase tracking-widest">Për Berberët & Pronarët</Text>
              </View>
              <Text className="text-white text-3xl font-black">10€<Text className="text-sm font-medium text-white/50">/muaj</Text></Text>
            </View>
            <Text className="text-white text-xl font-black mb-2">Pako Start (30 ditë Falas)</Text>
            <Text className="text-white/40 text-xs leading-5 mb-6">Panel i plotë menaxhimi, kalendar automatik, analitikë financiare dhe njoftime me SMS.</Text>
            <TouchableOpacity className="bg-[#3472ef] py-4 rounded-2xl items-center shadow-lg shadow-[#3472ef]/40">
              <Text className="text-white text-xs font-black uppercase tracking-widest">Fillo Prova Falas 30 Ditë</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </View>

      {/* ── TOP SALONS ────────────────────────────────────── */}
      <View className="mt-20 px-8">
        <Text className="text-2xl font-black text-white uppercase tracking-tighter mb-10">Më të vlerësuarit te linjës</Text>

        {loading && topShops.length === 0 ? (
          <ActivityIndicator size="large" color="#3472ef" className="my-10" />
        ) : (
          topShops.map((shop, i) => (
            <TouchableOpacity key={shop.id || i} className="bg-white/[0.02] border border-white/5 rounded-[48px] overflow-hidden mb-10 shadow-2xl">
              <View className="h-72 bg-zinc-900 relative">
                {shop.imageUrl ? (
                  <Image source={{ uri: shop.imageUrl }} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <View className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-900 items-center justify-center">
                    <Scissors size={48} color="#3472ef" />
                  </View>
                )}

                <View className="absolute top-8 left-8 z-10 bg-[#3472ef] px-5 py-2.5 rounded-[20px] border border-white/20 shadow-2xl">
                  <Text className="text-white text-[10px] font-black uppercase tracking-[0.2em]">👑 #{i + 1} TOP</Text>
                </View>
                <TouchableOpacity className="absolute top-8 right-8 z-10 w-14 h-14 rounded-[22px] bg-black/40 items-center justify-center border border-white/10 backdrop-blur-md">
                  <Heart size={28} color="white" />
                </TouchableOpacity>
                <View className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-transparent opacity-90" />

                {/* Popular Badge */}
                <View className="absolute bottom-8 right-8 flex-row items-center gap-2 bg-amber-400/20 px-4 py-2 rounded-full border border-amber-400/30">
                  <Flame size={14} color="#fbbf24" />
                  <Text className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Verifikuar</Text>
                </View>
              </View>

              <View className="p-10">
                <View className="flex-row justify-between items-start mb-8">
                  <View className="flex-1">
                    <Text className="text-3xl font-black text-white mb-3 tracking-tight">{shop.name}</Text>
                    <View className="flex-row items-center gap-3">
                      <MapPin size={16} color="#3472ef" />
                      <Text className="text-white/40 text-[12px] font-bold uppercase tracking-widest">{shop.city}, {shop.address || "Qendër"}</Text>
                    </View>
                  </View>
                  <View className="bg-amber-400/10 px-4 py-3 rounded-2xl border border-amber-400/20 items-center">
                    <View className="flex-row items-center gap-1.5">
                      <Star size={18} color="#fbbf24" fill="#fbbf24" />
                      <Text className="text-amber-400 font-black text-xl">{shop.rating || "4.9"}</Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-8 border-t border-white/5">
                  <View className="flex-row items-center gap-3">
                    <View className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse" />
                    <Text className="text-sm font-black text-emerald-500 uppercase tracking-widest">Hapur</Text>
                  </View>
                  <TouchableOpacity className="bg-[#3472ef] px-10 py-5 rounded-[24px] shadow-2xl shadow-[#3472ef]/50 active:scale-95">
                    <Text className="text-white text-[12px] font-black uppercase tracking-[0.15em]">Rezervo Tani</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* ── LIVE SUPPORT BANNER ───────────────────────────── */}
      <View className="mt-10 px-8 pb-48">
        <GlassCard intensity={40} className="p-8 rounded-[36px] border border-white/10">
          <View className="flex-row items-center gap-4 mb-4">
            <View className="w-12 h-12 rounded-2xl bg-[#3472ef]/20 items-center justify-center border border-[#3472ef]/40">
              <Phone size={24} color="#3472ef" />
            </View>
            <View>
              <Text className="text-white text-lg font-black">Nevoitet Ndihmë?</Text>
              <Text className="text-white/40 text-xs font-medium">Ekipi i LineUP është 24/7 në dispozicion.</Text>
            </View>
          </View>
          <View className="flex-row gap-3 mt-2">
            <TouchableOpacity className="flex-1 bg-white/5 border border-white/10 py-4 rounded-2xl items-center flex-row justify-center gap-2">
              <MessageCircle size={18} color="#10b981" />
              <Text className="text-white text-xs font-bold">WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-white/5 border border-white/10 py-4 rounded-2xl items-center flex-row justify-center gap-2">
              <Phone size={18} color="#3472ef" />
              <Text className="text-white text-xs font-bold">Thirr Tani</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>

    </ScrollView>
  );
};
