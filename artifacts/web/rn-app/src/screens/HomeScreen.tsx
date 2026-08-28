import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, Linking, Modal, Alert as RNAlert, ActivityIndicator, Platform, RefreshControl, KeyboardAvoidingView, useWindowDimensions } from "react-native";
import { Scissors, MapPin, Search, ChevronDown, Heart, Star, Grid, Eye, Waves, Hand, Sparkles, Smile, User, Syringe, Zap, Shield, Check, ArrowRight, ArrowUpRight, Plus, Minus, ExternalLink, Megaphone, X, Palette } from "lucide-react-native";
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import { supabase } from "../config/supabase";
import { getShopCardImage } from "../utils/imageUtils";
import { getShopPlanDetails } from "../utils/planLimits";
import * as Haptics from 'expo-haptics';
import { WebFooter } from "../components/WebFooter";
import { DesktopHomeWeb } from "../components/home/DesktopHomeWeb";

// Remove global width constant to support responsiveness with useWindowDimensions() inside components

const CATEGORY_COUNTS: Record<string, string> = {
  'Flokët & Trajtimet': '128 sallone',
  'Ngjyrosja e Flokëve': '74 sallone',
  'Mjekra & Rruajtja': '98 sallone',
  'Vetulla & Qerpikë': '52 sallone',
  'Thonjtë': '61 sallone',
  'Makeup': '38 sallone',
  'Fytyra & Kujdesi i Lëkurës': '27 sallone',
  'Depilim & Trup': '19 sallone'
};

const CATEGORY_ICONS: Record<string, any> = {
  'Flokët & Trajtimet': Scissors,
  'Ngjyrosja e Flokëve': Palette,
  'Mjekra & Rruajtja': User,
  'Vetulla & Qerpikë': Eye,
  'Thonjtë': Hand,
  'Makeup': Smile,
  'Fytyra & Kujdesi i Lëkurës': Shield,
  'Depilim & Trup': Zap
};

interface HomeScreenProps {
  onSelectShop: (shop: any) => void;
  onOpenLocation: () => void;
  onOpenSearch: () => void;
  onOpenAddAd: () => void;
  selectedLocation: string;
  onSearch?: (query: string, subIds?: string[], categoryName?: string) => void;
  onStartPlan?: (planId: string) => void;
  onManagePlan?: () => void;
  onUpgradePlan?: (planId: string) => void;
  onDowngradePlan?: (planId: string) => void;
  onRenewPlan?: (planId: string) => void;
  categories?: any[];
  subcategories?: any[];
  favorites?: any[];
  onToggleFavorite?: (shop: any) => void;
  user?: any;
  onTabPress?: (index: number) => void;
  activeTab?: number;
}

const RecommendedCard = React.memo(({ shop, onPress, width }: { shop: any, onPress: (shop: any) => void, width: number }) => (
  <TouchableOpacity
    onPress={() => onPress(shop)}
    activeOpacity={0.95}
    className="mr-4 overflow-hidden border border-white/60 shadow-sm"
    style={{ width: (width - 48) * 0.7, height: 260, borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
  >
    <BlurView intensity={30} tint="light" className="flex-1">
      <View className="relative w-full h-36">
        <Image
          source={{ uri: getShopCardImage(shop) }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-black/20" />
        <View className="absolute top-3 left-3 bg-black/60 px-3 py-1.5 rounded-full flex-row items-center border border-white/20 backdrop-blur-md">
          <Star size={12} color="#FFD700" fill="#FFD700" />
          <Text className="text-white font-black text-xs ml-1.5">{shop.rating ? parseFloat(String(shop.rating)).toFixed(1) : '0.0'}</Text>
        </View>
        <View className="absolute bottom-[-16] right-4 w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg border border-slate-50">
          <Image source={{ uri: shop.logo_url || getShopCardImage(shop) }} className="w-10 h-10 rounded-full" />
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
));

const ShopCard = React.memo(({ item, isFavorite, onToggleFavorite, onSelect, width }: { item: any, isFavorite: boolean, onToggleFavorite: (item: any) => void, onSelect: (item: any) => void, width: number }) => (
  <TouchableOpacity
    key={item.id}
    onPress={() => onSelect(item)}
    className="mr-4 mb-6 overflow-hidden border border-white/60 shadow-sm"
    style={{ width: (width - 48) * 0.63, borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
  >
    <BlurView intensity={30} tint="light" className="p-3 flex-1">
      <View className="relative rounded-2xl overflow-hidden mb-3">
        <Image
          source={{ uri: getShopCardImage(item) }}
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
          onPress={() => onToggleFavorite(item)}
          className="absolute top-3 right-3 overflow-hidden rounded-full border border-white/60"
          style={{ borderRadius: 100 }}
        >
          <BlurView intensity={60} tint="light" className="w-8 h-8 items-center justify-center bg-white/30">
            <Heart size={18} color={isFavorite ? "#ef4444" : "white"} fill={isFavorite ? "#ef4444" : "transparent"} />
          </BlurView>
        </TouchableOpacity>
      </View>
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-2">
          <Text className="text-base font-black text-[#161719]" numberOfLines={1}>{item.name}</Text>
          <Text className="text-[#8789A3] text-[11px] font-bold mt-0.5" numberOfLines={1}>
            {item.distance || ">50 km"} • {item.address || item.city}
          </Text>
          <Text className="text-[#8789A3] text-[10px] font-bold mt-0.5">{item.category || "Sallon bukurie"} • {item.total_reviews || item.reviews_count || 0} vlerësime</Text>
        </View>
        <View className="flex-row items-center bg-[#3473ef]/10 px-2 py-1 rounded-full">
          <Star size={10} color="#3473ef" fill="#3473ef" />
          <Text className="text-[#3473ef] font-black text-[10px] ml-1">{item.rating ? parseFloat(String(item.rating)).toFixed(1) : '0.0'}</Text>
        </View>
      </View>
    </BlurView>
  </TouchableOpacity>
));

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectShop,
  onOpenLocation,
  onOpenSearch,
  onOpenAddAd,
  selectedLocation = "Lokacioni aktual",
  onSearch,
  onStartPlan,
  onManagePlan,
  onUpgradePlan,
  onDowngradePlan,
  onRenewPlan,
  categories = [],
  subcategories = [],
  favorites = [],
  onToggleFavorite,
  user,
  onTabPress,
  activeTab
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [loading, setLoading] = useState(true);
  const [recommendedShops, setRecommendedShops] = useState<any[]>([]);
  const [newShops, setNewShops] = useState<any[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<any | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [currentPlanInfo, setCurrentPlanInfo] = useState<any>(null);

  const [ads, setAds] = useState<any[]>([
    {
      business_name: "NOA IPTV",
      image_url: "noaiptv_banner.jpg",
      url: "https://noaiptv.com",
      status: 'active',
      only_button: true
    },
    {
      business_name: "Vehees",
      url: "https://vehees.com/",
      image_url: "vehees_banner.jpg",
      status: 'active',
      only_button: true
    },
    {
      business_name: "noasim",
      url: "https://noasim.com/guides",
      image_url: "noasim_banner.jpg",
      status: 'active',
      only_button: true
    },
    {
      business_name: "Technova",
      url: "https://technova-ks.com",
      image_url: "technova_banner.jpg",
      status: 'active',
      only_button: true
    }
  ]);
  const recommendedScrollRef = useRef<any>(null);
  const newToLineUpScrollRef = useRef<ScrollView>(null);
  const adsScrollRef = useRef<ScrollView>(null);
  const autoScrollIndex = useRef(0);
  const adsAutoScrollIndex = useRef(0);
  const [teamEmployees, setTeamEmployees] = useState("3");

  const getAdImageSource = (ad: any) => {
    // Priority check for branding consistency with local high-resolution assets
    if (ad.business_name === 'Vehees') return require('../../assets/vehees_banner.jpg');
    if (ad.business_name === 'noasim' || ad.business_name === 'Noasim') return require('../../assets/noasim_banner.jpg');
    if (ad.business_name === 'NOA IPTV' || ad.image_url === 'noaiptv_banner.jpg') return require('../../assets/noaiptv_banner.jpg');
    if (ad.business_name === 'Technova' || ad.image_url === 'technova_banner.jpg') return require('../../assets/technova_banner.jpg');
    if (ad.image_url && ad.image_url.startsWith('http')) return { uri: ad.image_url };
    return { uri: ad.image_url || ad.imageUrl || 'noaiptv_banner.jpg' };
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
  }, [loading, recommendedShops, width]);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      adsAutoScrollIndex.current = (adsAutoScrollIndex.current + 1) % ads.length;
      const scrollPos = adsAutoScrollIndex.current * (width - 48);
      adsScrollRef.current?.scrollTo({ x: scrollPos, animated: true });
    }, 6000); // Slower loop (6 seconds)

    return () => clearInterval(interval);
  }, [ads, width]);

  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      // Calculate date 7 days ago for "New to LineUp" section
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();

      const [shopsRes, newShopsRes, adsRes] = await Promise.all([
        supabase
          .from('barbershops')
          .select('*')
          .eq('status', 'active')
          .order('rating', { ascending: false })
          .limit(10),
        supabase
          .from('barbershops')
          .select('*')
          .eq('status', 'active')
          .gte('created_at', sevenDaysAgoISO)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('advertisements')
          .select('*')
          .eq('status', 'active'),
      ]);

      let shopsData = shopsRes.data;
      let shopsError = shopsRes.error;

      if (shopsError && (shopsError.code === 'PGRST205' || shopsError.message?.includes('barbershops'))) {
        const fallbackRes = await supabase
          .from('barbers')
          .select('*')
          .limit(6);
        shopsData = fallbackRes.data;
      }

      if (shopsData && shopsData.length > 0) {
        setRecommendedShops(shopsData);
      }

      if (newShopsRes.data) {
        setNewShops(newShopsRes.data);
      }

      if (adsRes.data && adsRes.data.length > 0) {
        setAds(adsRes.data);
      }

      // Fetch plan info if user is logged in
      if (user?.id) {
        let sId = user.id;
        if (user.role === 'employee') {
          const { data: bData } = await supabase.from('barbers').select('shop_id').eq('user_id', user.id).maybeSingle();
          if (bData?.shop_id) sId = bData.shop_id;
        } else {
          const { data: sData } = await supabase.from('barbershops').select('id').eq('owner_id', user.id).maybeSingle();
          if (sData?.id) sId = sData.id;
        }

        const planInfo = await getShopPlanDetails(sId);
        setCurrentPlanInfo(planInfo);
      }
    } catch (e) {
      console.warn("Failed to load home data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    loadData(true);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) {}
  };

  const renderRecommendedCard = (shop: any, index: number) => (
    <RecommendedCard key={shop.id || index} shop={shop} onPress={onSelectShop} width={width} />
  );

  const renderShopCard = (item: any) => {
    const isFav = favorites?.some(f => f.shop_id === item.id || f.shop_id === Number(item.id));
    return (
      <ShopCard
        key={item.id}
        item={item}
        isFavorite={isFav}
        onToggleFavorite={onToggleFavorite || (() => {})}
        onSelect={onSelectShop}
        width={width}
      />
    );
  };

  const renderSubModal = () => {
    const isSubcatForCategory = (s: any) => {
      if (!selectedMainCategory) return false;
      const sCatId = String(s.category_id || '').trim().toLowerCase();
      const catId = String(selectedMainCategory.id || '').trim().toLowerCase();
      const sCatName = String(s.category_name || s.categoryName || '').trim().toLowerCase();
      const catName = String(selectedMainCategory.name || '').trim().toLowerCase();

      return (catId && sCatId === catId) || (catName && (sCatId === catName || sCatName === catName));
    };

    const currentSubcategories = subcategories.filter(isSubcatForCategory);

    return (
      <Modal
        visible={showSubModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSubModal(false)}
      >
        <View className={`flex-1 justify-end ${isDesktop ? 'items-center pb-4 sm:pb-8' : ''}`}>
          <TouchableOpacity
            className="absolute inset-0 bg-black/45 z-0"
            activeOpacity={1}
            onPress={() => setShowSubModal(false)}
          />
          <View className={`bg-white overflow-hidden shadow-2xl flex-col z-10 ${
            isDesktop 
              ? 'w-full max-w-2xl lg:max-w-3xl rounded-[36px] h-auto max-h-[85vh] border border-slate-200/80' 
              : 'w-full rounded-t-[32px] h-[75%]'
          }`}>
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
                {categories.map(cat => {
                  const IconComponent = CATEGORY_ICONS[cat.name] || Scissors;
                  const isSelected = selectedMainCategory?.id === cat.id || selectedMainCategory?.name === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id || cat.name}
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
                    const currentCategorySubIds = currentSubcategories.map(s => String(s.id).trim());
                    
                    setSelectedSubIds(prev => {
                      const allSelected = currentCategorySubIds.every(id => prev.includes(id));
                      if (allSelected) {
                        return prev.filter(id => !currentCategorySubIds.includes(id));
                      } else {
                        const newSelection = [...prev];
                        currentCategorySubIds.forEach(id => {
                          if (!newSelection.includes(id)) newSelection.push(id);
                        });
                        return newSelection;
                      }
                    });
                  }
                }}
                className={`rounded-2xl py-4 items-center mb-4 border ${!selectedMainCategory || (currentSubcategories.length > 0 && currentSubcategories.every(s => selectedSubIds.includes(String(s.id).trim()))) ? 'bg-[#3473ef]/10 border-[#3473ef]' : 'bg-slate-50 border-slate-200'}`}
              >
                <Text className={`font-black text-base ${!selectedMainCategory || (currentSubcategories.length > 0 && currentSubcategories.every(s => selectedSubIds.includes(String(s.id).trim()))) ? 'text-[#3473ef]' : 'text-[#64748b]'}`}>Të gjitha në këtë kategori</Text>
              </TouchableOpacity>

              {currentSubcategories.map((sub, sIdx) => {
                const subId = String(sub.id).trim();
                const isSelected = selectedSubIds.includes(subId);
                return (
                  <TouchableOpacity
                    key={`${subId}-${sIdx}`}
                    onPress={() => {
                      setSelectedSubIds(prev =>
                        prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
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

                  let finalSubIds = [...selectedSubIds];
                  if (finalSubIds.length === 0 && selectedMainCategory) {
                    finalSubIds = currentSubcategories.map(s => String(s.id).trim());
                  }
                  
                  if (onSearch) {
                    onSearch("", finalSubIds, selectedMainCategory?.name || "");
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
    );
  };

  if (Platform.OS === 'web') {
    return (
      <View className="flex-1 bg-[#f8fafc]">
        <DesktopHomeWeb
          categories={categories}
          recommendedShops={recommendedShops}
          newShops={newShops}
          ads={ads}
          user={user}
          selectedLocation={selectedLocation}
          onSelectShop={onSelectShop}
          onOpenLocation={onOpenLocation}
          onOpenSearch={onOpenSearch}
          onSelectCategory={(label) => {
            const found = categories.find(c => String(c.name).toLowerCase().trim() === String(label).toLowerCase().trim()) || { name: label, id: label };
            setSelectedMainCategory(found);
            setShowSubModal(true);
          }}
          onStartPlan={(pId) => onStartPlan && onStartPlan(pId)}
          onManagePlan={onManagePlan || (() => {})}
          onUpgradePlan={(pId) => onUpgradePlan && onUpgradePlan(pId)}
          onDowngradePlan={(pId) => onDowngradePlan && onDowngradePlan(pId)}
          onRenewPlan={(pId) => onRenewPlan && onRenewPlan(pId)}
          currentPlanInfo={currentPlanInfo}
          teamEmployees={teamEmployees}
          setTeamEmployees={setTeamEmployees}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite || (() => {})}
          activeTab={activeTab || 0}
          onTabPress={onTabPress || (() => {})}
        />

        {renderSubModal()}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View className="flex-1 bg-[#f8fafc]">
      {/* Background Decorative Blobs */}
      <View className="absolute top-[-50] left-[-50] w-64 h-64 bg-[#3473ef]/15 rounded-full blur-3xl" />
      <View className="absolute top-[200] right-[-100] w-80 h-80 bg-[#f47458]/15 rounded-full blur-3xl" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3473ef" />
        }
      >

        {/* ── HEADER SECTION (MOBILE ONLY) ───────────────────── */}
        {!isDesktop && (
          <View className="px-6 pt-14 pb-4">
            <TouchableOpacity
              onPress={onOpenLocation}
              activeOpacity={0.7}
              className="flex-row items-center mb-8 px-1"
            >
              <MapPin size={20} color="#3473ef" strokeWidth={2.5} />
              <Text className="text-base font-extrabold mx-2 text-[#161719]">{selectedLocation}</Text>
              <ChevronDown size={18} color="#161719" strokeWidth={3} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onOpenSearch}
              activeOpacity={0.7}
              className="overflow-hidden border border-white/90 shadow-2xl shadow-black/10"
              style={{ borderRadius: 100, backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
            >
              <View pointerEvents="none">
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
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* ── DESKTOP 3-COLUMN LAYOUT vs MOBILE LAYOUT ────────────────── */}
        {/* ───────────────────────────────────────────────────────────── */}

        {isDesktop ? (
          <View className="max-w-7xl w-full mx-auto px-6 pt-6">
            {/* HERO SECTION FOR DESKTOP */}
            <View className="mb-10 bg-white/40 p-8 rounded-[36px] border border-white/80 shadow-sm backdrop-blur-md">
              <View className="flex-row items-start justify-between mb-6">
                <View className="flex-1 pr-8">
                  <Text className="text-4xl font-black text-[#161719] mb-3 leading-tight">
                    Rezervo termin te berberi{"\n"}më i mirë në Kosovë
                  </Text>
                  <Text className="text-slate-500 font-extrabold text-base">
                    Shfleto sallonet, zgjidh orën që të përshtatet dhe konfirmo me OTP — pa telefonata.
                  </Text>
                </View>

                {/* Right Stats */}
                <View className="flex-row items-center gap-x-8 pt-2">
                  <View className="items-center">
                    <Text className="text-3xl font-black text-[#161719]">450+</Text>
                    <Text className="text-slate-400 font-extrabold text-xs">Sallone</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-3xl font-black text-[#161719]">28k</Text>
                    <Text className="text-slate-400 font-extrabold text-xs">Termine</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-3xl font-black text-[#3473ef]">4.9</Text>
                    <Text className="text-slate-400 font-extrabold text-xs">Vlerësim</Text>
                  </View>
                </View>
              </View>

              {/* Hero Search Bar */}
              <TouchableOpacity
                onPress={onOpenSearch}
                className="bg-white rounded-full border border-slate-200 shadow-lg shadow-black/5 p-2 flex-row items-center"
              >
                <Search size={22} color="#94A3B8" className="ml-4 mr-3" />
                <Text className="flex-1 text-slate-400 font-bold text-base ml-2">
                  Kërko sallone, trajtime...
                </Text>
                <View className="bg-black px-8 py-3 rounded-full shadow-md">
                  <Text className="text-white font-black text-sm">Kërko</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* 3 COLUMNS SECTION */}
            <View className="flex-row items-start justify-between">
              {/* LEFT SIDEBAR: SHËRBIMET (STICKY) */}
              <View className="w-64 gap-y-3 lg:sticky lg:top-24 lg:self-start">
                <Text className="text-slate-400 font-black text-xs uppercase tracking-widest mb-2 px-1">
                  SHËRBIMET
                </Text>
                {categories.map((cat, i) => {
                  const IconComponent = CATEGORY_ICONS[cat.name] || Scissors;
                  const count = CATEGORY_COUNTS[cat.name] || '45 sallone';
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => {
                        setSelectedMainCategory(cat);
                        setShowSubModal(true);
                      }}
                      activeOpacity={0.8}
                      className="bg-white hover:bg-slate-50 p-3 rounded-2xl border border-slate-200/80 shadow-sm flex-row items-center transition-all group"
                    >
                      <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mr-3 group-hover:bg-[#3473ef] transition-colors">
                        <IconComponent size={20} color="#161719" strokeWidth={2} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[#161719] font-black text-xs" numberOfLines={1}>{cat.name}</Text>
                        <Text className="text-slate-400 font-bold text-[10px] mt-0.5">{count}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* MIDDLE COLUMN: MAIN FEED CONTENT */}
              <View className="flex-1 mx-6 gap-y-8">
                {/* Partnerët tanë */}
                <View>
                  <Text className="text-xl font-black text-[#161719] mb-4">Partnerët tanë</Text>
                  <ScrollView
                    ref={adsScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="rounded-[28px] overflow-hidden"
                  >
                    {ads.map((ad, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => ad.url && Linking.openURL(ad.url)}
                        style={{ width: 560, height: 220 }}
                        className="mr-4 rounded-[28px] overflow-hidden bg-slate-900 shadow-md relative"
                      >
                        <Image
                          source={getAdImageSource(ad)}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Të rekomanduara */}
                <View>
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-2xl font-black text-[#161719]">Të rekomanduara</Text>
                    <TouchableOpacity onPress={onOpenSearch}>
                      <Text className="text-[#3473ef] font-extrabold text-sm">Shiko të gjitha</Text>
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row flex-wrap gap-4">
                    {recommendedShops.map(renderShopCard)}
                  </View>
                </View>

                {/* Të reja në LineUp */}
                {newShops.length > 0 && (
                  <View>
                    <Text className="text-2xl font-black text-[#161719] mb-4">Të reja në LineUp</Text>
                    <View className="flex-row flex-wrap gap-4">
                      {newShops.map(renderShopCard)}
                    </View>
                  </View>
                )}

                {/* Si funksionon */}
                <View className="bg-white/80 p-8 rounded-[32px] border border-white shadow-sm">
                  <Text className="text-2xl font-black text-[#161719] mb-1">Si funksionon</Text>
                  <Text className="text-slate-400 font-bold text-sm mb-6">Përjetoni stilimin më të mirë në 3 hapa</Text>
                  <View className="gap-y-6">
                    {[
                      { step: "01", title: "Gjej dyqanin tënd", desc: "Kërko sipas qytetit, shfleto vlerësimet dhe eksploro fotot e berberive më të mira.", icon: Search, color: "#3473ef" },
                      { step: "02", title: "Zgjidhni një vend", desc: "Zgjidhni berberin tuaj dhe orën e preferuar nga disponueshmëria në kohë reale.", icon: MapPin, color: "#f47458" },
                      { step: "03", title: "Konfirmo me OTP", desc: "Konfirmoni terminin tuaj menjëherë pa pasur nevojë për telefonata të lodhshme.", icon: Shield, color: "#10b981" }
                    ].map((item, i) => (
                      <View key={i} className="flex-row items-start">
                        <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: item.color }}>
                          <item.icon size={18} color="white" strokeWidth={2.5} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-black text-[#161719]">{item.title}</Text>
                          <Text className="text-slate-400 font-semibold text-xs mt-0.5">{item.desc}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* RIGHT SIDEBAR: PLANET E ÇMIMEVE (STICKY) */}
              <View className="w-72 gap-y-4 lg:sticky lg:top-24 lg:self-start">
                <Text className="text-slate-400 font-black text-xs uppercase tracking-widest mb-2 px-1">
                  PLANET E ÇMIMEVE
                </Text>
                <PricingCard
                  planId="solo"
                  title="Solo"
                  price="15€"
                  employees="1 berber"
                  desc="Ideale për berberët individualë"
                  icon={User}
                  onPress={() => onStartPlan && onStartPlan('solo')}
                  currentPlanInfo={currentPlanInfo}
                  userRole={user?.role}
                  onUpgrade={() => onUpgradePlan?.('solo')}
                  onDowngrade={() => onDowngradePlan?.('solo')}
                  onRenew={() => onRenewPlan?.('solo')}
                  onManage={onManagePlan}
                  width={width}
                />
                <PricingCard
                  planId="duo"
                  title="Duo"
                  price="20€"
                  employees="2 berberë"
                  desc="Për sallone të vogla me 2 berberë"
                  icon={Scissors}
                  isPopular
                  onPress={() => onStartPlan && onStartPlan('duo')}
                  currentPlanInfo={currentPlanInfo}
                  userRole={user?.role}
                  onUpgrade={() => onUpgradePlan?.('duo')}
                  onDowngrade={() => onDowngradePlan?.('duo')}
                  onRenew={() => onRenewPlan?.('duo')}
                  onManage={onManagePlan}
                  width={width}
                />
                <PricingCard
                  planId="team"
                  title="Team"
                  price={`${25 + (Math.max(3, parseInt(teamEmployees || "3")) - 3) * 5}€`}
                  employees={`${teamEmployees} berberë`}
                  desc="Për ekipe në rritje"
                  icon={Grid}
                  isTeam
                  teamEmployees={teamEmployees}
                  setTeamEmployees={setTeamEmployees}
                  onPress={() => onStartPlan && onStartPlan('team')}
                  currentPlanInfo={currentPlanInfo}
                  userRole={user?.role}
                  onUpgrade={() => onUpgradePlan?.('team')}
                  onDowngrade={() => onDowngradePlan?.('team')}
                  onRenew={() => onRenewPlan?.('team')}
                  onManage={onManagePlan}
                  width={width}
                />
              </View>
            </View>
          </View>
        ) : (
          /* MOBILE LAYOUT */
          <>
            {/* ── CATEGORIES GRID ──────────────────────────── */}
            <View className="px-6 mt-4">
              <View className="flex-row flex-wrap justify-between">
                {categories.map((cat, i) => {
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
                pagingEnabled={false}
                snapToInterval={width - 48}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                className="rounded-[28px] overflow-hidden shadow-sm"
                style={{ height: 224 }}
              >
                {ads.map((ad, i) => {
                  const isCleanBanner = ad.only_button || ad.onlyButton || ad.business_name === 'Vehees' || ad.business_name === 'noasim' || ad.business_name === 'Noasim' || ad.business_name === 'NOA IPTV' || ad.business_name === 'Technova';
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => ad.url && Linking.openURL(ad.url)}
                      activeOpacity={0.95}
                      style={{ width: width - 48, height: 224 }}
                      className="relative overflow-hidden rounded-[28px] bg-slate-900 shadow-md border border-slate-200/40"
                    >
                      <Image
                        source={getAdImageSource(ad)}
                        resizeMode={ad.business_name === 'NOA IPTV' || ad.business_name === 'Technova' ? "stretch" : "cover"}
                        className="absolute inset-0 w-full h-full"
                      />
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
                    planId="solo"
                    title="Solo"
                    price="15€"
                    employees="1 berber"
                    desc="Ideale për berberët individualë"
                    icon={User}
                    onPress={() => onStartPlan && onStartPlan('solo')}
                    currentPlanInfo={currentPlanInfo}
                    userRole={user?.role}
                    onUpgrade={() => onUpgradePlan?.('solo')}
                    onDowngrade={() => onDowngradePlan?.('solo')}
                    onRenew={() => onRenewPlan?.('solo')}
                    onManage={onManagePlan}
                    width={width}
                  />
                  <PricingCard
                    planId="duo"
                    title="Duo"
                    price="20€"
                    employees="2 berberë"
                    desc="Për ekipe të vogla prej dy personash"
                    icon={Scissors}
                    isPopular
                    onPress={() => onStartPlan && onStartPlan('duo')}
                    currentPlanInfo={currentPlanInfo}
                    userRole={user?.role}
                    onUpgrade={() => onUpgradePlan?.('duo')}
                    onDowngrade={() => onDowngradePlan?.('duo')}
                    onRenew={() => onRenewPlan?.('duo')}
                    onManage={onManagePlan}
                    width={width}
                  />
                  <PricingCard
                    planId="team"
                    title="Team"
                    price={`${25 + (Math.max(3, parseInt(teamEmployees || "3")) - 3) * 5}€`}
                    employees={`${teamEmployees} berberë`}
                    desc="Për ekipe në rritje"
                    icon={Grid}
                    isTeam
                    teamEmployees={teamEmployees}
                    setTeamEmployees={setTeamEmployees}
                    onPress={() => onStartPlan && onStartPlan('team')}
                    currentPlanInfo={currentPlanInfo}
                    userRole={user?.role}
                    onUpgrade={() => onUpgradePlan?.('team')}
                    onDowngrade={() => onDowngradePlan?.('team')}
                    onRenew={() => onRenewPlan?.('team')}
                    onManage={onManagePlan}
                    width={width}
                  />
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
                  <View 
                    className="absolute left-[38px] top-12 bottom-12 w-[1px] bg-slate-300" 
                    style={{ borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1' }}
                  />

                  <View className="gap-y-8">
                    {[
                      { step: "01", title: "Gjej dyqanin tënd", desc: "Kërko sipas qytetit, shfleto vlerësimet dhe eksploro fotot e berberive më të mira të Kosovës.", icon: Search, color: "#3473ef" },
                      { step: "02", title: "Zgjidhni një vend", desc: "Zgjidhni berberin tuaj dhe orën e preferuar nga disponueshmëria në kohë reale.", icon: MapPin, color: "#f47458" },
                      { step: "03", title: "Konfirmo me OTP", desc: "Konfirmoni terminin tuaj menjëherë pa pasur nevojë për telefonata të lodhshme.", icon: Shield, color: "#10b981" },
                    ].map((item, i) => (
                      <View key={i} className="flex-row items-start relative z-10">
                        <View 
                          className="w-11 h-11 rounded-full items-center justify-center border-2 border-white shadow-sm"
                          style={{ backgroundColor: item.color }}
                        >
                          <item.icon size={20} color="white" strokeWidth={2.5} />
                        </View>

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
          </>
        )}

        {/* ── WEB FOOTER FOR DESKTOP SCREENS ─────────────────── */}
        {isDesktop && (
          <WebFooter
            onNavigateTab={(tabIndex) => {
              if (tabIndex === 3 && onManagePlan) onManagePlan();
              else if (tabIndex === 1 && onOpenSearch) onOpenSearch();
            }}
            onOpenRegisterShop={() => onStartPlan && onStartPlan('solo')}
          />
        )}

      </ScrollView>

      {renderSubModal()}
      </View>
    </KeyboardAvoidingView>
  );
};

const PricingCard = ({
  planId,
  title,
  price,
  employees,
  desc,
  icon: Icon,
  isPopular = false,
  isTeam = false,
  teamEmployees,
  setTeamEmployees,
  onPress,
  currentPlanInfo,
  userRole,
  onUpgrade,
  onDowngrade,
  onRenew,
  onManage,
  width
}: any) => {
  const isCurrentPlan = currentPlanInfo?.planId === planId;
  const isExpired = currentPlanInfo?.status === 'expired' || currentPlanInfo?.status === 'canceled';
  const isEmployee = userRole === 'employee';

  // Plan hierarchy to determine upgrade/downgrade
  const planWeights: Record<string, number> = { solo: 1, duo: 2, team: 3 };
  const currentWeight = planWeights[currentPlanInfo?.planId || ''] || 0;
  const targetWeight = planWeights[planId] || 0;

  const handlePress = () => {
    if (isEmployee) {
      RNAlert.alert(
        "Llogari Punëtori",
        "Abonimet mund të blihen dhe menaxhohen vetëm nga Pronari i Biznesit. Ju aktualisht jeni duke përdorur një llogari Punëtori."
      );
      return;
    }

    if (isCurrentPlan) {
      if (isExpired) {
        onRenew?.();
      } else {
        onManage?.();
      }
      return;
    }

    if (currentPlanInfo?.status === 'active' || currentPlanInfo?.status === 'trialing') {
      if (targetWeight > currentWeight) {
        onUpgrade?.();
      } else {
        onDowngrade?.();
      }
      return;
    }

    onPress();
  };

  let buttonText = "Fillo Tani";
  if (isCurrentPlan) {
    buttonText = isExpired ? "Rinovon" : "Plani Aktual";
  } else if (currentPlanInfo?.status === 'active' || currentPlanInfo?.status === 'trialing') {
    buttonText = targetWeight > currentWeight ? "Përmirëso" : "Zbrit";
  }

  return (
    <View
      className="mr-4 bg-white overflow-hidden shadow-sm border border-slate-100"
      style={{ width: (width - 48) * 0.7, borderRadius: 28, height: 215 }}
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

        {isTeam ? (
          <View className="bg-[#3473ef]/5 p-3 rounded-2xl border-2 border-dashed border-[#3473ef]/20 mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-8 h-8 rounded-full bg-white items-center justify-center mr-2 shadow-sm">
                   <User size={14} color="#3473ef" strokeWidth={3} />
                </View>

                <View className="flex-row items-center bg-white rounded-xl px-2 py-0.5 shadow-sm">
                  <TouchableOpacity
                    onPress={() => {
                      const num = parseInt(teamEmployees || "3");
                      if (num > 3) {
                        setTeamEmployees((num - 1).toString());
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    disabled={parseInt(teamEmployees || "3") <= 3}
                    className={`w-6 h-6 items-center justify-center rounded-full ${parseInt(teamEmployees || "3") <= 3 ? 'bg-slate-50' : 'bg-slate-100'}`}
                  >
                    <Minus size={12} color={parseInt(teamEmployees || "3") <= 3 ? '#CBD5E1' : '#161719'} strokeWidth={3} />
                  </TouchableOpacity>

                  <TextInput
                    keyboardType="numeric"
                    className="text-lg font-black text-[#161719] px-2 min-w-[30px] text-center"
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
                    editable={!isEmployee}
                  />

                  <TouchableOpacity
                    onPress={() => {
                      const num = parseInt(teamEmployees || "3");
                      setTeamEmployees((num + 1).toString());
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="w-6 h-6 items-center justify-center bg-[#3473ef] rounded-full"
                  >
                    <Plus size={12} color="white" strokeWidth={3} />
                  </TouchableOpacity>
                </View>

                <Text className="text-[#8789A3] text-[9px] font-bold ml-1.5">berberë</Text>
              </View>
              <Text className="text-xl font-black text-[#3473ef]">{price}</Text>
            </View>
          </View>
        ) : (
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
        )}

        {isCurrentPlan && !isExpired && (
          <Text className="text-[#3473ef] text-[9px] font-black mb-2 text-center">
            Jeni i abonuar në këtë plan.
          </Text>
        )}

        <TouchableOpacity
          onPress={handlePress}
          className={`h-10 rounded-2xl items-center justify-center shadow-md active:scale-95 mt-auto ${isCurrentPlan && !isExpired ? 'bg-slate-200' : 'bg-black'}`}
          disabled={isCurrentPlan && !isExpired && !isEmployee}
        >
          <Text className={`${isCurrentPlan && !isExpired ? 'text-slate-500' : 'text-white'} font-black text-sm`}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

