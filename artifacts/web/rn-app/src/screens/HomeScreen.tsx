import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, Linking } from "react-native";
import { Scissors, MapPin, Search, ChevronDown, Heart, Star, Grid, Eye, Waves, Hand, Sparkles, Smile, User, Syringe, Zap, Shield, Check, ArrowRight, ArrowUpRight, Plus, ExternalLink, Megaphone } from "lucide-react-native";
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import { supabase } from "@/config/supabase";

const { width } = Dimensions.get("window");

interface HomeScreenProps {
  onSelectShop: (shop: any) => void;
  onOpenLocation: () => void;
  onOpenSearch: () => void;
  onOpenAddAd: () => void;
  selectedLocation?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectShop, onOpenLocation, onOpenSearch, onOpenAddAd, selectedLocation = "Lokacioni aktual" }) => {
  const [loading, setLoading] = useState(true);
  const [recommendedShops, setRecommendedShops] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([
    {
      business_name: "Vehees",
      headline: "Zbulo historikun e veturës tënde",
      description: "Kontrollo çdo VIN në sekonda",
      color: "#00d084",
      url: "https://vehees.com/",
      button_text: "Gjej veturën",
      image_url: "https://vehees.com/wp-content/uploads/2024/03/vehees-hero.jpg",
      status: 'active'
    },
    {
      business_name: "noasim",
      headline: "Udhëzues eSIM për udhëtim",
      description: "Udhëzues praktikë për çdo udhëtim",
      color: "transparent",
      url: "https://noasim.com/guides",
      button_text: "Lexo udhëzuesit",
      image_url: "https://noasim.com/wp-content/uploads/2024/05/esim-travel-guides.jpg",
      status: 'active',
      only_button: true
    }
  ]);
  const recommendedScrollRef = useRef<ScrollView>(null);
  const newToLineUpScrollRef = useRef<ScrollView>(null);
  const adsScrollRef = useRef<ScrollView>(null);
  const autoScrollIndex = useRef(0);
  const adsAutoScrollIndex = useRef(0);
  const [teamEmployees, setTeamEmployees] = useState("3");

  const getAdImageSource = (ad: any) => {
    // Priority check for branding consistency with local high-resolution assets
    if (ad.business_name === 'Vehees') return require('../../assets/vehees_banner.jpg');
    if (ad.business_name === 'noasim' || ad.business_name === 'Noasim') return require('../../assets/noasim_banner.jpg');
    if (ad.image_url && ad.image_url.startsWith('http')) return { uri: ad.image_url };
    return { uri: ad.image_url || ad.imageUrl || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1000&auto=format&fit=crop&q=80' };
  };

  useEffect(() => {
    if (loading || recommendedShops.length <= 1) return;

    const interval = setInterval(() => {
      autoScrollIndex.current = (autoScrollIndex.current + 1) % recommendedShops.length;

      const scrollPos = autoScrollIndex.current * ((width - 48) * 0.63 + 16);

      recommendedScrollRef.current?.scrollTo({ x: scrollPos, animated: true });
      newToLineUpScrollRef.current?.scrollTo({ x: scrollPos, animated: true });
    }, 4000);

    return () => clearInterval(interval);
  }, [loading, recommendedShops]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      adsAutoScrollIndex.current = (adsAutoScrollIndex.current + 1) % ads.length;
      const scrollPos = adsAutoScrollIndex.current * (width - 48);
      adsScrollRef.current?.scrollTo({ x: scrollPos, animated: true });
    }, 6000); // Slower loop (6 seconds)

    return () => clearInterval(interval);
  }, [ads]);

  const CATEGORIES = [
    { name: "Të gjitha", icon: Grid },
    { name: "Flokë & stilim", icon: Scissors },
    { name: "Vetulla & qerpikë", icon: Eye },
    { name: "Masazhë", icon: User },
    { name: "Spa & saunë", icon: Waves },
    { name: "Thonjtë", icon: Hand },
    { name: "Depilim", icon: Sparkles },
    { name: "Trajtime fytyre", icon: Smile },
    { name: "Berber", icon: Scissors },
    { name: "Estetikë", icon: Syringe },
  ];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: shopsData, error: shopsError } = await supabase
          .from('barbershops')
          .select('*')
          .eq('status', 'active')
          .order('rating', { ascending: false })
          .limit(6);

        if (shopsError) throw shopsError;
        if (shopsData) setRecommendedShops(shopsData);

        const defaultAds = [
          {
            business_name: "Vehees",
            headline: "Zbulo historikun e veturës tënde",
            description: "Kontrollo çdo VIN në sekonda",
            color: "#00d084",
            url: "https://vehees.com/",
            button_text: "Na vizitoni",
            image_url: "vehees_banner.jpg",
            status: 'active',
            only_button: true
          },
          {
            business_name: "noasim",
            headline: "Udhëzues eSIM për udhëtim",
            description: "Udhëzues praktikë destinacionesh për çdo udhëtim",
            color: "#8b5cf6",
            url: "https://noasim.com/guides",
            button_text: "Na vizitoni",
            image_url: "noasim_banner.jpg",
            status: 'active',
            only_button: true
          }
        ];

        // FORCE SYNC: Upsert defaults to Supabase advertisements table
        const { error: seedError } = await supabase
          .from('advertisements')
          .upsert(defaultAds, { onConflict: 'business_name' });

        if (seedError) {
          console.warn("Seeding failed, using backup:", seedError.message);
          setAds(defaultAds);
        } else {
          const { data: liveAds } = await supabase
            .from('advertisements')
            .select('*')
            .eq('status', 'active');
          setAds(liveAds && liveAds.length > 0 ? liveAds : defaultAds);
        }
      } catch (e) {
        console.warn("Failed to load home data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const renderShopCard = (item: any) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => onSelectShop(item)}
      className="mr-4 mb-6"
      style={{ width: (width - 48) * 0.63 }}
    >
      <View className="relative rounded-3xl overflow-hidden mb-3">
        <Image
          source={{ uri: item.imageUrl || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1000&auto=format&fit=crop&q=80" }}
          className="w-full h-48 object-cover"
        />
        <View
          className="absolute top-3 left-3 overflow-hidden rounded-full border border-white/60"
          style={{ borderRadius: 100 }}
        >
          <BlurView intensity={80} tint="light" className="px-3 py-1 bg-white/50">
            <Text className="text-black text-[10px] font-bold">I zgjedhur</Text>
          </BlurView>
        </View>
        <TouchableOpacity
          className="absolute top-3 right-3 overflow-hidden rounded-full border border-white/60"
          style={{ borderRadius: 100 }}
        >
          <BlurView intensity={60} tint="light" className="w-8 h-8 items-center justify-center bg-white/30">
            <Heart size={18} color="white" fill="white" />
          </BlurView>
        </TouchableOpacity>
      </View>
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-2">
          <Text className="text-lg font-bold text-[#161719]" numberOfLines={1}>{item.name}</Text>
          <Text className="text-[#8789A3] text-sm mt-0.5" numberOfLines={1}>
            {item.distance || ">50 km"} • {item.address || "Manastirski Livadi, Sofia"}
          </Text>
          <Text className="text-[#8789A3] text-sm mt-0.5">{item.category || "Sallon bukurie"} • {item.reviews || "1866"} vlerësime</Text>
        </View>
        <View className="flex-row items-center bg-amber-50 px-2 py-1 rounded-lg">
          <Star size={12} color="#fbbf24" fill="#fbbf24" />
          <Text className="text-[#161719] font-bold text-xs ml-1">{parseFloat(item.rating || "5.0").toFixed(1)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#F5F5F5]">
      {/* Background Decorative Blobs */}
      <View className="absolute top-[-50] left-[-50] w-64 h-64 bg-[#3473ef]/15 rounded-full blur-3xl" />
      <View className="absolute top-[200] right-[-100] w-80 h-80 bg-[#f47458]/15 rounded-full blur-3xl" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── HEADER SECTION ───────────────────────────── */}
        <View className="px-6 pt-14 pb-4">
          <TouchableOpacity
            onPress={onOpenLocation}
            className="flex-row items-center mb-8 px-1"
          >
            <MapPin size={20} color="#3473ef" strokeWidth={2.5} />
            <Text className="text-base font-extrabold mx-2 text-[#161719]">{selectedLocation}</Text>
            <ChevronDown size={18} color="#161719" strokeWidth={3} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onOpenSearch}
            className="overflow-hidden border border-white/90 shadow-2xl shadow-black/10"
            style={{ borderRadius: 100, backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
          >
            <BlurView intensity={80} tint="light" className="flex-row items-center pl-5 pr-1.5 py-1.5">
              <Search size={22} color="#161719" strokeWidth={3} />
              <View className="flex-1 ml-3 h-12 justify-center">
                <Text className="text-[16px] text-[#4b5563] font-extrabold">
                  Kërko sallone, trajtime...
                </Text>
              </View>
              <View className="bg-black px-8 h-12 rounded-full items-center justify-center ml-2 shadow-lg">
                <Text className="text-white font-black text-base">Kërko</Text>
              </View>
            </BlurView>
          </TouchableOpacity>
        </View>

      {/* ── CATEGORIES GRID ──────────────────────────── */}
      <View className="px-6 mt-4">
        <View className="flex-row flex-wrap justify-between">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <View key={i} className="items-center mb-6" style={{ width: '18%' }}>
                <View
                  className="overflow-hidden border border-white/60 shadow-sm mb-2"
                  style={{ borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  <BlurView intensity={30} tint="light" className="w-20 h-20 items-center justify-center">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      className="items-center justify-center w-full h-full"
                    >
                      <Icon size={36} color="#161719" strokeWidth={1.8} />
                    </TouchableOpacity>
                  </BlurView>
                </View>
                <Text className="text-[10px] text-center font-bold text-[#161719] leading-3" numberOfLines={2}>{cat.name}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── ADVERTISEMENT CAROUSEL ─────────────────── */}
      <View className="mt-4 px-6">
        <View className="flex-row items-center justify-between mb-4 px-1">
          <Text className="text-xl font-black text-[#161719]">Partnerët tanë</Text>
          <TouchableOpacity
            onPress={onOpenAddAd}
            className="flex-row items-center bg-[#3473ef]/10 px-3 py-1.5 rounded-full border border-[#3473ef]/20"
          >
             <Megaphone size={12} color="#3473ef" strokeWidth={2.5} />
             <Text className="text-[#3473ef] text-[10px] font-black uppercase ml-1.5">Shto Reklamë</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={adsScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          className="rounded-[32px] overflow-hidden shadow-sm"
        >
          {ads.map((ad, i) => {
            const isCleanBanner = ad.only_button || ad.onlyButton;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => ad.url && Linking.openURL(ad.url)}
                activeOpacity={0.95}
                style={{ width: width - 48 }}
                className="h-48 relative overflow-hidden rounded-[28px] bg-slate-900 shadow-md border border-slate-200/40 mr-4"
              >
                {/* Background Banner Image */}
                <Image
                  source={getAdImageSource(ad)}
                  resizeMode={isCleanBanner ? "contain" : "cover"}
                  className="absolute inset-0 w-full h-full"
                />

                {/* Overlay for standard text ads */}
                {!isCleanBanner && (
                  <View className="absolute inset-0" style={{ backgroundColor: ad.color, opacity: 0.85 }} />
                )}

                {/* Content Overlay */}
                <View className="flex-1 p-4 justify-between relative z-10">

                  {!isCleanBanner && (
                    <View className="my-auto">
                      <Text className="text-white text-lg font-black mb-0.5">{ad.headline}</Text>
                      <Text className="text-white/80 text-xs font-bold">{ad.description || ad.desc}</Text>
                    </View>
                  )}

                  <View className="flex-row justify-end items-center mt-auto">
                    <TouchableOpacity
                      onPress={() => ad.url && Linking.openURL(ad.url)}
                      className="bg-[#3473ef] px-4 py-2 rounded-xl shadow-xl flex-row items-center gap-1.5 border border-white/20 active:scale-95"
                    >
                      <Text className="text-white font-black text-xs uppercase tracking-wider">
                        {ad.button_text || ad.buttonText || "Na vizitoni"}
                      </Text>
                      <ArrowUpRight size={14} color="white" strokeWidth={3} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── RECOMMENDED SECTION ──────────────────────── */}
      <View className="mt-4 px-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-[#161719]">Të rekomanduara</Text>
        </View>
        <View className="overflow-hidden">
          <Animated.ScrollView
            ref={recommendedScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={(width - 48) * 0.63 + 16}
            decelerationRate="fast"
          >
            {recommendedShops.map(renderShopCard)}
          </Animated.ScrollView>
        </View>
      </View>

      {/* ── PRICING PLANS ───────────────────────────── */}
      <View className="mt-4 px-6">
        <Text className="text-xl font-black text-[#161719] mb-4">Planet e Çmimeve</Text>

        <View className="overflow-hidden">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={(width - 48) * 0.7 + 16}
            decelerationRate="fast"
          >
            <PricingCard
              title="Solo"
              price="15€"
              employees="1 berber"
              desc="Ideale për berberët individualë"
              icon={User}
            />
            <PricingCard
              title="Duo"
              price="20€"
              employees="2 berberë"
              desc="Për ekipe të vogla prej dy personash"
              icon={Scissors}
              isPopular
            />
            <View
              className="mr-4 bg-white overflow-hidden shadow-sm border border-slate-100"
              style={{ width: (width - 48) * 0.7, borderRadius: 28, height: 185 }}
            >
              <View className="p-4 relative h-full">
                <View className="absolute top-[-20] right-[-20] w-24 h-24 bg-[#3473ef]/5 rounded-full blur-xl" />

                <View className="flex-row items-center gap-3 mb-3">
                  <View className="w-9 h-9 rounded-xl bg-[#3473ef]/10 items-center justify-center">
                    <Grid size={18} color="#3473ef" strokeWidth={2.5} />
                  </View>
                  <View>
                    <Text className="text-[#161719] text-base font-black">Team</Text>
                    <Text className="text-[#8789A3] text-[9px] font-bold">Për ekipe në rritje</Text>
                  </View>
                </View>

                <View className="bg-[#3473ef]/5 p-3 rounded-2xl border-2 border-dashed border-[#3473ef]/20 mb-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-8 h-8 rounded-full bg-white items-center justify-center mr-2 shadow-sm">
                         <User size={14} color="#3473ef" strokeWidth={3} />
                      </View>
                      <TextInput
                        keyboardType="numeric"
                        className="text-xl font-black text-[#161719] p-0"
                        value={teamEmployees}
                        onChangeText={(val) => {
                          const num = parseInt(val);
                          if (val === "" || (!isNaN(num) && num >= 3)) {
                            setTeamEmployees(val);
                          }
                        }}
                        onBlur={() => {
                          if (!teamEmployees || parseInt(teamEmployees) < 3) {
                            setTeamEmployees("3");
                          }
                        }}
                        placeholder="3"
                        placeholderTextColor="#CBD5E1"
                      />
                      <Text className="text-[#8789A3] text-[10px] font-bold ml-1.5 pt-1">berberë</Text>
                    </View>
                    <Text className="text-xl font-black text-[#3473ef]">
                      {25 + (Math.max(3, parseInt(teamEmployees || "3")) - 3) * 5}€
                    </Text>
                  </View>
                  <Text className="text-[#3473ef]/60 text-[8px] font-black uppercase mt-2 text-center">Ndrysho numrin për të kalkuluar</Text>
                </View>

                <TouchableOpacity className="h-10 bg-black rounded-2xl items-center justify-center shadow-md active:scale-95 mt-auto">
                  <Text className="text-white font-black text-sm">Fillo Tani</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* ── NEW TO LINEUP SECTION ───────────────────── */}
      <View className="mt-4 px-6 mb-8">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-[#161719]">Të reja në LineUp</Text>
        </View>
        <View className="overflow-hidden">
          <ScrollView
            ref={newToLineUpScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={(width - 48) * 0.63 + 16}
            decelerationRate="fast"
          >
            {recommendedShops.slice().reverse().map(renderShopCard)}
          </ScrollView>
        </View>
      </View>

      {/* ── HOW TO USE ────────────────────────────── */}
      <View className="mt-4 px-6 pb-20">
        <View className="flex-row items-center justify-between mb-8">
          <View>
            <Text className="text-3xl font-black text-[#161719]">Si funksionon</Text>
            <Text className="text-[#8789A3] font-bold mt-1">Përjetoni stilimin më të mirë</Text>
          </View>
        </View>

        <View className="gap-y-6">
          {[
            {
              step: "01",
              title: "Gjej dyqanin tënd",
              desc: "Kërko sipas qytetit, shfleto vlerësimet dhe eksploro fotot e berberive më të mira të Kosovës.",
              icon: Search,
              color: "#3473ef"
            },
            {
              step: "02",
              title: "Zgjidhni një vend",
              desc: "Zgjidhni berberin tuaj dhe orën e preferuar nga disponueshmëria në kohë reale.",
              icon: MapPin,
              color: "#f47458"
            },
            {
              step: "03",
              title: "Konfirmo me OTP",
              desc: "Merrni një kod të njëhershëm. Konfirmuar menjëherë, pa asnjë telefonatë.",
              icon: Shield,
              color: "#10b981"
            },
          ].map((item, i) => (
            <View
              key={i}
              className="overflow-hidden shadow-lg mb-4"
              style={{ borderRadius: 28 }}
            >
              <BlurView intensity={30} tint="light" className="flex-row items-center p-5 bg-white/20 border border-white/60">
                <View
                  className="w-16 h-16 rounded-[22px] items-center justify-center bg-white border border-slate-100 shadow-sm"
                >
                  <item.icon size={30} color={item.color} strokeWidth={2.5} />
                </View>

                <View className="flex-1 ml-5">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-xl font-black text-[#161719]">{item.title}</Text>
                    <Text className="text-[10px] font-black text-[#8789A3] tracking-[0.2em]">{item.step}</Text>
                  </View>
                  <Text className="text-[#8789A3] font-bold leading-5 text-[13px]">{item.desc}</Text>
                </View>
              </BlurView>
            </View>
          ))}
        </View>
      </View>

    </ScrollView>
  </View>
);
};

const PricingCard = ({ title, price, employees, desc, icon: Icon, isPopular = false }: any) => (
  <View
    className="mr-4 bg-white overflow-hidden shadow-sm border border-slate-100"
    style={{ width: (width - 48) * 0.7, borderRadius: 28, height: 185 }}
  >
    <View className="p-4 relative h-full">
      <View className="absolute top-[-20] right-[-20] w-24 h-24 bg-[#3473ef]/5 rounded-full blur-xl" />

      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center gap-3">
          <View className="w-9 h-9 rounded-xl bg-[#3473ef]/10 items-center justify-center shadow-lg shadow-[#3473ef]/30">
            <Icon size={18} color="#3473ef" strokeWidth={2.5} />
          </View>
          <View>
            <Text className="text-[#161719] text-base font-black leading-5">{title}</Text>
            <Text className="text-[#8789A3] text-[9px] font-bold">LineUp Premium</Text>
          </View>
        </View>
        {isPopular && (
          <View className="bg-amber-400 px-2 py-0.5 rounded-full">
            <Text className="text-[#161719] text-[7px] font-black uppercase">Më i Populluari</Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center justify-between mb-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
        <View className="flex-row items-baseline">
          <Text className="text-2xl font-black text-[#161719]">{price}</Text>
          <Text className="text-[10px] font-bold text-[#8789A3] ml-1">/muaj</Text>
        </View>
        <View className="flex-row items-center">
          <Check size={10} color="#10b981" strokeWidth={4} />
          <Text className="text-[#161719] font-bold text-[10px] ml-1.5">{employees}</Text>
        </View>
      </View>

      <TouchableOpacity className="h-10 bg-black rounded-2xl items-center justify-center shadow-md active:scale-95 mt-auto">
        <Text className="text-white font-black text-sm">Fillo Tani</Text>
      </TouchableOpacity>
    </View>
  </View>
);

