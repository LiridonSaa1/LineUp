import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, Linking, Modal } from "react-native";
import { Scissors, MapPin, Search, ChevronDown, Heart, Star, Grid, Eye, Waves, Hand, Sparkles, Smile, User, Syringe, Zap, Shield, Check, ArrowRight, ArrowUpRight, Plus, ExternalLink, Megaphone } from "lucide-react-native";
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import { supabase } from "@/config/supabase";

import { X } from "lucide-react-native";

const { width } = Dimensions.get("window");

const CATEGORY_ICONS: Record<string, any> = {
  'Flokë & Stilim': Scissors,
  'Mjekër & Estetikë': User,
  'Thonjtë': Hand,
  'Grim & Bukuri': Smile,
  'Kujdesi i Lëkurës': Shield,
  'Spa & Relaks': Waves,
  'Depilim': Zap,
  'Raste të Veçanta': Sparkles
};

interface HomeScreenProps {
  onSelectShop: (shop: any) => void;
  onOpenLocation: () => void;
  onOpenSearch: () => void;
  onOpenAddAd: () => void;
  selectedLocation: string;
  onSearch?: (query: string) => void;
  onStartPlan?: (planId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectShop, onOpenLocation, onOpenSearch, onOpenAddAd, selectedLocation = "Lokacioni aktual", onSearch, onStartPlan }) => {
  const [loading, setLoading] = useState(true);
  const [recommendedShops, setRecommendedShops] = useState<any[]>([]);
  const [newShops, setNewShops] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbSubcategories, setDbSubcategories] = useState<any[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<any | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);

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
    { name: "Haircut & Styling", icon: Scissors },
    { name: "Hair Coloring", icon: Sparkles },
    { name: "Hair Treatment", icon: Zap },
    { name: "Beard & Grooming", icon: User },
    { name: "Nails", icon: Hand },
    { name: "Makeup", icon: Smile },
    { name: "Brows & Lashes", icon: Eye },
    { name: "Skin Care", icon: Shield },
    { name: "Body Care", icon: Waves },
  ];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let { data: shopsData, error: shopsError } = await supabase
          .from('barbershops')
          .select('*')
          .eq('status', 'active')
          .order('rating', { ascending: false })
          .limit(6);

        if (shopsError && (shopsError.code === 'PGRST205' || shopsError.message?.includes('barbershops'))) {
          const fallbackRes = await supabase
            .from('barbers')
            .select('*')
            .limit(6);
          shopsData = fallbackRes.data;
          shopsError = fallbackRes.error;
        }

        if (shopsData && shopsData.length > 0) {
          setRecommendedShops(shopsData);
        }

        // Fetch new shops (latest first)
        const { data: newShopsData } = await supabase
          .from('barbershops')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(6);
        if (newShopsData) {
          setNewShops(newShopsData);
        }

        const { data: liveAds } = await supabase
          .from('advertisements')
          .select('*')
          .eq('status', 'active');

        if (liveAds && liveAds.length > 0) {
          setAds(liveAds);
        }

        const { data: catData } = await supabase.from('categories').select('*');
        if (catData) setDbCategories(catData);
        
        const { data: subData } = await supabase.from('subcategories').select('*');
        if (subData) setDbSubcategories(subData);

      } catch (e) {
        console.warn("Failed to load home data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const renderRecommendedCard = (shop: any, index: number) => (
    <TouchableOpacity
      key={shop.id || index}
      onPress={() => onSelectShop(shop)}
      activeOpacity={0.95}
      className="mr-4 overflow-hidden border border-white/60 shadow-sm"
      style={{ width: (width - 48) * 0.7, height: 260, borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
    >
      <BlurView intensity={30} tint="light" className="flex-1">
        <View className="relative w-full h-36">
          <Image
            source={{ uri: shop.imageUrl || shop.image_url || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1000&auto=format&fit=crop&q=80' }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/20" />
          <View className="absolute top-3 left-3 bg-black/60 px-3 py-1.5 rounded-full flex-row items-center border border-white/20 backdrop-blur-md">
            <Star size={12} color="#FFD700" fill="#FFD700" />
            <Text className="text-white font-black text-xs ml-1.5">{shop.rating || '5.0'}</Text>
          </View>
          <View className="absolute bottom-[-16] right-4 w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg border border-slate-50">
            <Image source={{ uri: shop.logo_url || 'https://ui-avatars.com/api/?name=' + shop.name }} className="w-10 h-10 rounded-full" />
          </View>
        </View>

        <View className="p-4 pt-5 flex-1 justify-between">
          <View>
            <Text className="text-xl font-black text-[#161719] mb-1" numberOfLines={1}>{shop.name}</Text>
            <View className="flex-row items-center">
              <MapPin size={12} color="#8789A3" />
              <Text className="text-[#8789A3] font-bold text-xs ml-1" numberOfLines={1}>{shop.address || shop.city}</Text>
            </View>
          </View>
          
          <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-white/40">
            <Text className="text-[#3473ef] font-black text-sm uppercase tracking-wider">Top Rated</Text>
            <View className="w-8 h-8 rounded-full bg-[#3473ef]/10 items-center justify-center">
              <ArrowUpRight size={16} color="#3473ef" />
            </View>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  const renderShopCard = (item: any) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => onSelectShop(item)}
      className="mr-4 mb-6 overflow-hidden border border-white/60 shadow-sm"
      style={{ width: (width - 48) * 0.63, borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
    >
      <BlurView intensity={30} tint="light" className="p-3 flex-1">
        <View className="relative rounded-2xl overflow-hidden mb-3">
          <Image
            source={{ uri: item.imageUrl || item.image_url || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1000&auto=format&fit=crop&q=80" }}
            className="w-full h-40 object-cover"
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
            <Text className="text-base font-black text-[#161719]" numberOfLines={1}>{item.name}</Text>
            <Text className="text-[#8789A3] text-[11px] font-bold mt-0.5" numberOfLines={1}>
              {item.distance || ">50 km"} • {item.address || item.city}
            </Text>
            <Text className="text-[#8789A3] text-[10px] font-bold mt-0.5">{item.category || "Sallon bukurie"} • {item.reviews || "186"} vlerësime</Text>
          </View>
          <View className="flex-row items-center bg-[#3473ef]/10 px-2 py-1 rounded-full">
            <Star size={10} color="#3473ef" fill="#3473ef" />
            <Text className="text-[#3473ef] font-black text-[10px] ml-1">{parseFloat(item.rating || "5.0").toFixed(1)}</Text>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#ECEEF2]">
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
          {dbCategories.map((cat, i) => {
            const IconComponent = CATEGORY_ICONS[cat.name] || Scissors;
            return (
              <View key={i} className="items-center mb-6" style={{ width: '22%' }}>
                <View
                  className="overflow-hidden border border-white/60 shadow-sm mb-2"
                  style={{ borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
                >
                  <BlurView intensity={30} tint="light" className="w-[70px] h-[70px] items-center justify-center">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      className="items-center justify-center w-full h-full"
                      onPress={() => {
                        setSelectedMainCategory(cat);
                        setShowSubModal(true);
                      }}
                    >
                      <IconComponent size={32} color="#161719" strokeWidth={1.5} />
                    </TouchableOpacity>
                  </BlurView>
                </View>
                <Text className="text-[11px] text-center font-bold text-[#161719] leading-3" numberOfLines={2}>{cat.name}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* ── ADVERTISEMENT CAROUSEL ─────────────────── */}
      <View className="mt-4 px-6">
        <View className="flex-row items-center justify-between mb-4 px-1">
          <Text className="text-xl font-black text-[#161719]">Partnerët tanë</Text>
        </View>

        <ScrollView
          ref={adsScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          className="rounded-[28px] overflow-hidden shadow-sm"
        >
          {ads.map((ad, i) => {
            const isCleanBanner = ad.only_button || ad.onlyButton || ad.business_name === 'Vehees' || ad.business_name === 'noasim' || ad.business_name === 'Noasim';
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
                  resizeMode="cover"
                  className="absolute inset-0 w-full h-full"
                />

                {/* Overlay for standard text ads */}
                {!isCleanBanner && (
                  <View className="absolute inset-0" style={{ backgroundColor: ad.color, opacity: 0.85 }} />
                )}
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
              onPress={() => onStartPlan && onStartPlan('solo')}
            />
            <PricingCard
              title="Duo"
              price="20€"
              employees="2 berberë"
              desc="Për ekipe të vogla prej dy personash"
              icon={Scissors}
              isPopular
              onPress={() => onStartPlan && onStartPlan('duo')}
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

                <TouchableOpacity 
                  onPress={() => onStartPlan && onStartPlan('team')}
                  className="h-10 bg-black rounded-2xl items-center justify-center shadow-md active:scale-95 mt-auto"
                >
                  <Text className="text-white font-black text-sm">Fillo Tani</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* ── NEW TO LINEUP SECTION ───────────────────── */}
      {newShops.length > 0 && (
        <View className="mt-4 px-6">
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
              {newShops.map(renderShopCard)}
            </ScrollView>
          </View>
        </View>
      )}

      {/* ── HOW TO USE (TIMELINE STYLE) ──────────────── */}
      <View className="mt-4 px-6 pb-20">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-3xl font-black text-[#161719]">Si funksionon</Text>
            <Text className="text-[#8789A3] font-bold mt-1">Përjetoni stilimin më të mirë në 3 hapa</Text>
          </View>
        </View>

        <View 
          className="overflow-hidden border border-white/60 shadow-lg" 
          style={{ borderRadius: 32, backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
        >
          <BlurView intensity={30} tint="light" className="p-6 relative">
            {/* Timeline Vertical Line Connector */}
            <View 
              className="absolute left-[38px] top-12 bottom-12 w-[1px] bg-slate-300" 
              style={{ borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' }}
            />

            <View className="gap-y-8">
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
                  desc: "Konfirmoni terminin tuaj menjëherë pa pasur nevojë për telefonata të lodhshme.",
                  icon: Shield,
                  color: "#10b981"
                },
              ].map((item, i) => (
                <View key={i} className="flex-row items-start relative z-10">
                  {/* Left Circle Icon */}
                  <View 
                    className="w-11 h-11 rounded-full items-center justify-center border-2 border-white shadow-sm"
                    style={{ backgroundColor: item.color }}
                  >
                    <item.icon size={20} color="white" strokeWidth={2.5} />
                  </View>

                  {/* Right Content */}
                  <View className="flex-1 ml-5">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-lg font-black text-[#161719]">{item.title}</Text>
                      <View className="bg-white/60 px-2 py-0.5 rounded-full border border-white/80">
                        <Text className="text-[10px] font-black text-[#8789A3] tracking-widest">{item.step}</Text>
                      </View>
                    </View>
                    <Text className="text-[#8789A3] font-semibold leading-5 text-[13px]">{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </BlurView>
        </View>
      </View>

    </ScrollView>

    {/* Subcategory Modal */}
    <Modal
      visible={showSubModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSubModal(false)}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <TouchableOpacity
          className="absolute inset-0"
          activeOpacity={1}
          onPress={() => setShowSubModal(false)}
        />
        <View className="bg-white rounded-t-[32px] h-[75%] overflow-hidden flex-col">
          <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mt-3 mb-2" />
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-50">
            <View className="flex-row items-center">
              <Text className="text-xl font-black text-[#161719]">Shërbimet</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSubModal(false)} className="p-2 bg-slate-100 rounded-full">
              <X size={20} color="#161719" />
            </TouchableOpacity>
          </View>

          {/* Category Tabs */}
          <View className="border-b border-slate-100">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              {dbCategories.map(cat => {
                const IconComponent = CATEGORY_ICONS[cat.name] || Scissors;
                const isSelected = selectedMainCategory?.id === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedMainCategory(cat)}
                    className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${isSelected ? 'bg-[#161719]' : 'bg-slate-100'}`}
                  >
                    <IconComponent size={14} color={isSelected ? "white" : "#64748b"} />
                    <Text className={`ml-2 text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-500'}`}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} className="flex-1">
            <Text className="text-sm font-bold text-[#8789A3] mb-4">Zgjidhni shërbimet për këtë kategori:</Text>
            
            <TouchableOpacity
              onPress={() => {
                if (selectedMainCategory) {
                  const currentCategorySubIds = dbSubcategories
                    .filter(s => s.category_id === selectedMainCategory.id)
                    .map(s => s.id);
                  
                  setSelectedSubIds(prev => {
                    const allSelected = currentCategorySubIds.every(id => prev.includes(id));
                    if (allSelected) {
                      // If all are selected, unselect them
                      return prev.filter(id => !currentCategorySubIds.includes(id));
                    } else {
                      // Select all
                      const newSelection = [...prev];
                      currentCategorySubIds.forEach(id => {
                        if (!newSelection.includes(id)) newSelection.push(id);
                      });
                      return newSelection;
                    }
                  });
                }
              }}
              className={`rounded-2xl py-4 items-center mb-4 border ${!selectedMainCategory || dbSubcategories.filter(s => s.category_id === selectedMainCategory?.id).every(s => selectedSubIds.includes(s.id)) ? 'bg-[#3473ef]/10 border-[#3473ef]' : 'bg-slate-50 border-slate-200'}`}
            >
              <Text className={`font-black text-base ${!selectedMainCategory || dbSubcategories.filter(s => s.category_id === selectedMainCategory?.id).every(s => selectedSubIds.includes(s.id)) ? 'text-[#3473ef]' : 'text-[#64748b]'}`}>Të gjitha në këtë kategori</Text>
            </TouchableOpacity>

            {selectedMainCategory && dbSubcategories.filter(s => s.category_id === selectedMainCategory.id).map((sub) => {
              const isSelected = selectedSubIds.includes(sub.id);
              return (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => {
                    setSelectedSubIds(prev =>
                      prev.includes(sub.id) ? prev.filter(id => id !== sub.id) : [...prev, sub.id]
                    );
                  }}
                  className={`flex-row items-center py-4 border-b ${isSelected ? 'border-[#3473ef]/30' : 'border-slate-100'}`}
                >
                  <View className={`w-6 h-6 rounded-md border items-center justify-center mr-3 ${isSelected ? 'bg-[#3473ef] border-[#3473ef]' : 'bg-white border-slate-300'}`}>
                    {isSelected && <Check size={14} color="white" strokeWidth={3} />}
                  </View>
                  <Text className={`text-base flex-1 ${isSelected ? 'font-black text-[#3473ef]' : 'font-bold text-[#161719]'}`}>{sub.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Sticky Bottom Button */}
          <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-50">
            <TouchableOpacity
              onPress={() => {
                setShowSubModal(false);
                let queryText = "";
                if (selectedSubIds.length > 0) {
                  const selectedNames = dbSubcategories
                    .filter(s => selectedSubIds.includes(s.id))
                    .map(s => s.name);
                  queryText = selectedNames.join(", ");
                } else {
                  queryText = selectedMainCategory?.name || "";
                }
                
                if (onSearch && queryText) {
                  onSearch(queryText);
                }
              }}
              className="h-14 bg-black rounded-2xl items-center justify-center shadow-lg"
            >
              <Text className="text-white font-black text-lg">
                Kërko {selectedSubIds.length > 0 ? `(${selectedSubIds.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </View>
);
};

const PricingCard = ({ title, price, employees, desc, icon: Icon, isPopular = false, onPress }: any) => (
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

      <TouchableOpacity 
        onPress={onPress}
        className="h-10 bg-black rounded-2xl items-center justify-center shadow-md active:scale-95 mt-auto"
      >
        <Text className="text-white font-black text-sm">Fillo Tani</Text>
      </TouchableOpacity>
    </View>
  </View>
);

