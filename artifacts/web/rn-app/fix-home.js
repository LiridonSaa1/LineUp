const fs = require('fs');
const path = 'src/screens/HomeScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add new state for newShops
content = content.replace(
  'const [recommendedShops, setRecommendedShops] = useState<any[]>([]);',
  'const [recommendedShops, setRecommendedShops] = useState<any[]>([]);\n  const [newShops, setNewShops] = useState<any[]>([]);'
);

// 2. Update fetching logic to get top 10 recommended and top new shops
const oldFetch = `        let { data: shopsData, error: shopsError } = await supabase
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
        }`;

const newFetch = `        // Fetch Top 10 Recommended
        let { data: shopsData, error: shopsError } = await supabase
          .from('barbershops')
          .select('*')
          .eq('status', 'active')
          .order('rating', { ascending: false })
          .limit(10);

        if (shopsError) {
          const fallbackRes = await supabase
            .from('barbers')
            .select('*')
            .order('rating', { ascending: false })
            .limit(10);
          shopsData = fallbackRes.data;
          shopsError = fallbackRes.error;
        }
        if (shopsData) setRecommendedShops(shopsData);

        // Fetch New in Lineup (created in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { data: newData } = await supabase
          .from('barbershops')
          .select('*')
          .eq('status', 'active')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (newData && newData.length > 0) {
          setNewShops(newData);
        } else if (shopsData) {
          // Fallback if no new shops found
          setNewShops(shopsData.slice().reverse());
        }`;

content = content.replace(oldFetch, newFetch);

// 3. Create renderRecommendedCard (premium look)
const renderShopCardFunc = `  const renderShopCard = (shop: any) => (`;
const renderRecommendedCardFunc = `  const renderRecommendedCard = (shop: any, index: number) => (
    <TouchableOpacity
      key={shop.id || index}
      onPress={() => onSelectShop(shop)}
      activeOpacity={0.95}
      className="mr-4 bg-white rounded-[28px] overflow-hidden shadow-md border border-[#FFD700]/30"
      style={{ width: (width - 48) * 0.7, height: 260 }}
    >
      <View className="relative w-full h-36">
        <Image
          source={{ uri: shop.image_url || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1000&auto=format&fit=crop&q=80' }}
          className="w-full h-full"
          resizeMode="cover"
        />
        {/* Gold overlay gradient simulation */}
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
        
        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-50">
          <Text className="text-[#3473ef] font-black text-sm uppercase tracking-wider">Top Rated</Text>
          <View className="w-8 h-8 rounded-full bg-[#3473ef]/10 items-center justify-center">
            <ArrowUpRight size={16} color="#3473ef" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderShopCard = (shop: any) => (`;

content = content.replace(renderShopCardFunc, renderRecommendedCardFunc);

// 4. Update the render sections
content = content.replace(
  '{recommendedShops.map(renderShopCard)}',
  '{recommendedShops.map((shop, i) => renderRecommendedCard(shop, i))}'
);

content = content.replace(
  '{recommendedShops.slice().reverse().map(renderShopCard)}',
  '{newShops.map((shop, i) => renderShopCard(shop, i))}'
);

fs.writeFileSync(path, content);
console.log('HomeScreen updated successfully!');
