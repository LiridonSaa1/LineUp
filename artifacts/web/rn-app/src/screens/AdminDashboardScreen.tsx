import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Pressable, TextInput, ActivityIndicator, Alert, FlatList, RefreshControl } from "react-native";
import { Shield, Store, Users, CreditCard, Check, X, Search, Power, Trash2, ChevronRight, RefreshCw, BarChart2, Zap, ArrowLeft, LogOut, Sliders } from "lucide-react-native";
import { supabase } from "../config/supabase";
import { PADDLE_CONFIG } from "../config/paddle";

interface AdminDashboardScreenProps {
  onLogout: () => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'shops' | 'subscriptions' | 'users' | 'system'>('shops');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data States
  const [shops, setShops] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Barbershops
      const { data: shopsData } = await supabase
        .from('barbershops')
        .select('*')
        .order('id', { ascending: false });

      // 2. Fetch Subscriptions & Customers
      const { data: subsData } = await supabase
        .from('subscriptions')
        .select('*')
        .order('id', { ascending: false });

      // 3. Fetch Users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('id', { ascending: false });

      setShops(shopsData || []);
      setSubscriptions(subsData || []);
      setUsers(usersData || []);
    } catch (err) {
      console.warn("[AdminDashboard] Error fetching admin data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleShopStatus = async (shopId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await supabase
        .from('barbershops')
        .update({ status: newStatus })
        .eq('id', shopId);

      setShops(prev => prev.map(s => s.id === shopId ? { ...s, status: newStatus } : s));
      Alert.alert("Statusi u Përditësua", `Berberia tani është ${newStatus === 'active' ? 'Aktive' : 'E Pezulluar'}.`);
    } catch (e: any) {
      Alert.alert("Gabim", "Nuk u mundësua ndryshimi i statusit.");
    }
  };

  const handleDeleteShop = async (shopId: number, shopName: string) => {
    Alert.alert(
      "Fshi Berberinë",
      `A jeni të sigurt që dëshironi të fshini "${shopName}"?`,
      [
        { text: "Anulo", style: "cancel" },
        {
          text: "Fshi",
          style: "destructive",
          onPress: async () => {
            await supabase.from('barbershops').delete().eq('id', shopId);
            setShops(prev => prev.filter(s => s.id !== shopId));
          }
        }
      ]
    );
  };

  const filteredShops = shops.filter(s => 
    (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.phone || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = subscriptions.reduce((acc, sub) => {
    const planCost = sub.product_id === 'team' ? 25 : sub.product_id === 'solo' ? 15 : 20;
    return acc + planCost;
  }, 0);

  return (
    <View className="flex-1 bg-[#0F172A] pt-12">
      {/* Admin Top Header */}
      <View className="px-6 pb-5 flex-row items-center justify-between border-b border-slate-800">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-2xl bg-[#3473ef] items-center justify-center shadow-lg shadow-[#3473ef]/30">
            <Shield size={24} color="white" />
          </View>
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xl font-black text-white tracking-tight">LineUp Admin Panel</Text>
              <View className="bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                <Text className="text-emerald-400 text-[10px] font-black uppercase">SUPER ADMIN</Text>
              </View>
            </View>
            <Text className="text-slate-400 font-bold text-xs">lineup@admin.com</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onLogout}
          className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center border border-slate-700 active:bg-slate-700"
        >
          <LogOut size={18} color="#F87171" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={["#3473ef"]} tintColor="#3473ef" />}
      >
        {/* KPI Cards */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-slate-800/80 p-4 rounded-3xl border border-slate-700/60">
            <View className="w-8 h-8 rounded-xl bg-[#3473ef]/20 items-center justify-center mb-2">
              <Store size={18} color="#3473ef" />
            </View>
            <Text className="text-2xl font-black text-white">{shops.length}</Text>
            <Text className="text-slate-400 text-[11px] font-bold mt-0.5">Barberitë në Total</Text>
          </View>

          <View className="flex-1 bg-slate-800/80 p-4 rounded-3xl border border-slate-700/60">
            <View className="w-8 h-8 rounded-xl bg-emerald-500/20 items-center justify-center mb-2">
              <CreditCard size={18} color="#10B981" />
            </View>
            <Text className="text-2xl font-black text-emerald-400">{totalRevenue}€</Text>
            <Text className="text-slate-400 text-[11px] font-bold mt-0.5">Të Hyra nga Paddle</Text>
          </View>

          <View className="flex-1 bg-slate-800/80 p-4 rounded-3xl border border-slate-700/60">
            <View className="w-8 h-8 rounded-xl bg-purple-500/20 items-center justify-center mb-2">
              <Users size={18} color="#A855F7" />
            </View>
            <Text className="text-2xl font-black text-purple-400">{users.length}</Text>
            <Text className="text-slate-400 text-[11px] font-bold mt-0.5">Përdoruesit në DB</Text>
          </View>
        </View>

        {/* Tab Navigation Selector */}
        <View className="flex-row bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 mb-5">
          <TouchableOpacity
            onPress={() => setActiveTab('shops')}
            className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === 'shops' ? 'bg-[#3473ef]' : ''}`}
          >
            <Text className={`font-black text-xs ${activeTab === 'shops' ? 'text-white' : 'text-slate-400'}`}>Berberitë ({shops.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('subscriptions')}
            className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === 'subscriptions' ? 'bg-[#3473ef]' : ''}`}
          >
            <Text className={`font-black text-xs ${activeTab === 'subscriptions' ? 'text-white' : 'text-slate-400'}`}>Paddle ({subscriptions.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('users')}
            className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === 'users' ? 'bg-[#3473ef]' : ''}`}
          >
            <Text className={`font-black text-xs ${activeTab === 'users' ? 'text-white' : 'text-slate-400'}`}>Përdoruesit ({users.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('system')}
            className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === 'system' ? 'bg-[#3473ef]' : ''}`}
          >
            <Text className={`font-black text-xs ${activeTab === 'system' ? 'text-white' : 'text-slate-400'}`}>Sistemi</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input Bar */}
        {(activeTab === 'shops' || activeTab === 'users') && (
          <View className="bg-slate-800 rounded-2xl px-4 h-12 flex-row items-center mb-5 border border-slate-700">
            <Search size={18} color="#94A3B8" />
            <TextInput
              placeholder={activeTab === 'shops' ? "Kërko berberinë sipas emrit ose qytetit..." : "Kërko përdoruesit..."}
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-white font-bold text-sm"
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")} className="p-1">
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* TAB 1: BARBERSHOPS LIST */}
        {activeTab === 'shops' && (
          <View className="gap-y-4 pb-12">
            {loading ? (
              <ActivityIndicator size="large" color="#3473ef" className="my-8" />
            ) : filteredShops.length === 0 ? (
              <View className="bg-slate-800/50 p-8 rounded-3xl items-center justify-center border border-slate-700">
                <Store size={32} color="#64748B" className="mb-2" />
                <Text className="text-slate-400 font-bold text-sm">Nuk u gjet asnjë berberi.</Text>
              </View>
            ) : (
              filteredShops.map((shop) => (
                <View key={shop.id} className="bg-slate-800/90 rounded-3xl p-5 border border-slate-700 gap-y-3">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-row items-center gap-3">
                      <View className="w-12 h-12 rounded-2xl bg-[#3473ef]/10 items-center justify-center border border-[#3473ef]/30">
                        <Store size={22} color="#3473ef" />
                      </View>
                      <View>
                        <Text className="text-lg font-black text-white">{shop.name}</Text>
                        <Text className="text-slate-400 font-bold text-xs">{shop.city || "Prishtinë"} • {shop.address || "Qendra"}</Text>
                        <Text className="text-slate-500 font-bold text-[11px] mt-0.5">ID: #{shop.id} • Tel: {shop.phone || "N/A"}</Text>
                      </View>
                    </View>
                    <View className={`px-3 py-1 rounded-full border ${shop.status === 'active' ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-rose-500/20 border-rose-500/40'}`}>
                      <Text className={`text-[10px] font-black uppercase ${shop.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {shop.status === 'active' ? 'AKTIV' : 'PEZULLUAR'}
                      </Text>
                    </View>
                  </View>

                  <View className="h-[1px] bg-slate-700/60 my-1" />

                  {/* Actions Row */}
                  <View className="flex-row gap-3 pt-1">
                    <TouchableOpacity
                      onPress={() => handleToggleShopStatus(shop.id, shop.status)}
                      className={`flex-1 py-3 rounded-2xl flex-row items-center justify-center gap-2 border ${shop.status === 'active' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}
                    >
                      <Power size={16} color={shop.status === 'active' ? '#F59E0B' : '#10B981'} />
                      <Text className={`font-black text-xs ${shop.status === 'active' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {shop.status === 'active' ? 'Pezullo Berberinë' : 'Aktivizo Berberinë'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteShop(shop.id, shop.name)}
                      className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 items-center justify-center"
                    >
                      <Trash2 size={18} color="#F87171" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 2: PADDLE SUBSCRIPTIONS & TRANSACTIONS */}
        {activeTab === 'subscriptions' && (
          <View className="gap-y-4 pb-12">
            {subscriptions.length === 0 ? (
              <View className="bg-slate-800/50 p-8 rounded-3xl items-center justify-center border border-slate-700">
                <CreditCard size={32} color="#64748B" className="mb-2" />
                <Text className="text-slate-400 font-bold text-sm">Nuk ka abonime active te regjistruara nga Paddle.</Text>
              </View>
            ) : (
              subscriptions.map((sub) => (
                <View key={sub.id || sub.subscription_id} className="bg-slate-800/90 rounded-3xl p-5 border border-slate-700 gap-y-3">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-xl bg-emerald-500/20 items-center justify-center">
                        <CreditCard size={20} color="#10B981" />
                      </View>
                      <View>
                        <Text className="text-base font-black text-white">Plani: {sub.product_id?.toUpperCase() || 'DUO'}</Text>
                        <Text className="text-slate-400 font-bold text-xs">Customer ID: {sub.customer_id}</Text>
                      </View>
                    </View>
                    <View className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/40">
                      <Text className="text-emerald-400 text-[10px] font-black uppercase">PADDLE ACTIVE</Text>
                    </View>
                  </View>
                  <Text className="text-slate-500 font-bold text-[11px]">Subscription ID: {sub.subscription_id}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 3: USERS LIST */}
        {activeTab === 'users' && (
          <View className="gap-y-3 pb-12">
            {filteredUsers.map((u) => (
              <View key={u.id} className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center">
                    <Users size={18} color="#94A3B8" />
                  </View>
                  <View>
                    <Text className="text-white font-black text-sm">{u.name || u.email}</Text>
                    <Text className="text-slate-400 font-bold text-xs">{u.email}</Text>
                  </View>
                </View>
                <View className="bg-slate-700 px-3 py-1 rounded-full">
                  <Text className="text-slate-300 font-black text-[10px] uppercase">{u.role || 'client'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 4: SYSTEM & PADDLE CONFIG STATUS */}
        {activeTab === 'system' && (
          <View className="gap-y-4 pb-12">
            <View className="bg-slate-800/90 rounded-3xl p-5 border border-slate-700 gap-y-3">
              <Text className="text-white font-black text-base mb-1">Statusi i Integrimit me Paddle</Text>

              <View className="bg-slate-900 p-4 rounded-2xl border border-slate-700 gap-y-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-slate-400 font-bold text-xs">Paddle API Environment:</Text>
                  <Text className="text-emerald-400 font-black text-xs uppercase">{PADDLE_CONFIG.ENVIRONMENT}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-slate-400 font-bold text-xs">Paddle API Key:</Text>
                  <Text className="text-white font-bold text-xs">pdl_sdbx_apikey_... (Aktiv)</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-slate-400 font-bold text-xs">Paddle Client Token:</Text>
                  <Text className="text-white font-bold text-xs">{PADDLE_CONFIG.CLIENT_TOKEN.substring(0, 15)}...</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
