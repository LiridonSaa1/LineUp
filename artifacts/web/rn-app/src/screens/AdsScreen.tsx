import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput } from "react-native";
import { ShoppingBag, Search, Star, MapPin, Tag, ShoppingCart, ArrowUpRight, Heart, Filter, Plus } from "lucide-react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { fetchFromAPI } from "@/config/api";
import { supabase } from "@/config/supabase";

export const AdsScreen = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Të gjitha");

  const CATEGORIES = ["Të gjitha", "Styling", "Beard Care", "Shaving", "Hair Care"];

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_available', true);

        if (error) throw error;
        setProducts(data || []);
      } catch (e) {
        console.warn("Error fetching products from Supabase:", e);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = category === "Të gjitha" || p.category === category;
    const matchesSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View className="flex-1 bg-[#F8F9FE]">
      {/* Top Header Banner */}
      <View className="bg-[#3473ef] pt-14 pb-8 px-6 rounded-b-[40px] z-10">
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full self-start border border-white/30">
            <ShoppingBag size={14} color="white" />
            <Text className="text-white text-[10px] font-black uppercase tracking-widest">Premium Marketplace</Text>
          </View>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-white items-center justify-center">
            <ShoppingCart size={18} color="#3473ef" />
          </TouchableOpacity>
        </View>

        <Text className="text-3xl font-black text-white tracking-tight mb-4">Grooming Shop</Text>

        {/* Search Bar */}
        <View className="bg-white rounded-2xl px-5 py-3 flex-row items-center gap-3 shadow-md">
          <Search size={18} color="#8789A3" />
          <TextInput
            placeholder="Kërko produkte..."
            placeholderTextColor="#8789A3"
            className="flex-1 text-[#161719] font-bold text-sm"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity className="bg-[#EBF2FF] p-2 rounded-xl">
            <Filter size={16} color="#3473ef" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories Horizontal Scroll */}
      <View className="py-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 flex-row">
          {CATEGORIES.map((cat, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setCategory(cat)}
              className={`mr-3 px-6 py-3 rounded-2xl border ${
                category === cat ? "bg-[#3473ef] border-[#3473ef]" : "bg-white border-slate-100"
              }`}
            >
              <Text className={`font-black text-xs ${category === cat ? "text-white" : "text-[#8789A3]"}`}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products Grid-like List */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#3473ef" className="my-10" />
        ) : filteredProducts.length > 0 ? (
          <View className="flex-row flex-wrap justify-between">
            {filteredProducts.map((product, i) => (
              <View key={product.id || i} className="bg-white rounded-3xl p-3 mb-6 shadow-sm border border-slate-100" style={{ width: "47%" }}>
                <View className="h-32 bg-slate-50 rounded-2xl overflow-hidden mb-3 items-center justify-center">
                  <Image
                    source={{ uri: product.imageUrl || "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400" }}
                    className="w-full h-full object-contain"
                  />
                  <TouchableOpacity className="absolute top-2 right-2 w-7 h-7 bg-white/80 rounded-full items-center justify-center">
                    <Heart size={12} color="#3473ef" />
                  </TouchableOpacity>
                </View>

                <Text className="text-[#161719] font-black text-xs mb-1" numberOfLines={1}>{product.name}</Text>
                <Text className="text-[#8789A3] text-[9px] font-bold mb-2 uppercase tracking-tighter">{product.category || "General"}</Text>

                <View className="flex-row items-center justify-between mt-1">
                  <Text className="text-[#3473ef] font-black text-sm">€{product.price}</Text>
                  <TouchableOpacity className="bg-[#3473ef] w-8 h-8 rounded-full items-center justify-center">
                    <Plus size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center justify-center py-20">
            <ShoppingBag size={48} color="#E2E8F0" />
            <Text className="text-[#8789A3] font-bold mt-4">Nuk u gjetën produkte.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
