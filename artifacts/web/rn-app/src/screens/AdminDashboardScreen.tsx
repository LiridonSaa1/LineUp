import React, { useEffect, useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable, TextInput, ActivityIndicator, Alert, FlatList, RefreshControl, KeyboardAvoidingView, Platform, Modal, Dimensions, InteractionManager, Keyboard, TouchableWithoutFeedback } from "react-native";
import { Shield, Store, Users, CreditCard, Check, X, Search, Power, Trash2, ChevronRight, RefreshCw, BarChart2, Zap, ArrowLeft, LogOut, SlidersHorizontal, MessageSquare, ChevronLeft, LayoutGrid, LayoutList, Bell, AlertCircle } from "lucide-react-native";
import { supabase } from "../config/supabase";
import { PADDLE_CONFIG, listPaddleTransactions, PaddleTransaction } from "../config/paddle";
import { deleteShopAssets } from "../utils/storage";
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight } from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface AdminDashboardScreenProps {
  onLogout: () => void;
  onImpersonate: (user: any) => void;
}

// --- OPTIMIZED LIST ITEM COMPONENTS ---

const ShopItem = React.memo(({ item, onToggleStatus, onDelete }: any) => (
  <View className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm mb-4">
    <View className="flex-row justify-between items-start">
      <View className="flex-row items-center gap-3">
        <View className="w-12 h-12 rounded-2xl bg-[#3473ef]/10 items-center justify-center border border-[#3473ef]/10">
          <Store size={22} color="#3473ef" />
        </View>
        <View>
          <Text className="text-lg font-black text-slate-900">{item.name}</Text>
          <Text className="text-slate-500 font-bold text-xs">{item.city || "Prishtinë"} • {item.address || "Qendra"}</Text>
          <Text className="text-slate-400 font-bold text-[10px] mt-0.5">ID: #{item.id} • Tel: {item.phone || "N/A"}</Text>
        </View>
      </View>
      <View className={`px-3 py-1 rounded-full border ${item.status === 'active' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
        <Text className={`text-[10px] font-black uppercase ${item.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {item.status === 'active' ? 'AKTIV' : 'PEZULLUAR'}
        </Text>
      </View>
    </View>
    <View className="h-[1px] bg-slate-50 my-4" />
    <View className="flex-row gap-3">
      <TouchableOpacity
        onPress={() => onToggleStatus(item.id, item.status)}
        className={`flex-1 py-3.5 rounded-2xl flex-row items-center justify-center gap-2 border ${item.status === 'active' ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}
      >
        <Power size={16} color={item.status === 'active' ? '#D97706' : '#059669'} />
        <Text className={`font-black text-xs ${item.status === 'active' ? 'text-amber-700' : 'text-emerald-700'}`}>
          {item.status === 'active' ? 'Pezullo' : 'Aktivizo'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onDelete(item.id, item.name)}
        className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 items-center justify-center"
      >
        <Trash2 size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  </View>
));

const UserItem = React.memo(({ item, onImpersonate }: any) => (
  <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-row items-center justify-between mb-3">
    <View className="flex-row items-center gap-3">
      <View className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center">
        <Users size={18} color="#64748B" />
      </View>
      <View>
        <Text className="text-slate-900 font-black text-sm">{item.name || item.email}</Text>
        <Text className="text-slate-500 font-bold text-xs">{item.email}</Text>
      </View>
    </View>
    <View className="flex-row items-center gap-2">
      <TouchableOpacity
        onPress={() => onImpersonate(item)}
        className="bg-[#3473ef] px-3 py-1.5 rounded-xl border border-[#3473ef]/20"
      >
        <Text className="text-white font-black text-[10px] uppercase">Hyr</Text>
      </TouchableOpacity>
      <View className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
        <Text className="text-slate-600 font-black text-[10px] uppercase">{item.role || 'client'}</Text>
      </View>
    </View>
  </View>
));

const FeedbackItem = React.memo(({ item, onDelete, isSupport = false }: any) => (
  <View className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm mb-4">
    <View className="flex-row justify-between items-start">
      <View className="flex-1 mr-4">
        {isSupport && (
          <View className="flex-row items-center mb-1">
            <View className={`px-2 py-0.5 rounded-full mr-2 ${item.status === 'open' ? 'bg-amber-50' : 'bg-emerald-50'}`}>
              <Text className={`text-[8px] font-black uppercase ${item.status === 'open' ? 'text-amber-500' : 'text-emerald-500'}`}>{item.status || 'open'}</Text>
            </View>
            <Text className="text-[#3473ef] font-black text-[10px] uppercase tracking-wider">{(item.subject || "").replace("SUPPORT: ", "")}</Text>
          </View>
        )}
        {!isSupport && <Text className="text-[#3473ef] font-black text-[10px] uppercase tracking-wider">{item.subject}</Text>}
        <Text className="text-slate-900 font-bold text-base mt-1">{item.content}</Text>
        <View className="flex-row items-center mt-4 pt-4 border-t border-slate-50">
          <View className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center mr-2">
            <Text className="text-slate-700 text-[10px] font-black">{(item.name || item.users?.name || 'U').charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text className="text-slate-900 font-black text-[11px]">{item.name || item.users?.name || 'Klient / Vizitor'}</Text>
            <Text className="text-slate-500 font-bold text-[10px]">
              {item.email || item.users?.email || "Pa Email"} {item.phone ? `• ${item.phone}` : ''} • {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={() => onDelete(item.id)} className="w-10 h-10 rounded-xl bg-rose-50 items-center justify-center border border-rose-100">
        <Trash2 size={16} color="#EF4444" />
      </TouchableOpacity>
    </View>
  </View>
));

const TransactionItem = React.memo(({ item }: any) => {
  if (item.type === 'header') return <Text className="text-slate-900 font-black text-lg mt-6 mb-3 px-1">{item.title}</Text>;
  const isSubscription = !!item.subscription_id && !item.details;

  const endDate = new Date(item.current_period_end || item.subscription_end_date);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining <= 0 || item.status === 'expired';
  const isNearExpiry = daysRemaining <= 7 && daysRemaining > 0;

  let statusColor = 'text-emerald-600';
  let statusBg = 'bg-emerald-50';
  let statusBorder = 'border-emerald-100';

  if (isExpired) {
    statusColor = 'text-rose-600';
    statusBg = 'bg-rose-50';
    statusBorder = 'border-rose-100';
  } else if (isNearExpiry) {
    statusColor = 'text-amber-600';
    statusBg = 'bg-amber-50';
    statusBorder = 'border-amber-100';
  }

  return (
    <View className={`bg-white rounded-[24px] p-5 border shadow-sm mb-3 ${isExpired ? 'border-rose-100' : 'border-slate-100'}`}>
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center gap-3">
          <View className={`w-12 h-12 rounded-2xl items-center justify-center ${isSubscription ? 'bg-[#3473ef]/10' : 'bg-emerald-50'}`}>
            {isSubscription ? <CreditCard size={24} color="#3473ef" /> : <Check size={24} color="#10B981" />}
          </View>
          <View>
            <Text className="text-lg font-black text-slate-900">
              {isSubscription ? (item.barbershops?.name || 'Sallon pa emër') : `${(parseFloat(item.details?.totals?.total || "0") / 100).toFixed(2)} ${item.details?.totals?.currency_code}`}
            </Text>
            <Text className="text-slate-500 font-bold text-xs">
               {isSubscription ? `Plani: ${item.product_id?.toUpperCase() || 'DUO'}` : `${new Date(item.created_at).toLocaleDateString()} • ${item.status}`}
            </Text>
          </View>
        </View>
        <View className={`px-3 py-1 rounded-full border ${statusBg} ${statusBorder}`}>
          <Text className={`text-[10px] font-black uppercase ${statusColor}`}>
            {isExpired ? 'EXPIRED' : (isNearExpiry ? 'EXPIRING' : 'ACTIVE')}
          </Text>
        </View>
      </View>

      {isSubscription && (
        <View className="bg-slate-50 rounded-2xl p-4 gap-y-2">
           <View className="flex-row justify-between items-center">
              <Text className="text-slate-400 font-bold text-[10px] uppercase">Skadimi</Text>
              <Text className={`font-black text-xs ${isExpired ? 'text-rose-500' : (isNearExpiry ? 'text-amber-500' : 'text-slate-700')}`}>
                 {endDate.toLocaleDateString('sq-AL')} ({daysRemaining} ditë)
              </Text>
           </View>
           <View className="flex-row justify-between items-center">
              <Text className="text-slate-400 font-bold text-[10px] uppercase">Pagesa e fundit</Text>
              <Text className="text-slate-700 font-black text-xs">
                 {new Date(item.last_payment_date || item.updated_at).toLocaleDateString('sq-AL')}
              </Text>
           </View>
           <View className="flex-row justify-between items-center">
              <Text className="text-slate-400 font-bold text-[10px] uppercase">ID</Text>
              <Text className="text-slate-400 font-bold text-[9px]">{item.subscription_id || item.id}</Text>
           </View>
        </View>
      )}
    </View>
  );
});

// --- HUB BUTTON COMPONENT ---

const HubButton = ({ icon: Icon, title, subtitle, color, onPress, badge }: any) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{ width: (width - 64) / 2 }}
    className="bg-white rounded-[32px] p-6 mb-4 border border-slate-100 shadow-sm items-center justify-center"
  >
    <View className={`w-14 h-14 rounded-[20px] items-center justify-center mb-4`} style={{ backgroundColor: `${color}15` }}>
      <Icon size={28} color={color} strokeWidth={2.5} />
      {badge > 0 && (
        <View className="absolute -top-1 -right-1 bg-rose-500 min-w-[20px] h-[20px] rounded-full items-center justify-center border-2 border-white shadow-xs px-1">
          <Text className="text-white text-[10px] font-black">{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
    <Text className="text-slate-900 font-black text-sm text-center">{title}</Text>
    <Text className="text-slate-400 font-bold text-[10px] text-center mt-1 uppercase tracking-widest">{subtitle}</Text>
  </TouchableOpacity>
);

// --- MAIN SCREEN COMPONENT ---

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onLogout, onImpersonate }) => {
  const [activeModal, setActiveModal] = useState<'shops' | 'subscriptions' | 'users' | 'system' | 'suggestions' | 'support' | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Suspension Modal State
  const [suspensionModalVisible, setSuspensionModalVisible] = useState(false);
  const [selectedShopForSuspension, setSelectedShopForSuspension] = useState<{id: number, name: string} | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [isSubmittingSuspension, setIsSubmittingSuspension] = useState(false);

  // Data States
  const [shops, setShops] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [paddleTransactions, setPaddleTransactions] = useState<PaddleTransaction[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [supportEmail, setSupportEmail] = useState("support@lineup.ks");
  const [savingEmail, setSavingEmail] = useState(false);

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      // Fetch shops, users, etc. normally
      const [shopsRes, usersRes, pTransactions, feedbackRes, settingsRes] = await Promise.all([
        supabase.from('barbershops').select('*').order('id', { ascending: false }),
        supabase.from('users').select('*').order('id', { ascending: false }),
        listPaddleTransactions(),
        supabase.from('system_feedback').select('*, users(name, email)').order('created_at', { ascending: false }),
        supabase.from('system_settings').select('*').eq('key', 'support_email').maybeSingle()
      ]);

      // Fetch subscriptions separately with a fallback for the new barbershops(name) relation which depends on business_id
      let subsData: any[] = [];
      try {
        const { data: sData, error: sErr } = await supabase.from('subscriptions').select('*, barbershops(name)').order('updated_at', { ascending: false });
        if (sErr) throw sErr;
        subsData = sData || [];
      } catch (e) {
        console.warn("[AdminDashboard] business_id or relation missing, falling back to basic subscriptions fetch");
        const { data: sData } = await supabase.from('subscriptions').select('*').order('updated_at', { ascending: false });
        subsData = sData || [];
      }

      setShops(shopsRes.data || []);
      setSubscriptions(subsData);
      setUsers(usersRes.data || []);
      setPaddleTransactions(pTransactions || []);
      setFeedbacks(feedbackRes.data || []);
      if (settingsRes.data) setSupportEmail(settingsRes.data.value);

    } catch (err) {
      console.warn("[AdminDashboard] Error fetching admin data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Use InteractionManager to ensure the UI is stable before fetching
    const task = InteractionManager.runAfterInteractions(() => {
      if (isMounted) {
        fetchData(true);
      }
    });

    return () => {
      isMounted = false;
      if (task) task.cancel();
    };
  }, [fetchData]);

  const handleToggleShopStatus = useCallback(async (shopId: number, currentStatus: string) => {
    console.log("[AdminDashboard] handleToggleShopStatus called:", { shopId, currentStatus });
    if (currentStatus === 'active') {
      const shop = shops.find(s => s.id === shopId);
      console.log("[AdminDashboard] Found shop for suspension:", shop?.name);
      setSelectedShopForSuspension({ id: shopId, name: shop?.name || "Këtë sallon" });
      setSuspensionReason("");
      setSuspensionModalVisible(true);
      return;
    }

    // If we are activating, just do it directly
    try {
      await supabase.from('barbershops').update({ status: 'active', suspension_reason: null }).eq('id', shopId);
      await supabase.from('barbers').update({ status: 'active' }).eq('shop_id', shopId);
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, status: 'active', suspension_reason: null } : s));
      Alert.alert("Sukses", `Salloni u aktivizua.`);
    } catch (e) { Alert.alert("Gabim", "Dështoi aktivizimi."); }
  }, [shops]);

  const confirmSuspension = async () => {
    if (!selectedShopForSuspension) return;
    if (!suspensionReason.trim()) {
      Alert.alert("Gabim", "Ju lutem shënoni një arsye për pezullimin.");
      return;
    }

    setIsSubmittingSuspension(true);
    try {
      const { error } = await supabase
        .from('barbershops')
        .update({
          status: 'suspended',
          suspension_reason: suspensionReason.trim()
        })
        .eq('id', selectedShopForSuspension.id);

      if (error) throw error;

      await supabase.from('barbers').update({ status: 'suspended' }).eq('shop_id', selectedShopForSuspension.id);

      setShops(prev => prev.map(s => s.id === selectedShopForSuspension.id ? { ...s, status: 'suspended', suspension_reason: suspensionReason.trim() } : s));

      Alert.alert("Sukses", `Salloni u pezullua me sukses.`);
      setSuspensionModalVisible(false);
      setSelectedShopForSuspension(null);
    } catch (e) {
      Alert.alert("Gabim", "Dështoi pezullimi.");
    } finally {
      setIsSubmittingSuspension(false);
    }
  };

  const handleDeleteShop = useCallback(async (shopId: number, shopName: string) => {
    Alert.alert("Fshi Berberinë", `Fshi "${shopName}"? Ky veprim do të fshijë edhe të gjitha fotografitë.`, [
      { text: "Anulo", style: "cancel" },
      { text: "Fshi", style: "destructive", onPress: async () => {
        try {
          // 1. Fetch shop assets to delete from storage
          const { data: shop } = await supabase
            .from('barbershops')
            .select('image_url, portfolio_urls')
            .eq('id', shopId)
            .maybeSingle();

          if (shop) {
            const assetsToDelete = [];
            if (shop.image_url) assetsToDelete.push(shop.image_url);
            if (Array.isArray(shop.portfolio_urls)) {
              shop.portfolio_urls.forEach((url: any) => {
                if (typeof url === 'string') assetsToDelete.push(url);
                else if (url?.url) assetsToDelete.push(url.url);
              });
            }
            if (assetsToDelete.length > 0) {
              await deleteShopAssets(assetsToDelete);
            }
          }

          // 2. Delete row (cascade handles staff/appts)
          await supabase.from('barbershops').delete().eq('id', shopId);
          setShops(prev => prev.filter(s => s.id !== shopId));
        } catch (e) {
          console.warn("Failed to delete shop assets:", e);
        }
      }}
    ]);
  }, []);

  const handleDeleteFeedback = useCallback(async (id: string) => {
    Alert.alert("Fshi", "A jeni të sigurt?", [
      { text: "Anulo", style: "cancel" },
      { text: "Fshi", style: "destructive", onPress: async () => {
        await supabase.from('system_feedback').delete().eq('id', id);
        setFeedbacks(prev => prev.filter(f => f.id !== id));
      }}
    ]);
  }, []);

  const handleSaveEmail = async () => {
    if (!supportEmail.includes('@')) { Alert.alert("Gabim", "Email i pasaktë."); return; }
    setSavingEmail(true);
    try {
      await supabase.from('system_settings').upsert({ key: 'support_email', value: supportEmail, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      Alert.alert("Sukses", "Email i suportit u ruajt.");
    } catch (e) { Alert.alert("Gabim", "Dështoi ruajtja."); } finally { setSavingEmail(false); }
  };

  const totalRevenue = useMemo(() => paddleTransactions.reduce((acc, txn) => {
    const rawVal = (txn as any).details?.totals?.total || (txn as any).amount || "0";
    const amount = parseFloat(rawVal) / ((txn as any).details ? 100 : 1);
    return acc + amount;
  }, 0), [paddleTransactions]);

  const suggestionsList = useMemo(() => feedbacks.filter(f => !(f.subject || "").startsWith("SUPPORT:")), [feedbacks]);
  const supportMessagesList = useMemo(() => feedbacks.filter(f => (f.subject || "").startsWith("SUPPORT:")), [feedbacks]);

  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!activeModal) return [];
    if (activeModal === 'shops') return shops.filter(s => (s.name || "").toLowerCase().includes(q) || (s.city || "").toLowerCase().includes(q));
    if (activeModal === 'users') return users.filter(u => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
    if (activeModal === 'suggestions') return suggestionsList;
    if (activeModal === 'support') return supportMessagesList;
    if (activeModal === 'subscriptions') return [...subscriptions, { id: 'header-trans', type: 'header', title: 'Transaksionet (Paddle)' }, ...paddleTransactions];
    return [];
  }, [activeModal, searchQuery, shops, users, suggestionsList, supportMessagesList, subscriptions, paddleTransactions]);

  const renderHubContent = () => (
    <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 90, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={["#3473ef"]} />}
    >
      <Animated.View entering={FadeInDown.delay(100)} className="flex-row gap-3 mb-8">
        <View className="flex-1 bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
          <View className="w-10 h-10 rounded-2xl bg-emerald-50 items-center justify-center mb-3">
             <CreditCard size={22} color="#10B981" />
          </View>
          <Text className="text-3xl font-black text-slate-900">{totalRevenue}€</Text>
          <Text className="text-slate-400 font-bold text-[10px] mt-1 uppercase tracking-wider">Të Hyra Totale</Text>
        </View>

        <View className="flex-1 bg-[#161719] p-5 rounded-[32px] shadow-lg shadow-black/20">
          <View className="w-10 h-10 rounded-2xl bg-white/10 items-center justify-center mb-3">
             <Store size={22} color="white" />
          </View>
          <Text className="text-3xl font-black text-white">{shops.length}</Text>
          <Text className="text-white/40 font-bold text-[10px] mt-1 uppercase tracking-wider">Sallone Aktive</Text>
        </View>
      </Animated.View>

      <Text className="text-slate-900 font-black text-lg mb-6 ml-1">Menaxhimi i Sistemit</Text>

      <View className="flex-row flex-wrap justify-between">
        <HubButton icon={Store} title="Berberitë" subtitle="Menaxho sallonet" color="#3473ef" onPress={() => { setSearchQuery(""); setActiveModal('shops'); }} badge={shops.length} />
        <HubButton icon={Users} title="Përdoruesit" subtitle="Lista e klientëve" color="#A855F7" onPress={() => { setSearchQuery(""); setActiveModal('users'); }} badge={users.length} />
        <HubButton icon={CreditCard} title="Paddle" subtitle="Pagesat & Planet" color="#10B981" onPress={() => { setSearchQuery(""); setActiveModal('subscriptions'); }} />
        <HubButton icon={MessageSquare} title="Feedback" subtitle="Sugjerimet" color="#F59E0B" onPress={() => { setSearchQuery(""); setActiveModal('suggestions'); }} badge={suggestionsList.length} />
        <HubButton icon={Bell} title="Suporti" subtitle="Kërkesat e ndihmës" color="#6366f1" onPress={() => { setSearchQuery(""); setActiveModal('support'); }} badge={supportMessagesList.filter(m => m.status !== 'closed').length} />
        <HubButton icon={SlidersHorizontal} title="Sistemi" subtitle="Konfigurimet" color="#64748B" onPress={() => { setSearchQuery(""); setActiveModal('system'); }} />
      </View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-[#F8FAFC]">
      <View className="flex-1">
        {/* Header removed as requested - navigation is now via bottom bar */}

        {loading && !refreshing ? (
          <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#3473ef" /><Text className="text-slate-400 font-bold mt-4 uppercase tracking-widest text-[10px]">Duke përgatitur Hub-in...</Text></View>
        ) : renderHubContent()}

        {/* --- MODAL SYSTEM FOR LISTS --- */}
        <Modal visible={activeModal !== null} animationType="slide" transparent={true}>
          <View className="flex-1 bg-black/60 justify-end">
            <TouchableOpacity activeOpacity={1} onPress={() => setActiveModal(null)} className="absolute inset-0" />

            <Animated.View entering={FadeInUp} className="bg-[#F8FAFC] rounded-t-[48px] h-[92%] overflow-hidden">
              <View className="w-12 h-1.5 bg-slate-200 rounded-full self-center mt-3 mb-6" />

              {/* Modal Header */}
              <View className="px-8 pb-6 flex-row justify-between items-center">
                <View>
                  <Text className="text-3xl font-black text-slate-900">
                    {activeModal === 'shops' ? 'Berberitë' :
                     activeModal === 'users' ? 'Përdoruesit' :
                     activeModal === 'subscriptions' ? 'Financat' :
                     activeModal === 'suggestions' ? 'Feedback' :
                     activeModal === 'support' ? 'Suporti' : 'Sistemi'}
                  </Text>
                  <Text className="text-slate-400 font-bold text-xs mt-1">Gjithsej {filteredData.length} rreshta</Text>
                </View>
                <TouchableOpacity onPress={() => setActiveModal(null)} className="w-12 h-12 bg-white rounded-full items-center justify-center border border-slate-100 shadow-sm">
                  <X size={24} color="#161719" />
                </TouchableOpacity>
              </View>

              {/* Search in Modal */}
              {(activeModal === 'shops' || activeModal === 'users') && (
                <View className="px-8 mb-6">
                  <View className="bg-white rounded-2xl px-4 h-14 flex-row items-center border border-slate-100 shadow-sm">
                    <Search size={20} color="#94A3B8" />
                    <TextInput
                        placeholder="Kërko këtu..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="flex-1 ml-3 text-slate-900 font-bold text-base"
                    />
                    {searchQuery !== "" && <TouchableOpacity onPress={() => setSearchQuery("")} className="p-1"><X size={18} color="#94A3B8" /></TouchableOpacity>}
                  </View>
                </View>
              )}

              {/* Modal Content */}
              <View className="flex-1 px-8 pb-10">
                {activeModal === 'system' ? (
                  <ScrollView showsVerticalScrollIndicator={false} className="gap-y-6">
                    <View className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm gap-y-4">
                      <View className="flex-row items-center gap-3 mb-2"><View className="w-10 h-10 rounded-xl bg-[#3473ef]/10 items-center justify-center"><SlidersHorizontal size={20} color="#3473ef" /></View><View><Text className="text-slate-900 font-black text-lg">Email Suporti</Text><Text className="text-slate-500 font-bold text-xs">Cakto ku pranohen kërkesat</Text></View></View>
                      <TextInput value={supportEmail} onChangeText={setSupportEmail} keyboardType="email-address" autoCapitalize="none" className="bg-slate-50 h-14 rounded-2xl px-5 text-slate-900 font-bold border border-slate-100" />
                      <TouchableOpacity onPress={handleSaveEmail} disabled={savingEmail} className="bg-[#3473ef] h-14 rounded-2xl items-center justify-center shadow-lg shadow-[#3473ef]/20">
                        {savingEmail ? <ActivityIndicator color="white" /> : <Text className="text-white font-black text-base">Ruaj Ndryshimet</Text>}
                      </TouchableOpacity>
                    </View>
                    <View className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm gap-y-4">
                      <Text className="text-slate-900 font-black text-base">Paddle Config</Text>
                      <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 gap-y-3">
                        <View className="flex-row justify-between items-center"><Text className="text-slate-500 font-bold text-xs">Environment:</Text><Text className="text-[#3473ef] font-black text-[10px] uppercase">{PADDLE_CONFIG.ENVIRONMENT}</Text></View>
                        <View className="flex-row justify-between items-center"><Text className="text-slate-500 font-bold text-xs">API Status:</Text><Text className="text-emerald-600 font-black text-[10px]">AKTIV</Text></View>
                        <View className="flex-row justify-between items-center"><Text className="text-slate-500 font-bold text-xs">Client Token:</Text><Text className="text-slate-900 font-bold text-[10px]">{PADDLE_CONFIG.CLIENT_TOKEN.substring(0, 15)}...</Text></View>
                      </View>
                    </View>
                  </ScrollView>
                ) : (
                  <FlatList
                    data={filteredData}
                    keyExtractor={(item, index) => (item.id || item.subscription_id || `idx-${index}`).toString()}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                      if (activeModal === 'shops') return <ShopItem item={item} onToggleStatus={handleToggleShopStatus} onDelete={handleDeleteShop} />;
                      if (activeModal === 'users') return <UserItem item={item} onImpersonate={onImpersonate} />;
                      if (activeModal === 'suggestions') return <FeedbackItem item={item} onDelete={handleDeleteFeedback} />;
                      if (activeModal === 'support') return <FeedbackItem item={item} onDelete={handleDeleteFeedback} isSupport />;
                      if (activeModal === 'subscriptions') return <TransactionItem item={item} />;
                      return null;
                    }}
                    ListEmptyComponent={
                        <View className="items-center justify-center py-20">
                            <Store size={48} color="#CBD5E1" />
                            <Text className="text-slate-400 font-bold mt-4">Nuk u gjet asnjë rekord.</Text>
                        </View>
                    }
                  />
                )}
              </View>

              {/* --- SUSPENSION REASON MODAL (Nested to avoid sibling modal issues on some platforms) --- */}
              {suspensionModalVisible && (
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View className="absolute inset-0 bg-black/40 justify-center px-6 z-[2000]">
                    <KeyboardAvoidingView
                      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                      className="w-full"
                    >
                      <Animated.View entering={FadeInUp} className="bg-white rounded-[40px] p-8 shadow-2xl">
                        <View className="flex-row justify-between items-center mb-6">
                          <View className="w-12 h-12 bg-rose-50 rounded-2xl items-center justify-center">
                            <AlertCircle size={24} color="#EF4444" />
                          </View>
                          <TouchableOpacity onPress={() => setSuspensionModalVisible(false)} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                            <X size={20} color="#64748B" />
                          </TouchableOpacity>
                        </View>

                        <Text className="text-2xl font-black text-slate-900 mb-2">Arsyeja e Pezullimit</Text>
                        <Text className="text-slate-500 font-bold text-sm mb-6">
                          Shënoni arsyen pse po pezulloni "{selectedShopForSuspension?.name}". Kjo do t'i shfaqet pronarit të sallonit.
                        </Text>

                        <TextInput
                          multiline
                          numberOfLines={4}
                          value={suspensionReason}
                          onChangeText={setSuspensionReason}
                          placeholder="Shënoni arsyen këtu..."
                          className="bg-slate-50 rounded-2xl p-5 text-slate-900 font-bold border border-slate-100 min-h-[120px] text-left align-top"
                          style={{ textAlignVertical: 'top' }}
                        />

                        <View className="flex-row gap-3 mt-8">
                          <TouchableOpacity
                            onPress={() => setSuspensionModalVisible(false)}
                            className="flex-1 h-14 bg-slate-100 rounded-2xl items-center justify-center"
                          >
                            <Text className="text-slate-600 font-black text-base">Anulo</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={confirmSuspension}
                            disabled={isSubmittingSuspension}
                            className="flex-[2] h-14 bg-rose-500 rounded-2xl items-center justify-center shadow-lg shadow-rose-200"
                          >
                            {isSubmittingSuspension ? (
                              <ActivityIndicator color="white" />
                            ) : (
                              <Text className="text-white font-black text-base">Pezullo</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </Animated.View>
                    </KeyboardAvoidingView>
                  </View>
                </TouchableWithoutFeedback>
              )}
            </Animated.View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};
